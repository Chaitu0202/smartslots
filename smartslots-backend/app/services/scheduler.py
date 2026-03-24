"""
AI-powered timetable scheduling engine using Google OR-Tools.
Handles hard constraints (no clashes, required hours) and soft constraints (preferences, workload balance).
"""
from ortools.sat.python import cp_model
from sqlalchemy.orm import Session
from typing import List, Dict, Tuple
from collections import defaultdict

from app.models.models import (
    TimeSlot, Teacher, Subject, Section, Room,
    SubjectAssignment, TeacherPreference, Constraint,
    Timetable, TimetableEntry, DayOfWeek, RoomType,
)


class SchedulingResult:
    def __init__(self):
        self.success = False
        self.entries: List[Dict] = []
        self.score = 0
        self.log: List[str] = []
        self.conflicts: List[Dict] = []


class TimetableScheduler:
    def __init__(self, db: Session, department_id: int, college_id: int):
        self.db = db
        self.department_id = department_id
        self.college_id = college_id
        self.model = cp_model.CpModel()
        self.result = SchedulingResult()

    def _load_data(self):
        """Load all necessary data from the database."""
        self.timeslots = (
            self.db.query(TimeSlot)
            .filter(TimeSlot.college_id == self.college_id, TimeSlot.is_break == False)
            .order_by(TimeSlot.day, TimeSlot.period)
            .all()
        )

        self.assignments = (
            self.db.query(SubjectAssignment)
            .join(Subject)
            .filter(Subject.department_id == self.department_id)
            .all()
        )

        self.sections = (
            self.db.query(Section)
            .filter(Section.department_id == self.department_id)
            .all()
        )

        self.rooms = (
            self.db.query(Room)
            .filter(Room.college_id == self.college_id, Room.is_available == True)
            .all()
        )

        self.teachers = (
            self.db.query(Teacher)
            .filter(Teacher.department_id == self.department_id)
            .all()
        )

        self.preferences = {}
        all_prefs = self.db.query(TeacherPreference).all()
        for p in all_prefs:
            key = (p.teacher_id, p.day.value if hasattr(p.day, 'value') else p.day, p.period)
            self.preferences[key] = p.preference

        self.custom_constraints = (
            self.db.query(Constraint)
            .filter(Constraint.college_id == self.college_id, Constraint.is_active == True)
            .all()
        )

        self.result.log.append(
            f"Loaded: {len(self.timeslots)} slots, {len(self.assignments)} assignments, "
            f"{len(self.sections)} sections, {len(self.rooms)} rooms, {len(self.teachers)} teachers"
        )

    def _create_variables(self):
        """Create decision variables: x[assignment_id, timeslot_id] = 1 if assigned."""
        self.x = {}
        self.room_vars = {}

        for a in self.assignments:
            subject = self.db.query(Subject).filter(Subject.id == a.subject_id).first()
            hours = subject.hours_per_week if subject else 4

            for t in self.timeslots:
                var_name = f"x_{a.id}_{t.id}"
                self.x[(a.id, t.id)] = self.model.NewBoolVar(var_name)

            if self.rooms:
                for t in self.timeslots:
                    for r in self.rooms:
                        var_name = f"room_{a.id}_{t.id}_{r.id}"
                        self.room_vars[(a.id, t.id, r.id)] = self.model.NewBoolVar(var_name)

        self.result.log.append(f"Created {len(self.x)} scheduling variables")

    def _add_hard_constraints(self):
        """Add hard constraints that must never be broken."""

        # 1. Each assignment must be scheduled exactly the required number of hours per week
        for a in self.assignments:
            subject = self.db.query(Subject).filter(Subject.id == a.subject_id).first()
            if not subject:
                continue
            hours_needed = subject.hours_per_week
            self.model.Add(
                sum(self.x[(a.id, t.id)] for t in self.timeslots) == hours_needed
            )

        # 2. No teacher clash: a teacher can teach at most one class per timeslot
        teacher_assignments = defaultdict(list)
        for a in self.assignments:
            teacher_assignments[a.teacher_id].append(a)

        for teacher_id, t_assignments in teacher_assignments.items():
            for t in self.timeslots:
                self.model.Add(
                    sum(self.x[(a.id, t.id)] for a in t_assignments) <= 1
                )

        # 3. No section clash: a section can have at most one class per timeslot
        section_assignments = defaultdict(list)
        for a in self.assignments:
            section_assignments[a.section_id].append(a)

        for section_id, s_assignments in section_assignments.items():
            for t in self.timeslots:
                self.model.Add(
                    sum(self.x[(a.id, t.id)] for a in s_assignments) <= 1
                )

        # 4. Room constraints: at most one class per room per timeslot
        if self.rooms:
            for a in self.assignments:
                for t in self.timeslots:
                    # If assignment is scheduled, it must be in exactly one room
                    if self.rooms:
                        room_sum = sum(
                            self.room_vars.get((a.id, t.id, r.id), self.model.NewConstant(0))
                            for r in self.rooms
                        )
                        self.model.Add(room_sum == self.x[(a.id, t.id)])

            for r in self.rooms:
                for t in self.timeslots:
                    self.model.Add(
                        sum(
                            self.room_vars.get((a.id, t.id, r.id), self.model.NewConstant(0))
                            for a in self.assignments
                        ) <= 1
                    )

        # 5. Teacher availability: respect "unavailable" preferences
        for a in self.assignments:
            for t in self.timeslots:
                day_val = t.day.value if hasattr(t.day, 'value') else t.day
                key = (a.teacher_id, day_val, t.period)
                if self.preferences.get(key) == "unavailable":
                    self.model.Add(self.x[(a.id, t.id)] == 0)

        # 6. Max hours per day per teacher
        for teacher_id, t_assignments in teacher_assignments.items():
            teacher = self.db.query(Teacher).filter(Teacher.id == teacher_id).first()
            max_per_day = teacher.max_hours_per_day if teacher else 6

            for day in DayOfWeek:
                day_slots = [t for t in self.timeslots
                             if (t.day.value if hasattr(t.day, 'value') else t.day) == day.value]
                if day_slots:
                    self.model.Add(
                        sum(self.x[(a.id, t.id)]
                            for a in t_assignments for t in day_slots) <= max_per_day
                    )

        # 7. Apply custom hard constraints
        for c in self.custom_constraints:
            if c.constraint_type.value == "hard" if hasattr(c.constraint_type, 'value') else c.constraint_type == "hard":
                self._apply_custom_constraint(c)

        self.result.log.append("Added all hard constraints")

    def _apply_custom_constraint(self, constraint):
        """Apply a custom constraint from the database."""
        rule = constraint.rule
        rule_type = rule.get("type", "")

        if rule_type == "no_class_after":
            # e.g., {"type": "no_class_after", "period": 6, "day": "friday"}
            target_day = rule.get("day")
            after_period = rule.get("period", 6)
            for a in self.assignments:
                for t in self.timeslots:
                    day_val = t.day.value if hasattr(t.day, 'value') else t.day
                    if target_day and day_val == target_day and t.period > after_period:
                        self.model.Add(self.x[(a.id, t.id)] == 0)
                    elif not target_day and t.period > after_period:
                        self.model.Add(self.x[(a.id, t.id)] == 0)

        elif rule_type == "lab_continuous":
            # Labs must be scheduled in consecutive slots
            lab_assignments = []
            for a in self.assignments:
                subject = self.db.query(Subject).filter(Subject.id == a.subject_id).first()
                if subject and subject.is_lab:
                    lab_assignments.append((a, subject))

            for a, subject in lab_assignments:
                lab_hours = subject.lab_hours if subject.lab_hours > 0 else 2
                for day in DayOfWeek:
                    day_slots = sorted(
                        [t for t in self.timeslots
                         if (t.day.value if hasattr(t.day, 'value') else t.day) == day.value],
                        key=lambda s: s.period
                    )
                    # If lab is on this day, consecutive slots must be used
                    for i in range(len(day_slots)):
                        if i + lab_hours - 1 < len(day_slots):
                            consecutive = day_slots[i:i + lab_hours]
                            are_consecutive = all(
                                consecutive[j + 1].period == consecutive[j].period + 1
                                for j in range(len(consecutive) - 1)
                            )
                            if are_consecutive:
                                # Link: either all slots are used or none
                                for j in range(1, len(consecutive)):
                                    self.model.Add(
                                        self.x[(a.id, consecutive[j].id)] ==
                                        self.x[(a.id, consecutive[0].id)]
                                    ).OnlyEnforceIf(self.x[(a.id, consecutive[0].id)])

        elif rule_type == "room_type_match":
            # Labs must be in lab rooms
            if self.rooms:
                for a in self.assignments:
                    subject = self.db.query(Subject).filter(Subject.id == a.subject_id).first()
                    if subject and subject.is_lab:
                        lab_rooms = [r for r in self.rooms
                                     if (r.room_type.value if hasattr(r.room_type, 'value') else r.room_type) == RoomType.LAB.value]
                        non_lab_rooms = [r for r in self.rooms if r not in lab_rooms]
                        for t in self.timeslots:
                            for r in non_lab_rooms:
                                if (a.id, t.id, r.id) in self.room_vars:
                                    self.model.Add(self.room_vars[(a.id, t.id, r.id)] == 0)

    def _add_soft_constraints(self):
        """Add soft constraints optimized via scoring."""
        objective_terms = []

        # 1. Prefer teacher's preferred slots (bonus for "preferred")
        for a in self.assignments:
            for t in self.timeslots:
                day_val = t.day.value if hasattr(t.day, 'value') else t.day
                key = (a.teacher_id, day_val, t.period)
                pref = self.preferences.get(key)
                if pref == "preferred":
                    objective_terms.append(self.x[(a.id, t.id)] * 10)

        # 2. Prefer morning slots for theory subjects
        for a in self.assignments:
            subject = self.db.query(Subject).filter(Subject.id == a.subject_id).first()
            if subject and not subject.is_lab:
                for t in self.timeslots:
                    if t.period <= 4:
                        objective_terms.append(self.x[(a.id, t.id)] * 2)

        # 3. Workload balance: penalize too many classes in a single day
        teacher_assignments = defaultdict(list)
        for a in self.assignments:
            teacher_assignments[a.teacher_id].append(a)

        for teacher_id, t_assignments in teacher_assignments.items():
            for day in DayOfWeek:
                day_slots = [t for t in self.timeslots
                             if (t.day.value if hasattr(t.day, 'value') else t.day) == day.value]
                if day_slots and len(t_assignments) > 0:
                    day_load = sum(
                        self.x[(a.id, t.id)]
                        for a in t_assignments for t in day_slots
                    )
                    # Penalize if >4 classes per day
                    overload = self.model.NewIntVar(0, 10, f"overload_{teacher_id}_{day.value}")
                    self.model.Add(overload >= day_load - 4)
                    self.model.Add(overload >= 0)
                    objective_terms.append(overload * -5)

        # 4. Spread sections' classes across the week
        section_assignments = defaultdict(list)
        for a in self.assignments:
            section_assignments[a.section_id].append(a)

        for section_id, s_assignments in section_assignments.items():
            for day in DayOfWeek:
                day_slots = [t for t in self.timeslots
                             if (t.day.value if hasattr(t.day, 'value') else t.day) == day.value]
                if day_slots:
                    day_count = sum(
                        self.x[(a.id, t.id)]
                        for a in s_assignments for t in day_slots
                    )
                    overload = self.model.NewIntVar(0, 20, f"sec_overload_{section_id}_{day.value}")
                    self.model.Add(overload >= day_count - 6)
                    self.model.Add(overload >= 0)
                    objective_terms.append(overload * -3)

        # 5. Apply custom soft constraints
        for c in self.custom_constraints:
            ct = c.constraint_type.value if hasattr(c.constraint_type, 'value') else c.constraint_type
            if ct == "soft":
                terms = self._apply_soft_custom_constraint(c)
                objective_terms.extend(terms)

        if objective_terms:
            self.model.Maximize(sum(objective_terms))

        self.result.log.append(f"Added {len(objective_terms)} soft constraint terms")

    def _apply_soft_custom_constraint(self, constraint):
        """Apply soft custom constraints and return objective terms."""
        terms = []
        rule = constraint.rule
        rule_type = rule.get("type", "")

        if rule_type == "prefer_time_range":
            start_period = rule.get("start_period", 1)
            end_period = rule.get("end_period", 4)
            bonus = rule.get("bonus", 5) * constraint.priority
            for a in self.assignments:
                for t in self.timeslots:
                    if start_period <= t.period <= end_period:
                        terms.append(self.x[(a.id, t.id)] * bonus)

        elif rule_type == "avoid_day":
            target_day = rule.get("day")
            penalty = rule.get("penalty", -10) * constraint.priority
            for a in self.assignments:
                for t in self.timeslots:
                    day_val = t.day.value if hasattr(t.day, 'value') else t.day
                    if day_val == target_day:
                        terms.append(self.x[(a.id, t.id)] * penalty)

        return terms

    def generate(self) -> SchedulingResult:
        """Run the scheduling engine and return results."""
        self._load_data()

        if not self.timeslots:
            self.result.log.append("ERROR: No time slots configured")
            return self.result

        if not self.assignments:
            self.result.log.append("ERROR: No subject assignments found")
            return self.result

        self._create_variables()
        self._add_hard_constraints()
        self._add_soft_constraints()

        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 30.0
        solver.parameters.num_workers = 4

        self.result.log.append("Solving...")
        status = solver.Solve(self.model)

        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            self.result.success = True
            self.result.score = int(solver.ObjectiveValue()) if solver.ObjectiveValue() else 0
            self.result.log.append(
                f"Solution found! Status: {'OPTIMAL' if status == cp_model.OPTIMAL else 'FEASIBLE'}, "
                f"Score: {self.result.score}"
            )

            # Extract solution
            for a in self.assignments:
                for t in self.timeslots:
                    if solver.Value(self.x[(a.id, t.id)]) == 1:
                        entry = {
                            "assignment_id": a.id,
                            "timeslot_id": t.id,
                            "teacher_id": a.teacher_id,
                            "subject_id": a.subject_id,
                            "section_id": a.section_id,
                            "room_id": None,
                        }
                        # Find assigned room
                        if self.rooms:
                            for r in self.rooms:
                                if (a.id, t.id, r.id) in self.room_vars:
                                    if solver.Value(self.room_vars[(a.id, t.id, r.id)]) == 1:
                                        entry["room_id"] = r.id
                                        break

                        self.result.entries.append(entry)

            self.result.log.append(f"Generated {len(self.result.entries)} timetable entries")
        else:
            self.result.log.append(f"No solution found. Status: {status}")
            self.result.log.append("Try relaxing some constraints or adding more time slots")

        return self.result


def detect_conflicts(db: Session, timetable_id: int) -> List[Dict]:
    """Detect conflicts in an existing timetable."""
    entries = db.query(TimetableEntry).filter(TimetableEntry.timetable_id == timetable_id).all()
    conflicts = []

    # Check teacher clashes
    teacher_slots = defaultdict(list)
    for e in entries:
        teacher_slots[(e.teacher_id, e.timeslot_id)].append(e)

    for key, entry_list in teacher_slots.items():
        if len(entry_list) > 1:
            teacher = db.query(Teacher).filter(Teacher.id == key[0]).first()
            slot = db.query(TimeSlot).filter(TimeSlot.id == key[1]).first()
            conflicts.append({
                "type": "teacher_clash",
                "description": f"Teacher '{teacher.name if teacher else 'Unknown'}' has {len(entry_list)} classes at {slot.day.value if slot else '?'} period {slot.period if slot else '?'}",
                "severity": "high",
                "entry_ids": [e.id for e in entry_list],
            })

    # Check section clashes
    section_slots = defaultdict(list)
    for e in entries:
        section_slots[(e.section_id, e.timeslot_id)].append(e)

    for key, entry_list in section_slots.items():
        if len(entry_list) > 1:
            section = db.query(Section).filter(Section.id == key[0]).first()
            slot = db.query(TimeSlot).filter(TimeSlot.id == key[1]).first()
            conflicts.append({
                "type": "section_clash",
                "description": f"Section '{section.name if section else 'Unknown'}' has {len(entry_list)} classes at {slot.day.value if slot else '?'} period {slot.period if slot else '?'}",
                "severity": "high",
                "entry_ids": [e.id for e in entry_list],
            })

    # Check room clashes
    room_slots = defaultdict(list)
    for e in entries:
        if e.room_id:
            room_slots[(e.room_id, e.timeslot_id)].append(e)

    for key, entry_list in room_slots.items():
        if len(entry_list) > 1:
            room = db.query(Room).filter(Room.id == key[0]).first()
            slot = db.query(TimeSlot).filter(TimeSlot.id == key[1]).first()
            conflicts.append({
                "type": "room_clash",
                "description": f"Room '{room.name if room else 'Unknown'}' has {len(entry_list)} classes at {slot.day.value if slot else '?'} period {slot.period if slot else '?'}",
                "severity": "high",
                "entry_ids": [e.id for e in entry_list],
            })

    return conflicts


def suggest_improvements(db: Session, timetable_id: int) -> List[Dict]:
    """Suggest improvements to the timetable."""
    entries = db.query(TimetableEntry).filter(TimetableEntry.timetable_id == timetable_id).all()
    suggestions = []

    # Check workload balance
    teacher_daily_load = defaultdict(lambda: defaultdict(int))
    for e in entries:
        slot = db.query(TimeSlot).filter(TimeSlot.id == e.timeslot_id).first()
        if slot:
            day_val = slot.day.value if hasattr(slot.day, 'value') else slot.day
            teacher_daily_load[e.teacher_id][day_val] += 1

    for teacher_id, day_loads in teacher_daily_load.items():
        teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
        max_load = max(day_loads.values())
        min_load = min(day_loads.values()) if day_loads else 0
        if max_load - min_load > 3:
            heavy_day = max(day_loads, key=day_loads.get)
            light_day = min(day_loads, key=day_loads.get)
            suggestions.append({
                "type": "workload_balance",
                "description": f"Move a class for {teacher.name if teacher else 'teacher'} from {heavy_day} ({max_load} classes) to {light_day} ({min_load} classes) for better balance",
                "priority": "medium",
                "teacher_id": teacher_id,
            })

    # Check for theory classes in afternoon
    for e in entries:
        subject = db.query(Subject).filter(Subject.id == e.subject_id).first()
        slot = db.query(TimeSlot).filter(TimeSlot.id == e.timeslot_id).first()
        if subject and slot and not subject.is_lab and slot.period >= 6:
            suggestions.append({
                "type": "time_preference",
                "description": f"Consider moving '{subject.name}' to a morning slot for better student attention",
                "priority": "low",
                "entry_id": e.id,
            })
            break  # Only suggest once

    return suggestions

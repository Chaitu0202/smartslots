from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from collections import defaultdict

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import (
    User, Teacher, Subject, Room, Section, Timetable, TimetableEntry,
    Department, TimeSlot,
)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
def get_dashboard(
    college_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cid = college_id or current_user.college_id

    # Basic counts
    teachers_q = db.query(Teacher)
    subjects_q = db.query(Subject)
    rooms_q = db.query(Room)
    sections_q = db.query(Section)
    timetables_q = db.query(Timetable)

    if cid:
        rooms_q = rooms_q.filter(Room.college_id == cid)
        dept_ids = [d.id for d in db.query(Department).filter(Department.college_id == cid).all()]
        if dept_ids:
            teachers_q = teachers_q.filter(Teacher.department_id.in_(dept_ids))
            subjects_q = subjects_q.filter(Subject.department_id.in_(dept_ids))
            sections_q = sections_q.filter(Section.department_id.in_(dept_ids))
            timetables_q = timetables_q.filter(Timetable.department_id.in_(dept_ids))

    total_teachers = teachers_q.count()
    total_subjects = subjects_q.count()
    total_rooms = rooms_q.count()
    total_sections = sections_q.count()
    total_timetables = timetables_q.count()
    published = timetables_q.filter(Timetable.is_published == True).count()

    # Teacher workload
    teacher_load = []
    for teacher in teachers_q.limit(20).all():
        entry_count = db.query(TimetableEntry).filter(TimetableEntry.teacher_id == teacher.id).count()
        teacher_load.append({
            "name": teacher.name,
            "hours": entry_count,
            "max_hours": teacher.max_hours_per_week,
            "color": teacher.color,
        })

    # Room usage
    room_usage = []
    for room in rooms_q.limit(20).all():
        used = db.query(TimetableEntry).filter(TimetableEntry.room_id == room.id).count()
        total_slots = db.query(TimeSlot).filter(
            TimeSlot.college_id == cid, TimeSlot.is_break == False
        ).count() if cid else 48
        usage_pct = round((used / total_slots * 100), 1) if total_slots > 0 else 0
        room_usage.append({
            "name": room.name,
            "code": room.code,
            "used": used,
            "total": total_slots,
            "usage_percent": usage_pct,
        })

    # Department stats
    dept_stats = []
    departments = db.query(Department)
    if cid:
        departments = departments.filter(Department.college_id == cid)
    for dept in departments.all():
        t_count = db.query(Teacher).filter(Teacher.department_id == dept.id).count()
        s_count = db.query(Subject).filter(Subject.department_id == dept.id).count()
        sec_count = db.query(Section).filter(Section.department_id == dept.id).count()
        dept_stats.append({
            "name": dept.name,
            "code": dept.code,
            "teachers": t_count,
            "subjects": s_count,
            "sections": sec_count,
        })

    return {
        "total_teachers": total_teachers,
        "total_subjects": total_subjects,
        "total_rooms": total_rooms,
        "total_sections": total_sections,
        "total_timetables": total_timetables,
        "published_timetables": published,
        "teacher_load": teacher_load,
        "room_usage": room_usage,
        "department_stats": dept_stats,
    }

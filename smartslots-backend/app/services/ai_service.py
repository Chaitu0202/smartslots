"""
AI Service for SmartSlots.
Handles natural language constraint parsing, conflict explanation, and smart suggestions.
"""
import re
from typing import Dict, List, Optional


# Map of common time expressions to periods
TIME_TO_PERIOD = {
    "morning": (1, 4),
    "afternoon": (5, 8),
    "evening": (7, 8),
    "1st period": (1, 1),
    "2nd period": (2, 2),
    "3rd period": (3, 3),
    "4th period": (4, 4),
    "5th period": (5, 5),
    "6th period": (6, 6),
    "7th period": (7, 7),
    "8th period": (8, 8),
    "first period": (1, 1),
    "last period": (8, 8),
}

DAY_MAP = {
    "monday": "monday", "mon": "monday",
    "tuesday": "tuesday", "tue": "tuesday", "tues": "tuesday",
    "wednesday": "wednesday", "wed": "wednesday",
    "thursday": "thursday", "thu": "thursday", "thur": "thursday", "thurs": "thursday",
    "friday": "friday", "fri": "friday",
    "saturday": "saturday", "sat": "saturday",
}

TIME_REGEX = re.compile(r'(\d{1,2})\s*(am|pm|AM|PM)?')


def _parse_time_to_period(time_str: str) -> Optional[int]:
    """Convert a time string like '2 PM' or '14:00' to a period number."""
    match = TIME_REGEX.search(time_str)
    if not match:
        return None
    hour = int(match.group(1))
    ampm = match.group(2)
    if ampm and ampm.lower() == 'pm' and hour < 12:
        hour += 12
    if ampm and ampm.lower() == 'am' and hour == 12:
        hour = 0

    # Map hours to periods
    period_map = {9: 1, 10: 2, 11: 3, 12: 4, 13: 4, 14: 5, 15: 6, 16: 7, 17: 8}
    return period_map.get(hour)


def parse_natural_language_constraint(text: str, college_id: int) -> Dict:
    """
    Parse natural language into a structured constraint.

    Examples:
    - "No classes after 2 PM on Friday" -> hard constraint
    - "Prefer morning classes for Math" -> soft constraint
    - "No labs on Saturday" -> hard constraint
    """
    text_lower = text.lower().strip()
    result = {
        "parsed_constraint": {},
        "explanation": "",
        "confidence": 0.0,
    }

    # Pattern: "No classes after X PM/AM on DAY"
    no_after_match = re.search(
        r'no\s+(?:classes?|lectures?)\s+after\s+(\d{1,2}\s*(?:am|pm)?)\s+(?:on\s+)?(\w+)',
        text_lower
    )
    if no_after_match:
        time_str = no_after_match.group(1)
        day_str = no_after_match.group(2)
        period = _parse_time_to_period(time_str)
        day = DAY_MAP.get(day_str)

        if period and day:
            result["parsed_constraint"] = {
                "name": f"No classes after period {period} on {day}",
                "constraint_type": "hard",
                "rule": {
                    "type": "no_class_after",
                    "period": period - 1,
                    "day": day,
                },
                "college_id": college_id,
                "priority": 1,
            }
            result["explanation"] = f"No classes will be scheduled after period {period} on {day.capitalize()}"
            result["confidence"] = 0.95
            return result

    # Pattern: "No classes after X PM" (all days)
    no_after_all = re.search(r'no\s+(?:classes?|lectures?)\s+after\s+(\d{1,2}\s*(?:am|pm)?)', text_lower)
    if no_after_all:
        time_str = no_after_all.group(1)
        period = _parse_time_to_period(time_str)
        if period:
            result["parsed_constraint"] = {
                "name": f"No classes after period {period}",
                "constraint_type": "hard",
                "rule": {
                    "type": "no_class_after",
                    "period": period - 1,
                },
                "college_id": college_id,
                "priority": 1,
            }
            result["explanation"] = f"No classes will be scheduled after period {period} on any day"
            result["confidence"] = 0.90
            return result

    # Pattern: "Prefer morning/afternoon classes"
    prefer_match = re.search(r'prefer\s+(morning|afternoon|evening)\s+(?:classes?|lectures?|slots?)', text_lower)
    if prefer_match:
        time_range = prefer_match.group(1)
        start_p, end_p = TIME_TO_PERIOD.get(time_range, (1, 4))
        result["parsed_constraint"] = {
            "name": f"Prefer {time_range} classes",
            "constraint_type": "soft",
            "rule": {
                "type": "prefer_time_range",
                "start_period": start_p,
                "end_period": end_p,
                "bonus": 5,
            },
            "college_id": college_id,
            "priority": 2,
        }
        result["explanation"] = f"Classes will be preferentially scheduled in {time_range} slots (periods {start_p}-{end_p})"
        result["confidence"] = 0.90
        return result

    # Pattern: "No labs/classes on DAY"
    no_day_match = re.search(r'no\s+(?:labs?|classes?|lectures?)\s+(?:on\s+)?(\w+)', text_lower)
    if no_day_match:
        day_str = no_day_match.group(1)
        day = DAY_MAP.get(day_str)
        if day:
            result["parsed_constraint"] = {
                "name": f"No classes on {day}",
                "constraint_type": "hard",
                "rule": {
                    "type": "avoid_day",
                    "day": day,
                    "penalty": -100,
                },
                "college_id": college_id,
                "priority": 1,
            }
            result["explanation"] = f"No classes will be scheduled on {day.capitalize()}"
            result["confidence"] = 0.85
            return result

    # Pattern: "Avoid DAY"
    avoid_match = re.search(r'avoid\s+(\w+)', text_lower)
    if avoid_match:
        day_str = avoid_match.group(1)
        day = DAY_MAP.get(day_str)
        if day:
            result["parsed_constraint"] = {
                "name": f"Avoid {day}",
                "constraint_type": "soft",
                "rule": {
                    "type": "avoid_day",
                    "day": day,
                    "penalty": -10,
                },
                "college_id": college_id,
                "priority": 2,
            }
            result["explanation"] = f"The system will try to avoid scheduling on {day.capitalize()}"
            result["confidence"] = 0.80
            return result

    # Pattern: "Labs must be continuous/consecutive"
    if re.search(r'labs?\s+(?:must\s+be\s+)?(?:continuous|consecutive|back.to.back)', text_lower):
        result["parsed_constraint"] = {
            "name": "Labs must be continuous",
            "constraint_type": "hard",
            "rule": {
                "type": "lab_continuous",
            },
            "college_id": college_id,
            "priority": 1,
        }
        result["explanation"] = "Lab sessions will be scheduled in consecutive time slots"
        result["confidence"] = 0.90
        return result

    # Default: couldn't parse
    result["explanation"] = "Could not parse the constraint. Please try rephrasing."
    result["confidence"] = 0.0
    return result


def explain_conflict(conflict: Dict) -> str:
    """Generate a human-readable explanation of a conflict."""
    ctype = conflict.get("type", "unknown")
    desc = conflict.get("description", "")

    explanations = {
        "teacher_clash": f"Schedule Conflict: {desc}. This means the same teacher is assigned to multiple classes at the same time. You need to move one of the conflicting classes to a different time slot.",
        "section_clash": f"Schedule Conflict: {desc}. Students in this section would need to attend multiple classes simultaneously, which is impossible. Move one class to a different time.",
        "room_clash": f"Room Conflict: {desc}. The same room is booked for multiple classes at once. Either change the room for one class or move it to a different time.",
    }

    return explanations.get(ctype, f"Conflict detected: {desc}")


def generate_suggestions(conflicts: List[Dict], entries: List[Dict]) -> List[Dict]:
    """Generate AI-powered suggestions to fix conflicts and improve the timetable."""
    suggestions = []

    for conflict in conflicts:
        if conflict["type"] == "teacher_clash":
            suggestions.append({
                "action": "move_class",
                "description": f"Resolve: {conflict['description']}",
                "suggestion": "Move one of the conflicting classes to an available time slot",
                "auto_fixable": True,
            })
        elif conflict["type"] == "room_clash":
            suggestions.append({
                "action": "change_room",
                "description": f"Resolve: {conflict['description']}",
                "suggestion": "Assign a different room to one of the classes",
                "auto_fixable": True,
            })

    return suggestions

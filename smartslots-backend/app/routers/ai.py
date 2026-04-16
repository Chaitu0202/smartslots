from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.models import User, UserRole, Constraint
from app.schemas.schemas import NLConstraintRequest
from app.services.ai_service import parse_natural_language_constraint, explain_conflict
from app.services.scheduler import detect_conflicts, suggest_improvements

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/parse-constraint")
def parse_constraint(
    data: NLConstraintRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.ADMIN)),
):
    result = parse_natural_language_constraint(data.text, data.college_id)

    # Optionally auto-create the constraint if confidence is high
    if result["confidence"] >= 0.8 and result["parsed_constraint"]:
        pc = result["parsed_constraint"]
        constraint = Constraint(
            name=pc["name"],
            description=f"Auto-created from: '{data.text}'",
            constraint_type=pc["constraint_type"],
            rule=pc["rule"],
            college_id=pc["college_id"],
            priority=pc.get("priority", 1),
        )
        db.add(constraint)
        db.commit()
        db.refresh(constraint)
        result["constraint_id"] = constraint.id
        result["auto_created"] = True

    return result


@router.get("/explain-conflicts/{timetable_id}")
def explain_conflicts_endpoint(
    timetable_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conflicts = detect_conflicts(db, timetable_id)
    explained = []
    for c in conflicts:
        explained.append({
            **c,
            "explanation": explain_conflict(c),
        })
    return {"conflicts": explained, "count": len(explained)}


@router.get("/suggestions/{timetable_id}")
def get_ai_suggestions(
    timetable_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    suggestions = suggest_improvements(db, timetable_id)
    return {"suggestions": suggestions, "count": len(suggestions)}

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.models import TimeSlot, User, UserRole
from app.schemas.schemas import TimeSlotCreate, TimeSlotResponse

router = APIRouter(prefix="/api/timeslots", tags=["timeslots"])


DEFAULT_SLOTS = [
    {"period": 1, "start_time": "09:00", "end_time": "09:50"},
    {"period": 2, "start_time": "09:50", "end_time": "10:40"},
    {"period": 3, "start_time": "10:50", "end_time": "11:40"},
    {"period": 4, "start_time": "11:40", "end_time": "12:30"},
    {"period": 5, "start_time": "13:30", "end_time": "14:20"},
    {"period": 6, "start_time": "14:20", "end_time": "15:10"},
    {"period": 7, "start_time": "15:20", "end_time": "16:10"},
    {"period": 8, "start_time": "16:10", "end_time": "17:00"},
]

DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]


@router.get("", response_model=List[TimeSlotResponse])
def list_timeslots(
    college_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(TimeSlot)
    if college_id:
        query = query.filter(TimeSlot.college_id == college_id)
    elif current_user.college_id:
        query = query.filter(TimeSlot.college_id == current_user.college_id)
    return query.order_by(TimeSlot.day, TimeSlot.period).all()


@router.post("", response_model=TimeSlotResponse)
def create_timeslot(
    data: TimeSlotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.ADMIN)),
):
    slot = TimeSlot(
        day=data.day,
        period=data.period,
        start_time=data.start_time,
        end_time=data.end_time,
        is_break=data.is_break,
        college_id=data.college_id,
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot


@router.post("/generate-default")
def generate_default_slots(
    college_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.ADMIN)),
):
    existing = db.query(TimeSlot).filter(TimeSlot.college_id == college_id).count()
    if existing > 0:
        return {"detail": f"Time slots already exist ({existing} slots). Delete them first to regenerate."}

    created = 0
    for day in DAYS:
        for slot_info in DEFAULT_SLOTS:
            slot = TimeSlot(
                day=day,
                period=slot_info["period"],
                start_time=slot_info["start_time"],
                end_time=slot_info["end_time"],
                is_break=False,
                college_id=college_id,
            )
            db.add(slot)
            created += 1
    db.commit()
    return {"detail": f"Created {created} default time slots"}


@router.delete("/{slot_id}")
def delete_timeslot(
    slot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.ADMIN)),
):
    slot = db.query(TimeSlot).filter(TimeSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Time slot not found")
    db.delete(slot)
    db.commit()
    return {"detail": "Time slot deleted"}

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.models import Teacher, TeacherPreference, User, UserRole
from app.schemas.schemas import (
    TeacherCreate, TeacherUpdate, TeacherResponse,
    TeacherPreferenceCreate, TeacherPreferenceResponse,
)

router = APIRouter(prefix="/api/teachers", tags=["teachers"])


@router.get("", response_model=List[TeacherResponse])
def list_teachers(
    department_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Teacher)
    if department_id:
        query = query.filter(Teacher.department_id == department_id)
    return query.all()


@router.post("", response_model=TeacherResponse)
def create_teacher(
    data: TeacherCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.ADMIN)),
):
    teacher = Teacher(
        employee_id=data.employee_id,
        name=data.name,
        email=data.email,
        phone=data.phone,
        department_id=data.department_id,
        user_id=data.user_id,
        max_hours_per_day=data.max_hours_per_day,
        max_hours_per_week=data.max_hours_per_week,
        color=data.color,
    )
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return teacher


@router.get("/{teacher_id}", response_model=TeacherResponse)
def get_teacher(teacher_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher


@router.put("/{teacher_id}", response_model=TeacherResponse)
def update_teacher(
    teacher_id: int,
    data: TeacherUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FACULTY)),
):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(teacher, field, value)
    db.commit()
    db.refresh(teacher)
    return teacher


@router.delete("/{teacher_id}")
def delete_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.ADMIN)),
):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    db.delete(teacher)
    db.commit()
    return {"detail": "Teacher deleted"}


# ---- Teacher Preferences ----
@router.get("/{teacher_id}/preferences", response_model=List[TeacherPreferenceResponse])
def get_preferences(teacher_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(TeacherPreference).filter(TeacherPreference.teacher_id == teacher_id).all()


@router.post("/{teacher_id}/preferences", response_model=TeacherPreferenceResponse)
def set_preference(
    teacher_id: int,
    data: TeacherPreferenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(TeacherPreference).filter(
        TeacherPreference.teacher_id == teacher_id,
        TeacherPreference.day == data.day,
        TeacherPreference.period == data.period,
    ).first()

    if existing:
        existing.preference = data.preference
        existing.reason = data.reason
        db.commit()
        db.refresh(existing)
        return existing

    pref = TeacherPreference(
        teacher_id=teacher_id,
        day=data.day,
        period=data.period,
        preference=data.preference,
        reason=data.reason,
    )
    db.add(pref)
    db.commit()
    db.refresh(pref)
    return pref


@router.delete("/{teacher_id}/preferences")
def clear_preferences(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(TeacherPreference).filter(TeacherPreference.teacher_id == teacher_id).delete()
    db.commit()
    return {"detail": "Preferences cleared"}

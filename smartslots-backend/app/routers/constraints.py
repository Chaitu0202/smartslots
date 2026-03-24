from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.models import Constraint, User, UserRole
from app.schemas.schemas import ConstraintCreate, ConstraintUpdate, ConstraintResponse

router = APIRouter(prefix="/api/constraints", tags=["constraints"])


@router.get("", response_model=List[ConstraintResponse])
def list_constraints(
    college_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Constraint)
    if college_id:
        query = query.filter(Constraint.college_id == college_id)
    elif current_user.college_id:
        query = query.filter(Constraint.college_id == current_user.college_id)
    return query.all()


@router.post("", response_model=ConstraintResponse)
def create_constraint(
    data: ConstraintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.ADMIN)),
):
    constraint = Constraint(
        name=data.name,
        description=data.description,
        constraint_type=data.constraint_type,
        rule=data.rule,
        college_id=data.college_id,
        priority=data.priority,
    )
    db.add(constraint)
    db.commit()
    db.refresh(constraint)
    return constraint


@router.get("/{constraint_id}", response_model=ConstraintResponse)
def get_constraint(constraint_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    constraint = db.query(Constraint).filter(Constraint.id == constraint_id).first()
    if not constraint:
        raise HTTPException(status_code=404, detail="Constraint not found")
    return constraint


@router.put("/{constraint_id}", response_model=ConstraintResponse)
def update_constraint(
    constraint_id: int,
    data: ConstraintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.ADMIN)),
):
    constraint = db.query(Constraint).filter(Constraint.id == constraint_id).first()
    if not constraint:
        raise HTTPException(status_code=404, detail="Constraint not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(constraint, field, value)
    db.commit()
    db.refresh(constraint)
    return constraint


@router.delete("/{constraint_id}")
def delete_constraint(
    constraint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.ADMIN)),
):
    constraint = db.query(Constraint).filter(Constraint.id == constraint_id).first()
    if not constraint:
        raise HTTPException(status_code=404, detail="Constraint not found")
    db.delete(constraint)
    db.commit()
    return {"detail": "Constraint deleted"}

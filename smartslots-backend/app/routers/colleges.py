from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.models import College, User, UserRole
from app.schemas.schemas import CollegeCreate, CollegeUpdate, CollegeResponse

router = APIRouter(prefix="/api/colleges", tags=["colleges"])


@router.get("", response_model=List[CollegeResponse])
def list_colleges(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.SUPER_ADMIN:
        return db.query(College).all()
    if current_user.college_id:
        return db.query(College).filter(College.id == current_user.college_id).all()
    return []


@router.post("", response_model=CollegeResponse)
def create_college(
    data: CollegeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
):
    existing = db.query(College).filter(College.code == data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="College code already exists")

    college = College(name=data.name, code=data.code, address=data.address)
    db.add(college)
    db.commit()
    db.refresh(college)
    return college


@router.get("/{college_id}", response_model=CollegeResponse)
def get_college(college_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    college = db.query(College).filter(College.id == college_id).first()
    if not college:
        raise HTTPException(status_code=404, detail="College not found")
    return college


@router.put("/{college_id}", response_model=CollegeResponse)
def update_college(
    college_id: int,
    data: CollegeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.ADMIN)),
):
    college = db.query(College).filter(College.id == college_id).first()
    if not college:
        raise HTTPException(status_code=404, detail="College not found")
    if data.name is not None:
        college.name = data.name
    if data.address is not None:
        college.address = data.address
    db.commit()
    db.refresh(college)
    return college


@router.delete("/{college_id}")
def delete_college(
    college_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
):
    college = db.query(College).filter(College.id == college_id).first()
    if not college:
        raise HTTPException(status_code=404, detail="College not found")
    db.delete(college)
    db.commit()
    return {"detail": "College deleted"}

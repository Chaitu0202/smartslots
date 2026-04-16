from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.models import SubjectAssignment, User, UserRole
from app.schemas.schemas import SubjectAssignmentCreate, SubjectAssignmentResponse

router = APIRouter(prefix="/api/assignments", tags=["assignments"])


@router.get("", response_model=List[SubjectAssignmentResponse])
def list_assignments(
    department_id: int = None,
    section_id: int = None,
    teacher_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(SubjectAssignment)
    if section_id:
        query = query.filter(SubjectAssignment.section_id == section_id)
    if teacher_id:
        query = query.filter(SubjectAssignment.teacher_id == teacher_id)
    return query.all()


@router.post("", response_model=SubjectAssignmentResponse)
def create_assignment(
    data: SubjectAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.ADMIN)),
):
    existing = db.query(SubjectAssignment).filter(
        SubjectAssignment.teacher_id == data.teacher_id,
        SubjectAssignment.subject_id == data.subject_id,
        SubjectAssignment.section_id == data.section_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Assignment already exists")

    assignment = SubjectAssignment(
        teacher_id=data.teacher_id,
        subject_id=data.subject_id,
        section_id=data.section_id,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.delete("/{assignment_id}")
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.ADMIN)),
):
    assignment = db.query(SubjectAssignment).filter(SubjectAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(assignment)
    db.commit()
    return {"detail": "Assignment deleted"}

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.models import Section, User, UserRole
from app.schemas.schemas import SectionCreate, SectionUpdate, SectionResponse

router = APIRouter(prefix="/api/sections", tags=["sections"])


@router.get("", response_model=List[SectionResponse])
def list_sections(
    department_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Section)
    if department_id:
        query = query.filter(Section.department_id == department_id)
    return query.all()


@router.post("", response_model=SectionResponse)
def create_section(
    data: SectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.ADMIN)),
):
    section = Section(
        name=data.name,
        year=data.year,
        semester=data.semester,
        department_id=data.department_id,
        student_count=data.student_count,
    )
    db.add(section)
    db.commit()
    db.refresh(section)
    return section


@router.get("/{section_id}", response_model=SectionResponse)
def get_section(section_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    section = db.query(Section).filter(Section.id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    return section


@router.put("/{section_id}", response_model=SectionResponse)
def update_section(
    section_id: int,
    data: SectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.ADMIN)),
):
    section = db.query(Section).filter(Section.id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(section, field, value)
    db.commit()
    db.refresh(section)
    return section


@router.delete("/{section_id}")
def delete_section(
    section_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.ADMIN)),
):
    section = db.query(Section).filter(Section.id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    db.delete(section)
    db.commit()
    return {"detail": "Section deleted"}

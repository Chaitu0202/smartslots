from sqlalchemy import (
    Column, Integer, String, Boolean, ForeignKey, Text, JSON,
    DateTime, Enum as SQLEnum, UniqueConstraint
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    FACULTY = "faculty"
    STUDENT = "student"


class DayOfWeek(str, enum.Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"


class ConstraintType(str, enum.Enum):
    HARD = "hard"
    SOFT = "soft"


class RoomType(str, enum.Enum):
    CLASSROOM = "classroom"
    LAB = "lab"
    SEMINAR_HALL = "seminar_hall"


class College(Base):
    __tablename__ = "colleges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    address = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    departments = relationship("Department", back_populates="college", cascade="all, delete-orphan")
    users = relationship("User", back_populates="college", cascade="all, delete-orphan")


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    college = relationship("College", back_populates="departments")
    teachers = relationship("Teacher", back_populates="department", cascade="all, delete-orphan")
    subjects = relationship("Subject", back_populates="department", cascade="all, delete-orphan")
    sections = relationship("Section", back_populates="department", cascade="all, delete-orphan")
    timetables = relationship("Timetable", back_populates="department", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("code", "college_id", name="uq_dept_code_college"),
    )


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.STUDENT)
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    college = relationship("College", back_populates="users")
    teacher_profile = relationship("Teacher", back_populates="user", uselist=False)


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    max_hours_per_day = Column(Integer, default=6)
    max_hours_per_week = Column(Integer, default=24)
    color = Column(String(7), default="#3B82F6")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    department = relationship("Department", back_populates="teachers")
    user = relationship("User", back_populates="teacher_profile")
    subject_assignments = relationship("SubjectAssignment", back_populates="teacher", cascade="all, delete-orphan")
    preferences = relationship("TeacherPreference", back_populates="teacher", cascade="all, delete-orphan")
    timetable_entries = relationship("TimetableEntry", back_populates="teacher")

    __table_args__ = (
        UniqueConstraint("employee_id", "department_id", name="uq_emp_dept"),
    )


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    hours_per_week = Column(Integer, default=4)
    is_lab = Column(Boolean, default=False)
    lab_hours = Column(Integer, default=0)
    color = Column(String(7), default="#10B981")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    department = relationship("Department", back_populates="subjects")
    assignments = relationship("SubjectAssignment", back_populates="subject", cascade="all, delete-orphan")
    timetable_entries = relationship("TimetableEntry", back_populates="subject")

    __table_args__ = (
        UniqueConstraint("code", "department_id", name="uq_subj_code_dept"),
    )


class Section(Base):
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    year = Column(Integer, nullable=False)
    semester = Column(Integer, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    student_count = Column(Integer, default=60)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    department = relationship("Department", back_populates="sections")
    subject_assignments = relationship("SubjectAssignment", back_populates="section", cascade="all, delete-orphan")
    timetable_entries = relationship("TimetableEntry", back_populates="section")

    __table_args__ = (
        UniqueConstraint("name", "year", "semester", "department_id", name="uq_section"),
    )


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    room_type = Column(SQLEnum(RoomType), default=RoomType.CLASSROOM)
    capacity = Column(Integer, default=60)
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=False)
    building = Column(String(100), nullable=True)
    floor = Column(Integer, nullable=True)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    timetable_entries = relationship("TimetableEntry", back_populates="room")

    __table_args__ = (
        UniqueConstraint("code", "college_id", name="uq_room_code_college"),
    )


class TimeSlot(Base):
    __tablename__ = "timeslots"

    id = Column(Integer, primary_key=True, index=True)
    day = Column(SQLEnum(DayOfWeek), nullable=False)
    period = Column(Integer, nullable=False)
    start_time = Column(String(10), nullable=False)
    end_time = Column(String(10), nullable=False)
    is_break = Column(Boolean, default=False)
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=False)

    timetable_entries = relationship("TimetableEntry", back_populates="timeslot")

    __table_args__ = (
        UniqueConstraint("day", "period", "college_id", name="uq_timeslot"),
    )


class SubjectAssignment(Base):
    __tablename__ = "subject_assignments"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=False)

    teacher = relationship("Teacher", back_populates="subject_assignments")
    subject = relationship("Subject", back_populates="assignments")
    section = relationship("Section", back_populates="subject_assignments")

    __table_args__ = (
        UniqueConstraint("teacher_id", "subject_id", "section_id", name="uq_assignment"),
    )


class TeacherPreference(Base):
    __tablename__ = "teacher_preferences"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    day = Column(SQLEnum(DayOfWeek), nullable=False)
    period = Column(Integer, nullable=False)
    preference = Column(String(20), default="available")  # available, preferred, unavailable
    reason = Column(Text, nullable=True)

    teacher = relationship("Teacher", back_populates="preferences")

    __table_args__ = (
        UniqueConstraint("teacher_id", "day", "period", name="uq_teacher_pref"),
    )


class Constraint(Base):
    __tablename__ = "constraints"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    constraint_type = Column(SQLEnum(ConstraintType), default=ConstraintType.HARD)
    rule = Column(JSON, nullable=False)
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=1)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Timetable(Base):
    __tablename__ = "timetables"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    academic_year = Column(String(20), nullable=False)
    semester = Column(Integer, nullable=False)
    is_published = Column(Boolean, default=False)
    score = Column(Integer, default=0)
    generation_log = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    department = relationship("Department", back_populates="timetables")
    entries = relationship("TimetableEntry", back_populates="timetable", cascade="all, delete-orphan")


class TimetableEntry(Base):
    __tablename__ = "timetable_entries"

    id = Column(Integer, primary_key=True, index=True)
    timetable_id = Column(Integer, ForeignKey("timetables.id"), nullable=False)
    timeslot_id = Column(Integer, ForeignKey("timeslots.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)

    timetable = relationship("Timetable", back_populates="entries")
    timeslot = relationship("TimeSlot", back_populates="timetable_entries")
    subject = relationship("Subject", back_populates="timetable_entries")
    teacher = relationship("Teacher", back_populates="timetable_entries")
    section = relationship("Section", back_populates="timetable_entries")
    room = relationship("Room", back_populates="timetable_entries")

    __table_args__ = (
        UniqueConstraint("timetable_id", "timeslot_id", "section_id", name="uq_entry_slot_section"),
    )

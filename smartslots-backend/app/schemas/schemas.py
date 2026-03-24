from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime


# ---- Auth ----
class LoginRequest(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: int
    role: str


# ---- User ----
class UserCreate(BaseModel):
    email: str
    full_name: str
    password: str
    role: str = "student"
    college_id: Optional[int] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    college_id: Optional[int] = None
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- College ----
class CollegeCreate(BaseModel):
    name: str
    code: str
    address: Optional[str] = None


class CollegeUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None


class CollegeResponse(BaseModel):
    id: int
    name: str
    code: str
    address: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- Department ----
class DepartmentCreate(BaseModel):
    name: str
    code: str
    college_id: int


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None


class DepartmentResponse(BaseModel):
    id: int
    name: str
    code: str
    college_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- Teacher ----
class TeacherCreate(BaseModel):
    employee_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    department_id: int
    user_id: Optional[int] = None
    max_hours_per_day: int = 6
    max_hours_per_week: int = 24
    color: str = "#3B82F6"


class TeacherUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    max_hours_per_day: Optional[int] = None
    max_hours_per_week: Optional[int] = None
    color: Optional[str] = None


class TeacherResponse(BaseModel):
    id: int
    employee_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    department_id: int
    user_id: Optional[int] = None
    max_hours_per_day: int
    max_hours_per_week: int
    color: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- Subject ----
class SubjectCreate(BaseModel):
    name: str
    code: str
    department_id: int
    hours_per_week: int = 4
    is_lab: bool = False
    lab_hours: int = 0
    color: str = "#10B981"


class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    hours_per_week: Optional[int] = None
    is_lab: Optional[bool] = None
    lab_hours: Optional[int] = None
    color: Optional[str] = None


class SubjectResponse(BaseModel):
    id: int
    name: str
    code: str
    department_id: int
    hours_per_week: int
    is_lab: bool
    lab_hours: int
    color: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- Section ----
class SectionCreate(BaseModel):
    name: str
    year: int
    semester: int
    department_id: int
    student_count: int = 60


class SectionUpdate(BaseModel):
    name: Optional[str] = None
    student_count: Optional[int] = None


class SectionResponse(BaseModel):
    id: int
    name: str
    year: int
    semester: int
    department_id: int
    student_count: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- Room ----
class RoomCreate(BaseModel):
    name: str
    code: str
    room_type: str = "classroom"
    capacity: int = 60
    college_id: int
    building: Optional[str] = None
    floor: Optional[int] = None


class RoomUpdate(BaseModel):
    name: Optional[str] = None
    capacity: Optional[int] = None
    room_type: Optional[str] = None
    is_available: Optional[bool] = None
    building: Optional[str] = None
    floor: Optional[int] = None


class RoomResponse(BaseModel):
    id: int
    name: str
    code: str
    room_type: str
    capacity: int
    college_id: int
    building: Optional[str] = None
    floor: Optional[int] = None
    is_available: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- TimeSlot ----
class TimeSlotCreate(BaseModel):
    day: str
    period: int
    start_time: str
    end_time: str
    is_break: bool = False
    college_id: int


class TimeSlotResponse(BaseModel):
    id: int
    day: str
    period: int
    start_time: str
    end_time: str
    is_break: bool
    college_id: int

    class Config:
        from_attributes = True


# ---- SubjectAssignment ----
class SubjectAssignmentCreate(BaseModel):
    teacher_id: int
    subject_id: int
    section_id: int


class SubjectAssignmentResponse(BaseModel):
    id: int
    teacher_id: int
    subject_id: int
    section_id: int

    class Config:
        from_attributes = True


# ---- TeacherPreference ----
class TeacherPreferenceCreate(BaseModel):
    teacher_id: int
    day: str
    period: int
    preference: str = "available"
    reason: Optional[str] = None


class TeacherPreferenceResponse(BaseModel):
    id: int
    teacher_id: int
    day: str
    period: int
    preference: str
    reason: Optional[str] = None

    class Config:
        from_attributes = True


# ---- Constraint ----
class ConstraintCreate(BaseModel):
    name: str
    description: Optional[str] = None
    constraint_type: str = "hard"
    rule: dict
    college_id: int
    priority: int = 1


class ConstraintUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    constraint_type: Optional[str] = None
    rule: Optional[dict] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = None


class ConstraintResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    constraint_type: str
    rule: dict
    college_id: int
    is_active: bool
    priority: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- Timetable ----
class TimetableCreate(BaseModel):
    name: str
    department_id: int
    academic_year: str
    semester: int


class TimetableEntryResponse(BaseModel):
    id: int
    timetable_id: int
    timeslot_id: int
    subject_id: int
    teacher_id: int
    section_id: int
    room_id: Optional[int] = None

    # Nested data for display
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    subject_color: Optional[str] = None
    teacher_name: Optional[str] = None
    teacher_color: Optional[str] = None
    section_name: Optional[str] = None
    room_name: Optional[str] = None
    day: Optional[str] = None
    period: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_lab: Optional[bool] = None

    class Config:
        from_attributes = True


class TimetableResponse(BaseModel):
    id: int
    name: str
    department_id: int
    academic_year: str
    semester: int
    is_published: bool
    score: int
    generation_log: Optional[Any] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    entries: Optional[List[TimetableEntryResponse]] = None

    class Config:
        from_attributes = True


class TimetableEntryUpdate(BaseModel):
    timeslot_id: int
    subject_id: int
    teacher_id: int
    section_id: int
    room_id: Optional[int] = None


# ---- Generate Timetable ----
class GenerateRequest(BaseModel):
    department_id: int
    academic_year: str
    semester: int
    name: Optional[str] = "Auto-Generated Timetable"


# ---- AI ----
class NLConstraintRequest(BaseModel):
    text: str
    college_id: int


class NLConstraintResponse(BaseModel):
    parsed_constraint: dict
    explanation: str
    confidence: float


class ConflictExplanation(BaseModel):
    conflict_type: str
    description: str
    affected_entries: List[dict]
    suggestion: Optional[str] = None


class SuggestionResponse(BaseModel):
    suggestions: List[dict]
    score_improvement: int


# ---- Dashboard ----
class DashboardStats(BaseModel):
    total_teachers: int
    total_subjects: int
    total_rooms: int
    total_sections: int
    total_timetables: int
    published_timetables: int
    teacher_load: List[dict]
    room_usage: List[dict]
    department_stats: List[dict]

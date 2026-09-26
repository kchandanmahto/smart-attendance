from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr


class StudentCreate(BaseModel):
    department_id: UUID
    course_id: UUID
    section_id: UUID

    student_id: str
    roll_number: str | None = None
    admission_number: str | None = None

    first_name: str
    last_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None

    date_of_birth: date | None = None
    gender: str | None = None

    year: int | None = None
    semester: int | None = None

    profile_photo: str | None = None


class StudentUpdate(BaseModel):
    department_id: UUID | None = None
    course_id: UUID | None = None
    section_id: UUID | None = None

    roll_number: str | None = None
    admission_number: str | None = None

    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None

    date_of_birth: date | None = None
    gender: str | None = None

    year: int | None = None
    semester: int | None = None

    profile_photo: str | None = None
    is_active: bool | None = None


class StudentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID

    user_id: UUID | None

    department_id: UUID
    course_id: UUID
    section_id: UUID

    student_id: str
    roll_number: str | None
    admission_number: str | None

    first_name: str
    last_name: str | None

    email: str | None
    phone: str | None

    date_of_birth: date | None
    gender: str | None

    year: int | None
    semester: int | None

    profile_photo: str | None

    face_enrollment_status: str
    is_active: bool

    created_at: datetime
    updated_at: datetime
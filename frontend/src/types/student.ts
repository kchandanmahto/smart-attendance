export interface Student {
    id: string;
    organization_id: string;
    user_id: string | null;

    department_id: string | null;
    course_id: string | null;
    section_id: string | null;

    student_id: string;
    roll_number: string | null;
    admission_number: string | null;

    first_name: string;
    last_name: string | null;

    email: string | null;
    phone: string | null;

    date_of_birth: string | null;
    gender: string | null;

    academic_year: string | null;
    semester: number | null;

    profile_photo_url: string | null;
    face_enrollment_status: string;

    is_active: boolean;

    created_at: string;
    updated_at: string;
}

export interface StudentCreate {
    student_id: string;
    department_id: string;
    course_id: string;
    section_id: string;

    roll_number?: string;
    admission_number?: string;

    first_name: string;
    last_name?: string;

    email?: string;
    phone?: string;

    date_of_birth?: string;
    gender?: string;

    academic_year?: string;
    semester?: number;
}

export interface StudentUpdate {
    department_id?: string;
    course_id?: string;
    section_id?: string;

    roll_number?: string;
    admission_number?: string;

    first_name?: string;
    last_name?: string;

    email?: string;
    phone?: string;

    date_of_birth?: string;
    gender?: string;

    academic_year?: string;
    semester?: number;

    is_active?: boolean;
}

export interface Department {
    id: string;
    organization_id: string;
    name: string;
    code: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Course {
    id: string;
    organization_id: string;
    department_id: string;
    name: string;
    code: string;
    duration_years: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Section {
    id: string;
    course_id: string;
    name: string;
    academic_year: string;
    semester: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
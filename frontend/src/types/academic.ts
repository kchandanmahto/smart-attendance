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

export interface DepartmentCreate {
    name: string;
    code: string;
    description?: string;
}

export interface DepartmentUpdate {
    name?: string;
    code?: string;
    description?: string;
    is_active?: boolean;
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

export interface CourseCreate {
    department_id: string;
    name: string;
    code: string;
    duration_years?: number;
}

export interface CourseUpdate {
    department_id?: string;
    name?: string;
    code?: string;
    duration_years?: number;
    is_active?: boolean;
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

export interface SectionCreate {
    course_id: string;
    name: string;
    academic_year: string;
    semester: number;
}

export interface SectionUpdate {
    course_id?: string;
    name?: string;
    academic_year?: string;
    semester?: number;
    is_active?: boolean;
}
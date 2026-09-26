import { apiRequest } from "./api";

import {
    Course,
    CourseCreate,
    CourseUpdate,
    Department,
    DepartmentCreate,
    DepartmentUpdate,
    Section,
    SectionCreate,
    SectionUpdate,
} from "@/types/academic";

/* =========================
   DEPARTMENTS
========================= */

export async function getDepartments(): Promise<Department[]> {
    return apiRequest<Department[]>("/departments");
}

export async function createDepartment(
    data: DepartmentCreate,
): Promise<Department> {
    return apiRequest<Department>("/departments", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateDepartment(
    departmentId: string,
    data: DepartmentUpdate,
): Promise<Department> {
    return apiRequest<Department>(
        `/departments/${departmentId}`,
        {
            method: "PATCH",
            body: JSON.stringify(data),
        },
    );
}

export async function deleteDepartment(
    departmentId: string,
): Promise<Department> {
    return apiRequest<Department>(
        `/departments/${departmentId}`,
        {
            method: "DELETE",
        },
    );
}

/* =========================
   COURSES
========================= */

export async function getCourses(): Promise<Course[]> {
    return apiRequest<Course[]>("/courses");
}

export async function createCourse(
    data: CourseCreate,
): Promise<Course> {
    return apiRequest<Course>("/courses", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateCourse(
    courseId: string,
    data: CourseUpdate,
): Promise<Course> {
    return apiRequest<Course>(
        `/courses/${courseId}`,
        {
            method: "PATCH",
            body: JSON.stringify(data),
        },
    );
}

export async function deleteCourse(
    courseId: string,
): Promise<Course> {
    return apiRequest<Course>(
        `/courses/${courseId}`,
        {
            method: "DELETE",
        },
    );
}

/* =========================
   SECTIONS
========================= */

export async function getSections(): Promise<Section[]> {
    return apiRequest<Section[]>("/sections");
}

export async function createSection(
    data: SectionCreate,
): Promise<Section> {
    return apiRequest<Section>("/sections", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateSection(
    sectionId: string,
    data: SectionUpdate,
): Promise<Section> {
    return apiRequest<Section>(
        `/sections/${sectionId}`,
        {
            method: "PATCH",
            body: JSON.stringify(data),
        },
    );
}

export async function deleteSection(
    sectionId: string,
): Promise<Section> {
    return apiRequest<Section>(
        `/sections/${sectionId}`,
        {
            method: "DELETE",
        },
    );
}
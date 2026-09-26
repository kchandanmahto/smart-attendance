import { apiRequest } from "./api";

import {
    Course,
    Department,
    Section,
    Student,
    StudentCreate,
    StudentUpdate,
} from "@/types/student";

export async function getStudents(): Promise<Student[]> {
    return apiRequest<Student[]>("/students");
}

export async function createStudent(
    data: StudentCreate,
): Promise<Student> {
    return apiRequest<Student>("/students", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateStudent(
    studentId: string,
    data: StudentUpdate,
): Promise<Student> {
    return apiRequest<Student>(`/students/${studentId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

export async function deleteStudent(
    studentId: string,
): Promise<void> {
    await apiRequest(`/students/${studentId}`, {
        method: "DELETE",
    });
}

export async function getDepartments(): Promise<Department[]> {
    return apiRequest<Department[]>("/departments");
}

export async function getCourses(): Promise<Course[]> {
    return apiRequest<Course[]>("/courses");
}

export async function getSections(): Promise<Section[]> {
    return apiRequest<Section[]>("/sections");
}
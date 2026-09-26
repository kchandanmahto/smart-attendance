export interface DashboardSummary {
    attendance_date: string;
    total_students: number;
    present: number;
    late: number;
    absent: number;
    attendance_percentage: number;
    face_recognition_count: number;
    manual_count: number;
    unknown_count: number;
}


export interface DepartmentAttendance {
    department_id: string;
    department_name: string;
    total_students: number;
    present: number;
    late: number;
    absent: number;
    attendance_percentage: number;
}
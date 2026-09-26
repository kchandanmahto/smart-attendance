export interface Attendance {
    id: string;
    organization_id: string;
    student_id: string;
    section_id: string | null;
    attendance_date: string;
    check_in_time: string | null;
    check_out_time: string | null;
    status: string;
    source: string;
    confidence_score: number | null;
    verification_method: string | null;
    remarks: string | null;
    marked_by: string | null;
    created_at: string;
    updated_at: string;
}
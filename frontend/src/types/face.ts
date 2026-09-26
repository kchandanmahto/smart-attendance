export interface FaceEnrollment {
    id: string;
    student_id: string;
    status: string;
    capture_count: number;
    required_capture_count: number;
    started_at: string | null;
    completed_at: string | null;
}

export interface FaceCaptureResponse {
    success: boolean;
    message: string;
    capture_count: number;
    required_capture_count: number;
    quality_score?: number | null;
}

export interface FaceEnrollmentResponse {
    success: boolean;
    message: string;
    enrollment: FaceEnrollment;
}

export interface FaceTrainingResponse {
    success: boolean;
    message: string;
    model_version?: string | null;
}

export interface FaceRecognitionResponse {
    success: boolean;
    recognized: boolean;
    student_id?: string | null;
    confidence?: number | null;
    distance?: number | null;
    message: string;
}
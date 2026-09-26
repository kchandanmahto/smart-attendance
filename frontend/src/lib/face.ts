import { apiRequest, uploadFile } from "./api";

import {
    FaceCaptureResponse,
    FaceEnrollmentResponse,
    FaceRecognitionResponse,
    FaceTrainingResponse,
} from "@/types/face";

/* =========================================
   START FACE ENROLLMENT
========================================= */

export async function startFaceEnrollment(
    studentId: string,
): Promise<FaceEnrollmentResponse> {
    return apiRequest<FaceEnrollmentResponse>(
        `/face/enrollment/${studentId}/start`,
        {
            method: "POST",
        },
    );
}

/* =========================================
   CAPTURE FACE IMAGE
========================================= */

export async function captureFace(
    studentId: string,
    image: Blob,
): Promise<FaceCaptureResponse> {
    const file = new File(
        [image],
        `face-${Date.now()}.jpg`,
        {
            type: "image/jpeg",
        },
    );

    return uploadFile<FaceCaptureResponse>(
        `/face/enrollment/${studentId}/capture`,
        file,
    );
}

/* =========================================
   COMPLETE FACE ENROLLMENT
========================================= */

export async function completeFaceEnrollment(
    studentId: string,
): Promise<FaceEnrollmentResponse> {
    return apiRequest<FaceEnrollmentResponse>(
        `/face/enrollment/${studentId}/complete`,
        {
            method: "POST",
        },
    );
}

/* =========================================
   TRAIN FACE MODEL
========================================= */

export async function trainFaceModel(): Promise<FaceTrainingResponse> {
    return apiRequest<FaceTrainingResponse>(
        "/face/train",
        {
            method: "POST",
        },
    );
}

/* =========================================
   RECOGNIZE FACE
========================================= */

export async function recognizeFace(
    image: Blob,
): Promise<FaceRecognitionResponse> {
    const file = new File(
        [image],
        `recognition-${Date.now()}.jpg`,
        {
            type: "image/jpeg",
        },
    );

    return uploadFile<FaceRecognitionResponse>(
        "/face/recognize",
        file,
    );
}

/* =========================================
   RECOGNIZE + MARK ATTENDANCE
========================================= */

export async function recognizeAndMarkAttendance(
    image: Blob,
): Promise<FaceRecognitionResponse> {
    const file = new File(
        [image],
        `attendance-${Date.now()}.jpg`,
        {
            type: "image/jpeg",
        },
    );

    return uploadFile<FaceRecognitionResponse>(
        "/face/recognize-and-mark-attendance",
        file,
    );
}
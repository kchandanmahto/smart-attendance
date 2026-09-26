"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import { useSearchParams } from "next/navigation";

import {
    captureFace,
    completeFaceEnrollment,
    startFaceEnrollment,
    trainFaceModel,
} from "@/lib/face";

import { Student } from "@/types/student";

import { getStudents } from "@/lib/students";

const REQUIRED_CAPTURES = 20;

type EnrollmentStatus =
    | "IDLE"
    | "STARTED"
    | "CAPTURING"
    | "COMPLETED"
    | "ERROR";

export default function FaceEnrollmentPage() {
    const searchParams = useSearchParams();

    const studentIdFromUrl =
        searchParams.get("student_id");

    const videoRef =
        useRef<HTMLVideoElement | null>(null);

    const canvasRef =
        useRef<HTMLCanvasElement | null>(null);

    const streamRef =
        useRef<MediaStream | null>(null);

    const [students, setStudents] = useState<Student[]>(
        [],
    );

    const [selectedStudentId, setSelectedStudentId] =
        useState(studentIdFromUrl ?? "");

    const [loadingStudents, setLoadingStudents] =
        useState(true);

    const [cameraActive, setCameraActive] =
        useState(false);

    const [cameraLoading, setCameraLoading] =
        useState(false);

    const [capturing, setCapturing] =
        useState(false);

    const [captureCount, setCaptureCount] =
        useState(0);

    const [status, setStatus] =
        useState<EnrollmentStatus>("IDLE");

    const [message, setMessage] =
        useState("");

    const [error, setError] = useState("");

    const [training, setTraining] =
        useState(false);

    const selectedStudent = students.find(
        (student) =>
            student.id === selectedStudentId,
    );

    /*
     * Load students
     */
    useEffect(() => {
        let cancelled = false;

        async function loadStudents() {
            setLoadingStudents(true);
            setError("");

            try {
                const data = await getStudents();

                if (cancelled) {
                    return;
                }

                setStudents(data);

                if (
                    studentIdFromUrl &&
                    data.some(
                        (student) =>
                            student.id ===
                            studentIdFromUrl,
                    )
                ) {
                    setSelectedStudentId(
                        studentIdFromUrl,
                    );
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load students.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingStudents(false);
                }
            }
        }

        void loadStudents();

        return () => {
            cancelled = true;
        };
    }, [studentIdFromUrl]);

    /*
     * Stop camera
     */
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current
                .getTracks()
                .forEach((track) => track.stop());

            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setCameraActive(false);
    }, []);

    /*
     * Cleanup camera when leaving page
     */
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current
                    .getTracks()
                    .forEach((track) =>
                        track.stop(),
                    );
            }
        };
    }, []);

    /*
     * Start browser camera
     */
    async function startCamera() {
        setError("");
        setMessage("");

        if (!selectedStudentId) {
            setError(
                "Please select a student first.",
            );
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setError(
                "Camera access is not supported by this browser.",
            );
            return;
        }

        setCameraLoading(true);

        try {
            stopCamera();

            const stream =
                await navigator.mediaDevices.getUserMedia(
                    {
                        video: {
                            facingMode: "user",
                            width: {
                                ideal: 1280,
                            },
                            height: {
                                ideal: 720,
                            },
                        },
                        audio: false,
                    },
                );

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject =
                    stream;

                await videoRef.current.play();
            }

            setCameraActive(true);
            setStatus("IDLE");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to access camera.",
            );
        } finally {
            setCameraLoading(false);
        }
    }

    /*
     * Start backend enrollment
     */
    async function handleStartEnrollment() {
        setError("");
        setMessage("");

        if (!selectedStudentId) {
            setError(
                "Please select a student first.",
            );
            return;
        }

        if (!cameraActive) {
            setError(
                "Please start the camera first.",
            );
            return;
        }

        try {
            const response =
                await startFaceEnrollment(
                    selectedStudentId,
                );

            setCaptureCount(0);
            setStatus("STARTED");

            setMessage(
                response.message ||
                "Face enrollment started.",
            );
        } catch (err) {
            setStatus("ERROR");

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to start face enrollment.",
            );
        }
    }

    /*
     * Capture image from video
     */
    async function handleCapture() {
        setError("");
        setMessage("");

        if (!selectedStudentId) {
            setError(
                "Please select a student.",
            );
            return;
        }

        if (!videoRef.current) {
            setError(
                "Camera video is not available.",
            );
            return;
        }

        if (!canvasRef.current) {
            setError(
                "Capture canvas is not available.",
            );
            return;
        }

        if (
            status !== "STARTED" &&
            status !== "CAPTURING"
        ) {
            setError(
                "Start enrollment before capturing.",
            );
            return;
        }

        if (
            captureCount >=
            REQUIRED_CAPTURES
        ) {
            setError(
                "Required captures are already completed.",
            );
            return;
        }

        setCapturing(true);
        setStatus("CAPTURING");

        try {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            const width =
                video.videoWidth || 1280;

            const height =
                video.videoHeight || 720;

            canvas.width = width;
            canvas.height = height;

            const context =
                canvas.getContext("2d");

            if (!context) {
                throw new Error(
                    "Unable to access canvas.",
                );
            }

            context.drawImage(
                video,
                0,
                0,
                width,
                height,
            );

            const blob =
                await new Promise<Blob | null>(
                    (resolve) => {
                        canvas.toBlob(
                            resolve,
                            "image/jpeg",
                            0.9,
                        );
                    },
                );

            if (!blob) {
                throw new Error(
                    "Failed to create image.",
                );
            }

            const response =
                await captureFace(
                    selectedStudentId,
                    blob,
                );

            const newCount =
                response.capture_count ??
                captureCount + 1;

            setCaptureCount(newCount);

            setMessage(
                response.message ||
                `Capture ${newCount} completed.`,
            );

            if (
                newCount >=
                REQUIRED_CAPTURES
            ) {
                setStatus("COMPLETED");
            } else {
                setStatus("STARTED");
            }
        } catch (err) {
            setStatus("ERROR");

            setError(
                err instanceof Error
                    ? err.message
                    : "Face capture failed.",
            );
        } finally {
            setCapturing(false);
        }
    }

    /*
     * Complete enrollment
     */
    async function handleCompleteEnrollment() {
        setError("");
        setMessage("");

        if (!selectedStudentId) {
            setError(
                "Please select a student.",
            );
            return;
        }

        if (
            captureCount <
            REQUIRED_CAPTURES
        ) {
            setError(
                `Please capture at least ${REQUIRED_CAPTURES} face images.`,
            );
            return;
        }

        try {
            const response =
                await completeFaceEnrollment(
                    selectedStudentId,
                );

            setStatus("COMPLETED");

            setMessage(
                response.message ||
                "Face enrollment completed successfully.",
            );
        } catch (err) {
            setStatus("ERROR");

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to complete enrollment.",
            );
        }
    }

    /*
     * Train LBPH model
     */
    async function handleTrainModel() {
        setError("");
        setMessage("");

        setTraining(true);

        try {
            const response =
                await trainFaceModel();

            setMessage(
                response.message ||
                "Face model trained successfully.",
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Face model training failed.",
            );
        } finally {
            setTraining(false);
        }
    }

    /*
     * Reset current enrollment
     */
    function resetEnrollment() {
        setCaptureCount(0);
        setStatus("IDLE");
        setMessage("");
        setError("");
    }

    /*
     * Progress
     */
    const progress =
        Math.min(
            (captureCount /
                REQUIRED_CAPTURES) *
            100,
            100,
        );

    return (
        <main className="min-h-screen bg-slate-950 p-6 text-white">
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">
                        Face Enrollment
                    </h1>

                    <p className="mt-1 text-sm text-slate-400">
                        Register a student&apos;s face
                        for automatic attendance
                        recognition.
                    </p>
                </div>

                {/* Messages */}
                {error && (
                    <div
                        role="alert"
                        className="mb-4 rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300"
                    >
                        {error}
                    </div>
                )}

                {message && (
                    <div
                        role="status"
                        className="mb-4 rounded-lg border border-emerald-900 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300"
                    >
                        {message}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
                    {/* Left panel */}
                    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                        <h2 className="text-xl font-semibold">
                            Enrollment Setup
                        </h2>

                        {/* Student */}
                        <div className="mt-6">
                            <label
                                htmlFor="student"
                                className="mb-2 block text-sm font-medium text-slate-300"
                            >
                                Student
                            </label>

                            <select
                                id="student"
                                value={
                                    selectedStudentId
                                }
                                onChange={(
                                    event,
                                ) => {
                                    setSelectedStudentId(
                                        event.target
                                            .value,
                                    );

                                    resetEnrollment();
                                }}
                                disabled={
                                    loadingStudents ||
                                    status ===
                                    "CAPTURING"
                                }
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
                            >
                                <option value="">
                                    {loadingStudents
                                        ? "Loading students..."
                                        : "Select student"}
                                </option>

                                {students.map(
                                    (student) => (
                                        <option
                                            key={
                                                student.id
                                            }
                                            value={
                                                student.id
                                            }
                                        >
                                            {
                                                student.first_name
                                            }{" "}
                                            {
                                                student.last_name ??
                                                ""
                                            }{" "}
                                            —{" "}
                                            {
                                                student.student_id
                                            }
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>

                        {/* Student info */}
                        {selectedStudent && (
                            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
                                <p className="font-medium text-white">
                                    {
                                        selectedStudent.first_name
                                    }{" "}
                                    {
                                        selectedStudent.last_name ??
                                        ""
                                    }
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    ID:{" "}
                                    {
                                        selectedStudent.student_id
                                    }
                                </p>

                                {selectedStudent.email && (
                                    <p className="mt-1 text-xs text-slate-500">
                                        {
                                            selectedStudent.email
                                        }
                                    </p>
                                )}

                                <div className="mt-3">
                                    <span className="text-xs text-slate-500">
                                        Enrollment Status
                                    </span>

                                    <div className="mt-1">
                                        <StatusBadge
                                            status={
                                                selectedStudent.face_enrollment_status
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Camera button */}
                        <div className="mt-6 space-y-3">
                            {!cameraActive ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        void startCamera()
                                    }
                                    disabled={
                                        cameraLoading ||
                                        !selectedStudentId
                                    }
                                    className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {cameraLoading
                                        ? "Starting Camera..."
                                        : "Start Camera"}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={
                                        stopCamera
                                    }
                                    className="w-full rounded-lg border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                                >
                                    Stop Camera
                                </button>
                            )}
                        </div>

                        {/* Backend enrollment */}
                        <div className="mt-3">
                            <button
                                type="button"
                                onClick={() =>
                                    void handleStartEnrollment()
                                }
                                disabled={
                                    !cameraActive ||
                                    !selectedStudentId ||
                                    status ===
                                    "STARTED" ||
                                    status ===
                                    "CAPTURING"
                                }
                                className="w-full rounded-lg border border-blue-800 bg-blue-950/30 px-4 py-3 text-sm font-medium text-blue-300 transition hover:bg-blue-950/60 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Start Enrollment
                            </button>
                        </div>

                        {/* Complete */}
                        <div className="mt-3">
                            <button
                                type="button"
                                onClick={() =>
                                    void handleCompleteEnrollment()
                                }
                                disabled={
                                    captureCount <
                                    REQUIRED_CAPTURES
                                }
                                className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Complete Enrollment
                            </button>
                        </div>

                        {/* Train */}
                        <div className="mt-3">
                            <button
                                type="button"
                                onClick={() =>
                                    void handleTrainModel()
                                }
                                disabled={
                                    training
                                }
                                className="w-full rounded-lg border border-purple-800 bg-purple-950/30 px-4 py-3 text-sm font-medium text-purple-300 transition hover:bg-purple-950/60 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {training
                                    ? "Training Model..."
                                    : "Train Face Model"}
                            </button>
                        </div>
                    </section>

                    {/* Camera panel */}
                    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">
                                    Camera
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Keep the student&apos;s
                                    face clearly visible.
                                </p>
                            </div>

                            <div className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm">
                                <span className="text-slate-400">
                                    Captured:
                                </span>{" "}
                                <span className="font-semibold text-white">
                                    {captureCount}
                                </span>
                                <span className="text-slate-500">
                                    {" "}
                                    /{" "}
                                    {
                                        REQUIRED_CAPTURES
                                    }
                                </span>
                            </div>
                        </div>

                        {/* Camera */}
                        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-black">
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className={`aspect-video w-full object-cover ${cameraActive
                                        ? ""
                                        : "hidden"
                                    }`}
                            />

                            {!cameraActive && (
                                <div className="flex aspect-video items-center justify-center">
                                    <div className="text-center">
                                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-2xl">
                                            📷
                                        </div>

                                        <p className="font-medium text-slate-300">
                                            Camera is
                                            inactive
                                        </p>

                                        <p className="mt-1 text-sm text-slate-600">
                                            Select a student
                                            and start the
                                            camera.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Face guide */}
                            {cameraActive && (
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                    <div className="h-64 w-48 rounded-[50%] border-2 border-dashed border-white/70 sm:h-72 sm:w-56" />
                                </div>
                            )}
                        </div>

                        {/* Hidden canvas */}
                        <canvas
                            ref={canvasRef}
                            className="hidden"
                        />

                        {/* Progress */}
                        <div className="mt-6">
                            <div className="mb-2 flex justify-between text-sm">
                                <span className="text-slate-400">
                                    Enrollment Progress
                                </span>

                                <span className="font-medium text-white">
                                    {Math.round(
                                        progress,
                                    )}
                                    %
                                </span>
                            </div>

                            <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                                <div
                                    className="h-full rounded-full bg-blue-600 transition-all duration-300"
                                    style={{
                                        width: `${progress}%`,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Capture */}
                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={() =>
                                    void handleCapture()
                                }
                                disabled={
                                    !cameraActive ||
                                    capturing ||
                                    status ===
                                    "IDLE" ||
                                    captureCount >=
                                    REQUIRED_CAPTURES
                                }
                                className="w-full rounded-xl bg-white px-5 py-4 text-base font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {capturing
                                    ? "Processing Capture..."
                                    : captureCount >=
                                        REQUIRED_CAPTURES
                                        ? "20 Captures Completed"
                                        : "Capture Face"}
                            </button>
                        </div>

                        {/* Instructions */}
                        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4">
                            <h3 className="text-sm font-semibold text-slate-300">
                                Capture Guidelines
                            </h3>

                            <ul className="mt-3 space-y-2 text-xs text-slate-500">
                                <li>
                                    • Keep the face
                                    centered inside the
                                    guide.
                                </li>

                                <li>
                                    • Make sure lighting
                                    is sufficient.
                                </li>

                                <li>
                                    • Keep the face clearly
                                    visible.
                                </li>

                                <li>
                                    • Avoid covering the
                                    face.
                                </li>

                                <li>
                                    • Capture different
                                    natural positions.
                                </li>

                                <li>
                                    • Required captures:{" "}
                                    {
                                        REQUIRED_CAPTURES
                                    }
                                </li>
                            </ul>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}

/*
 * Status
 */
function StatusBadge({
    status,
}: {
    status: string;
}) {
    const normalized =
        status?.toUpperCase() ||
        "NOT_ENROLLED";

    const enrolled =
        normalized === "COMPLETED" ||
        normalized === "ENROLLED" ||
        normalized === "ACTIVE";

    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${enrolled
                    ? "bg-emerald-950 text-emerald-300"
                    : "bg-amber-950 text-amber-300"
                }`}
        >
            {normalized}
        </span>
    );
}
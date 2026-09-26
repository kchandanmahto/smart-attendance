export interface LiveAttendanceEvent {
    type: string;
    success: boolean;
    matched?: boolean;
    attendance_marked?: boolean;
    message?: string;
    recognition?: Record<
        string,
        unknown
    >;
    attendance?: {
        id: string;
        student_id: string;
        attendance_date: string;
        status: string;
        source: string;
        check_in_time: string | null;
        confidence_score: number | null;
        verification_method:
        | string
        | null;
    };
}


export function createAttendanceSocket(
    onMessage: (
        event: LiveAttendanceEvent,
    ) => void,
    onError?: () => void,
    onClose?: () => void,
): WebSocket {
    const token =
        localStorage.getItem(
            "access_token",
        );

    if (!token) {
        throw new Error(
            "Authentication token not found",
        );
    }

    const websocketUrl =
        process.env.NEXT_PUBLIC_WS_URL ||
        "ws://127.0.0.1:8000/api/v1/live/attendance";

    const socket = new WebSocket(
        `${websocketUrl}?token=${encodeURIComponent(
            token,
        )}`,
    );

    socket.onmessage = (
        message,
    ) => {
        try {
            const data =
                JSON.parse(
                    message.data,
                );

            onMessage(data);
        } catch {
            console.error(
                "Invalid WebSocket message",
            );
        }
    };

    socket.onerror = () => {
        onError?.();
    };

    socket.onclose = () => {
        onClose?.();
    };

    return socket;
}
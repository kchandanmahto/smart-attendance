const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000/api/v1";


function redirectToLogin() {
    if (
        typeof window !== "undefined"
    ) {
        localStorage.removeItem(
            "access_token",
        );

        window.location.replace(
            "/login",
        );
    }
}


export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {

    const token =
        typeof window !== "undefined"
            ? localStorage.getItem(
                "access_token",
            )
            : null;


    const headers = new Headers(
        options.headers,
    );


    if (
        options.body &&
        !(
            options.body instanceof
            FormData
        )
    ) {
        headers.set(
            "Content-Type",
            "application/json",
        );
    }


    if (token) {
        headers.set(
            "Authorization",
            `Bearer ${token}`,
        );
    }


    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            ...options,
            headers,
        },
    );


    // --------------------------------------------------
    // AUTHENTICATION ERROR
    // --------------------------------------------------

    if (
        response.status === 401
    ) {
        redirectToLogin();

        throw new Error(
            "Authentication required",
        );
    }


    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    const contentType =
        response.headers.get(
            "content-type",
        );


    const data =
        contentType?.includes(
            "application/json",
        )
            ? await response.json()
            : null;


    // --------------------------------------------------
    // API ERROR
    // --------------------------------------------------

    if (!response.ok) {
        throw new Error(
            data?.detail ||
            data?.message ||
            "API request failed",
        );
    }


    return data as T;
}


// ======================================================
// FILE UPLOAD
// ======================================================

export async function uploadFile<T>(
    endpoint: string,
    file: File,
): Promise<T> {

    const token =
        typeof window !== "undefined"
            ? localStorage.getItem(
                "access_token",
            )
            : null;


    const formData =
        new FormData();


    formData.append(
        "file",
        file,
    );


    const headers: HeadersInit = {};


    if (token) {
        headers[
            "Authorization"
        ] = `Bearer ${token}`;
    }


    const response =
        await fetch(
            `${API_URL}${endpoint}`,
            {
                method: "POST",
                headers,
                body: formData,
            },
        );


    // --------------------------------------------------
    // AUTHENTICATION ERROR
    // --------------------------------------------------

    if (
        response.status === 401
    ) {
        redirectToLogin();

        throw new Error(
            "Authentication required",
        );
    }


    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    const contentType =
        response.headers.get(
            "content-type",
        );


    const data =
        contentType?.includes(
            "application/json",
        )
            ? await response.json()
            : null;


    // --------------------------------------------------
    // API ERROR
    // --------------------------------------------------

    if (!response.ok) {
        throw new Error(
            data?.detail ||
            data?.message ||
            "Upload failed",
        );
    }


    return data as T;
}


export {
    API_URL,
};
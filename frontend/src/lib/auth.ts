import {
    apiRequest,
} from "./api";

import {
    CurrentUser,
    LoginResponse,
} from "@/types/auth";


export async function login(
    email: string,
    password: string,
): Promise<LoginResponse> {
    const response =
        await apiRequest<LoginResponse>(
            "/auth/login",
            {
                method: "POST",
                body: JSON.stringify({
                    email,
                    password,
                }),
            },
        );

    localStorage.setItem(
        "access_token",
        response.access_token,
    );

    return response;
}


export async function getCurrentUser(): Promise<CurrentUser> {
    return apiRequest<CurrentUser>(
        "/auth/me",
    );
}


export function logout() {
    localStorage.removeItem(
        "access_token",
    );
}


export function isAuthenticated(): boolean {
    if (
        typeof window ===
        "undefined"
    ) {
        return false;
    }

    return Boolean(
        localStorage.getItem(
            "access_token",
        ),
    );
}
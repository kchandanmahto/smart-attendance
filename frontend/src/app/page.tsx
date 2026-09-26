"use client";

import { useEffect } from "react";


export default function Home() {
    useEffect(() => {
        const token =
            localStorage.getItem("access_token");

        window.location.href = token
            ? "/dashboard"
            : "/login";
    }, []);

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
            Loading...
        </main>
    );
}
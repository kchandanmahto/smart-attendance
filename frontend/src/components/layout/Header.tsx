"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    getCurrentUser,
} from "@/lib/auth";

import {
    CurrentUser,
} from "@/types/auth";


export default function Header() {
    const [
        user,
        setUser,
    ] = useState<CurrentUser | null>(
        null,
    );

    useEffect(() => {
        getCurrentUser()
            .then(setUser)
            .catch(() => { });
    }, []);

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/95 px-6 backdrop-blur">

            <div>
                <p className="text-sm text-slate-500">
                    Enterprise AI Smart Attendance
                </p>
            </div>

            <div className="text-right">

                <p className="text-sm font-medium text-white">
                    {user
                        ? `${user.first_name} ${user.last_name ?? ""
                        }`
                        : "Loading..."}
                </p>

                <p className="text-xs text-slate-500">
                    {user?.role ?? ""}
                </p>

            </div>

        </header>
    );
}
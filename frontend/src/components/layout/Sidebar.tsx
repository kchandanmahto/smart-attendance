"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
    logout,
} from "@/lib/auth";


const navigation = [
    {
        name: "Dashboard",
        href: "/dashboard",
    },
    {
        name: "Students",
        href: "/students",
    },
    {
        name: "Attendance",
        href: "/attendance",
    },
    {
        name: "Face Recognition",
        href: "/face",
    },
    {
        name: "Reports",
        href: "/reports",
    },
];


export default function Sidebar() {
    const pathname =
        usePathname();

    return (
        <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800 bg-slate-950">

            <div className="border-b border-slate-800 px-6 py-5">

                <h1 className="text-lg font-bold text-white">
                    Smart Attendance
                </h1>

                <p className="mt-1 text-xs text-slate-500">
                    Management System
                </p>

            </div>


            <nav className="flex-1 space-y-1 p-4">

                {navigation.map(
                    (item) => {
                        const active =
                            pathname ===
                            item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`block rounded-lg px-4 py-3 text-sm transition ${active
                                        ? "bg-blue-600 text-white"
                                        : "text-slate-400 hover:bg-slate-900 hover:text-white"
                                    }`}
                            >
                                {item.name}
                            </Link>
                        );
                    },
                )}

            </nav>


            <div className="border-t border-slate-800 p-4">

                <button
                    onClick={logout}
                    className="w-full rounded-lg px-4 py-3 text-left text-sm text-slate-400 hover:bg-red-950/30 hover:text-red-400"
                >
                    Sign out
                </button>

            </div>

        </aside>
    );
}
"use client";

import {
    ReactNode,
} from "react";

import Sidebar from "./Sidebar";
import Header from "./Header";


interface Props {
    children: ReactNode;
}


export default function DashboardLayout({
    children,
}: Props) {
    return (
        <div className="min-h-screen bg-slate-900 text-white">

            <Sidebar />

            <div className="pl-64">

                <Header />

                <main className="p-6">
                    {children}
                </main>

            </div>

        </div>
    );
}
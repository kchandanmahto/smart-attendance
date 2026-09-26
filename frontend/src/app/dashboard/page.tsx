"use client";

import {
    useEffect,
    useState,
} from "react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Loading from "@/components/ui/Loading";
import StatCard from "@/components/ui/StatCard";

import {
    apiRequest,
} from "@/lib/api";

import {
    DashboardSummary,
    DepartmentAttendance,
} from "@/types/dashboard";


export default function DashboardPage() {
    const [
        summary,
        setSummary,
    ] = useState<DashboardSummary | null>(
        null,
    );

    const [
        departments,
        setDepartments,
    ] = useState<
        DepartmentAttendance[]
    >([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState("");


    useEffect(() => {
        async function loadDashboard() {
            try {
                setLoading(true);

                const [
                    summaryData,
                    departmentData,
                ] = await Promise.all([
                    apiRequest<DashboardSummary>(
                        "/dashboard/summary",
                    ),
                    apiRequest<
                        DepartmentAttendance[]
                    >(
                        "/dashboard/departments",
                    ),
                ]);

                setSummary(
                    summaryData,
                );

                setDepartments(
                    departmentData,
                );
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Failed to load dashboard",
                );
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();
    }, []);


    return (
        <DashboardLayout>

            <div>

                <div className="flex items-center justify-between">

                    <div>

                        <h1 className="text-2xl font-bold text-white">
                            Dashboard
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Today&apos;s attendance overview
                        </p>

                    </div>

                    {summary && (
                        <div className="text-sm text-slate-500">
                            {summary.attendance_date}
                        </div>
                    )}

                </div>


                {error && (
                    <div className="mt-6 rounded-lg border border-red-900 bg-red-950/30 p-4 text-red-300">
                        {error}
                    </div>
                )}


                {loading ? (
                    <Loading text="Loading dashboard..." />
                ) : summary ? (
                    <>

                        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

                            <StatCard
                                title="Total Students"
                                value={
                                    summary.total_students
                                }
                            />

                            <StatCard
                                title="Present"
                                value={
                                    summary.present
                                }
                            />

                            <StatCard
                                title="Late"
                                value={
                                    summary.late
                                }
                            />

                            <StatCard
                                title="Absent"
                                value={
                                    summary.absent
                                }
                            />

                        </div>


                        <div className="mt-4 grid gap-4 md:grid-cols-3">

                            <StatCard
                                title="Attendance"
                                value={`${summary.attendance_percentage}%`}
                                description="Present + Late"
                            />

                            <StatCard
                                title="Face Recognition"
                                value={
                                    summary.face_recognition_count
                                }
                                description="Automatically marked"
                            />

                            <StatCard
                                title="Manual"
                                value={
                                    summary.manual_count
                                }
                                description="Manually marked"
                            />

                        </div>


                        <div className="mt-8 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">

                            <div className="border-b border-slate-800 px-5 py-4">

                                <h2 className="font-semibold text-white">
                                    Department Attendance
                                </h2>

                            </div>


                            <div className="overflow-x-auto">

                                <table className="w-full text-left text-sm">

                                    <thead className="border-b border-slate-800 text-slate-500">

                                        <tr>

                                            <th className="px-5 py-4">
                                                Department
                                            </th>

                                            <th className="px-5 py-4">
                                                Students
                                            </th>

                                            <th className="px-5 py-4">
                                                Present
                                            </th>

                                            <th className="px-5 py-4">
                                                Late
                                            </th>

                                            <th className="px-5 py-4">
                                                Absent
                                            </th>

                                            <th className="px-5 py-4">
                                                Attendance
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        {departments.map(
                                            (department) => (
                                                <tr
                                                    key={
                                                        department.department_id
                                                    }
                                                    className="border-b border-slate-900"
                                                >

                                                    <td className="px-5 py-4 font-medium text-white">
                                                        {
                                                            department.department_name
                                                        }
                                                    </td>

                                                    <td className="px-5 py-4 text-slate-400">
                                                        {
                                                            department.total_students
                                                        }
                                                    </td>

                                                    <td className="px-5 py-4 text-slate-400">
                                                        {
                                                            department.present
                                                        }
                                                    </td>

                                                    <td className="px-5 py-4 text-slate-400">
                                                        {
                                                            department.late
                                                        }
                                                    </td>

                                                    <td className="px-5 py-4 text-slate-400">
                                                        {
                                                            department.absent
                                                        }
                                                    </td>

                                                    <td className="px-5 py-4 font-medium text-white">
                                                        {
                                                            department.attendance_percentage
                                                        }%
                                                    </td>

                                                </tr>
                                            ),
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        </div>

                    </>
                ) : null}

            </div>

        </DashboardLayout>
    );
}
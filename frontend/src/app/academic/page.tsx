"use client";

import {
    FormEvent,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Course,
    Department,
    Section,
} from "@/types/academic";

import {
    createCourse,
    createDepartment,
    createSection,
    deleteCourse,
    deleteDepartment,
    deleteSection,
    getCourses,
    getDepartments,
    getSections,
    updateCourse,
    updateDepartment,
    updateSection,
} from "@/lib/academic";

type Tab = "departments" | "courses" | "sections";

export default function AcademicPage() {
    const [activeTab, setActiveTab] =
        useState<Tab>("departments");

    const [departments, setDepartments] = useState<
        Department[]
    >([]);

    const [courses, setCourses] = useState<Course[]>([]);

    const [sections, setSections] = useState<Section[]>(
        [],
    );

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [refreshing, setRefreshing] =
        useState(false);

    useEffect(() => {
        let cancelled = false;

        async function loadAcademicData() {
            setLoading(true);
            setError("");

            try {
                const [
                    departmentsData,
                    coursesData,
                    sectionsData,
                ] = await Promise.all([
                    getDepartments(),
                    getCourses(),
                    getSections(),
                ]);

                if (cancelled) {
                    return;
                }

                setDepartments(departmentsData);
                setCourses(coursesData);
                setSections(sectionsData);
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load academic data.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadAcademicData();

        return () => {
            cancelled = true;
        };
    }, []);

    async function refreshData() {
        setRefreshing(true);
        setError("");

        try {
            const [
                departmentsData,
                coursesData,
                sectionsData,
            ] = await Promise.all([
                getDepartments(),
                getCourses(),
                getSections(),
            ]);

            setDepartments(departmentsData);
            setCourses(coursesData);
            setSections(sectionsData);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to refresh academic data.",
            );
        } finally {
            setRefreshing(false);
        }
    }

    function showSuccess(message: string) {
        setError("");
        setSuccess(message);

        window.setTimeout(() => {
            setSuccess("");
        }, 3000);
    }

    return (
        <main className="min-h-screen bg-slate-950 p-6 text-white">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Academic Structure
                        </h1>

                        <p className="mt-1 text-sm text-slate-400">
                            Manage departments, courses and
                            sections.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            void refreshData()
                        }
                        disabled={refreshing}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {refreshing
                            ? "Refreshing..."
                            : "Refresh"}
                    </button>
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

                {success && (
                    <div
                        role="status"
                        className="mb-4 rounded-lg border border-emerald-900 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300"
                    >
                        {success}
                    </div>
                )}

                {/* Summary */}
                <div className="mb-6 grid gap-4 md:grid-cols-3">
                    <SummaryCard
                        title="Departments"
                        value={departments.length}
                        active={
                            departments.filter(
                                (item) =>
                                    item.is_active,
                            ).length
                        }
                    />

                    <SummaryCard
                        title="Courses"
                        value={courses.length}
                        active={
                            courses.filter(
                                (item) =>
                                    item.is_active,
                            ).length
                        }
                    />

                    <SummaryCard
                        title="Sections"
                        value={sections.length}
                        active={
                            sections.filter(
                                (item) =>
                                    item.is_active,
                            ).length
                        }
                    />
                </div>

                {/* Tabs */}
                <div className="mb-6 flex overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-1">
                    <TabButton
                        active={
                            activeTab === "departments"
                        }
                        onClick={() =>
                            setActiveTab(
                                "departments",
                            )
                        }
                    >
                        Departments
                    </TabButton>

                    <TabButton
                        active={
                            activeTab === "courses"
                        }
                        onClick={() =>
                            setActiveTab("courses")
                        }
                    >
                        Courses
                    </TabButton>

                    <TabButton
                        active={
                            activeTab === "sections"
                        }
                        onClick={() =>
                            setActiveTab("sections")
                        }
                    >
                        Sections
                    </TabButton>
                </div>

                {loading ? (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
                        Loading academic structure...
                    </div>
                ) : (
                    <>
                        {activeTab ===
                            "departments" && (
                                <DepartmentManager
                                    departments={
                                        departments
                                    }
                                    onRefresh={
                                        refreshData
                                    }
                                    onSuccess={
                                        showSuccess
                                    }
                                    onError={setError}
                                />
                            )}

                        {activeTab === "courses" && (
                            <CourseManager
                                departments={
                                    departments
                                }
                                courses={courses}
                                onRefresh={
                                    refreshData
                                }
                                onSuccess={
                                    showSuccess
                                }
                                onError={setError}
                            />
                        )}

                        {activeTab === "sections" && (
                            <SectionManager
                                departments={
                                    departments
                                }
                                courses={courses}
                                sections={sections}
                                onRefresh={
                                    refreshData
                                }
                                onSuccess={
                                    showSuccess
                                }
                                onError={setError}
                            />
                        )}
                    </>
                )}
            </div>
        </main>
    );
}

/* =====================================================
   DEPARTMENT MANAGER
===================================================== */

interface DepartmentManagerProps {
    departments: Department[];
    onRefresh: () => Promise<void>;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

function DepartmentManager({
    departments,
    onRefresh,
    onSuccess,
    onError,
}: DepartmentManagerProps) {
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [description, setDescription] =
        useState("");

    const [editingId, setEditingId] =
        useState<string | null>(null);

    const [submitting, setSubmitting] =
        useState(false);

    const [search, setSearch] = useState("");

    const filteredDepartments = useMemo(() => {
        const query = search
            .trim()
            .toLowerCase();

        if (!query) {
            return departments;
        }

        return departments.filter(
            (department) =>
                department.name
                    .toLowerCase()
                    .includes(query) ||
                department.code
                    .toLowerCase()
                    .includes(query),
        );
    }, [departments, search]);

    function resetForm() {
        setName("");
        setCode("");
        setDescription("");
        setEditingId(null);
    }

    function editDepartment(
        department: Department,
    ) {
        setEditingId(department.id);
        setName(department.name);
        setCode(department.code);
        setDescription(
            department.description ?? "",
        );
    }

    async function submit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (!name.trim()) {
            onError("Department name is required.");
            return;
        }

        if (!code.trim()) {
            onError("Department code is required.");
            return;
        }

        setSubmitting(true);
        onError("");

        try {
            if (editingId) {
                await updateDepartment(
                    editingId,
                    {
                        name: name.trim(),
                        code: code.trim(),
                        description:
                            description.trim() ||
                            undefined,
                    },
                );

                onSuccess(
                    "Department updated successfully.",
                );
            } else {
                await createDepartment({
                    name: name.trim(),
                    code: code.trim(),
                    description:
                        description.trim() ||
                        undefined,
                });

                onSuccess(
                    "Department created successfully.",
                );
            }

            resetForm();
            await onRefresh();
        } catch (err) {
            onError(
                err instanceof Error
                    ? err.message
                    : "Department operation failed.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function remove(
        department: Department,
    ) {
        const confirmed = window.confirm(
            `Delete department "${department.name}"?`,
        );

        if (!confirmed) {
            return;
        }

        try {
            await deleteDepartment(
                department.id,
            );

            onSuccess(
                "Department deleted successfully.",
            );

            if (editingId === department.id) {
                resetForm();
            }

            await onRefresh();
        } catch (err) {
            onError(
                err instanceof Error
                    ? err.message
                    : "Failed to delete department.",
            );
        }
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            {/* Form */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="text-xl font-semibold">
                    {editingId
                        ? "Edit Department"
                        : "Add Department"}
                </h2>

                <form
                    onSubmit={submit}
                    className="mt-6 space-y-4"
                >
                    <Input
                        label="Department Name"
                        required
                        value={name}
                        onChange={setName}
                        placeholder="Computer Science"
                    />

                    <Input
                        label="Department Code"
                        required
                        value={code}
                        onChange={setCode}
                        placeholder="CSE"
                    />

                    <Textarea
                        label="Description"
                        value={description}
                        onChange={setDescription}
                        placeholder="Department description"
                    />

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold transition hover:bg-blue-500 disabled:opacity-50"
                        >
                            {submitting
                                ? "Saving..."
                                : editingId
                                    ? "Update"
                                    : "Create"}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                onClick={
                                    resetForm
                                }
                                className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </section>

            {/* List */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900">
                <div className="flex flex-col gap-4 border-b border-slate-800 p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">
                            Departments
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            {filteredDepartments.length}{" "}
                            departments
                        </p>
                    </div>

                    <input
                        type="search"
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value,
                            )
                        }
                        placeholder="Search department..."
                        className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="border-b border-slate-800 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="px-6 py-4">
                                    Name
                                </th>

                                <th className="px-6 py-4">
                                    Code
                                </th>

                                <th className="px-6 py-4">
                                    Status
                                </th>

                                <th className="px-6 py-4 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-800">
                            {filteredDepartments.map(
                                (department) => (
                                    <tr
                                        key={
                                            department.id
                                        }
                                        className="hover:bg-slate-800/40"
                                    >
                                        <td className="px-6 py-4 font-medium">
                                            {
                                                department.name
                                            }
                                        </td>

                                        <td className="px-6 py-4 text-slate-400">
                                            {
                                                department.code
                                            }
                                        </td>

                                        <td className="px-6 py-4">
                                            <StatusBadge
                                                active={
                                                    department.is_active
                                                }
                                            />
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        editDepartment(
                                                            department,
                                                        )
                                                    }
                                                    className="rounded-lg border border-slate-700 px-3 py-2 text-xs hover:bg-slate-800"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void remove(
                                                            department,
                                                        )
                                                    }
                                                    className="rounded-lg border border-red-900 px-3 py-2 text-xs text-red-400 hover:bg-red-950/40"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ),
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

/* =====================================================
   COURSE MANAGER
===================================================== */

interface CourseManagerProps {
    departments: Department[];
    courses: Course[];
    onRefresh: () => Promise<void>;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

function CourseManager({
    departments,
    courses,
    onRefresh,
    onSuccess,
    onError,
}: CourseManagerProps) {
    const [departmentId, setDepartmentId] =
        useState("");

    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [duration, setDuration] =
        useState("");

    const [editingId, setEditingId] =
        useState<string | null>(null);

    const [submitting, setSubmitting] =
        useState(false);

    const [search, setSearch] = useState("");

    const filteredCourses = useMemo(() => {
        const query = search
            .trim()
            .toLowerCase();

        return courses.filter((course) => {
            const departmentMatch =
                !departmentId ||
                course.department_id ===
                departmentId;

            const searchMatch =
                !query ||
                course.name
                    .toLowerCase()
                    .includes(query) ||
                course.code
                    .toLowerCase()
                    .includes(query);

            return (
                departmentMatch &&
                searchMatch
            );
        });
    }, [courses, departmentId, search]);

    function resetForm() {
        setDepartmentId("");
        setName("");
        setCode("");
        setDuration("");
        setEditingId(null);
    }

    function editCourse(course: Course) {
        setEditingId(course.id);
        setDepartmentId(
            course.department_id,
        );
        setName(course.name);
        setCode(course.code);
        setDuration(
            course.duration_years !== null
                ? String(course.duration_years)
                : "",
        );
    }

    async function submit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (!departmentId) {
            onError(
                "Please select a department.",
            );
            return;
        }

        if (!name.trim()) {
            onError("Course name is required.");
            return;
        }

        if (!code.trim()) {
            onError("Course code is required.");
            return;
        }

        setSubmitting(true);
        onError("");

        try {
            const durationYears = duration
                ? Number(duration)
                : undefined;

            if (
                durationYears !== undefined &&
                (
                    Number.isNaN(durationYears) ||
                    durationYears <= 0
                )
            ) {
                onError(
                    "Duration must be a valid positive number.",
                );
                setSubmitting(false);
                return;
            }

            if (editingId) {
                await updateCourse(
                    editingId,
                    {
                        department_id:
                            departmentId,
                        name: name.trim(),
                        code: code.trim(),
                        duration_years:
                            durationYears,
                    },
                );

                onSuccess(
                    "Course updated successfully.",
                );
            } else {
                await createCourse({
                    department_id:
                        departmentId,
                    name: name.trim(),
                    code: code.trim(),
                    duration_years:
                        durationYears,
                });

                onSuccess(
                    "Course created successfully.",
                );
            }

            resetForm();
            await onRefresh();
        } catch (err) {
            onError(
                err instanceof Error
                    ? err.message
                    : "Course operation failed.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function remove(course: Course) {
        const confirmed = window.confirm(
            `Delete course "${course.name}"?`,
        );

        if (!confirmed) {
            return;
        }

        try {
            await deleteCourse(course.id);

            onSuccess(
                "Course deleted successfully.",
            );

            if (editingId === course.id) {
                resetForm();
            }

            await onRefresh();
        } catch (err) {
            onError(
                err instanceof Error
                    ? err.message
                    : "Failed to delete course.",
            );
        }
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            {/* Form */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="text-xl font-semibold">
                    {editingId
                        ? "Edit Course"
                        : "Add Course"}
                </h2>

                <form
                    onSubmit={submit}
                    className="mt-6 space-y-4"
                >
                    <Select
                        label="Department"
                        required
                        value={departmentId}
                        onChange={
                            setDepartmentId
                        }
                        placeholder="Select department"
                        options={departments
                            .filter(
                                (item) =>
                                    item.is_active,
                            )
                            .map((department) => ({
                                value:
                                    department.id,
                                label: `${department.name} (${department.code})`,
                            }))}
                    />

                    <Input
                        label="Course Name"
                        required
                        value={name}
                        onChange={setName}
                        placeholder="B.Tech Computer Science"
                    />

                    <Input
                        label="Course Code"
                        required
                        value={code}
                        onChange={setCode}
                        placeholder="BT-CSE"
                    />

                    <Input
                        label="Duration (Years)"
                        type="number"
                        value={duration}
                        onChange={setDuration}
                        placeholder="4"
                    />

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
                        >
                            {submitting
                                ? "Saving..."
                                : editingId
                                    ? "Update"
                                    : "Create"}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                onClick={
                                    resetForm
                                }
                                className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </section>

            {/* List */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900">
                <div className="flex flex-col gap-4 border-b border-slate-800 p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">
                            Courses
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            {filteredCourses.length}{" "}
                            courses
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <select
                            value={departmentId}
                            onChange={(event) =>
                                setDepartmentId(
                                    event.target
                                        .value,
                                )
                            }
                            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none"
                        >
                            <option value="">
                                All Departments
                            </option>

                            {departments.map(
                                (department) => (
                                    <option
                                        key={
                                            department.id
                                        }
                                        value={
                                            department.id
                                        }
                                    >
                                        {
                                            department.name
                                        }
                                    </option>
                                ),
                            )}
                        </select>

                        <input
                            type="search"
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target
                                        .value,
                                )
                            }
                            placeholder="Search..."
                            className="w-40 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="border-b border-slate-800 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="px-6 py-4">
                                    Course
                                </th>

                                <th className="px-6 py-4">
                                    Department
                                </th>

                                <th className="px-6 py-4">
                                    Duration
                                </th>

                                <th className="px-6 py-4">
                                    Status
                                </th>

                                <th className="px-6 py-4 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-800">
                            {filteredCourses.map(
                                (course) => (
                                    <tr
                                        key={
                                            course.id
                                        }
                                        className="hover:bg-slate-800/40"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-medium">
                                                {
                                                    course.name
                                                }
                                            </div>

                                            <div className="mt-1 text-xs text-slate-500">
                                                {
                                                    course.code
                                                }
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-slate-400">
                                            {getDepartmentName(
                                                departments,
                                                course.department_id,
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-slate-400">
                                            {course.duration_years
                                                ? `${course.duration_years} years`
                                                : "—"}
                                        </td>

                                        <td className="px-6 py-4">
                                            <StatusBadge
                                                active={
                                                    course.is_active
                                                }
                                            />
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        editCourse(
                                                            course,
                                                        )
                                                    }
                                                    className="rounded-lg border border-slate-700 px-3 py-2 text-xs hover:bg-slate-800"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void remove(
                                                            course,
                                                        )
                                                    }
                                                    className="rounded-lg border border-red-900 px-3 py-2 text-xs text-red-400 hover:bg-red-950/40"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ),
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

/* =====================================================
   SECTION MANAGER
===================================================== */

interface SectionManagerProps {
    departments: Department[];
    courses: Course[];
    sections: Section[];
    onRefresh: () => Promise<void>;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

function SectionManager({
    departments,
    courses,
    sections,
    onRefresh,
    onSuccess,
    onError,
}: SectionManagerProps) {
    const [departmentId, setDepartmentId] =
        useState("");

    const [courseId, setCourseId] = useState("");

    const [name, setName] = useState("");

    const [academicYear, setAcademicYear] =
        useState("");

    const [semester, setSemester] =
        useState("");

    const [editingId, setEditingId] =
        useState<string | null>(null);

    const [submitting, setSubmitting] =
        useState(false);

    const [search, setSearch] = useState("");

    const filteredCourses = useMemo(() => {
        if (!departmentId) {
            return [];
        }

        return courses.filter(
            (course) =>
                course.department_id ===
                departmentId &&
                course.is_active,
        );
    }, [courses, departmentId]);

    const filteredSections = useMemo(() => {
        const query = search
            .trim()
            .toLowerCase();

        return sections.filter((section) => {
            const selectedCourse =
                !courseId ||
                section.course_id ===
                courseId;

            const searchMatch =
                !query ||
                section.name
                    .toLowerCase()
                    .includes(query) ||
                section.academic_year
                    .toLowerCase()
                    .includes(query);

            return (
                selectedCourse &&
                searchMatch
            );
        });
    }, [sections, courseId, search]);

    function resetForm() {
        setDepartmentId("");
        setCourseId("");
        setName("");
        setAcademicYear("");
        setSemester("");
        setEditingId(null);
    }

    function handleDepartmentChange(
        value: string,
    ) {
        setDepartmentId(value);
        setCourseId("");
    }

    function editSection(section: Section) {
        const course =
            courses.find(
                (item) =>
                    item.id ===
                    section.course_id,
            );

        setEditingId(section.id);

        setDepartmentId(
            course?.department_id ?? "",
        );

        setCourseId(section.course_id);
        setName(section.name);
        setAcademicYear(
            section.academic_year,
        );
        setSemester(
            String(section.semester),
        );
    }

    async function submit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (!departmentId) {
            onError(
                "Please select a department.",
            );
            return;
        }

        if (!courseId) {
            onError(
                "Please select a course.",
            );
            return;
        }

        if (!name.trim()) {
            onError("Section name is required.");
            return;
        }

        if (!academicYear.trim()) {
            onError(
                "Academic year is required.",
            );
            return;
        }

        const semesterNumber =
            Number(semester);

        if (
            !semester ||
            Number.isNaN(semesterNumber) ||
            semesterNumber < 1
        ) {
            onError(
                "Please enter a valid semester.",
            );
            return;
        }

        setSubmitting(true);
        onError("");

        try {
            if (editingId) {
                await updateSection(
                    editingId,
                    {
                        course_id: courseId,
                        name: name.trim(),
                        academic_year:
                            academicYear.trim(),
                        semester:
                            semesterNumber,
                    },
                );

                onSuccess(
                    "Section updated successfully.",
                );
            } else {
                await createSection({
                    course_id: courseId,
                    name: name.trim(),
                    academic_year:
                        academicYear.trim(),
                    semester:
                        semesterNumber,
                });

                onSuccess(
                    "Section created successfully.",
                );
            }

            resetForm();
            await onRefresh();
        } catch (err) {
            onError(
                err instanceof Error
                    ? err.message
                    : "Section operation failed.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function remove(section: Section) {
        const confirmed = window.confirm(
            `Delete section "${section.name}"?`,
        );

        if (!confirmed) {
            return;
        }

        try {
            await deleteSection(section.id);

            onSuccess(
                "Section deleted successfully.",
            );

            if (editingId === section.id) {
                resetForm();
            }

            await onRefresh();
        } catch (err) {
            onError(
                err instanceof Error
                    ? err.message
                    : "Failed to delete section.",
            );
        }
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            {/* Form */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="text-xl font-semibold">
                    {editingId
                        ? "Edit Section"
                        : "Add Section"}
                </h2>

                <form
                    onSubmit={submit}
                    className="mt-6 space-y-4"
                >
                    <Select
                        label="Department"
                        required
                        value={departmentId}
                        onChange={
                            handleDepartmentChange
                        }
                        placeholder="Select department"
                        options={departments
                            .filter(
                                (item) =>
                                    item.is_active,
                            )
                            .map((department) => ({
                                value:
                                    department.id,
                                label: `${department.name} (${department.code})`,
                            }))}
                    />

                    <Select
                        label="Course"
                        required
                        value={courseId}
                        onChange={setCourseId}
                        placeholder={
                            departmentId
                                ? "Select course"
                                : "Select department first"
                        }
                        disabled={
                            !departmentId
                        }
                        options={filteredCourses.map(
                            (course) => ({
                                value: course.id,
                                label: `${course.name} (${course.code})`,
                            }),
                        )}
                    />

                    <Input
                        label="Section Name"
                        required
                        value={name}
                        onChange={setName}
                        placeholder="Section A"
                    />

                    <Input
                        label="Academic Year"
                        required
                        value={academicYear}
                        onChange={
                            setAcademicYear
                        }
                        placeholder="2026-27"
                    />

                    <Input
                        label="Semester"
                        required
                        type="number"
                        value={semester}
                        onChange={setSemester}
                        placeholder="5"
                    />

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
                        >
                            {submitting
                                ? "Saving..."
                                : editingId
                                    ? "Update"
                                    : "Create"}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                onClick={
                                    resetForm
                                }
                                className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </section>

            {/* List */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900">
                <div className="flex flex-col gap-4 border-b border-slate-800 p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">
                            Sections
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            {filteredSections.length}{" "}
                            sections
                        </p>
                    </div>

                    <input
                        type="search"
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value,
                            )
                        }
                        placeholder="Search section..."
                        className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="border-b border-slate-800 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="px-6 py-4">
                                    Section
                                </th>

                                <th className="px-6 py-4">
                                    Course
                                </th>

                                <th className="px-6 py-4">
                                    Academic Year
                                </th>

                                <th className="px-6 py-4">
                                    Semester
                                </th>

                                <th className="px-6 py-4">
                                    Status
                                </th>

                                <th className="px-6 py-4 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-800">
                            {filteredSections.map(
                                (section) => (
                                    <tr
                                        key={
                                            section.id
                                        }
                                        className="hover:bg-slate-800/40"
                                    >
                                        <td className="px-6 py-4 font-medium">
                                            {
                                                section.name
                                            }
                                        </td>

                                        <td className="px-6 py-4 text-slate-400">
                                            {getCourseName(
                                                courses,
                                                section.course_id,
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-slate-400">
                                            {
                                                section.academic_year
                                            }
                                        </td>

                                        <td className="px-6 py-4 text-slate-400">
                                            {
                                                section.semester
                                            }
                                        </td>

                                        <td className="px-6 py-4">
                                            <StatusBadge
                                                active={
                                                    section.is_active
                                                }
                                            />
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        editSection(
                                                            section,
                                                        )
                                                    }
                                                    className="rounded-lg border border-slate-700 px-3 py-2 text-xs hover:bg-slate-800"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void remove(
                                                            section,
                                                        )
                                                    }
                                                    className="rounded-lg border border-red-900 px-3 py-2 text-xs text-red-400 hover:bg-red-950/40"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ),
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

/* =====================================================
   COMMON COMPONENTS
===================================================== */

interface InputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    required?: boolean;
}

function Input({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    required = false,
}: InputProps) {
    return (
        <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
                {label}

                {required && (
                    <span className="ml-1 text-red-400">
                        *
                    </span>
                )}
            </label>

            <input
                type={type}
                value={value}
                required={required}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                placeholder={placeholder}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
            />
        </div>
    );
}

interface TextareaProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

function Textarea({
    label,
    value,
    onChange,
    placeholder,
}: TextareaProps) {
    return (
        <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
                {label}
            </label>

            <textarea
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                placeholder={placeholder}
                rows={4}
                className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
            />
        </div>
    );
}

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder: string;
    required?: boolean;
    disabled?: boolean;
}

function Select({
    label,
    value,
    onChange,
    options,
    placeholder,
    required = false,
    disabled = false,
}: SelectProps) {
    return (
        <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
                {label}

                {required && (
                    <span className="ml-1 text-red-400">
                        *
                    </span>
                )}
            </label>

            <select
                value={value}
                required={required}
                disabled={disabled}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <option value="">
                    {placeholder}
                </option>

                {options.map((option) => (
                    <option
                        key={option.value}
                        value={option.value}
                    >
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

function StatusBadge({
    active,
}: {
    active: boolean;
}) {
    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${active
                    ? "bg-emerald-950 text-emerald-300"
                    : "bg-slate-800 text-slate-400"
                }`}
        >
            {active ? "Active" : "Inactive"}
        </span>
    );
}

function SummaryCard({
    title,
    value,
    active,
}: {
    title: string;
    value: number;
    active: number;
}) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
                {title}
            </p>

            <div className="mt-2 flex items-end justify-between">
                <span className="text-3xl font-bold">
                    {value}
                </span>

                <span className="text-xs text-emerald-400">
                    {active} active
                </span>
            </div>
        </div>
    );
}

function TabButton({
    children,
    active,
    onClick,
}: {
    children: React.ReactNode;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`min-w-[140px] flex-1 rounded-lg px-5 py-3 text-sm font-medium transition ${active
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
        >
            {children}
        </button>
    );
}

/* =====================================================
   HELPERS
===================================================== */

function getDepartmentName(
    departments: Department[],
    departmentId: string,
): string {
    const department = departments.find(
        (item) => item.id === departmentId,
    );

    if (!department) {
        return "—";
    }

    return `${department.name} (${department.code})`;
}

function getCourseName(
    courses: Course[],
    courseId: string,
): string {
    const course = courses.find(
        (item) => item.id === courseId,
    );

    if (!course) {
        return "—";
    }

    return `${course.name} (${course.code})`;
}
"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Loading from "@/components/ui/Loading";

import {
    createStudent,
    deleteStudent,
    getStudents,
} from "@/lib/students";

import {
    Student,
    StudentCreate,
} from "@/types/student";


const EMPTY_FORM: StudentCreate = {
    student_id: "",
    department_id: "",
    course_id: "",
    section_id: "",

    roll_number: "",
    admission_number: "",

    first_name: "",
    last_name: "",

    email: "",
    phone: "",

    date_of_birth: "",
    gender: "",

    academic_year: "",
    semester: undefined,
};


export default function StudentsPage() {

    const [
        students,
        setStudents,
    ] = useState<Student[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        submitting,
        setSubmitting,
    ] = useState(false);

    const [
        search,
        setSearch,
    ] = useState("");

    const [
        showForm,
        setShowForm,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        success,
        setSuccess,
    ] = useState("");

    const [
        form,
        setForm,
    ] = useState<StudentCreate>(
        EMPTY_FORM,
    );


    // ======================================================
    // LOAD STUDENTS
    // ======================================================

    useEffect(() => {

        let cancelled = false;

        async function load() {

            try {

                setLoading(true);
                setError("");

                const data =
                    await getStudents();

                if (!cancelled) {
                    setStudents(data);
                }

            } catch (error) {

                if (!cancelled) {

                    setError(
                        error instanceof Error
                            ? error.message
                            : "Failed to load students",
                    );

                }

            } finally {

                if (!cancelled) {
                    setLoading(false);
                }

            }
        }

        load();

        return () => {
            cancelled = true;
        };

    }, []);


    // ======================================================
    // UPDATE FORM FIELD
    // ======================================================

    function updateField(
        field: keyof StudentCreate,
        value: string | number | undefined,
    ) {

        setForm(
            (previous) => ({
                ...previous,
                [field]: value,
            }),
        );

    }


    // ======================================================
    // RESET FORM
    // ======================================================

    function resetForm() {

        setForm({
            ...EMPTY_FORM,
        });

    }


    // ======================================================
    // CREATE STUDENT
    // ======================================================

    async function handleCreate(
        event: React.FormEvent<HTMLFormElement>,
    ) {

        event.preventDefault();

        try {

            setSubmitting(true);
            setError("");
            setSuccess("");

            await createStudent(
                form,
            );

            setSuccess(
                "Student created successfully.",
            );

            setShowForm(false);

            resetForm();

            /*
             * Refresh the student list directly.
             * No useEffect dependency issue.
             */
            await refreshStudents();

        } catch (error) {

            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to create student",
            );

        } finally {

            setSubmitting(false);

        }

    }


    // ======================================================
    // DELETE STUDENT
    // ======================================================

    async function handleDelete(
        student: Student,
    ) {

        const confirmed =
            window.confirm(
                `Delete ${student.first_name} ${student.last_name ?? ""
                }?`,
            );

        if (!confirmed) {
            return;
        }

        try {

            setError("");
            setSuccess("");

            await deleteStudent(
                student.id,
            );

            setSuccess(
                "Student deleted successfully.",
            );

            await refreshStudents();

        } catch (error) {

            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to delete student",
            );

        }

    }


    // ======================================================
    // REFRESH STUDENTS
    // ======================================================

    async function refreshStudents() {

        try {

            setLoading(true);
            setError("");

            const data =
                await getStudents();

            setStudents(data);

        } catch (error) {

            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to load students",
            );

        } finally {

            setLoading(false);

        }

    }


    // ======================================================
    // FILTER STUDENTS
    // ======================================================

    const filteredStudents =
        useMemo(() => {

            const query =
                search
                    .trim()
                    .toLowerCase();

            if (!query) {
                return students;
            }

            return students.filter(
                (student) => {

                    const fullName =
                        `${student.first_name} ${student.last_name ?? ""
                            }`
                            .toLowerCase();

                    return (
                        fullName.includes(query) ||

                        student.student_id
                            .toLowerCase()
                            .includes(query) ||

                        (
                            student.email ?? ""
                        )
                            .toLowerCase()
                            .includes(query) ||

                        (
                            student.phone ?? ""
                        )
                            .toLowerCase()
                            .includes(query)
                    );

                },
            );

        }, [
            students,
            search,
        ]);


    // ======================================================
    // UI
    // ======================================================

    return (
        <DashboardLayout>

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div>

                    <h1 className="text-2xl font-bold text-white">
                        Students
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Manage students and academic information
                    </p>

                </div>


                <button
                    type="button"
                    onClick={() => {

                        setShowForm(
                            (previous) =>
                                !previous,
                        );

                        setError("");
                        setSuccess("");

                    }}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
                >

                    {showForm
                        ? "Close"
                        : "+ Add Student"}

                </button>

            </div>


            {/* ==================================================
                ALERTS
            ================================================== */}

            {error && (

                <div
                    role="alert"
                    className="mt-6 rounded-lg border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-300"
                >
                    {error}
                </div>

            )}


            {success && (

                <div
                    role="status"
                    className="mt-6 rounded-lg border border-emerald-900 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300"
                >
                    {success}
                </div>

            )}


            {/* ==================================================
                CREATE FORM
            ================================================== */}

            {showForm && (

                <form
                    onSubmit={handleCreate}
                    className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-6"
                >

                    <div className="flex items-center justify-between">

                        <div>

                            <h2 className="text-lg font-semibold text-white">
                                Add New Student
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Enter student academic and contact information.
                            </p>

                        </div>

                    </div>


                    <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                        {/* Student ID */}

                        <Field
                            label="Student ID"
                            required
                            value={
                                form.student_id
                            }
                            onChange={(
                                value,
                            ) =>
                                updateField(
                                    "student_id",
                                    value,
                                )
                            }
                            placeholder="STU001"
                        />


                        {/* First Name */}

                        <Field
                            label="First Name"
                            required
                            value={
                                form.first_name
                            }
                            onChange={(
                                value,
                            ) =>
                                updateField(
                                    "first_name",
                                    value,
                                )
                            }
                            placeholder="First name"
                        />


                        {/* Last Name */}

                        <Field
                            label="Last Name"
                            value={
                                form.last_name
                            }
                            onChange={(
                                value,
                            ) =>
                                updateField(
                                    "last_name",
                                    value,
                                )
                            }
                            placeholder="Last name"
                        />


                        {/* Roll Number */}

                        <Field
                            label="Roll Number"
                            value={
                                form.roll_number
                            }
                            onChange={(
                                value,
                            ) =>
                                updateField(
                                    "roll_number",
                                    value,
                                )
                            }
                            placeholder="Roll number"
                        />


                        {/* Admission Number */}

                        <Field
                            label="Admission Number"
                            value={
                                form.admission_number
                            }
                            onChange={(
                                value,
                            ) =>
                                updateField(
                                    "admission_number",
                                    value,
                                )
                            }
                            placeholder="Admission number"
                        />


                        {/* Email */}

                        <Field
                            label="Email"
                            type="email"
                            value={
                                form.email
                            }
                            onChange={(
                                value,
                            ) =>
                                updateField(
                                    "email",
                                    value,
                                )
                            }
                            placeholder="student@example.com"
                        />


                        {/* Phone */}

                        <Field
                            label="Phone"
                            value={
                                form.phone
                            }
                            onChange={(
                                value,
                            ) =>
                                updateField(
                                    "phone",
                                    value,
                                )
                            }
                            placeholder="Phone number"
                        />


                        {/* Date of Birth */}

                        <Field
                            label="Date of Birth"
                            type="date"
                            value={
                                form.date_of_birth
                            }
                            onChange={(
                                value,
                            ) =>
                                updateField(
                                    "date_of_birth",
                                    value,
                                )
                            }
                        />


                        {/* Gender */}

                        <SelectField
                            label="Gender"
                            value={
                                form.gender ?? ""
                            }
                            onChange={(
                                value,
                            ) =>
                                updateField(
                                    "gender",
                                    value,
                                )
                            }
                            options={[
                                {
                                    value: "",
                                    label: "Select gender",
                                },
                                {
                                    value: "MALE",
                                    label: "Male",
                                },
                                {
                                    value: "FEMALE",
                                    label: "Female",
                                },
                                {
                                    value: "OTHER",
                                    label: "Other",
                                },
                            ]}
                        />


                        {/* Academic Year */}

                        <Field
                            label="Academic Year"
                            value={
                                form.academic_year
                            }
                            onChange={(
                                value,
                            ) =>
                                updateField(
                                    "academic_year",
                                    value,
                                )
                            }
                            placeholder="2026-27"
                        />


                        {/* Semester */}

                        <Field
                            label="Semester"
                            type="number"
                            value={
                                form.semester
                            }
                            onChange={(
                                value,
                            ) =>
                                updateField(
                                    "semester",
                                    value
                                        ? Number(value)
                                        : undefined,
                                )
                            }
                            placeholder="1"
                        />


                        {/* Department */}

                        <Field
                            label="Department ID"
                            required
                            value={
                                form.department_id
                            }
                            onChange={(
                                value,
                            ) =>
                                updateField(
                                    "department_id",
                                    value,
                                )
                            }
                            placeholder="Department UUID"
                        />


                        {/* Course */}

                        <Field
                            label="Course ID"
                            required
                            value={
                                form.course_id
                            }
                            onChange={(
                                value,
                            ) =>
                                updateField(
                                    "course_id",
                                    value,
                                )
                            }
                            placeholder="Course UUID"
                        />


                        {/* Section */}

                        <Field
                            label="Section ID"
                            required
                            value={
                                form.section_id
                            }
                            onChange={(
                                value,
                            ) =>
                                updateField(
                                    "section_id",
                                    value,
                                )
                            }
                            placeholder="Section UUID"
                        />

                    </div>


                    {/* FORM ACTIONS */}

                    <div className="mt-6 flex justify-end gap-3">

                        <button
                            type="button"
                            onClick={() => {

                                setShowForm(false);
                                resetForm();
                                setError("");

                            }}
                            className="rounded-lg border border-slate-700 px-6 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >

                            {submitting
                                ? "Creating..."
                                : "Create Student"}

                        </button>

                    </div>

                </form>

            )}


            {/* ==================================================
                SEARCH
            ================================================== */}

            <div className="mt-6 flex flex-col gap-3 md:flex-row">

                <input
                    value={search}
                    onChange={(event) =>
                        setSearch(
                            event.target.value,
                        )
                    }
                    placeholder="Search by name, student ID, email or phone..."
                    className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />


                <button
                    type="button"
                    onClick={refreshStudents}
                    disabled={loading}
                    className="rounded-lg border border-slate-700 px-5 py-3 text-sm text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading
                        ? "Refreshing..."
                        : "Refresh"}
                </button>

            </div>


            {/* ==================================================
                TABLE
            ================================================== */}

            <div className="mt-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">

                {loading ? (

                    <Loading
                        text="Loading students..."
                    />

                ) : filteredStudents.length === 0 ? (

                    <div className="p-10 text-center">

                        <p className="text-slate-400">
                            No students found.
                        </p>

                        <p className="mt-2 text-sm text-slate-600">
                            Add a student or change your search.
                        </p>

                    </div>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="w-full text-left text-sm">

                            <thead className="border-b border-slate-800 text-slate-500">

                                <tr>

                                    <th className="px-5 py-4">
                                        Student
                                    </th>

                                    <th className="px-5 py-4">
                                        Student ID
                                    </th>

                                    <th className="px-5 py-4">
                                        Contact
                                    </th>

                                    <th className="px-5 py-4">
                                        Face
                                    </th>

                                    <th className="px-5 py-4">
                                        Status
                                    </th>

                                    <th className="px-5 py-4">
                                        Action
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {filteredStudents.map(
                                    (student) => (

                                        <tr
                                            key={
                                                student.id
                                            }
                                            className="border-b border-slate-900 hover:bg-slate-900/50"
                                        >

                                            {/* STUDENT */}

                                            <td className="px-5 py-4">

                                                <div className="font-medium text-white">

                                                    {
                                                        student.first_name
                                                    }{" "}

                                                    {
                                                        student.last_name ??
                                                        ""
                                                    }

                                                </div>

                                                <div className="mt-1 text-xs text-slate-600">

                                                    {
                                                        student.admission_number ??
                                                        "No admission number"
                                                    }

                                                </div>

                                            </td>


                                            {/* STUDENT ID */}

                                            <td className="px-5 py-4 text-slate-400">

                                                {
                                                    student.student_id
                                                }

                                            </td>


                                            {/* CONTACT */}

                                            <td className="px-5 py-4">

                                                <div className="text-slate-400">

                                                    {
                                                        student.email ??
                                                        "-"
                                                    }

                                                </div>

                                                <div className="mt-1 text-xs text-slate-600">

                                                    {
                                                        student.phone ??
                                                        "-"
                                                    }

                                                </div>

                                            </td>


                                            {/* FACE */}

                                            <td className="px-5 py-4">

                                                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">

                                                    {
                                                        student.face_enrollment_status
                                                    }

                                                </span>

                                            </td>


                                            {/* STATUS */}

                                            <td className="px-5 py-4">

                                                <span
                                                    className={
                                                        student.is_active
                                                            ? "rounded-full bg-emerald-950 px-3 py-1 text-xs text-emerald-400"
                                                            : "rounded-full bg-red-950 px-3 py-1 text-xs text-red-400"
                                                    }
                                                >

                                                    {
                                                        student.is_active
                                                            ? "Active"
                                                            : "Inactive"
                                                    }

                                                </span>

                                            </td>


                                            {/* ACTION */}

                                            <td className="px-5 py-4">

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDelete(
                                                            student,
                                                        )
                                                    }
                                                    className="text-sm text-red-400 transition hover:text-red-300"
                                                >
                                                    Delete
                                                </button>

                                            </td>

                                        </tr>

                                    ),
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>


            {/* ==================================================
                RESULT COUNT
            ================================================== */}

            <div className="mt-4 text-sm text-slate-600">

                Showing{" "}
                {filteredStudents.length}{" "}
                of{" "}
                {students.length}{" "}
                students

            </div>

        </DashboardLayout>
    );
}


// ======================================================
// FIELD COMPONENT
// ======================================================

interface FieldProps {

    label: string;

    value:
    | string
    | number
    | undefined;

    onChange: (
        value: string,
    ) => void;

    placeholder?: string;

    type?: string;

    required?: boolean;
}


function Field({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    required = false,
}: FieldProps) {

    return (

        <div>

            <label className="mb-2 block text-sm text-slate-300">

                {label}

                {required && (

                    <span className="ml-1 text-red-400">
                        *
                    </span>

                )}

            </label>


            <input
                type={type}
                required={required}
                value={
                    value === undefined
                        ? ""
                        : value
                }
                onChange={(event) =>
                    onChange(
                        event.target.value,
                    )
                }
                placeholder={
                    placeholder
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
            />

        </div>

    );
}


// ======================================================
// SELECT COMPONENT
// ======================================================

interface SelectOption {
    value: string;
    label: string;
}


interface SelectFieldProps {

    label: string;

    value: string;

    onChange: (
        value: string,
    ) => void;

    options: SelectOption[];

    required?: boolean;
}


function SelectField({
    label,
    value,
    onChange,
    options,
    required = false,
}: SelectFieldProps) {

    return (

        <div>

            <label className="mb-2 block text-sm text-slate-300">

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
                onChange={(event) =>
                    onChange(
                        event.target.value,
                    )
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            >

                {options.map(
                    (option) => (

                        <option
                            key={
                                option.value
                            }
                            value={
                                option.value
                            }
                        >
                            {
                                option.label
                            }
                        </option>

                    ),
                )}

            </select>

        </div>

    );
}
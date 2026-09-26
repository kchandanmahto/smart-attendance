"use client";

import {
    FormEvent,
    useEffect,
    useMemo,
    useState,
} from "react";

import { useRouter } from "next/navigation";

import {
    Course,
    Department,
    Section,
    Student,
    StudentCreate,
} from "@/types/student";

import {
    createStudent,
    deleteStudent,
    getCourses,
    getDepartments,
    getSections,
    getStudents,
    updateStudent,
} from "@/lib/students";

type FormState = {
    student_id: string;
    department_id: string;
    course_id: string;
    section_id: string;

    roll_number: string;
    admission_number: string;

    first_name: string;
    last_name: string;

    email: string;
    phone: string;

    date_of_birth: string;
    gender: string;

    academic_year: string;
    semester: string;
};

const EMPTY_FORM: FormState = {
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
    semester: "",
};

export default function StudentsPage() {
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);

    const [departments, setDepartments] = useState<Department[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [sections, setSections] = useState<Section[]>([]);

    const [form, setForm] = useState<FormState>(EMPTY_FORM);

    const [editingId, setEditingId] = useState<string | null>(null);

    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [deleteId, setDeleteId] = useState<string | null>(null);

    /*
     * Initial data loading
     */
    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError("");

            try {
                const [
                    studentsData,
                    departmentsData,
                    coursesData,
                    sectionsData,
                ] = await Promise.all([
                    getStudents(),
                    getDepartments(),
                    getCourses(),
                    getSections(),
                ]);

                if (cancelled) {
                    return;
                }

                setStudents(studentsData);
                setDepartments(
                    departmentsData.filter(
                        (department) => department.is_active,
                    ),
                );
                setCourses(
                    coursesData.filter(
                        (course) => course.is_active,
                    ),
                );
                setSections(
                    sectionsData.filter(
                        (section) => section.is_active,
                    ),
                );
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load student data",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void load();

        return () => {
            cancelled = true;
        };
    }, []);

    /*
     * Refresh only students
     */
    async function refreshStudents() {
        setRefreshing(true);
        setError("");

        try {
            const data = await getStudents();
            setStudents(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to refresh students",
            );
        } finally {
            setRefreshing(false);
        }
    }

    /*
     * Filter courses by selected department
     */
    const filteredCourses = useMemo(() => {
        if (!form.department_id) {
            return [];
        }

        return courses.filter(
            (course) =>
                course.department_id === form.department_id,
        );
    }, [courses, form.department_id]);

    /*
     * Filter sections by selected course
     */
    const filteredSections = useMemo(() => {
        if (!form.course_id) {
            return [];
        }

        return sections.filter(
            (section) =>
                section.course_id === form.course_id,
        );
    }, [sections, form.course_id]);

    /*
     * Search students
     */
    const filteredStudents = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return students;
        }

        return students.filter((student) => {
            const fullName =
                `${student.first_name} ${student.last_name ?? ""}`.toLowerCase();

            return (
                fullName.includes(query) ||
                student.student_id
                    .toLowerCase()
                    .includes(query) ||
                (student.email ?? "")
                    .toLowerCase()
                    .includes(query) ||
                (student.phone ?? "")
                    .toLowerCase()
                    .includes(query) ||
                (student.roll_number ?? "")
                    .toLowerCase()
                    .includes(query) ||
                (student.admission_number ?? "")
                    .toLowerCase()
                    .includes(query)
            );
        });
    }, [students, search]);

    function updateForm(
        field: keyof FormState,
        value: string,
    ) {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    }

    /*
     * Department change
     */
    function handleDepartmentChange(value: string) {
        setForm((previous) => ({
            ...previous,
            department_id: value,
            course_id: "",
            section_id: "",
            academic_year: "",
            semester: "",
        }));
    }

    /*
     * Course change
     */
    function handleCourseChange(value: string) {
        setForm((previous) => ({
            ...previous,
            course_id: value,
            section_id: "",
            academic_year: "",
            semester: "",
        }));
    }

    /*
     * Section change
     *
     * Academic year and semester come from selected section.
     */
    function handleSectionChange(value: string) {
        const selectedSection = sections.find(
            (section) => section.id === value,
        );

        setForm((previous) => ({
            ...previous,
            section_id: value,
            academic_year:
                selectedSection?.academic_year ?? "",
            semester:
                selectedSection?.semester
                    ? String(selectedSection.semester)
                    : "",
        }));
    }

    /*
     * Reset form
     */
    function resetForm() {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setError("");
    }

    /*
     * Start editing
     */
    function handleEdit(student: Student) {
        setError("");
        setSuccess("");

        setEditingId(student.id);

        setForm({
            student_id: student.student_id,
            department_id: student.department_id ?? "",
            course_id: student.course_id ?? "",
            section_id: student.section_id ?? "",

            roll_number: student.roll_number ?? "",
            admission_number:
                student.admission_number ?? "",

            first_name: student.first_name,
            last_name: student.last_name ?? "",

            email: student.email ?? "",
            phone: student.phone ?? "",

            date_of_birth:
                student.date_of_birth ?? "",
            gender: student.gender ?? "",

            academic_year:
                student.academic_year ?? "",
            semester:
                student.semester !== null
                    ? String(student.semester)
                    : "",
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }

    /*
     * Validate form
     */
    function validateForm(): string | null {
        if (!form.student_id.trim()) {
            return "Student ID is required.";
        }

        if (!form.first_name.trim()) {
            return "First name is required.";
        }

        if (!form.department_id) {
            return "Please select a department.";
        }

        if (!form.course_id) {
            return "Please select a course.";
        }

        if (!form.section_id) {
            return "Please select a section.";
        }

        if (
            form.email.trim() &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                form.email.trim(),
            )
        ) {
            return "Please enter a valid email address.";
        }

        if (
            form.semester &&
            (
                Number.isNaN(Number(form.semester)) ||
                Number(form.semester) < 1
            )
        ) {
            return "Semester must be a valid number.";
        }

        return null;
    }

    /*
     * Submit create/update
     */
    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setError("");
        setSuccess("");

        const validationError = validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        setSubmitting(true);

        try {
            const payload: StudentCreate = {
                student_id: form.student_id.trim(),

                department_id: form.department_id,
                course_id: form.course_id,
                section_id: form.section_id,

                first_name: form.first_name.trim(),

                last_name:
                    form.last_name.trim() || undefined,

                roll_number:
                    form.roll_number.trim() || undefined,

                admission_number:
                    form.admission_number.trim() ||
                    undefined,

                email:
                    form.email.trim() || undefined,

                phone:
                    form.phone.trim() || undefined,

                date_of_birth:
                    form.date_of_birth || undefined,

                gender:
                    form.gender || undefined,

                academic_year:
                    form.academic_year || undefined,

                semester: form.semester
                    ? Number(form.semester)
                    : undefined,
            };

            if (editingId) {
                await updateStudent(editingId, payload);

                setSuccess(
                    "Student updated successfully.",
                );
            } else {
                await createStudent(payload);

                setSuccess(
                    "Student created successfully.",
                );
            }

            resetForm();

            await refreshStudents();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : editingId
                        ? "Failed to update student."
                        : "Failed to create student.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    /*
     * Delete student
     */
    async function handleDelete(studentId: string) {
        setDeleteId(studentId);
        setError("");
        setSuccess("");

        try {
            await deleteStudent(studentId);

            setSuccess(
                "Student deleted successfully.",
            );

            if (editingId === studentId) {
                resetForm();
            }

            await refreshStudents();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to delete student.",
            );
        } finally {
            setDeleteId(null);
        }
    }

    function getDepartmentName(
        departmentId: string | null,
    ) {
        if (!departmentId) {
            return "—";
        }

        const department = departments.find(
            (item) => item.id === departmentId,
        );

        return department
            ? `${department.name} (${department.code})`
            : "—";
    }

    function getCourseName(
        courseId: string | null,
    ) {
        if (!courseId) {
            return "—";
        }

        const course = courses.find(
            (item) => item.id === courseId,
        );

        return course
            ? `${course.name} (${course.code})`
            : "—";
    }

    function getSectionName(
        sectionId: string | null,
    ) {
        if (!sectionId) {
            return "—";
        }

        const section = sections.find(
            (item) => item.id === sectionId,
        );

        return section
            ? `${section.name} · ${section.academic_year}`
            : "—";
    }

    return (
        <main className="min-h-screen bg-slate-950 p-6 text-white">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Student Management
                        </h1>

                        <p className="mt-1 text-sm text-slate-400">
                            Manage students, academic structure
                            and enrollment information.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => void refreshStudents()}
                        disabled={refreshing}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {refreshing
                            ? "Refreshing..."
                            : "Refresh Students"}
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

                {/* Student Form */}
                <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
                    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold">
                                {editingId
                                    ? "Edit Student"
                                    : "Add New Student"}
                            </h2>

                            <p className="mt-1 text-sm text-slate-400">
                                {editingId
                                    ? "Update student information."
                                    : "Create a student and assign academic structure."}
                            </p>
                        </div>

                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>
                    zc
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >
                        {/* Identity */}
                        <div>
                            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                                Student Information
                            </h3>

                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Field
                                    label="Student ID"
                                    required
                                    value={form.student_id}
                                    onChange={(value) =>
                                        updateForm(
                                            "student_id",
                                            value,
                                        )
                                    }
                                    disabled={Boolean(
                                        editingId,
                                    )}
                                    placeholder="STU-001"
                                />

                                <Field
                                    label="First Name"
                                    required
                                    value={form.first_name}
                                    onChange={(value) =>
                                        updateForm(
                                            "first_name",
                                            value,
                                        )
                                    }
                                    placeholder="Rahul"
                                />

                                <Field
                                    label="Last Name"
                                    value={form.last_name}
                                    onChange={(value) =>
                                        updateForm(
                                            "last_name",
                                            value,
                                        )
                                    }
                                    placeholder="Kumar"
                                />

                                <Field
                                    label="Roll Number"
                                    value={form.roll_number}
                                    onChange={(value) =>
                                        updateForm(
                                            "roll_number",
                                            value,
                                        )
                                    }
                                    placeholder="23CSE001"
                                />

                                <Field
                                    label="Admission Number"
                                    value={
                                        form.admission_number
                                    }
                                    onChange={(value) =>
                                        updateForm(
                                            "admission_number",
                                            value,
                                        )
                                    }
                                    placeholder="ADM-2026-001"
                                />

                                <Field
                                    label="Email"
                                    type="email"
                                    value={form.email}
                                    onChange={(value) =>
                                        updateForm(
                                            "email",
                                            value,
                                        )
                                    }
                                    placeholder="student@example.com"
                                />

                                <Field
                                    label="Phone"
                                    value={form.phone}
                                    onChange={(value) =>
                                        updateForm(
                                            "phone",
                                            value,
                                        )
                                    }
                                    placeholder="+91 9876543210"
                                />

                                <Field
                                    label="Date of Birth"
                                    type="date"
                                    value={
                                        form.date_of_birth
                                    }
                                    onChange={(value) =>
                                        updateForm(
                                            "date_of_birth",
                                            value,
                                        )
                                    }
                                />

                                <SelectField
                                    label="Gender"
                                    value={form.gender}
                                    onChange={(value) =>
                                        updateForm(
                                            "gender",
                                            value,
                                        )
                                    }
                                    options={[
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
                                    placeholder="Select gender"
                                />
                            </div>
                        </div>

                        {/* Academic Structure */}
                        <div>
                            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                                Academic Structure
                            </h3>

                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <SelectField
                                    label="Department"
                                    required
                                    value={
                                        form.department_id
                                    }
                                    onChange={
                                        handleDepartmentChange
                                    }
                                    options={departments.map(
                                        (department) => ({
                                            value:
                                                department.id,
                                            label: `${department.name} (${department.code})`,
                                        }),
                                    )}
                                    placeholder="Select department"
                                />

                                <SelectField
                                    label="Course"
                                    required
                                    value={form.course_id}
                                    onChange={
                                        handleCourseChange
                                    }
                                    options={filteredCourses.map(
                                        (course) => ({
                                            value: course.id,
                                            label: `${course.name} (${course.code})`,
                                        }),
                                    )}
                                    placeholder={
                                        form.department_id
                                            ? "Select course"
                                            : "Select department first"
                                    }
                                    disabled={
                                        !form.department_id
                                    }
                                />

                                <SelectField
                                    label="Section"
                                    required
                                    value={form.section_id}
                                    onChange={
                                        handleSectionChange
                                    }
                                    options={filteredSections.map(
                                        (section) => ({
                                            value: section.id,
                                            label: `${section.name} · ${section.academic_year} · Sem ${section.semester}`,
                                        }),
                                    )}
                                    placeholder={
                                        form.course_id
                                            ? "Select section"
                                            : "Select course first"
                                    }
                                    disabled={
                                        !form.course_id
                                    }
                                />

                                <Field
                                    label="Academic Year"
                                    value={
                                        form.academic_year
                                    }
                                    onChange={(value) =>
                                        updateForm(
                                            "academic_year",
                                            value,
                                        )
                                    }
                                    disabled
                                    placeholder="Auto-filled"
                                />

                                <Field
                                    label="Semester"
                                    value={form.semester}
                                    onChange={(value) =>
                                        updateForm(
                                            "semester",
                                            value,
                                        )
                                    }
                                    disabled
                                    placeholder="Auto-filled"
                                />
                            </div>

                            <p className="mt-3 text-xs text-slate-500">
                                Academic year and semester are
                                automatically taken from the
                                selected section.
                            </p>
                        </div>

                        {/* Submit */}
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {submitting
                                    ? editingId
                                        ? "Updating..."
                                        : "Creating..."
                                    : editingId
                                        ? "Update Student"
                                        : "Create Student"}
                            </button>

                            {!editingId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    disabled={submitting}
                                    className="rounded-lg border border-slate-700 px-6 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                                >
                                    Clear Form
                                </button>
                            )}
                        </div>
                    </form>
                </section>

                {/* Student List */}
                <section className="rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
                    <div className="border-b border-slate-800 p-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">
                                    Students
                                </h2>

                                <p className="mt-1 text-sm text-slate-400">
                                    {filteredStudents.length}{" "}
                                    student
                                    {filteredStudents.length !==
                                        1
                                        ? "s"
                                        : ""}{" "}
                                    found
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
                                placeholder="Search students..."
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 md:w-80"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-10 text-center text-slate-400">
                            Loading students...
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="p-10 text-center">
                            <p className="text-slate-300">
                                No students found.
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                Create your first student using
                                the form above.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="border-b border-slate-800 bg-slate-950/50 text-xs uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4">
                                            Student
                                        </th>

                                        <th className="px-6 py-4">
                                            Academic
                                        </th>

                                        <th className="px-6 py-4">
                                            Contact
                                        </th>

                                        <th className="px-6 py-4">
                                            Face
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
                                    {filteredStudents.map(
                                        (student) => (
                                            <tr
                                                key={
                                                    student.id
                                                }
                                                className="transition hover:bg-slate-800/40"
                                            >
                                                {/* Student */}
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-white">
                                                        {
                                                            student.first_name
                                                        }{" "}
                                                        {
                                                            student.last_name ??
                                                            ""
                                                        }
                                                    </div>

                                                    <div className="mt-1 text-xs text-slate-500">
                                                        ID:{" "}
                                                        {
                                                            student.student_id
                                                        }
                                                    </div>

                                                    {student.roll_number && (
                                                        <div className="mt-1 text-xs text-slate-500">
                                                            Roll:{" "}
                                                            {
                                                                student.roll_number
                                                            }
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Academic */}
                                                <td className="px-6 py-4">
                                                    <div className="text-slate-200">
                                                        {getDepartmentName(
                                                            student.department_id,
                                                        )}
                                                    </div>

                                                    <div className="mt-1 text-xs text-slate-400">
                                                        {getCourseName(
                                                            student.course_id,
                                                        )}
                                                    </div>

                                                    <div className="mt-1 text-xs text-slate-500">
                                                        {getSectionName(
                                                            student.section_id,
                                                        )}
                                                    </div>

                                                    {student.semester && (
                                                        <div className="mt-1 text-xs text-slate-500">
                                                            Semester{" "}
                                                            {
                                                                student.semester
                                                            }
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Contact */}
                                                <td className="px-6 py-4">
                                                    <div className="text-slate-300">
                                                        {student.email ??
                                                            "—"}
                                                    </div>

                                                    <div className="mt-1 text-xs text-slate-500">
                                                        {student.phone ??
                                                            "—"}
                                                    </div>
                                                </td>

                                                {/* Face */}
                                                <td className="px-6 py-4">
                                                    <FaceStatus
                                                        status={
                                                            student.face_enrollment_status
                                                        }
                                                    />
                                                </td>

                                                {/* Active */}
                                                <td className="px-6 py-4">
                                                    <StatusBadge
                                                        active={
                                                            student.is_active
                                                        }
                                                    />
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                router.push(
                                                                    `/face?student_id=${encodeURIComponent(student.id)}`,
                                                                )
                                                            }
                                                            className="rounded-lg border border-blue-800 bg-blue-950/30 px-3 py-2 text-xs font-medium text-blue-300 transition hover:bg-blue-950/60"
                                                        >
                                                            Enroll Face
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleEdit(student)
                                                            }
                                                            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const confirmed =
                                                                    window.confirm(
                                                                        `Delete ${student.first_name} ${student.last_name ?? ""}?`,
                                                                    );

                                                                if (confirmed) {
                                                                    void handleDelete(
                                                                        student.id,
                                                                    );
                                                                }
                                                            }}
                                                            disabled={
                                                                deleteId === student.id
                                                            }
                                                            className="rounded-lg border border-red-900 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-950/50 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            {deleteId === student.id
                                                                ? "Deleting..."
                                                                : "Delete"}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ),
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

/*
 * Field component
 */
interface FieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    required?: boolean;
    disabled?: boolean;
}

function Field({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    required = false,
    disabled = false,
}: FieldProps) {
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
                disabled={disabled}
                placeholder={placeholder}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
        </div>
    );
}

/*
 * Select component
 */
interface SelectOption {
    value: string;
    label: string;
}

interface SelectFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder: string;
    required?: boolean;
    disabled?: boolean;
}

function SelectField({
    label,
    value,
    onChange,
    options,
    placeholder,
    required = false,
    disabled = false,
}: SelectFieldProps) {
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
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
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

/*
 * Face enrollment status
 */
function FaceStatus({
    status,
}: {
    status: string;
}) {
    const normalized = status.toUpperCase();

    const enrolled =
        normalized === "COMPLETED" ||
        normalized === "ENROLLED" ||
        normalized === "ACTIVE";

    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${enrolled
                ? "bg-emerald-950 text-emerald-300"
                : "bg-amber-950 text-amber-300"
                }`}
        >
            {status || "NOT_ENROLLED"}
        </span>
    );
}

/*
 * Active status
 */
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
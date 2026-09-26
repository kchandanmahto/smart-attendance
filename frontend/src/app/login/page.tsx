"use client";

import {
    FormEvent,
    useState,
} from "react";

import {
    useRouter,
} from "next/navigation";

import {
    login,
} from "@/lib/auth";


export default function LoginPage() {
    const router = useRouter();

    const [
        email,
        setEmail,
    ] = useState("");

    const [
        password,
        setPassword,
    ] = useState("");

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");


    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            await login(
                email.trim(),
                password,
            );

            router.push("/dashboard");
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Login failed",
            );
        } finally {
            setLoading(false);
        }
    }


    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">

            <div className="w-full max-w-md">

                {/* Header */}

                <div className="mb-8 text-center">

                    <h1 className="text-3xl font-bold text-white">
                        Smart Attendance
                    </h1>

                    <p className="mt-2 text-slate-400">
                        Enterprise Attendance Management
                    </p>

                </div>


                {/* Login Card */}

                <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
                >

                    <h2 className="text-xl font-semibold text-white">
                        Sign in
                    </h2>


                    {/* Error */}

                    {error && (
                        <div
                            role="alert"
                            className="mt-4 rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300"
                        >
                            {error}
                        </div>
                    )}


                    {/* Email */}

                    <div className="mt-6">

                        <label
                            htmlFor="email"
                            className="mb-2 block text-sm text-slate-300"
                        >
                            Email
                        </label>

                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(event) =>
                                setEmail(
                                    event.target.value,
                                )
                            }
                            disabled={loading}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="admin@example.com"
                        />

                    </div>


                    {/* Password */}

                    <div className="mt-4">

                        <label
                            htmlFor="password"
                            className="mb-2 block text-sm text-slate-300"
                        >
                            Password
                        </label>

                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(event) =>
                                setPassword(
                                    event.target.value,
                                )
                            }
                            disabled={loading}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="••••••••"
                        />

                    </div>


                    {/* Submit */}

                    <button
                        type="submit"
                        disabled={
                            loading ||
                            !email.trim() ||
                            !password
                        }
                        className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading
                            ? "Signing in..."
                            : "Sign in"}
                    </button>

                </form>

            </div>

        </main>
    );
}
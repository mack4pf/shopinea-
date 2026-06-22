"use client";

import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Route render failed:", error);
    }, [error]);

    return (
        <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-10 text-white">
            <section className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-300">
                    <AlertTriangle className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-black tracking-tight">Something went wrong</h1>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                    The page could not finish loading. Please try again, or return home and continue from there.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={reset}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-bold text-zinc-950 transition hover:bg-zinc-200"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Try again
                    </button>
                    <Link
                        href="/"
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-zinc-800"
                    >
                        <Home className="h-4 w-4" />
                        Home
                    </Link>
                </div>
            </section>
        </main>
    );
}

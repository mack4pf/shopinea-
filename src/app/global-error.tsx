"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Application render failed:", error);
    }, [error]);

    return (
        <html lang="en">
            <body>
                <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-10 font-sans text-white">
                    <section className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
                        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-300">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight">Shoplinea could not load</h1>
                        <p className="mt-2 text-sm leading-6 text-zinc-400">
                            Please refresh the page. If it continues, contact support@shoplinea.shop.
                        </p>
                        <button
                            type="button"
                            onClick={reset}
                            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-bold text-zinc-950 transition hover:bg-zinc-200"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Try again
                        </button>
                    </section>
                </main>
            </body>
        </html>
    );
}

"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className = "", showLabel = false }: { className?: string; showLabel?: boolean }) {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        setIsDark(document.documentElement.classList.contains("dark"));
    }, []);

    const toggleTheme = () => {
        const nextDark = !document.documentElement.classList.contains("dark");
        document.documentElement.classList.toggle("dark", nextDark);
        document.documentElement.dataset.theme = nextDark ? "dark" : "light";
        localStorage.setItem("theme", nextDark ? "dark" : "light");
        setIsDark(nextDark);
    };

    return (
        <button
            type="button"
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            title={isDark ? "Switch to light theme" : "Switch to dark theme"}
            onClick={toggleTheme}
            className={cn(
                "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-lime-100 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-200 dark:hover:bg-white/[0.12]",
                showLabel ? "w-auto" : "w-10 px-0",
                className
            )}
        >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {showLabel && <span className="hidden sm:inline">{isDark ? "Light" : "Dark"}</span>}
        </button>
    );
}

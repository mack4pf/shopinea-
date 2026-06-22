"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, Search, ChevronDown, Check } from "lucide-react";
import { CountryCurrency, FALLBACK_COUNTRIES } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface CountrySelectProps {
    value: string;
    onChange: (value: string, country?: CountryCurrency) => void;
    className?: string;
    placeholder?: string;
    size?: "sm" | "md";
}

export function CountrySelect({
    value,
    onChange,
    className = "",
    placeholder = "Select country",
    size = "md",
}: CountrySelectProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [countries, setCountries] = useState<CountryCurrency[]>(FALLBACK_COUNTRIES);
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = query.trim()
        ? countries.filter((c) =>
              `${c.name} ${c.currencyCode}`.toLowerCase().includes(query.toLowerCase())
          )
        : countries;

    const selectedCountry = countries.find(country => country.name === value);

    useEffect(() => {
        let alive = true;
        fetch("/api/countries")
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (alive && Array.isArray(data?.countries)) setCountries(data.countries);
            })
            .catch(() => {});
        return () => { alive = false; };
    }, []);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery("");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    const height = size === "sm" ? "h-9" : "h-11";
    const textSize = size === "sm" ? "text-sm" : "text-[13px]";

    return (
        <div ref={ref} className={cn("relative", className)}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={cn(
                    "w-full flex items-center gap-2.5 px-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-left transition-all",
                    height,
                    textSize,
                    open ? "border-blue-500/50 ring-1 ring-blue-500/20" : "hover:border-white/[0.14]"
                )}
            >
                <span className="w-5 text-center text-base shrink-0">{selectedCountry?.flag || <Globe className="w-4 h-4 text-zinc-500" />}</span>
                <span className={cn("flex-1 truncate", value ? "text-white" : "text-zinc-600")}>
                    {value || placeholder}
                </span>
                {selectedCountry && <span className="text-[10px] font-semibold text-zinc-500">{selectedCountry.currencyCode}</span>}
                <ChevronDown className={cn("w-4 h-4 text-zinc-500 shrink-0 transition-transform", open && "rotate-180")} />
            </button>

            {open && (
                <div className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-[#0f0f14] border border-white/[0.1] rounded-xl shadow-2xl shadow-black/60 overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b border-white/[0.06]">
                        <div className="flex items-center gap-2 px-3 h-9 bg-white/[0.04] border border-white/[0.06] rounded-lg">
                            <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search country..."
                                className="flex-1 bg-transparent text-[13px] text-white placeholder:text-zinc-600 outline-none"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-52 overflow-y-auto overscroll-contain py-1">
                        {filtered.length === 0 ? (
                            <p className="px-4 py-3 text-xs text-zinc-600 text-center">No results</p>
                        ) : (
                            filtered.map((c) => (
                                <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => {
                                        onChange(c.name, c);
                                        setOpen(false);
                                        setQuery("");
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3.5 py-2 text-[13px] transition-colors text-left",
                                        value === c.name
                                            ? "text-blue-300 bg-blue-500/10"
                                            : "text-zinc-300 hover:bg-white/[0.05] hover:text-white"
                                    )}
                                >
                                    <span className="text-base">{c.flag}</span>
                                    <span className="flex-1 truncate">{c.name}</span>
                                    <span className="text-[10px] text-zinc-500">{c.currencyCode}</span>
                                    {value === c.name && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

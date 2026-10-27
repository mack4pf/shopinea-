"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { Activity, ClipboardCopy, Eye, Radio, Search, Wallet } from "lucide-react";
import { db } from "@/lib/firebase/config";

type ActivityEvent = {
    id: string;
    event?: string;
    userId?: string;
    userEmail?: string;
    path?: string;
    details?: Record<string, string | number | boolean | null>;
    createdAt?: { toDate?: () => Date };
};

const labels: Record<string, string> = {
    page_view: "Viewed page",
    crypto_address_copied: "Copied crypto address",
    deposit_submitted: "Submitted deposit",
};

function EventIcon({ event }: { event?: string }) {
    if (event === "crypto_address_copied") return <ClipboardCopy className="h-4 w-4" />;
    if (event === "deposit_submitted") return <Wallet className="h-4 w-4" />;
    return <Eye className="h-4 w-4" />;
}

function eventTime(event: ActivityEvent) {
    const date = event.createdAt?.toDate?.();
    return date ? date.toLocaleString() : "Just now";
}

export default function AdminActivityPage() {
    const [events, setEvents] = useState<ActivityEvent[]>([]);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        const activityQuery = query(
            collection(db, "activityEvents"),
            orderBy("createdAt", "desc"),
            limit(200)
        );
        return onSnapshot(activityQuery, snapshot => {
            setEvents(snapshot.docs.map(item => ({ id: item.id, ...item.data() })));
        }, error => console.error("Live activity load failed:", error));
    }, []);

    const visibleEvents = useMemo(() => {
        const needle = search.trim().toLowerCase();
        return events.filter(event => {
            if (filter !== "all" && event.event !== filter) return false;
            if (!needle) return true;
            return [event.userEmail, event.path, event.event, event.details?.asset, event.details?.depositType]
                .some(value => String(value || "").toLowerCase().includes(needle));
        });
    }, [events, filter, search]);

    const latestEth = events.find(event =>
        ["crypto_address_copied", "deposit_submitted"].includes(event.event || "") &&
        String(event.details?.asset || "").toLowerCase() === "eth"
    );

    return (
        <div className="mx-auto max-w-6xl space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sky-700">
                        <Radio className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase">Real-time feed</span>
                    </div>
                    <h1 className="mt-1 text-2xl font-bold text-slate-950">User Activity</h1>
                    <p className="mt-1 text-sm text-slate-500">Page visits and important wallet actions update live.</p>
                </div>
                <div className="rounded-md border border-lime-300 bg-lime-50 px-3 py-2 text-xs font-bold text-slate-700">
                    {events.length} recent events
                </div>
            </div>

            <section className="border-y border-slate-200 bg-white py-4">
                <p className="text-xs font-bold uppercase text-slate-500">Latest tracked ETH action</p>
                <p className="mt-1 text-base font-bold text-slate-950">
                    {latestEth?.userEmail || "No tracked ETH action yet"}
                </p>
                {latestEth && <p className="mt-1 text-xs text-slate-500">{labels[latestEth.event || ""]} · {eventTime(latestEth)}</p>}
            </section>

            <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white px-3">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search email, page, or asset" className="h-10 w-full bg-transparent text-sm outline-none" />
                </label>
                <select value={filter} onChange={event => setFilter(event.target.value)} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none">
                    <option value="all">All activity</option>
                    <option value="page_view">Page views</option>
                    <option value="crypto_address_copied">Address copies</option>
                    <option value="deposit_submitted">Deposits</option>
                </select>
            </div>

            <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
                {visibleEvents.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-slate-400">
                        <Activity className="mb-3 h-7 w-7" />
                        <p className="text-sm font-semibold">No matching activity</p>
                    </div>
                ) : visibleEvents.map(event => (
                    <div key={event.id} className="grid gap-2 border-b border-slate-100 px-4 py-3 last:border-b-0 sm:grid-cols-[32px_1fr_auto] sm:items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-50 text-sky-700"><EventIcon event={event.event} /></div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">{event.userEmail || event.userId || "Unknown user"}</p>
                            <p className="truncate text-xs text-slate-500">
                                {labels[event.event || ""] || event.event || "Activity"}
                                {event.details?.asset ? ` · ${String(event.details.asset).toUpperCase()}` : ""}
                                {event.path ? ` · ${event.path}` : ""}
                            </p>
                        </div>
                        <time className="text-xs font-medium text-slate-500 sm:text-right">{eventTime(event)}</time>
                    </div>
                ))}
            </div>
        </div>
    );
}

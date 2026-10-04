"use client";

import { useEffect, useMemo, useState } from "react";
import {
    collection,
    doc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";
import { BadgeCheck, Clock3, Loader2, Search, ShieldCheck, Star, XCircle } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase/config";

type AdminReview = {
    id: string;
    displayName: string;
    email: string;
    role: string;
    storeName: string;
    rating: number;
    text: string;
    status: "pending" | "approved" | "rejected";
    approved?: boolean;
    adminNote?: string;
    createdAt?: any;
};

const toMillis = (value: any) => {
    if (!value) return 0;
    if (typeof value.toDate === "function") return value.toDate().getTime();
    const next = new Date(value).getTime();
    return Number.isFinite(next) ? next : 0;
};

const formatDate = (value: any) => {
    const millis = toMillis(value);
    if (!millis) return "Recently";
    return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(millis));
};

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<AdminReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
    const [search, setSearch] = useState("");
    const [notes, setNotes] = useState<Record<string, string>>({});

    const loadReviews = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(query(collection(db, "reviews"), orderBy("createdAt", "desc")));
            const nextReviews = snap.docs.map(reviewDoc => {
                const data = reviewDoc.data() as any;
                const status = data.status === "approved" || data.approved === true
                    ? "approved"
                    : data.status === "rejected"
                        ? "rejected"
                        : "pending";

                return {
                    id: reviewDoc.id,
                    displayName: data.displayName || data.userName || data.name || "Shoplinea user",
                    email: data.email || "",
                    role: data.role || "merchant",
                    storeName: data.storeName || "",
                    rating: Math.min(5, Math.max(1, Number(data.rating || 5))),
                    text: String(data.text || data.review || data.message || ""),
                    status,
                    approved: data.approved,
                    adminNote: data.adminNote || "",
                    createdAt: data.createdAt,
                } satisfies AdminReview;
            });

            setReviews(nextReviews);
            setNotes(Object.fromEntries(nextReviews.map(review => [review.id, review.adminNote || ""])));
        } catch (error) {
            console.error("Could not load reviews:", error);
            toast.error("Could not load reviews.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReviews();
    }, []);

    const filteredReviews = useMemo(() => {
        const cleanSearch = search.trim().toLowerCase();
        return reviews.filter(review => {
            if (filter !== "all" && review.status !== filter) return false;
            if (!cleanSearch) return true;
            return [review.displayName, review.email, review.role, review.storeName, review.text]
                .some(value => String(value || "").toLowerCase().includes(cleanSearch));
        });
    }, [filter, reviews, search]);

    const counts = useMemo(() => ({
        all: reviews.length,
        pending: reviews.filter(review => review.status === "pending").length,
        approved: reviews.filter(review => review.status === "approved").length,
        rejected: reviews.filter(review => review.status === "rejected").length,
    }), [reviews]);

    const updateReview = async (reviewId: string, status: "approved" | "rejected") => {
        setSavingId(reviewId);
        try {
            await updateDoc(doc(db, "reviews", reviewId), {
                approved: status === "approved",
                status,
                adminNote: notes[reviewId] || "",
                reviewedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                reviewedBy: "admin",
            });
            await loadReviews();
            toast.success(status === "approved" ? "Review approved." : "Review rejected.");
        } catch (error) {
            console.error("Could not update review:", error);
            toast.error("Could not update review.");
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-700">
                            <ShieldCheck className="h-3.5 w-3.5" /> Review moderation
                        </div>
                        <h1 className="mt-4 text-2xl font-black text-slate-950 md:text-3xl">User reviews</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                            Approve real user feedback before it appears on public Shoplinea pages.
                        </p>
                    </div>
                    <button
                        onClick={loadReviews}
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
                {(["pending", "approved", "rejected", "all"] as const).map(item => (
                    <button
                        key={item}
                        onClick={() => setFilter(item)}
                        className={`rounded-2xl border p-4 text-left transition ${filter === item ? "border-purple-300 bg-purple-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                    >
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500">{item}</p>
                        <p className="mt-2 text-2xl font-black text-slate-950">{counts[item]}</p>
                    </button>
                ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="relative max-w-md flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            placeholder="Search reviews..."
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                        />
                    </div>
                    <p className="text-sm font-semibold text-slate-500">{filteredReviews.length} showing</p>
                </div>

                {loading ? (
                    <div className="flex min-h-[20rem] items-center justify-center">
                        <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
                    </div>
                ) : filteredReviews.length === 0 ? (
                    <div className="p-10 text-center">
                        <Clock3 className="mx-auto h-9 w-9 text-slate-300" />
                        <h2 className="mt-3 text-lg font-black text-slate-950">No reviews here</h2>
                        <p className="mt-1 text-sm text-slate-500">New submissions will appear in this queue.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredReviews.map(review => (
                            <div key={review.id} className="p-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="font-black text-slate-950">{review.displayName}</h2>
                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                                                {review.role}
                                            </span>
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest ${
                                                review.status === "approved" ? "bg-emerald-50 text-emerald-700"
                                                    : review.status === "rejected" ? "bg-rose-50 text-rose-700"
                                                        : "bg-amber-50 text-amber-700"
                                            }`}>
                                                {review.status === "approved" ? <BadgeCheck className="h-3 w-3" />
                                                    : review.status === "rejected" ? <XCircle className="h-3 w-3" />
                                                        : <Clock3 className="h-3 w-3" />}
                                                {review.status}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-sm text-slate-500">{review.email || "No email"}{review.storeName ? ` - ${review.storeName}` : ""}</p>
                                        <div className="mt-3 flex gap-0.5">
                                            {Array.from({ length: 5 }).map((_, index) => (
                                                <Star key={index} className={`h-4 w-4 ${index < review.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`} />
                                            ))}
                                        </div>
                                        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">{review.text}</p>
                                        <p className="mt-3 text-xs font-semibold text-slate-400">{formatDate(review.createdAt)}</p>
                                    </div>

                                    <div className="w-full space-y-3 lg:w-80">
                                        <textarea
                                            value={notes[review.id] || ""}
                                            onChange={event => setNotes(previous => ({ ...previous, [review.id]: event.target.value }))}
                                            placeholder="Admin note, optional"
                                            rows={3}
                                            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => updateReview(review.id, "approved")}
                                                disabled={savingId === review.id}
                                                className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => updateReview(review.id, "rejected")}
                                                disabled={savingId === review.id}
                                                className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-rose-700 disabled:opacity-60"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

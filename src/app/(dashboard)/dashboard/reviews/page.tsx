"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    where,
} from "firebase/firestore";
import { BadgeCheck, Clock3, Loader2, Send, ShieldCheck, Star, XCircle } from "lucide-react";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase/config";

type UserReview = {
    id: string;
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
    if (!millis) return "Just now";
    return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(millis));
};

const statusMeta = {
    pending: {
        label: "Pending approval",
        icon: Clock3,
        className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    approved: {
        label: "Approved",
        icon: BadgeCheck,
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    rejected: {
        label: "Needs update",
        icon: XCircle,
        className: "bg-rose-50 text-rose-700 border-rose-200",
    },
};

export default function DashboardReviewsPage() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [reviews, setReviews] = useState<UserReview[]>([]);
    const [rating, setRating] = useState(5);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const latestPending = useMemo(
        () => reviews.some(review => review.status === "pending"),
        [reviews]
    );

    const loadReviews = async (uid: string) => {
        const snap = await getDocs(query(collection(db, "reviews"), where("userId", "==", uid)));
        const nextReviews = snap.docs
            .map(reviewDoc => {
                const data = reviewDoc.data() as any;
                return {
                    id: reviewDoc.id,
                    rating: Math.min(5, Math.max(1, Number(data.rating || 5))),
                    text: String(data.text || data.review || data.message || ""),
                    status: data.status === "approved" || data.approved === true
                        ? "approved"
                        : data.status === "rejected"
                            ? "rejected"
                            : "pending",
                    approved: data.approved,
                    adminNote: data.adminNote || "",
                    createdAt: data.createdAt,
                } satisfies UserReview;
            })
            .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
        setReviews(nextReviews);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
            setLoading(true);
            try {
                if (!firebaseUser) {
                    setUser(null);
                    setProfile(null);
                    setReviews([]);
                    return;
                }

                setUser(firebaseUser);
                const profileSnap = await getDoc(doc(db, "users", firebaseUser.uid));
                setProfile(profileSnap.exists() ? profileSnap.data() : null);
                await loadReviews(firebaseUser.uid);
            } catch (error) {
                console.error("Could not load reviews:", error);
                toast.error("Could not load your reviews right now.");
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!user) {
            toast.error("Please sign in before submitting a review.");
            return;
        }

        const cleanText = text.trim();
        if (cleanText.length < 20) {
            toast.error("Please write at least 20 characters.");
            return;
        }

        setSubmitting(true);
        try {
            await addDoc(collection(db, "reviews"), {
                userId: user.uid,
                email: user.email || "",
                displayName: profile?.displayName || profile?.name || user.displayName || user.email || "Shoplinea user",
                role: profile?.role || "merchant",
                storeName: profile?.storeName || profile?.businessName || "",
                rating,
                text: cleanText,
                approved: false,
                status: "pending",
                verified: true,
                source: "dashboard",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            setText("");
            setRating(5);
            await loadReviews(user.uid);
            toast.success("Review submitted for approval.");
        } catch (error) {
            console.error("Could not submit review:", error);
            toast.error("Could not submit your review. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-purple-700">
                            <ShieldCheck className="h-3.5 w-3.5" /> Review approval
                        </div>
                        <h1 className="mt-4 text-2xl font-black text-slate-950 md:text-3xl">Share your Shoplinea experience</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                            Submit a real review from your account. Admin will review it before it appears on public pages.
                        </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                        {reviews.length} submitted
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-black text-slate-950">New review</h2>
                    <p className="mt-1 text-sm text-slate-500">Tell us what has been useful, clear, or helpful for your store.</p>

                    <div className="mt-6">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500">Rating</label>
                        <div className="mt-3 flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map(value => (
                                <button
                                    type="button"
                                    key={value}
                                    onClick={() => setRating(value)}
                                    className="rounded-xl border border-slate-200 p-2 transition hover:border-yellow-300 hover:bg-yellow-50"
                                    aria-label={`Rate ${value} star${value === 1 ? "" : "s"}`}
                                >
                                    <Star className={`h-6 w-6 ${value <= rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6">
                        <label htmlFor="review" className="text-xs font-black uppercase tracking-widest text-slate-500">Review</label>
                        <textarea
                            id="review"
                            value={text}
                            onChange={event => setText(event.target.value)}
                            placeholder="Write your review here..."
                            rows={8}
                            maxLength={700}
                            className="mt-3 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                        />
                        <div className="mt-2 flex justify-between text-xs text-slate-400">
                            <span>Minimum 20 characters</span>
                            <span>{text.trim().length}/700</span>
                        </div>
                    </div>

                    {latestPending && (
                        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                            You already have a review waiting for approval. You can still submit another update if needed.
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Submit for approval
                    </button>
                </form>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-black text-slate-950">Your submissions</h2>
                    <div className="mt-5 space-y-4">
                        {reviews.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                                No reviews submitted yet.
                            </div>
                        ) : reviews.map(review => {
                            const meta = statusMeta[review.status];
                            const StatusIcon = meta.icon;
                            return (
                                <div key={review.id} className="rounded-2xl border border-slate-200 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex gap-0.5">
                                            {Array.from({ length: 5 }).map((_, index) => (
                                                <Star key={index} className={`h-4 w-4 ${index < review.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`} />
                                            ))}
                                        </div>
                                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${meta.className}`}>
                                            <StatusIcon className="h-3.5 w-3.5" /> {meta.label}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm leading-6 text-slate-600">{review.text}</p>
                                    {review.adminNote && (
                                        <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
                                            Note: {review.adminNote}
                                        </p>
                                    )}
                                    <p className="mt-3 text-xs text-slate-400">{formatDate(review.createdAt)}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

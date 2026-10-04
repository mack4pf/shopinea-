"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { Star, ShieldCheck } from "lucide-react";
import { db } from "@/lib/firebase/config";

type Review = {
    id: string;
    displayName: string;
    role: "reseller" | "supplier" | "merchant";
    rating: number;
    text: string;
    verified?: boolean;
    storeName?: string;
    createdAt?: any;
};

const safeText = (value: unknown, fallback = "") => {
    const text = typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
    return text || fallback;
};

const maskEmail = (email?: string) => {
    const clean = safeText(email);
    if (!clean.includes("@")) return "";
    const [name, domain] = clean.split("@");
    return `${name.slice(0, 2)}***@${domain}`;
};

const formatReviewDate = (value: any) => {
    const date = typeof value?.toDate === "function" ? value.toDate() : value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(date);
};

export function ReviewsSection() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function loadReviews() {
            try {
                const reviewsQuery = query(collection(db, "reviews"), where("approved", "==", true), limit(50));
                const snap = await getDocs(reviewsQuery);
                const nextReviews = snap.docs
                    .map(doc => {
                        const data = doc.data() as any;
                        const displayName = safeText(data.displayName || data.userName || data.name, maskEmail(data.email) || "Verified merchant");
                        const text = safeText(data.text || data.review || data.message);
                        if (!text) return null;
                        return {
                            id: doc.id,
                            displayName,
                            role: data.role === "supplier" ? "supplier" : data.role === "reseller" ? "reseller" : "merchant",
                            rating: Math.min(5, Math.max(1, Number(data.rating || 5))),
                            text,
                            verified: data.verified !== false,
                            storeName: safeText(data.storeName),
                            createdAt: data.createdAt,
                        } satisfies Review;
                    })
                    .filter(Boolean)
                    .sort((a: any, b: any) => {
                        const aTime = typeof a.createdAt?.toDate === "function" ? a.createdAt.toDate().getTime() : 0;
                        const bTime = typeof b.createdAt?.toDate === "function" ? b.createdAt.toDate().getTime() : 0;
                        return bTime - aTime;
                    })
                    .slice(0, 24) as Review[];

                if (mounted) setReviews(nextReviews);
            } catch (error) {
                console.error("Could not load public reviews:", error);
                if (mounted) setReviews([]);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        loadReviews();
        return () => { mounted = false; };
    }, []);

    return (
        <section className="py-24 bg-[#07060f] overflow-hidden">
            <div className="container px-4 md:px-6 mb-14 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-[11px] font-bold uppercase tracking-widest mb-6">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> Verified merchant feedback
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
                    Reviews from <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-cyan-400">approved platform users</span>
                </h2>
                <p className="text-zinc-500 text-lg font-medium max-w-3xl mx-auto">
                    Testimonials shown here come from approved review records connected to Shoplinea accounts. We do not publish generated reviews.
                </p>
            </div>

            {loading ? (
                <div className="container px-4 md:px-6 max-w-6xl mx-auto grid gap-5 md:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="h-48 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
                            <div className="h-9 w-40 rounded bg-white/[0.06] animate-pulse" />
                            <div className="mt-6 h-4 w-full rounded bg-white/[0.06] animate-pulse" />
                            <div className="mt-3 h-4 w-3/4 rounded bg-white/[0.06] animate-pulse" />
                        </div>
                    ))}
                </div>
            ) : reviews.length === 0 ? (
                <div className="container px-4 md:px-6 max-w-3xl mx-auto">
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 text-center">
                        <ShieldCheck className="mx-auto mb-4 h-9 w-9 text-emerald-400" />
                        <h3 className="text-lg font-bold text-white">Verified reviews will appear here</h3>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                            Public testimonials are displayed only after a real platform user submits feedback and it is approved for publication.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="relative w-full">
                    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#07060f] to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#07060f] to-transparent z-10 pointer-events-none" />

                    <div className="flex animate-scroll hover:pause gap-5 w-[max-content]">
                        {[...reviews, ...reviews].map((review, i) => (
                            <div
                                key={`${review.id}-${i}`}
                                className="w-[320px] flex-shrink-0 bg-white/[0.03] p-6 rounded-2xl border border-white/[0.06] hover:border-purple-500/30 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                                            style={{ background: `hsl(${(i * 37) % 360}, 65%, 45%)` }}>
                                            {review.displayName[0] || "M"}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-white text-sm truncate">{review.displayName}</h4>
                                            <p className="text-[11px] text-zinc-600 truncate">{review.storeName || "Verified Shoplinea account"}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${review.role === "supplier"
                                        ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/20"
                                        : "bg-purple-500/20 text-purple-400 border border-purple-500/20"
                                        }`}>
                                        {review.role}
                                    </span>
                                </div>
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                                        {formatReviewDate(review.createdAt) || "Approved review"}
                                    </span>
                                    {review.verified && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-emerald-300">
                                            <ShieldCheck className="h-3 w-3" /> Verified
                                        </span>
                                    )}
                                </div>
                                <div className="flex mb-3 gap-0.5">
                                    {Array.from({ length: 5 }).map((_, starIndex) => (
                                        <Star
                                            key={starIndex}
                                            className={`w-3.5 h-3.5 ${starIndex < review.rating ? "text-yellow-400 fill-yellow-400" : "text-zinc-700"}`}
                                        />
                                ))}
                                </div>
                                <p className="text-sm text-zinc-400 leading-relaxed">&quot;{review.text}&quot;</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-scroll {
                    animation: scroll 180s linear infinite;
                }
                .hover\\:pause:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </section>
    );
}

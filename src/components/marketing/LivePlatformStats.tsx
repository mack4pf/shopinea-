"use client";

import { useEffect, useState } from "react";
import { collection, getCountFromServer, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

type Stat = {
    value: string;
    label: string;
    color?: string;
};

type LivePlatformStatsProps = {
    variant?: "home" | "about";
};

const compact = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return "Live";
    if (value >= 1000000) return `${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1)}M+`;
    if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K+`;
    return value.toLocaleString();
};

const money = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return "Tracked";
    if (value >= 1000000) return `$${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1)}M+`;
    if (value >= 1000) return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K+`;
    return `$${Math.round(value).toLocaleString()}`;
};

async function countFor(collectionName: string, field?: string, operator?: any, value?: any) {
    const ref = collection(db, collectionName);
    const countQuery = field ? query(ref, where(field, operator, value)) : query(ref);
    const snap = await getCountFromServer(countQuery);
    return snap.data().count || 0;
}

async function orderRevenueSample() {
    const snap = await getDocs(query(collection(db, "orders"), limit(500)));
    return snap.docs.reduce((sum, doc) => {
        const data = doc.data() as any;
        const amount = Number(data.resellPrice || data.totalAmount || 0);
        return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0);
}

export function LivePlatformStats({ variant = "home" }: LivePlatformStatsProps) {
    const [stats, setStats] = useState<Stat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function loadStats() {
            try {
                const [resellers, suppliers, products, orders, revenue] = await Promise.all([
                    countFor("users", "role", "==", "reseller"),
                    countFor("users", "role", "==", "supplier"),
                    countFor("products"),
                    countFor("orders"),
                    orderRevenueSample(),
                ]);

                const nextStats = variant === "about"
                    ? [
                        { label: "Reseller Accounts", value: compact(resellers) },
                        { label: "Supplier Accounts", value: compact(suppliers) },
                        { label: "Products Available", value: compact(products) },
                        { label: "Orders Recorded", value: compact(orders) },
                    ]
                    : [
                        { value: compact(resellers + suppliers), label: "Merchant Accounts", color: "from-purple-400 to-fuchsia-400" },
                        { value: money(revenue), label: "Recorded Sales Sample", color: "from-cyan-400 to-blue-400" },
                        { value: compact(products), label: "Products in Catalog", color: "from-indigo-400 to-purple-400" },
                        { value: compact(orders), label: "Orders Recorded", color: "from-emerald-400 to-teal-400" },
                    ];

                if (mounted) setStats(nextStats);
            } catch (error) {
                console.error("Could not load public platform stats:", error);
                const fallbackStats = variant === "about"
                    ? [
                        { label: "Merchant Accounts", value: "Live data" },
                        { label: "Supplier Network", value: "Live data" },
                        { label: "Product Catalog", value: "Live data" },
                        { label: "Order Records", value: "Live data" },
                    ]
                    : [
                        { value: "Live", label: "Merchant Accounts", color: "from-purple-400 to-fuchsia-400" },
                        { value: "Tracked", label: "Sales Records", color: "from-cyan-400 to-blue-400" },
                        { value: "Live", label: "Product Catalog", color: "from-indigo-400 to-purple-400" },
                        { value: "Live", label: "Order Records", color: "from-emerald-400 to-teal-400" },
                    ];
                if (mounted) setStats(fallbackStats);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        loadStats();
        return () => { mounted = false; };
    }, [variant]);

    const displayStats = loading
        ? Array.from({ length: 4 }).map((_, index) => ({ value: "Loading", label: ["Merchants", "Sales", "Products", "Orders"][index], color: "from-zinc-500 to-zinc-400" }))
        : stats;

    if (variant === "about") {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {displayStats.map((stat, i) => (
                    <div key={`${stat.label}-${i}`} className="text-center">
                        <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                        <p className="text-sm text-zinc-500">{stat.label}</p>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {displayStats.map((stat, i) => (
                <div key={`${stat.label}-${i}`} className="flex flex-col items-center text-center p-8 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.10] transition-all">
                    <span className={`text-5xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r ${stat.color || "from-purple-400 to-fuchsia-400"} mb-3`}>{stat.value}</span>
                    <span className="text-zinc-500 text-sm font-semibold">{stat.label}</span>
                </div>
            ))}
        </div>
    );
}

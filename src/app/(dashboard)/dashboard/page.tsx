"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    ShoppingCart, TrendingUp, CheckCircle2, Circle,
    Loader2, Plus, Rocket, ChevronRight, Zap,
    Eye, Wallet, ArrowUpRight, Package, Megaphone,
    BarChart3, Settings, BadgeCheck
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/hooks/useCurrency";

const todayAnalyticsKey = () => new Date().toISOString().slice(0, 10);
const numeric = (value: any) => Number(value || 0);

export default function ResellerHome() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ revenueToday: 0, ordersToday: 0, visitorsToday: 0, totalOrders: 0, totalVisitors: 0 });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const currency = useCurrency(userData);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                const data = userDoc.data();
                setUserData(data);

                if (data?.role === "buyer") { router.push("/buyer-orders"); return; }

                const todayKey = todayAnalyticsKey();
                const storeViews = numeric(data?.storeViews || data?.impressions || data?.stats?.views);
                const storeVisits = numeric(data?.storeVisits);
                const dailyVisits = numeric(data?.dailyStoreVisits?.[todayKey]);
                const visitorsToday = dailyVisits || storeVisits || storeViews;
                const totalVisitors = storeVisits || storeViews || visitorsToday;

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const q = query(collection(db, "orders"), where("resellerId", "==", firebaseUser.uid), where("createdAt", ">=", today));
                const snap = await getDocs(q);
                let rev = 0;
                snap.docs.forEach(d => rev += d.data().resellPrice || 0);

                const allOrdersQ = query(collection(db, "orders"), where("resellerId", "==", firebaseUser.uid));
                const allOrdersSnap = await getDocs(allOrdersQ);
                const totalOrders = numeric(data?.stats?.orders) || allOrdersSnap.size || snap.size;

                setStats({ revenueToday: rev, ordersToday: snap.size, visitorsToday, totalOrders, totalVisitors });

                const recentQ = query(collection(db, "orders"), where("resellerId", "==", firebaseUser.uid), orderBy("createdAt", "desc"), limit(5));
                const recentSnap = await getDocs(recentQ);
                setRecentOrders(recentSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) return (
        <div className="h-[80vh] flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
        </div>
    );

    const conversionBase = stats.totalVisitors || stats.visitorsToday;
    const conversionOrders = stats.totalOrders || stats.ordersToday;
    const conversion = conversionOrders > 0 && conversionBase > 0
        ? `${((conversionOrders / conversionBase) * 100).toFixed(1)}%` : "0%";

    const setupSteps = [
        { icon: Package,    title: "Add your first product",  desc: "Browse and select products to sell.", done: (userData?.storeProducts?.length > 0), href: '/dashboard/products' },
        { icon: Megaphone,  title: "Fund your ads wallet",    desc: "Start reaching buyers through targeted ads.", done: (userData?.adWalletBalance > 0), href: '/dashboard/ads' },
        { icon: Settings,   title: "Set up your store",       desc: "Customize your store name and branding.", done: !!userData?.storeName, href: '/dashboard/settings' },
        { icon: BadgeCheck, title: "Verify your identity",    desc: "Complete KYC to unlock payouts.", done: (userData?.kycStatus === 'verified' || userData?.kycStatus === 'pending'), href: '/dashboard/settings' },
    ];

    const doneCount = setupSteps.filter(s => s.done).length;
    const setupPct = Math.round((doneCount / setupSteps.length) * 100);

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-10">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-medium text-zinc-500 mb-1">Overview</p>
                    <h1 className="text-2xl font-bold text-white leading-tight">
                        Good day, {userData?.displayName?.split(' ')[0] || 'there'}
                    </h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Here&apos;s what&apos;s happening with your store today.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => router.push('/dashboard/products')}
                        className="flex items-center gap-2 h-9 px-4 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm font-medium text-zinc-300 hover:bg-white/[0.08] transition-colors"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        View Store
                    </button>
                    <button
                        onClick={() => router.push('/onboarding/reseller')}
                        className="flex items-center gap-2 h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add Products
                    </button>
                </div>
            </div>

            {/* ── KPI Row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: "Revenue Today",  value: currency.money(stats.revenueToday), icon: TrendingUp,   color: "text-emerald-400", bg: "bg-emerald-500/10", trend: null },
                    { label: "Orders Today",   value: stats.ordersToday.toString(),                 icon: ShoppingCart, color: "text-blue-400",    bg: "bg-blue-500/10",    trend: null },
                    { label: "Visits Today",   value: stats.visitorsToday.toLocaleString(),          icon: Eye,          color: "text-violet-400",  bg: "bg-violet-500/10",  trend: null },
                    { label: "Conversion",     value: conversion,                                    icon: Zap,          color: "text-amber-400",   bg: "bg-amber-500/10",   trend: null },
                ].map((card, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-zinc-500">{card.label}</span>
                            <div className={`w-7 h-7 ${card.bg} rounded-lg flex items-center justify-center`}>
                                <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-white tracking-tight">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* ── Main Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Left — checklist + ad CTA */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Setup Checklist */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                        <div className="flex items-center justify-between mb-1">
                            <h2 className="text-sm font-semibold text-white">Getting Started</h2>
                            <span className="text-xs font-medium text-zinc-400">{doneCount}/{setupSteps.length} complete</span>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full h-1 bg-white/[0.06] rounded-full mb-5 mt-2">
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${setupPct}%` }} />
                        </div>
                        <div className="space-y-1">
                            {setupSteps.map((step, i) => (
                                <button
                                    key={i}
                                    onClick={() => router.push(step.href)}
                                    className="w-full flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/[0.04] transition-colors text-left group"
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${step.done ? 'bg-emerald-500/15' : 'bg-white/[0.04] border border-white/[0.08]'}`}>
                                        {step.done
                                            ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                            : <step.icon className="w-4 h-4 text-zinc-500" />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium leading-tight ${step.done ? 'text-zinc-500 line-through decoration-zinc-600' : 'text-zinc-200'}`}>{step.title}</p>
                                        <p className="text-xs text-zinc-600 mt-0.5">{step.desc}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors shrink-0" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ad / Campaign CTA */}
                    <div className="relative overflow-hidden rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-transparent p-6">
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-600/20 rounded-full blur-[60px] pointer-events-none" />
                        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
                            <div className="w-11 h-11 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                                <Rocket className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-white">Start Advertising</h3>
                                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                                    Reach buyers across Meta &amp; TikTok with automated campaigns. Fund your ads wallet to get started.
                                </p>
                            </div>
                            <button
                                onClick={() => router.push('/dashboard/ads')}
                                className="shrink-0 flex items-center gap-2 h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition-colors"
                            >
                                Launch Campaign
                                <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: "Products",   icon: Package,     href: '/dashboard/products',  color: "text-blue-400",    bg: "bg-blue-500/10" },
                            { label: "Analytics",  icon: BarChart3,   href: '/dashboard/analytics', color: "text-violet-400",  bg: "bg-violet-500/10" },
                            { label: "Orders",     icon: ShoppingCart,href: '/dashboard/orders',    color: "text-amber-400",   bg: "bg-amber-500/10" },
                            { label: "Marketing",  icon: Megaphone,   href: '/dashboard/marketing', color: "text-emerald-400", bg: "bg-emerald-500/10" },
                        ].map((link, i) => (
                            <button
                                key={i}
                                onClick={() => router.push(link.href)}
                                className="flex flex-col items-center gap-2.5 py-5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.10] transition-all group"
                            >
                                <div className={`w-9 h-9 ${link.bg} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    <link.icon className={`w-4 h-4 ${link.color}`} />
                                </div>
                                <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">{link.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-5">

                    {/* Wallet Card */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
                        <div className="p-5 border-b border-white/[0.05]">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <Wallet className="w-4 h-4 text-zinc-400" />
                                    <h3 className="text-sm font-semibold text-white">Wallet</h3>
                                </div>
                                <button onClick={() => router.push('/dashboard/wallet')} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1">
                                    Manage <ArrowUpRight className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                                    <p className="text-xs text-zinc-500 mb-1.5">Main Balance</p>
                                    <p className="text-2xl font-bold text-white">{currency.money(userData?.walletBalance || 0)}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <p className="text-xs text-zinc-500">Ads Budget</p>
                                        {(userData?.adWalletBalance || 0) > 0 && (
                                            <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Active</span>
                                        )}
                                    </div>
                                    <p className="text-2xl font-bold text-white">{currency.money(userData?.adWalletBalance || 0)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4">
                            <button
                                onClick={() => router.push('/dashboard/wallet')}
                                className="w-full h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition-colors"
                            >
                                Add Funds
                            </button>
                        </div>
                    </div>

                    {/* Plan status */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-white">Subscription</h3>
                            <button onClick={() => router.push('/dashboard/subscription')} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                                Manage →
                            </button>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                            <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                <Zap className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">{userData?.planName || "Free Plan"}</p>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                    {userData?.planName ? "Active subscription" : "No active plan"}
                                </p>
                            </div>
                        </div>
                        {!userData?.planName && (
                            <button
                                onClick={() => router.push('/dashboard/subscription')}
                                className="w-full mt-3 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm font-medium text-zinc-300 hover:bg-white/[0.08] transition-colors"
                            >
                                Upgrade Plan
                            </button>
                        )}
                    </div>

                    {/* Recent Orders */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-white">Recent Orders</h3>
                            <button onClick={() => router.push('/dashboard/orders')} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                                View all →
                            </button>
                        </div>
                        {recentOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 gap-2">
                                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                                    <ShoppingCart className="w-4 h-4 text-zinc-600" />
                                </div>
                                <p className="text-xs text-zinc-600 text-center">No orders yet. Start advertising to drive sales.</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {recentOrders.map((o) => (
                                    <div key={o.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                            <ShoppingCart className="w-3.5 h-3.5 text-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-zinc-200 truncate">#{o.id.slice(0, 8)}</p>
                                            <p className="text-[11px] text-zinc-600">{o.customerName || 'Customer'}</p>
                                        </div>
                                        <p className="text-xs font-semibold text-white shrink-0">{currency.money(o.resellPrice || 0)}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

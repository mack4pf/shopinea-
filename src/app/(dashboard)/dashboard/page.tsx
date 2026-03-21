"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    Wallet, ShoppingCart, TrendingUp, ArrowUpRight, CheckCircle2,
    Loader2, Plus, Sparkles, Rocket, ChevronRight, Users, Zap,
    Package, Eye
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ResellerHome() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        revenueToday: 0,
        ordersToday: 0,
        visitorsToday: 0,
        activeSessions: 0
    });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                const data = userDoc.data();
                setUserData(data);

                if (data?.role === "buyer") {
                    router.push("/buyer-orders");
                    return;
                }

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const q = query(
                    collection(db, "orders"),
                    where("resellerId", "==", firebaseUser.uid),
                    where("createdAt", ">=", today)
                );
                const snap = await getDocs(q);
                let rev = 0;
                snap.docs.forEach(d => rev += d.data().resellPrice || 0);

                setStats({
                    revenueToday: rev,
                    ordersToday: snap.size,
                    visitorsToday: data?.impressions || 0,
                    activeSessions: 0
                });

                const recentQ = query(
                    collection(db, "orders"),
                    where("resellerId", "==", firebaseUser.uid),
                    orderBy("createdAt", "desc"),
                    limit(5)
                );
                const recentSnap = await getDocs(recentQ);
                setRecentOrders(recentSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) return (
        <div className="h-[80vh] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
    );

    const currencySymbol = "$";

    const kpiCards = [
        {
            label: "Revenue Today",
            value: `${currencySymbol}${stats.revenueToday.toLocaleString()}`,
            icon: TrendingUp,
            iconColor: "text-emerald-500",
            iconBg: "bg-emerald-500/10"
        },
        {
            label: "Orders Today",
            value: stats.ordersToday.toString(),
            icon: ShoppingCart,
            iconColor: "text-blue-500",
            iconBg: "bg-blue-500/10"
        },
        {
            label: "Impressions",
            value: stats.visitorsToday.toLocaleString(),
            icon: Eye,
            iconColor: "text-violet-500",
            iconBg: "bg-violet-500/10"
        },
        {
            label: "Conversion",
            value: stats.ordersToday > 0 && stats.visitorsToday > 0
                ? `${((stats.ordersToday / stats.visitorsToday) * 100).toFixed(1)}%`
                : "0%",
            icon: Zap,
            iconColor: "text-amber-500",
            iconBg: "bg-amber-500/10"
        },
    ];

    const setupSteps = [
        { title: "Add your first product", desc: "Browse and select products to sell on your store.", done: (userData?.storeProducts?.length > 0), action: () => router.push('/dashboard/products') },
        { title: "Fund your ads wallet", desc: "Start reaching buyers through targeted ads.", done: (userData?.adWalletBalance > 0), action: () => router.push('/dashboard/ads') },
        { title: "Set up your store", desc: "Customize your store name and branding.", done: !!userData?.storeName, action: () => router.push('/dashboard/settings') },
        { title: "Verify your identity", desc: "Complete verification to enable payouts.", done: (userData?.kycStatus === 'verified' || userData?.kycStatus === 'pending'), action: () => router.push('/dashboard/settings') },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Welcome back, {userData?.displayName || 'there'} 👋
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        Here&apos;s what&apos;s happening with your store today.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => router.push('/dashboard/products')}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-white/[0.06] border border-white/[0.08] text-zinc-300 hover:bg-white/[0.1] transition-colors"
                    >
                        <Eye className="w-4 h-4" />
                        View Store
                    </button>
                    <button
                        onClick={() => router.push('/onboarding/reseller')}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Products
                    </button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map((card, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.05] transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-medium text-zinc-500">{card.label}</span>
                            <div className={`w-8 h-8 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                                <card.icon className={`w-4 h-4 ${card.iconColor}`} />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-white">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Setup + CTA */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Setup Checklist */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
                        <h2 className="text-base font-semibold text-white mb-1">Getting Started</h2>
                        <p className="text-xs text-zinc-500 mb-6">Complete these steps to launch your business.</p>

                        <div className="space-y-2">
                            {setupSteps.map((step, i) => (
                                <div
                                    key={i}
                                    onClick={step.action}
                                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer group"
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${step.done ? 'bg-emerald-500/15 text-emerald-500' : 'bg-white/[0.06] text-zinc-600'}`}>
                                        {step.done ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-semibold">{i + 1}</span>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${step.done ? 'text-zinc-600 line-through' : 'text-zinc-200'}`}>{step.title}</p>
                                        <p className="text-xs text-zinc-600 mt-0.5">{step.desc}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Marketing CTA */}
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative flex flex-col md:flex-row items-center gap-6">
                            <div className="w-14 h-14 bg-white/15 backdrop-blur rounded-xl flex items-center justify-center shrink-0">
                                <Rocket className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-lg font-bold text-white">Start Advertising</h3>
                                <p className="text-sm text-blue-100/70 mt-1">
                                    Reach buyers across Meta &amp; TikTok with automated ad campaigns.
                                </p>
                            </div>
                            <button
                                onClick={() => router.push('/dashboard/ads')}
                                className="px-6 py-3 bg-white text-blue-700 font-semibold text-sm rounded-lg hover:bg-blue-50 transition-colors shrink-0"
                            >
                                Launch Campaign
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    {/* Wallet */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-semibold text-zinc-300">Wallet</h3>
                            <button onClick={() => router.push('/dashboard/history')} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                                History →
                            </button>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <p className="text-xs text-zinc-600 mb-1">Balance</p>
                                <p className="text-2xl font-bold text-white">{currencySymbol}{(userData?.walletBalance || 0).toLocaleString()}</p>
                            </div>
                            <div className="h-px bg-white/[0.06]" />
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-xs text-zinc-600">Ads Budget</p>
                                    {(userData?.adWalletBalance || 0) > 0 && (
                                        <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-medium">Active</span>
                                    )}
                                </div>
                                <p className="text-2xl font-bold text-white">{currencySymbol}{(userData?.adWalletBalance || 0).toLocaleString()}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/dashboard/ads')}
                            className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium text-white transition-colors"
                        >
                            Add Funds
                        </button>
                    </div>

                    {/* Recent Orders */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-semibold text-zinc-300">Recent Orders</h3>
                            <button onClick={() => router.push('/dashboard/orders')} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                                View all →
                            </button>
                        </div>
                        <div className="space-y-2">
                            {recentOrders.length === 0 ? (
                                <div className="text-center py-10">
                                    <ShoppingCart className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
                                    <p className="text-sm text-zinc-600">No orders yet</p>
                                </div>
                            ) : (
                                recentOrders.map((o) => (
                                    <div key={o.id} className="flex items-center gap-3 p-3 hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer">
                                        <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center">
                                            <ShoppingCart className="w-4 h-4 text-zinc-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-zinc-300 truncate">#{o.id.slice(0, 8)}</p>
                                            <p className="text-xs text-zinc-600">{o.customerName || 'Customer'}</p>
                                        </div>
                                        <p className="text-sm font-semibold text-white">{currencySymbol}{(o.resellPrice || 0).toLocaleString()}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

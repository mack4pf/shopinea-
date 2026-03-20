"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    LayoutDashboard,
    Wallet,
    Package,
    ShoppingCart,
    BarChart3,
    Users,
    Megaphone,
    UserCircle,
    CreditCard,
    Bell,
    Settings,
    HelpCircle,
    User as UserIcon,
    ChevronRight,
    TrendingUp,
    ArrowUpRight,
    CheckCircle2,
    Loader2,
    Plus,
    MessageSquare,
    Target,
    Zap,
    Gift,
    Sparkles,
    Shield,
    Rocket,
    LogOut,
    Menu,
    X,
    Search,
    History,
    Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

                // Fetch today's orders (Real Data Only)
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
                    visitorsToday: 0, // In a real app we'd fetch this but for now we'll keep it at 0 for new accounts
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

    const currencySymbol = "$";

    if (loading) return (
        <div className="h-[80vh] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-1000">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-white tracking-tighter italic leading-none">Welcome, {userData?.displayName || 'Merchant'} 👋</h1>
                    <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        STORE: {userData?.storeName || 'My Boutique'}
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button onClick={() => router.push('/dashboard/subscription')} className="h-14 px-10 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-white font-black text-[11px] uppercase tracking-widest shadow-2xl transition-all">
                        UPGRADE TIER
                    </Button>
                    <Button onClick={() => router.push('/dashboard/settings')} className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-blue-500/20">
                        MY IDENTITY
                    </Button>
                </div>
            </div>

            {/* Top Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Today's Revenue", val: `${currencySymbol}${stats.revenueToday.toLocaleString()}`, trend: "0%", icon: TrendingUp, color: "blue" },
                    { label: "Total Sessions", val: stats.visitorsToday.toString(), trend: "0%", icon: Users, color: "emerald" },
                    { label: "Orders Today", val: stats.ordersToday.toString(), trend: "0%", icon: ShoppingCart, color: "amber" },
                    { label: "Conversion Rate", val: "0.0%", trend: "0%", icon: Zap, color: "rose" },
                ].map((m, i) => (
                    <div key={i} className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 p-8 rounded-[2.5rem] hover:border-blue-500/50 hover:shadow-2xl hover:-translate-y-1 transition-all group relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-blue-500/10 transition-colors" />
                        <div className="space-y-2 relative z-10">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] leading-none mb-2">{m.label}</p>
                            <h3 className="text-4xl font-black text-white italic tracking-tighter">{m.val}</h3>
                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-800">
                                <span className={`text-[9px] font-black text-zinc-600 uppercase tracking-widest`}>
                                    VS YESTERDAY
                                </span>
                                <span className="text-[9px] font-black text-zinc-500">0%</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Setup Guide */}
                <div className="lg:col-span-2 space-y-10">
                    <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12">
                            <Sparkles className="w-16 h-16 text-blue-500 opacity-20 animate-pulse" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-3xl font-black text-white mb-2 tracking-tighter italic">Initialization Checklist</h3>
                            <p className="text-zinc-500 text-sm font-black mb-12 uppercase tracking-widest opacity-60">Finish setting up your store to start receiving orders.</p>

                            <div className="space-y-6">
                                {[
                                    { title: "Add your first product", desc: "Select from our marketplace to stock your shelves.", done: (userData?.storeProducts?.length > 0) },
                                    { title: "Refuel your Ads Wallet", desc: "Deposit funds to target buyers on Meta and TikTok.", done: (userData?.adWalletBalance > 0) },
                                    { title: "Setup Store Branding", desc: "Upload logic and themes to stand out.", done: !!userData?.storeName },
                                    { title: "Complete KYC Identity", desc: "Submit your legal ID in settings for verification.", done: (userData?.kycStatus === 'verified' || userData?.kycStatus === 'pending') },
                                ].map((step, i) => (
                                    <div
                                        key={i}
                                        onClick={() => {
                                            if (i === 0) router.push('/dashboard/products');
                                            if (i === 1) router.push('/dashboard/ads');
                                            if (i === 2) router.push('/dashboard/settings');
                                            if (i === 3) router.push('/dashboard/settings');
                                        }}
                                        className="flex items-center gap-8 p-8 rounded-[2.5rem] hover:bg-zinc-800/50 transition-all border border-zinc-800/50 hover:border-zinc-700 group cursor-pointer shadow-xl"
                                    >
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all ${step.done ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xl shadow-emerald-500/20' : 'border-zinc-800 bg-zinc-950 text-zinc-700'}`}>
                                            {step.done ? <CheckCircle2 className="w-8 h-8" /> : <span className="text-sm font-black italic">{i + 1}</span>}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className={`text-lg font-black tracking-tight ${step.done ? 'text-zinc-600 line-through' : 'text-white'}`}>{step.title}</h4>
                                            <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mt-1">{step.desc}</p>
                                        </div>
                                        <ChevronRight className={`w-6 h-6 text-zinc-800 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all ${step.done ? 'opacity-20' : ''}`} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Marketing Ad Snippet */}
                    <div className="bg-gradient-to-br from-blue-700 to-indigo-900 p-12 rounded-[3.5rem] text-white overflow-hidden relative group shadow-2xl shadow-blue-500/20">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] -mr-64 -mt-64 group-hover:bg-white/20 transition-all duration-1000" />
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                            <div className="w-32 h-32 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[3rem] flex items-center justify-center shrink-0 shadow-2xl group-hover:rotate-12 transition-transform">
                                <Rocket className="w-16 h-16 text-white fill-white/20" />
                            </div>
                            <div className="space-y-6 text-center md:text-left flex-1">
                                <h3 className="text-4xl font-black tracking-tighter leading-none italic uppercase">One-Click Growth</h3>
                                <p className="text-md font-black text-blue-100/80 leading-relaxed uppercase text-[11px] tracking-widest">
                                    Our AI agent handles the creative and targeting for Meta & TikTok. Select a product, set your budget, and watch the inquiries roll in.
                                </p>
                                <Button onClick={() => window.location.href = '/dashboard/ads'} className="bg-white text-blue-900 font-black px-14 rounded-2xl h-16 shadow-2xl hover:scale-105 active:scale-95 transition-all text-xs tracking-widest uppercase">
                                    LAUNCH CAMPAIGN 🚀
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-10">
                    {/* Wallet Status */}
                    <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[3rem] space-y-10 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em]">Treasury</h3>
                            <button onClick={() => router.push('/dashboard/history')} className="px-5 py-2 bg-zinc-950 rounded-full text-[9px] font-black text-zinc-400 hover:text-white transition-colors border border-zinc-800">HISTORY</button>
                        </div>
                        <div className="space-y-10">
                            <div className="group cursor-pointer">
                                <p className="text-[10px] font-black text-zinc-600 uppercase mb-3 tracking-[0.2em] pl-1">Buying Wallet</p>
                                <div className="flex items-center justify-between">
                                    <h4 className="text-4xl font-black text-white italic tracking-tighter">{currencySymbol}{(userData?.walletBalance || 0).toLocaleString()}</h4>
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-xl">
                                        <Wallet className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                            <div className="w-full h-px bg-zinc-800" />
                            <div className="group cursor-pointer">
                                <div className="flex items-center gap-3 mb-3">
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] pl-1">Ad Wallet</p>
                                    <span className="text-[8px] font-black bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full border border-emerald-500/20 shadow-sm animate-pulse">ACTIVE BONUS</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <h4 className="text-4xl font-black text-white italic tracking-tighter">{currencySymbol}{(userData?.adWalletBalance || 0).toLocaleString()}</h4>
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-xl">
                                        <Zap className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Button onClick={() => router.push('/dashboard/ads')} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-16 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-blue-500/20 hover:scale-[1.02] transition-all">
                            REFUEL ASSETS
                        </Button>
                    </div>

                    {/* Recent Orders Snippet */}
                    <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 p-12 rounded-[3rem] space-y-10 shadow-2xl">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] leading-none">Live Logs</h3>
                            <button onClick={() => router.push('/dashboard/history')} className="text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest">Global →</button>
                        </div>
                        <div className="space-y-4">
                            {recentOrders.length === 0 ? (
                                <div className="text-center py-16 space-y-6 bg-zinc-950/50 rounded-[2.5rem] border border-dashed border-zinc-800">
                                    <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto shadow-2xl border border-zinc-800/50">
                                        <ShoppingCart className="w-10 h-10 text-zinc-700" />
                                    </div>
                                    <p className="text-[11px] font-black text-zinc-600 uppercase tracking-widest italic">No transaction records</p>
                                </div>
                            ) : (
                                recentOrders.map((o) => (
                                    <div key={o.id} className="flex items-center gap-6 p-6 hover:bg-zinc-800 rounded-[2rem] transition-all border border-transparent hover:border-zinc-700 group cursor-pointer shadow-xl">
                                        <div className="w-14 h-14 rounded-2xl bg-zinc-950 flex items-center justify-center border border-zinc-800 group-hover:bg-blue-600 group-hover:border-blue-500 transition-all duration-300">
                                            <ShoppingCart className="w-7 h-7 text-zinc-600 group-hover:text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-white tracking-tighter uppercase leading-none mb-2">#{o.id.slice(0, 8)}</p>
                                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{o.customerName || 'Global Client'}</p>
                                        </div>
                                        <p className="font-black text-white text-md italic tracking-tighter">{currencySymbol}{(o.resellPrice || 0).toLocaleString()}</p>
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

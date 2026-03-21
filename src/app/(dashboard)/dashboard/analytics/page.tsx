"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, doc, getDoc, limit, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    TrendingUp,
    Target,
    Zap,
    Users,
    ShoppingCart,
    Globe,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    Smartphone,
    History,
    Activity,
    ShieldCheck,
    ArrowRight
} from "lucide-react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    ArcElement,
    Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    ArcElement,
    Filler
);

export default function AnalyticsPage() {
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState("7 Days");

    const [stats, setStats] = useState({
        totalVisitors: 0,
        conversionRate: 0,
        avgOrderValue: 0,
        bounceRate: 0,
        salesTrends: [0, 0, 0, 0, 0, 0, 0],
        topProducts: [] as any[],
        categoryDistribution: {} as Record<string, number>,
        recentOrders: [] as any[]
    });

    const getCurrencySymbol = (code: string = "USD") => {
        switch (code) {
            case "EUR": return "€";
            case "GBP": return "£";
            default: return "$";
        }
    };

    const currencySymbol = getCurrencySymbol(userData?.currency);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                try {
                    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                    const uData = userDoc.data();
                    setUserData(uData);

                    // Fetch All Orders for calculations
                    const ordersQuery = query(
                        collection(db, "orders"),
                        where("resellerId", "==", firebaseUser.uid),
                        orderBy("createdAt", "desc")
                    );
                    const ordersSnap = await getDocs(ordersQuery);
                    const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

                    // Use first 5 for "Recent Orders"
                    const recentOrders = orders.slice(0, 5);

                    // Calculate Summary Stats
                    const totalRev = orders.reduce((acc, curr) => acc + (curr.resellPrice || 0), 0);
                    const totalVisits = uData?.stats?.views || 0;
                    const convRate = totalVisits > 0 ? (orders.length / totalVisits) * 100 : 0;
                    const avgVal = orders.length > 0 ? totalRev / orders.length : 0;

                    // Calculate Sales Trends (Last 7 Days)
                    const trends = [0, 0, 0, 0, 0, 0, 0];
                    const now = new Date();
                    orders.forEach(order => {
                        const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
                        const diffTime = Math.abs(now.getTime() - orderDate.getTime());
                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                        if (diffDays < 7) {
                            trends[6 - diffDays] += order.resellPrice || 0;
                        }
                    });

                    // Top Products
                    const productMap: Record<string, { sales: number, revenue: number }> = {};
                    orders.forEach(order => {
                        const name = order.productName || "Unknown Product";
                        if (!productMap[name]) productMap[name] = { sales: 0, revenue: 0 };
                        productMap[name].sales += order.quantity || 1;
                        productMap[name].revenue += order.resellPrice || 0;
                    });

                    const topProds = Object.entries(productMap)
                        .map(([name, data]) => ({ name, ...data }))
                        .sort((a, b) => b.revenue - a.revenue)
                        .slice(0, 5);

                    // Category Distribution
                    const catMap: Record<string, number> = {};
                    orders.forEach(order => {
                        const cat = order.category || "Uncategorized";
                        catMap[cat] = (catMap[cat] || 0) + 1;
                    });

                    setStats({
                        totalVisitors: totalVisits,
                        conversionRate: convRate,
                        avgOrderValue: avgVal,
                        bounceRate: uData?.stats?.bounceRate || 0,
                        salesTrends: trends,
                        topProducts: topProds,
                        categoryDistribution: catMap,
                        recentOrders
                    });
                } catch (e) {
                    console.error("Error fetching analytics data:", e);
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const chartOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#18181b',
                titleColor: '#fff',
                bodyColor: '#a1a1aa',
                borderColor: '#27272a',
                borderWidth: 1,
                padding: 12,
                titleFont: { weight: 'bold', size: 14 },
                bodyFont: { size: 12 }
            }
        },
        scales: {
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false }, ticks: { color: '#71717a', font: { weight: '900', size: 10 } } },
            x: { grid: { display: false }, border: { display: false }, ticks: { color: '#71717a', font: { weight: '900', size: 10 } } }
        }
    };

    const salesData = {
        labels: ['6D_AGO', '5D_AGO', '4D_AGO', '3D_AGO', '2D_AGO', 'YESTERDAY', 'TODAY'],
        datasets: [{
            data: stats.salesTrends,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#3b82f6',
            pointRadius: 4,
            pointHoverRadius: 6
        }]
    };

    const categoryLabels = Object.keys(stats.categoryDistribution);
    const categoryValues = Object.values(stats.categoryDistribution);

    const categoryData = {
        labels: categoryLabels.length > 0 ? categoryLabels : ['No Data'],
        datasets: [{
            data: categoryValues.length > 0 ? categoryValues : [1],
            backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'],
            borderWidth: 0,
            hoverOffset: 15
        }]
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 shadow-2xl shadow-blue-500/10">
                            <Activity className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400">Node Performance Analytics</span>
                    </div>
                    <h1 className="text-6xl font-black text-white tracking-tighter italic leading-none uppercase">Quantum Core</h1>
                    <p className="text-zinc-600 font-extrabold text-sm uppercase tracking-widest leading-relaxed opacity-80 max-w-xl">
                        Recursive data visualization of your nodal growth streams and revenue vectors.
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-zinc-950/50 p-2 rounded-[2rem] border border-zinc-900 shadow-inner">
                    {['7 Days', '30 Days', 'Historic'].map(t => (
                        <button
                            key={t}
                            onClick={() => setTimeframe(t)}
                            className={cn(
                                "px-10 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all italic",
                                timeframe === t 
                                    ? "bg-blue-600 text-white shadow-2xl shadow-blue-500/20 scale-105" 
                                    : "text-zinc-600 hover:text-zinc-400"
                            )}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: "Reach Intensity", value: stats.totalVisitors.toLocaleString(), icon: Users, color: "blue", prefix: "" },
                    { label: "Yield Factor", value: `${stats.conversionRate.toFixed(1)}%`, icon: Target, color: "emerald", prefix: "" },
                    { label: "Alpha Ticket", value: `${stats.avgOrderValue.toFixed(0).toLocaleString()}`, icon: ShoppingCart, color: "indigo", prefix: currencySymbol },
                    { label: "Exit Stream", value: `${stats.bounceRate}%`, icon: Globe, color: "amber", prefix: "" },
                ].map((item, i) => (
                    <div key={i} className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3.5rem] space-y-8 group hover:border-zinc-700 transition-all shadow-2xl relative overflow-hidden">
                        <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-[80px] -mr-16 -mt-16 group-hover:scale-125 transition-transform", 
                            item.color === 'blue' ? 'bg-blue-600/10' : 
                            item.color === 'emerald' ? 'bg-emerald-600/10' : 
                            item.color === 'indigo' ? 'bg-indigo-600/10' : 'bg-amber-600/10'
                        )} />
                        <div className="flex justify-between items-start relative z-10">
                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border shadow-2xl transition-transform group-hover:rotate-12", 
                                item.color === 'blue' ? 'bg-blue-600/10 border-blue-600/20 text-blue-500 shadow-blue-600/10' : 
                                item.color === 'emerald' ? 'bg-emerald-600/10 border-emerald-600/20 text-emerald-500 shadow-emerald-600/10' : 
                                item.color === 'indigo' ? 'bg-indigo-600/10 border-indigo-600/20 text-indigo-500 shadow-indigo-600/10' : 
                                'bg-amber-600/10 border-amber-600/20 text-amber-500 shadow-amber-600/10'
                            )}>
                                <item.icon className="w-7 h-7" />
                            </div>
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mt-1" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-3 leading-none italic">{item.label}</p>
                            <h3 className="text-4xl font-black text-white italic tracking-tighter leading-none">{item.prefix}{item.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Visual Stream Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-[3.5rem] shadow-2xl overflow-hidden relative group">
                    <div className="p-12 border-b border-zinc-900 bg-zinc-950/20 backdrop-blur-3xl flex items-center justify-between">
                         <div className="space-y-1">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-4 italic leading-none group-hover:translate-x-1 transition-transform">
                                <TrendingUp className="w-7 h-7 text-blue-500" />
                                Revenue Spectrum
                            </h3>
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest pl-11">7-DAY QUANTUM TRAJECTORY</p>
                         </div>
                         <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-600" />
                                <span className="text-[10px] font-black text-zinc-500">LIQUID_REV</span>
                            </div>
                         </div>
                    </div>
                    <div className="p-12 h-[500px] w-full relative">
                        <Line data={salesData} options={chartOptions} />
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-[3.5rem] shadow-2xl flex flex-col group relative overflow-hidden">
                    <div className="p-12 border-b border-zinc-900 bg-zinc-950/20 backdrop-blur-3xl">
                         <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-4 italic leading-none">
                            <Zap className="w-7 h-7 text-amber-500" />
                            Segment Yield
                        </h3>
                    </div>
                    <div className="p-12 flex-1 space-y-12">
                        <div className="h-[280px] w-full relative flex items-center justify-center group/chart">
                            <Doughnut data={categoryData} options={{ ...chartOptions, cutout: '80%' }} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none group-hover:scale-110 transition-transform">
                                <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.2em] mb-1">AGGREGATE</p>
                                <h4 className="text-4xl font-black text-white italic leading-none">{categoryValues.reduce((a, b) => a + b, 0)}</h4>
                            </div>
                        </div>
                        <div className="space-y-5">
                            {categoryLabels.map((cat, i) => (
                                <div key={cat} className="flex justify-between items-center group/item p-5 bg-zinc-950/50 rounded-2xl border border-zinc-800 transition-all hover:border-zinc-700 hover:translate-x-2">
                                    <div className="flex items-center gap-5">
                                        <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: categoryData.datasets[0].backgroundColor[i] }} />
                                        <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest italic group-hover/item:text-white transition-colors">{cat}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                         <span className="text-sm font-black text-white italic">{stats.categoryDistribution[cat]}</span>
                                         <span className="text-[9px] font-black text-zinc-700">UNITS</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Operations Log Section (New) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                 {/* Top Products */}
                 <div className="bg-zinc-900 border border-zinc-800 rounded-[3.5rem] shadow-2xl flex flex-col group relative overflow-hidden">
                    <div className="p-12 border-b border-zinc-900 bg-zinc-950/20 backdrop-blur-3xl flex items-center justify-between">
                         <div className="space-y-1">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">Alpha Assets</h3>
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">TOP VELOCITY NODES</p>
                         </div>
                    </div>
                    <div className="p-12 space-y-6">
                        {stats.topProducts.length === 0 ? (
                            <div className="py-24 text-center opacity-30 grayscale flex flex-col items-center">
                                <ShoppingCart className="w-16 h-16 text-zinc-800 mb-6" />
                                <p className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.4em] italic leading-none">NO DATA TRACES</p>
                            </div>
                        ) : (
                            stats.topProducts.map((p, i) => (
                                <div key={i} className="flex items-center gap-8 p-6 bg-zinc-950/50 rounded-[2.5rem] border border-zinc-900 hover:border-blue-500/20 transition-all shadow-inner relative overflow-hidden group/product">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-900 flex items-center justify-center font-black text-blue-500 border border-zinc-800 shadow-2xl text-xl italic shrink-0">
                                        #{i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-lg font-black text-white truncate italic uppercase tracking-tighter mb-1.5">{p.name}</p>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">NET_VOLUME:</span>
                                            <span className="text-[10px] font-black text-zinc-400 tracking-widest italic">{p.sales} AUTHORIZATIONS</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-white italic tracking-tighter">{currencySymbol}{p.revenue.toLocaleString()}</p>
                                        <p className="text-[9px] font-black text-emerald-500 tracking-widest uppercase mt-1 italic">SETTLED</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Orders List */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-[3.5rem] shadow-2xl flex flex-col group relative overflow-hidden">
                    <div className="p-12 border-b border-zinc-900 bg-zinc-950/20 backdrop-blur-3xl flex items-center justify-between">
                         <div className="space-y-1">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">Tactical Stream</h3>
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">LIVE TRANSMISSION FEED</p>
                         </div>
                         <Link href="/dashboard/history?active=orders">
                            <Button variant="ghost" className="text-[10px] font-black text-blue-500 tracking-widest uppercase italic gap-2 hover:bg-blue-600/10">
                                FULL LOG <ArrowRight className="w-4 h-4" />
                            </Button>
                         </Link>
                    </div>
                    <div className="p-12 space-y-6">
                        {stats.recentOrders.length === 0 ? (
                            <div className="py-24 text-center opacity-30 grayscale flex flex-col items-center">
                                <History className="w-16 h-16 text-zinc-800 mb-6" />
                                <p className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.4em] italic leading-none">NULL ORDER BUFFER</p>
                            </div>
                        ) : (
                            stats.recentOrders.map((o) => (
                                <div key={o.id} className="flex items-center gap-6 p-6 bg-zinc-950/50 rounded-[2.5rem] border border-zinc-800 hover:border-zinc-700 transition-all shadow-inner relative overflow-hidden group/order">
                                    <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 shadow-xl group-hover/order:scale-110 transition-transform">
                                        <ShoppingCart className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <p className="text-base font-black text-white italic tracking-tighter uppercase">ORD-{o.id.slice(-6).toUpperCase()}</p>
                                            <span className="text-[10px] font-black text-white italic">{currencySymbol}{o.resellPrice?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest italic">{o.productName?.slice(0, 20)}...</p>
                                            <div className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest italic border", 
                                                o.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10' :
                                                o.status === 'cancelled' ? 'bg-rose-500/10 text-rose-500 border-rose-500/10' :
                                                'bg-blue-500/10 text-blue-500 border-blue-500/10'
                                            )}>
                                                {o.status}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Action Footer */}
            <div className="p-12 bg-blue-600 rounded-[3.5rem] flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32 transition-transform group-hover:scale-125 duration-1000" />
                 <div className="flex items-center gap-10 relative">
                    <div className="w-24 h-24 bg-white/10 rounded-[2.5rem] flex items-center justify-center text-white backdrop-blur-xl border border-white/20 shadow-2xl transition-transform group-hover:rotate-12">
                        <ShieldCheck className="w-12 h-12" />
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Intelligence Stream Finalized</h4>
                        <p className="text-blue-100/60 font-black text-[10px] uppercase tracking-[0.3em] italic max-w-lg leading-relaxed">
                            Quantum core visualization is derived from real-time nodal transactions. All streams are encrypted and anchored for audit verification.
                        </p>
                    </div>
                 </div>
                 <Link href="/dashboard/history" className="relative group/btn">
                    <Button className="h-20 px-12 bg-white text-blue-600 font-black italic rounded-[2rem] gap-4 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest border-b-4 border-zinc-200 active:border-b-0">
                        AUDIT SETTLEMENT LOG
                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
                    </Button>
                 </Link>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
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
    Smartphone
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
        categoryDistribution: {} as Record<string, number>
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

                    const ordersQuery = query(
                        collection(db, "orders"),
                        where("resellerId", "==", firebaseUser.uid)
                    );
                    const ordersSnap = await getDocs(ordersQuery);
                    const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

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
                        categoryDistribution: catMap
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
            }
        },
        scales: {
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#71717a' } },
            x: { grid: { display: false }, ticks: { color: '#71717a' } }
        }
    };

    const salesData = {
        labels: ['6d ago', '5d ago', '4d ago', '3d ago', '2d ago', 'Yesterday', 'Today'],
        datasets: [{
            data: stats.salesTrends,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
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
            hoverOffset: 10
        }]
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <TrendingUp className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400">Growth Intelligence</span>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter italic leading-none">Performance Matrix</h1>
                    <p className="text-zinc-500 font-extrabold text-sm uppercase tracking-widest leading-relaxed opacity-80 max-w-xl">
                        Monitor recursive data streams and identify top-performing revenue nodes.
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-[1.8rem] border border-zinc-800 shadow-inner">
                    {['7 Days', '30 Days', 'All Time'].map(t => (
                        <button
                            key={t}
                            onClick={() => setTimeframe(t)}
                            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all italic ${timeframe === t ? 'bg-blue-600 text-white shadow-2xl shadow-blue-500/20 scale-105' : 'text-zinc-600 hover:text-zinc-400'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Core Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: "Total Visitors", value: stats.totalVisitors.toLocaleString(), icon: Users, color: "blue" },
                    { label: "Conversion Rate", value: `${stats.conversionRate.toFixed(1)}%`, icon: Target, color: "emerald" },
                    { label: "Avg Order Value", value: `${currencySymbol}${stats.avgOrderValue.toFixed(0).toLocaleString()}`, icon: ShoppingCart, color: "indigo" },
                    { label: "Bounce Rate", value: `${stats.bounceRate}%`, icon: Globe, color: "amber" },
                ].map((item, i) => (
                    <div key={i} className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3.5rem] space-y-6 group hover:border-zinc-700 transition-all shadow-2xl relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-${item.color}-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-${item.color}-500/10 transition-colors`} />
                        <div className="flex justify-between items-start relative z-10">
                            <div className={`w-12 h-12 rounded-2xl bg-${item.color}-500/10 flex items-center justify-center border border-${item.color}-500/20 shadow-2xl shadow-${item.color}-500/10`}>
                                <item.icon className={`w-6 h-6 text-${item.color}-500`} />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[10px] font-black text-blue-500 italic tracking-widest">LIVE_CORE</span>
                            </div>
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2 leading-none">{item.label}</p>
                            <h3 className="text-3xl font-black text-white italic tracking-tighter leading-none">{item.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Strategic Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-[3.5rem] shadow-2xl overflow-hidden group">
                    <div className="p-10 border-b border-zinc-800/50 bg-zinc-950/20 backdrop-blur-3xl flex items-center justify-between">
                        <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-4 italic leading-none">
                            <TrendingUp className="w-6 h-6 text-blue-500" />
                            Revenue Projection (7D)
                        </h3>
                        <div className="px-4 py-2 bg-blue-600/10 rounded-xl border border-blue-600/20">
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest italic animate-pulse">Synchronizing...</span>
                        </div>
                    </div>
                    <div className="p-10 h-[450px] w-full relative">
                        <Line data={salesData} options={chartOptions} />
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-[3.5rem] shadow-2xl flex flex-col group">
                    <div className="p-10 border-b border-zinc-800/50 bg-zinc-950/20 backdrop-blur-3xl">
                         <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-4 italic leading-none">
                            <Zap className="w-6 h-6 text-amber-500" />
                            Category Yield
                        </h3>
                    </div>
                    <div className="p-10 flex-1 space-y-10">
                        <div className="h-[250px] w-full relative flex items-center justify-center">
                            <Doughnut data={categoryData} options={{ ...chartOptions, cutout: '75%' }} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.2em] mb-1">Total</p>
                                <h4 className="text-3xl font-black text-white italic leading-none">{categoryValues.reduce((a, b) => a + b, 0)}</h4>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {categoryLabels.map((cat, i) => (
                                <div key={cat} className="flex justify-between items-center group/item p-4 hover:bg-zinc-800/30 rounded-2xl transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-3 h-3 rounded-full shadow-lg`} style={{ backgroundColor: categoryData.datasets[0].backgroundColor[i] }} />
                                        <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest italic group-hover/item:text-white transition-colors">{cat}</span>
                                    </div>
                                    <span className="text-sm font-black text-white italic">{stats.categoryDistribution[cat]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tactical Assets & Engagement */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pb-12">
                <div className="bg-zinc-900 border border-zinc-800 rounded-[3.5rem] shadow-2xl flex flex-col group">
                    <div className="p-10 border-b border-zinc-800/50 bg-zinc-950/20 backdrop-blur-3xl flex items-center justify-between">
                        <h3 className="text-xl font-black text-white uppercase tracking-widest italic leading-none">Top Alpha Assets</h3>
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">Ranked by Revenue</span>
                    </div>
                    <div className="p-10 space-y-6">
                        {stats.topProducts.length === 0 ? (
                            <div className="py-24 text-center opacity-30 grayscale flex flex-col items-center">
                                <ShoppingCart className="w-16 h-16 text-zinc-700 mb-6" />
                                <p className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.5em] italic">No Asset Tractions</p>
                            </div>
                        ) : (
                            stats.topProducts.map((p, i) => (
                                <div key={i} className="flex items-center gap-8 p-6 bg-zinc-950/50 rounded-[2.5rem] border border-zinc-800 hover:border-blue-500/30 transition-all shadow-inner relative overflow-hidden group/asset">
                                    <div className="absolute inset-0 bg-blue-600/[0.01] pointer-events-none" />
                                    <div className="w-16 h-16 rounded-[1.2rem] bg-zinc-900 flex items-center justify-center font-black text-blue-500 border border-zinc-700 shadow-2xl text-lg italic">
                                        #{i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <p className="text-lg font-black text-white truncate italic uppercase tracking-tighter group-active:text-blue-400 transition-colors">{p.name}</p>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">VOLUME:</span>
                                            <span className="text-[10px] font-black text-zinc-400 font-mono tracking-widest italic">{p.sales} UNITS</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-white italic tracking-tighter">{currencySymbol}{p.revenue.toLocaleString()}</p>
                                        <p className="text-[9px] font-black text-emerald-500 tracking-widest uppercase mt-1 italic">Settled</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-[3.5rem] shadow-2xl flex flex-col group">
                    <div className="p-10 border-b border-zinc-800/50 bg-zinc-950/20 backdrop-blur-3xl flex items-center justify-between">
                         <h3 className="text-xl font-black text-white uppercase tracking-widest italic leading-none">Core Engagement</h3>
                         <div className="flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-zinc-600" />
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">Live Stream</span>
                         </div>
                    </div>
                    <div className="p-10 space-y-10">
                        <div className="p-10 bg-blue-600/5 rounded-[3rem] border border-blue-600/10 shadow-inner group/views relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/[0.03] blur-[40px] rounded-full" />
                            <div className="flex justify-between items-center mb-6 relative">
                                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600 italic">Platform Visibility</p>
                                <span className="text-[10px] font-black text-blue-400 italic font-mono uppercase">Node_ID: VIEW_01</span>
                            </div>
                            <h4 className="text-4xl font-black text-white mb-8 italic tracking-tighter relative">{stats.totalVisitors.toLocaleString()} <span className="text-lg text-zinc-600 not-italic uppercase tracking-widest ml-2 italic">Impressions</span></h4>
                            <div className="h-4 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 p-1 shadow-inner relative">
                                <div className="h-full bg-blue-600 rounded-full w-[65%] shadow-[0_0_20px_rgba(59,130,246,0.5)] animate-shimmer relative overflow-hidden">
                                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="p-8 bg-emerald-600/5 rounded-[2.5rem] border border-emerald-600/10 shadow-inner group/orders relative overflow-hidden">
                                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-2 italic leading-none">Authorizations</p>
                                <h4 className="text-3xl font-black text-white italic tracking-tighter leading-none">{categoryValues.reduce((a, b) => a + b, 0)}</h4>
                                <div className="absolute -bottom-6 -right-6 opacity-5 rotate-12 group-hover/orders:scale-110 transition-transform">
                                    <ShoppingCart className="w-24 h-24" />
                                </div>
                            </div>
                            <div className="p-8 bg-amber-600/5 rounded-[2.5rem] border border-amber-600/10 shadow-inner group/bounce relative overflow-hidden">
                                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-600 mb-2 italic leading-none">Bounce Matrix</p>
                                <h4 className="text-3xl font-black text-white italic tracking-tighter leading-none">{stats.bounceRate}%</h4>
                                <div className="absolute -bottom-6 -right-6 opacity-5 -rotate-12 group-hover/bounce:scale-110 transition-transform">
                                    <Globe className="w-24 h-24" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

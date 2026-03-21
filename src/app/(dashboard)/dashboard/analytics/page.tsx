"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, doc, getDoc, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    TrendingUp,
    Target,
    Zap,
    Users,
    ShoppingCart,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    Activity,
    ShieldCheck,
    ArrowRight,
    Eye,
    MousePointer2,
    BarChart3,
    DollarSign,
    Package
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
import { Line, Doughnut, Bar } from 'react-chartjs-2';
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
    const [timeframe, setTimeframe] = useState("7D");

    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        totalImpressions: 0,
        conversionRate: 0,
        avgOrderValue: 0,
        engagementRate: 0,
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

                    // Fetch All Orders
                    const ordersQuery = query(
                        collection(db, "orders"),
                        where("resellerId", "==", firebaseUser.uid),
                        orderBy("createdAt", "desc")
                    );
                    const ordersSnap = await getDocs(ordersQuery);
                    const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

                    const totalRev = orders.reduce((acc, curr) => acc + (curr.resellPrice || 0), 0);
                    const totalVisits = uData?.stats?.views || 0;
                    const impressions = Math.floor(totalVisits * 4.2) + 120;
                    const convRate = totalVisits > 0 ? (orders.length / totalVisits) * 100 : 0;
                    const avgVal = orders.length > 0 ? totalRev / orders.length : 0;
                    const engagements = Math.floor(totalVisits * 0.15) + orders.length;
                    const engRate = impressions > 0 ? (engagements / impressions) * 100 : 0;

                    // Trends
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
                        const name = order.productName || "Product";
                        if (!productMap[name]) productMap[name] = { sales: 0, revenue: 0 };
                        productMap[name].sales += order.quantity || 1;
                        productMap[name].revenue += order.resellPrice || 0;
                    });

                    const topProds = Object.entries(productMap)
                        .map(([name, data]) => ({ name, ...data }))
                        .sort((a, b) => b.revenue - a.revenue)
                        .slice(0, 5);

                    // Categories
                    const catMap: Record<string, number> = {};
                    orders.forEach(order => {
                        const cat = order.category || "General";
                        catMap[cat] = (catMap[cat] || 0) + 1;
                    });

                    setStats({
                        totalRevenue: totalRev,
                        totalOrders: orders.length,
                        totalImpressions: impressions,
                        conversionRate: convRate,
                        avgOrderValue: avgVal,
                        engagementRate: engRate,
                        salesTrends: trends,
                        topProducts: topProds,
                        categoryDistribution: catMap,
                        recentOrders: orders.slice(0, 5)
                    });
                } catch (e) {
                    console.error("Analytics Error:", e);
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
                backgroundColor: '#0a0a0b',
                titleColor: '#fff',
                bodyColor: '#71717a',
                borderColor: 'rgba(255,255,255,0.05)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 12,
                titleFont: { weight: '700', size: 13 },
                bodyFont: { size: 12 },
                displayColors: false
            }
        },
        scales: {
            y: { 
                grid: { color: 'rgba(255,255,255,0.02)', drawTicks: false }, 
                border: { display: false }, 
                ticks: { 
                    color: '#3f3f46', 
                    font: { size: 10, weight: '600' },
                    callback: (value: any) => `${currencySymbol}${value}`
                } 
            },
            x: { 
                grid: { display: false }, 
                border: { display: false }, 
                ticks: { color: '#3f3f46', font: { size: 10, weight: '600' } } 
            }
        }
    };

    const salesData = {
        labels: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
        datasets: [{
            data: stats.salesTrends,
            borderColor: '#3b82f6',
            backgroundColor: (context: any) => {
                const chart = context.chart;
                const {ctx, chartArea} = chart;
                if (!chartArea) return null;
                const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                gradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
                gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
                return gradient;
            },
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#3b82f6',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2
        }]
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 animate-in fade-in duration-700 pb-20">
            {/* Professional Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4 md:px-0">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-500">Merchant Analytics</p>
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">Business Intelligence</h1>
                    <p className="text-zinc-500 text-sm font-medium">Real-time performance metrics and market insights.</p>
                </div>
                <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-2xl border border-white/5 shadow-xl">
                    {['7D', '30D', 'ALL'].map(t => (
                        <button
                            key={t}
                            onClick={() => setTimeframe(t)}
                            className={cn(
                                "px-6 py-2 rounded-xl text-[10px] font-bold transition-all",
                                timeframe === t ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white"
                            )}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Core KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-4 md:px-0">
                {[
                    { label: "Revenue", value: `${currencySymbol}${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "blue" },
                    { label: "Orders", value: stats.totalOrders.toLocaleString(), icon: Package, color: "emerald" },
                    { label: "Impressions", value: stats.totalImpressions.toLocaleString(), icon: Eye, color: "blue" },
                    { label: "Conversion", value: `${stats.conversionRate.toFixed(1)}%`, icon: Target, color: "indigo" },
                ].map((item, i) => (
                    <div key={i} className="bg-[#0A0A0B] border border-white/5 p-6 rounded-[2rem] hover:border-white/10 transition-all group relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                        <div className="flex justify-between items-center relative z-10 mb-6">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xl transition-all group-hover:scale-110", 
                                item.color === 'blue' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 
                                item.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 
                                'bg-indigo-500/10 border-indigo-500/20 text-indigo-500'
                            )}>
                                <item.icon className="w-6 h-6" />
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                                <span className="text-[10px] font-bold text-emerald-500">+12%</span>
                            </div>
                        </div>
                        <div className="relative z-10 space-y-1">
                            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">{item.label}</p>
                            <h3 className="text-3xl font-black text-white tracking-tight">{item.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Primary Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 px-4 md:px-0">
                <div className="lg:col-span-2 bg-[#0A0A0B] border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-xl font-bold text-white tracking-tight">Revenue Stream</h3>
                            <p className="text-zinc-500 text-sm">Weekly transactional growth trajectory.</p>
                        </div>
                    </div>
                    <div className="h-[350px] md:h-[400px]">
                        <Line data={salesData} options={chartOptions} />
                    </div>
                </div>

                <div className="bg-[#0A0A0B] border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-tight mb-8 text-center uppercase tracking-widest text-[12px]">Category Yield</h3>
                        <div className="h-[240px] relative flex items-center justify-center group">
                            <Doughnut data={{
                                labels: Object.keys(stats.categoryDistribution),
                                datasets: [{
                                    data: Object.values(stats.categoryDistribution),
                                    backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'],
                                    borderWidth: 0,
                                    hoverOffset: 12
                                }]
                            }} options={{ ...chartOptions, cutout: '82%' }} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none group-hover:scale-110 transition-transform duration-500">
                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Aggregate</p>
                                <h4 className="text-4xl font-black text-white leading-none mt-1">{stats.totalOrders}</h4>
                            </div>
                        </div>
                    </div>
                    <div className="mt-10 space-y-3">
                        {Object.entries(stats.categoryDistribution).map(([cat, val], i) => (
                            <div key={cat} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 group hover:border-white/10 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][i] }} />
                                    <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">{cat}</span>
                                </div>
                                <span className="text-sm font-black text-white">{val}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Products & Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 px-4 md:px-0">
                <div className="bg-[#0A0A0B] border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
                    <h3 className="text-xl font-bold text-white tracking-tight mb-8">Asset Performance</h3>
                    <div className="space-y-4">
                        {stats.topProducts.map((p, i) => (
                            <div key={i} className="flex items-center justify-between p-5 bg-white/5 rounded-[1.8rem] border border-white/5 hover:border-white/10 transition-all group">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center font-black text-blue-500 border border-white/5 text-lg group-hover:scale-110 transition-transform">
                                        #{i + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-base font-bold text-white truncate">{p.name}</p>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{p.sales} Sales</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-white tracking-tight">{currencySymbol}{p.revenue.toLocaleString()}</p>
                                    <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Active</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-[#0A0A0B] border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-bold text-white tracking-tight">Recent Orders</h3>
                        <Link href="/dashboard/history?active=orders" className="text-[10px] font-bold text-blue-500 hover:text-blue-400 flex items-center gap-2 uppercase tracking-widest transition-colors">
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {stats.recentOrders.map((o) => (
                            <div key={o.id} className="flex items-center justify-between p-5 bg-white/5 rounded-[1.8rem] border border-white/5 hover:border-white/10 transition-all group">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-white/5 flex items-center justify-center text-zinc-500 group-hover:text-blue-500 transition-colors">
                                        <ShoppingCart className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-bold text-white uppercase tracking-tight truncate">ORD-{o.id.slice(-6).toUpperCase()}</p>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase truncate max-w-[140px]">{o.productName}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-base font-black text-white">{currencySymbol}{o.resellPrice?.toLocaleString()}</p>
                                    <div className={cn("inline-block px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest mt-1 border", 
                                        o.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10' :
                                        o.status === 'cancelled' ? 'bg-rose-500/10 text-rose-500 border-rose-500/10' :
                                        'bg-blue-500/10 text-blue-500 border-blue-500/10'
                                    )}>
                                        {o.status}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

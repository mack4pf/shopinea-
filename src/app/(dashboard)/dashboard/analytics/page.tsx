"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, doc, getDoc, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    TrendingUp, Target, Zap, Users, ShoppingCart, Loader2,
    Eye, DollarSign, Package, ArrowRight
} from "lucide-react";
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement,
    Title, Tooltip, Legend, PointElement, LineElement, ArcElement, Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import Link from "next/link";
import { cn } from "@/lib/utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, ArcElement, Filler);

export default function AnalyticsPage() {
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState("7D");

    const [stats, setStats] = useState({
        totalRevenue: 0, totalOrders: 0, totalImpressions: 0,
        conversionRate: 0, avgOrderValue: 0,
        salesTrends: [0, 0, 0, 0, 0, 0, 0],
        topProducts: [] as any[],
        categoryDistribution: {} as Record<string, number>,
        recentOrders: [] as any[]
    });

    const getCurrencySymbol = (code: string = "USD") => {
        switch (code) { case "EUR": return "€"; case "GBP": return "£"; default: return "$"; }
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
                        where("resellerId", "==", firebaseUser.uid),
                        orderBy("createdAt", "desc")
                    );
                    const ordersSnap = await getDocs(ordersQuery);
                    const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

                    const totalRev = orders.reduce((acc, curr) => acc + (curr.resellPrice || 0), 0);
                    const impressions = uData?.impressions || uData?.stats?.views || 0;
                    const convRate = impressions > 0 ? (orders.length / impressions) * 100 : 0;
                    const avgVal = orders.length > 0 ? totalRev / orders.length : 0;

                    const trends = [0, 0, 0, 0, 0, 0, 0];
                    const now = new Date();
                    orders.forEach(order => {
                        const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
                        const diffDays = Math.floor(Math.abs(now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
                        if (diffDays < 7) trends[6 - diffDays] += order.resellPrice || 0;
                    });

                    const productMap: Record<string, { sales: number, revenue: number }> = {};
                    orders.forEach(order => {
                        const name = order.productName || "Product";
                        if (!productMap[name]) productMap[name] = { sales: 0, revenue: 0 };
                        productMap[name].sales += order.quantity || 1;
                        productMap[name].revenue += order.resellPrice || 0;
                    });
                    const topProds = Object.entries(productMap)
                        .map(([name, data]) => ({ name, ...data }))
                        .sort((a, b) => b.revenue - a.revenue).slice(0, 5);

                    const catMap: Record<string, number> = {};
                    orders.forEach(order => {
                        const cat = order.category || "General";
                        catMap[cat] = (catMap[cat] || 0) + 1;
                    });

                    setStats({
                        totalRevenue: totalRev, totalOrders: orders.length,
                        totalImpressions: impressions, conversionRate: convRate,
                        avgOrderValue: avgVal, salesTrends: trends,
                        topProducts: topProds, categoryDistribution: catMap,
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
                backgroundColor: '#18181b', titleColor: '#fff', bodyColor: '#a1a1aa',
                borderColor: 'rgba(255,255,255,0.06)', borderWidth: 1, padding: 12,
                cornerRadius: 8, titleFont: { weight: '600', size: 13 },
                bodyFont: { size: 12 }, displayColors: false
            }
        },
        scales: {
            y: {
                grid: { color: 'rgba(255,255,255,0.03)', drawTicks: false },
                border: { display: false },
                ticks: { color: '#52525b', font: { size: 11 }, callback: (v: any) => `${currencySymbol}${v}` }
            },
            x: {
                grid: { display: false }, border: { display: false },
                ticks: { color: '#52525b', font: { size: 11 } }
            }
        }
    };

    const salesData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            data: stats.salesTrends,
            borderColor: '#3b82f6',
            backgroundColor: (context: any) => {
                const chart = context.chart;
                const { ctx, chartArea } = chart;
                if (!chartArea) return null;
                const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                gradient.addColorStop(0, 'rgba(59,130,246,0.08)');
                gradient.addColorStop(1, 'rgba(59,130,246,0)');
                return gradient;
            },
            fill: true, tension: 0.4, borderWidth: 2,
            pointRadius: 0, pointHoverRadius: 5,
            pointHoverBackgroundColor: '#3b82f6',
            pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2
        }]
    };

    const doughnutColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

    if (loading) return (
        <div className="h-[60vh] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Analytics</h1>
                    <p className="text-sm text-zinc-500 mt-1">Track your store performance and sales data.</p>
                </div>
                <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] rounded-lg p-1">
                    {['7D', '30D', 'All'].map(t => (
                        <button key={t} onClick={() => setTimeframe(t)}
                            className={cn("px-4 py-1.5 rounded-md text-xs font-medium transition-colors",
                                timeframe === t ? "bg-white/[0.1] text-white" : "text-zinc-500 hover:text-zinc-300")}>
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Hero Revenue + KPIs */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Revenue Hero */}
                <div className="lg:col-span-2 relative rounded-2xl overflow-hidden p-6 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 shadow-xl shadow-blue-500/20">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-300 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <DollarSign className="w-4 h-4 text-blue-200" />
                            <span className="text-xs font-semibold text-blue-200 uppercase tracking-widest">Total Revenue</span>
                        </div>
                        <p className="text-4xl font-black text-white tracking-tight">
                            {currencySymbol}{stats.totalRevenue.toLocaleString()}
                        </p>
                        <p className="text-sm text-blue-200 mt-2">
                            Avg. {currencySymbol}{stats.avgOrderValue.toFixed(2)} per order
                        </p>
                        <div className="mt-6 flex items-center gap-4">
                            <div>
                                <p className="text-xs text-blue-300">Orders</p>
                                <p className="text-lg font-bold text-white">{stats.totalOrders}</p>
                            </div>
                            <div className="w-px h-8 bg-white/20" />
                            <div>
                                <p className="text-xs text-blue-300">Conversion</p>
                                <p className="text-lg font-bold text-white">{stats.conversionRate.toFixed(1)}%</p>
                            </div>
                            <div className="w-px h-8 bg-white/20" />
                            <div>
                                <p className="text-xs text-blue-300">Impressions</p>
                                <p className="text-lg font-bold text-white">{stats.totalImpressions.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Supporting KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-1 lg:col-span-2 gap-4">
                    {[
                        { label: "Total Orders", value: stats.totalOrders.toLocaleString(), icon: Package, iconColor: "text-blue-400", iconBg: "bg-blue-500/10", change: "+0%" },
                        { label: "Store Views", value: stats.totalImpressions.toLocaleString(), icon: Eye, iconColor: "text-violet-400", iconBg: "bg-violet-500/10", change: "+0%" },
                        { label: "Conversion Rate", value: `${stats.conversionRate.toFixed(1)}%`, icon: Target, iconColor: "text-amber-400", iconBg: "bg-amber-500/10", change: "" },
                        { label: "Avg. Order Value", value: `${currencySymbol}${stats.avgOrderValue.toFixed(0)}`, icon: TrendingUp, iconColor: "text-emerald-400", iconBg: "bg-emerald-500/10", change: "" },
                    ].map((item, i) => (
                        <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.05] transition-colors flex items-center gap-4">
                            <div className={`w-10 h-10 ${item.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                                <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-zinc-500 truncate">{item.label}</p>
                                <p className="text-xl font-bold text-white">{item.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue line chart */}
                <div className="lg:col-span-2 bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-base font-semibold text-white">Revenue Trend</h3>
                            <p className="text-xs text-zinc-500 mt-0.5">Daily revenue over the last 7 days.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-xs text-zinc-500">Sales</span>
                        </div>
                    </div>
                    <div className="h-[280px]">
                        <Line data={salesData} options={chartOptions} />
                    </div>
                </div>

                {/* Category split */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 flex flex-col">
                    <h3 className="text-base font-semibold text-white mb-1">By Category</h3>
                    <p className="text-xs text-zinc-500 mb-5">Order distribution breakdown.</p>
                    <div className="h-[180px] relative flex items-center justify-center">
                        {Object.keys(stats.categoryDistribution).length > 0 ? (
                            <>
                                <Doughnut data={{
                                    labels: Object.keys(stats.categoryDistribution),
                                    datasets: [{
                                        data: Object.values(stats.categoryDistribution),
                                        backgroundColor: doughnutColors,
                                        borderWidth: 0, hoverOffset: 8
                                    }]
                                }} options={{ ...chartOptions, cutout: '72%' }} />
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Orders</p>
                                    <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center">
                                <ShoppingCart className="w-8 h-8 text-zinc-700 mb-2" />
                                <p className="text-xs text-zinc-500">No data yet</p>
                            </div>
                        )}
                    </div>
                    <div className="space-y-1.5 mt-4">
                        {Object.entries(stats.categoryDistribution).map(([cat, val], i) => (
                            <div key={cat} className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-white/[0.03] transition-colors">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: doughnutColors[i % doughnutColors.length] }} />
                                    <span className="text-xs font-medium text-zinc-300">{cat}</span>
                                </div>
                                <span className="text-xs font-semibold text-white tabular-nums">{val}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <Package className="w-4 h-4 text-zinc-400" />
                        <h3 className="text-base font-semibold text-white">Top Products</h3>
                    </div>
                    {stats.topProducts.length === 0 ? (
                        <div className="py-10 text-center">
                            <Package className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                            <p className="text-xs text-zinc-500">No sales data yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {stats.topProducts.map((p, i) => {
                                const maxRevenue = stats.topProducts[0]?.revenue || 1;
                                const pct = Math.round((p.revenue / maxRevenue) * 100);
                                return (
                                    <div key={i} className="group p-3 rounded-xl hover:bg-white/[0.04] transition-colors">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="text-xs font-bold text-zinc-600 w-4 shrink-0">#{i + 1}</span>
                                                <p className="text-sm font-medium text-zinc-200 truncate">{p.name}</p>
                                            </div>
                                            <div className="text-right shrink-0 ml-2">
                                                <p className="text-sm font-semibold text-white">{currencySymbol}{p.revenue.toLocaleString()}</p>
                                                <p className="text-[10px] text-zinc-600">{p.sales} sold</p>
                                            </div>
                                        </div>
                                        <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Recent Orders */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
                    <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4 text-zinc-400" />
                            <h3 className="text-base font-semibold text-white">Recent Orders</h3>
                        </div>
                        <Link href="/dashboard/history?active=orders" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                            View all <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    {stats.recentOrders.length === 0 ? (
                        <div className="py-10 text-center">
                            <ShoppingCart className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                            <p className="text-xs text-zinc-500">No orders yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {stats.recentOrders.map((o) => (
                                <div key={o.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.04] transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                                            <ShoppingCart className="w-3.5 h-3.5 text-zinc-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-zinc-200">#{o.id.slice(-6).toUpperCase()}</p>
                                            <p className="text-xs text-zinc-500 truncate max-w-[160px]">{o.productName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-2">
                                        <p className="text-sm font-semibold text-white">{currencySymbol}{o.resellPrice?.toLocaleString()}</p>
                                        <span className={cn("text-[10px] font-medium capitalize",
                                            o.status === 'delivered' ? 'text-emerald-400' :
                                            o.status === 'cancelled' ? 'text-red-400' : 'text-blue-400'
                                        )}>
                                            {o.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

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

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Revenue", value: `${currencySymbol}${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, iconColor: "text-emerald-500", iconBg: "bg-emerald-500/10" },
                    { label: "Orders", value: stats.totalOrders.toLocaleString(), icon: Package, iconColor: "text-blue-500", iconBg: "bg-blue-500/10" },
                    { label: "Impressions", value: stats.totalImpressions.toLocaleString(), icon: Eye, iconColor: "text-violet-500", iconBg: "bg-violet-500/10" },
                    { label: "Conversion", value: `${stats.conversionRate.toFixed(1)}%`, icon: Target, iconColor: "text-amber-500", iconBg: "bg-amber-500/10" },
                ].map((item, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.05] transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-medium text-zinc-500">{item.label}</span>
                            <div className={`w-8 h-8 ${item.iconBg} rounded-lg flex items-center justify-center`}>
                                <item.icon className={`w-4 h-4 ${item.iconColor}`} />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-white">{item.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue line chart */}
                <div className="lg:col-span-2 bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-base font-semibold text-white">Revenue</h3>
                            <p className="text-xs text-zinc-500 mt-0.5">Last 7 days sales trend.</p>
                        </div>
                    </div>
                    <div className="h-[300px]">
                        <Line data={salesData} options={chartOptions} />
                    </div>
                </div>

                {/* Category split */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 flex flex-col">
                    <h3 className="text-base font-semibold text-white mb-6">Sales by Category</h3>
                    <div className="h-[200px] relative flex items-center justify-center flex-1">
                        {Object.keys(stats.categoryDistribution).length > 0 ? (
                            <>
                                <Doughnut data={{
                                    labels: Object.keys(stats.categoryDistribution),
                                    datasets: [{
                                        data: Object.values(stats.categoryDistribution),
                                        backgroundColor: doughnutColors,
                                        borderWidth: 0, hoverOffset: 8
                                    }]
                                }} options={{ ...chartOptions, cutout: '75%' }} />
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <p className="text-xs text-zinc-500">Total</p>
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
                    <div className="space-y-2 mt-4">
                        {Object.entries(stats.categoryDistribution).map(([cat, val], i) => (
                            <div key={cat} className="flex justify-between items-center py-2 px-3 bg-white/[0.03] rounded-lg">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: doughnutColors[i % doughnutColors.length] }} />
                                    <span className="text-xs font-medium text-zinc-400">{cat}</span>
                                </div>
                                <span className="text-xs font-semibold text-white">{val}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
                    <h3 className="text-base font-semibold text-white mb-5">Top Products</h3>
                    {stats.topProducts.length === 0 ? (
                        <div className="py-10 text-center">
                            <Package className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                            <p className="text-xs text-zinc-500">No sales data yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {stats.topProducts.map((p, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg hover:bg-white/[0.05] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-xs font-semibold text-blue-400">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-zinc-200 truncate max-w-[200px]">{p.name}</p>
                                            <p className="text-xs text-zinc-600">{p.sales} sale{p.sales !== 1 ? 's' : ''}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-semibold text-white">{currencySymbol}{p.revenue.toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Orders */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-base font-semibold text-white">Recent Orders</h3>
                        <Link href="/dashboard/history?active=orders" className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1 transition-colors">
                            View all <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    {stats.recentOrders.length === 0 ? (
                        <div className="py-10 text-center">
                            <ShoppingCart className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                            <p className="text-xs text-zinc-500">No orders yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {stats.recentOrders.map((o) => (
                                <div key={o.id} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg hover:bg-white/[0.05] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
                                            <ShoppingCart className="w-3.5 h-3.5 text-zinc-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-zinc-200">#{o.id.slice(-6).toUpperCase()}</p>
                                            <p className="text-xs text-zinc-600 truncate max-w-[140px]">{o.productName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-white">{currencySymbol}{o.resellPrice?.toLocaleString()}</p>
                                        <span className={cn("text-[10px] font-medium",
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

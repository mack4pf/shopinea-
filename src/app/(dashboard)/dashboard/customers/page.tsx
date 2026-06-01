"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Users, Search, Mail, MapPin, BadgeCheck, TrendingUp, Loader2, Calendar, Globe } from "lucide-react";

export default function CustomersPage() {
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                try {
                    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                    if (userDoc.exists()) setUserData(userDoc.data());

                    const ordersQuery = query(collection(db, "orders"), where("resellerId", "==", firebaseUser.uid));
                    const ordersSnap = await getDocs(ordersQuery);
                    const orders = ordersSnap.docs.map(doc => doc.data());

                    const customerMap: Record<string, any> = {};
                    orders.forEach(o => {
                        // Key by name (trimmed lower) — each unique buyer name is its own customer
                        const key = (o.customerId || o.customerEmail || `${o.customerName || 'Guest'}-${o.customerCity || ''}-${o.customerCountry || ''}`)
                            .toString()
                            .trim()
                            .toLowerCase();
                        const orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : (o.createdAt ? new Date(o.createdAt) : null);

                        if (!customerMap[key]) {
                            customerMap[key] = {
                                name: o.customerName || 'Guest',
                                email: o.customerEmail || null,
                                city: o.customerCity || null,
                                country: o.customerCountry || null,
                                totalSpent: 0, orderCount: 0, lastOrder: o.createdAt,
                                isVerified: o.status === 'delivered' || o.status === 'shipped'
                            };
                        }
                        customerMap[key].totalSpent += Number(o.resellPrice || 0);
                        customerMap[key].orderCount += 1;
                        if (o.status === 'delivered' || o.status === 'shipped') customerMap[key].isVerified = true;
                        if (!customerMap[key].city && o.customerCity) customerMap[key].city = o.customerCity;
                        if (!customerMap[key].country && o.customerCountry) customerMap[key].country = o.customerCountry;

                        const currentLastOrderDate = customerMap[key].lastOrder?.toDate ? customerMap[key].lastOrder.toDate() : (customerMap[key].lastOrder ? new Date(customerMap[key].lastOrder) : null);
                        if (orderDate && (!currentLastOrderDate || orderDate > currentLastOrderDate)) {
                            customerMap[key].lastOrder = o.createdAt;
                        }
                    });
                    setCustomers(Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent));
                } catch (err) { console.error("Error fetching customers:", err); }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const getCurrencySymbol = (code: string = "USD") => {
        switch (code) { case "EUR": return "€"; case "GBP": return "£"; default: return "$"; }
    };
    const currencySymbol = getCurrencySymbol(userData?.currency);

    const activeThisWeekCount = customers.filter(c => {
        if (!c.lastOrder) return false;
        const lastOrderDate = c.lastOrder?.toDate ? c.lastOrder.toDate() : new Date(c.lastOrder);
        const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return lastOrderDate > sevenDaysAgo;
    }).length;

    const totalLTV = customers.reduce((acc, curr) => acc + curr.totalSpent, 0);
    const avgLTV = customers.length > 0 ? totalLTV / customers.length : 0;
    const repeatCustomers = customers.filter(c => c.orderCount > 1).length;

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.country || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.email || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <div className="h-[80vh] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
    );

    const statCards = [
        { label: "Total Customers", value: customers.length, icon: Users, iconColor: "text-blue-500", iconBg: "bg-blue-500/10" },
        { label: "Repeat Buyers", value: repeatCustomers, icon: BadgeCheck, iconColor: "text-emerald-500", iconBg: "bg-emerald-500/10" },
        { label: "Avg. Spend", value: `${currencySymbol}${avgLTV.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: TrendingUp, iconColor: "text-violet-500", iconBg: "bg-violet-500/10" },
        { label: "Active (7d)", value: activeThisWeekCount, icon: Calendar, iconColor: "text-amber-500", iconBg: "bg-amber-500/10" },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Customers</h1>
                    <p className="text-sm text-zinc-500 mt-1">Track your buyers and their purchase history.</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-zinc-500">Total Lifetime Value</p>
                    <p className="text-xl font-bold text-white">{currencySymbol}{totalLTV.toLocaleString()}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, i) => (
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

            {/* Table */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
                <div className="p-5 border-b border-white/[0.06] flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                        <input
                            placeholder="Search customers..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/40 transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/[0.04] text-xs font-medium text-zinc-500">
                                <th className="py-3 px-5">Customer</th>
                                <th className="py-3 px-4">Location</th>
                                <th className="py-3 px-4">Orders</th>
                                <th className="py-3 px-4">Total Spent</th>
                                <th className="py-3 px-5 text-right">Last Order</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center">
                                        <Users className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                                        <p className="text-sm text-zinc-500">No customers found.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((c, i) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="py-4 px-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center text-sm font-semibold text-blue-400">
                                                    {c.name[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{c.name}</p>
                                                    {c.isVerified && (
                                                        <span className="text-[10px] text-emerald-400 font-medium">Verified buyer</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            {(c.city || c.country) ? (
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="w-3 h-3 text-zinc-600 shrink-0" />
                                                    <div>
                                                        {c.city && <p className="text-xs text-zinc-300">{c.city}</p>}
                                                        {c.country && <p className="text-[10px] text-zinc-500">{c.country}</p>}
                                                    </div>
                                                </div>
                                            ) : c.email ? (
                                                <div className="flex items-center gap-1.5">
                                                    <Mail className="w-3 h-3 text-zinc-600" />
                                                    <span className="text-xs text-zinc-400">{c.email}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-zinc-700">—</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-sm font-medium text-white">{c.orderCount}</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <p className="text-sm font-semibold text-white">{currencySymbol}{c.totalSpent.toLocaleString()}</p>
                                            {c.totalSpent > (avgLTV * 1.5) && (
                                                <span className="text-[10px] text-blue-400 font-medium">High value</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-5 text-right">
                                            <p className="text-sm text-zinc-300">
                                                {c.lastOrder?.toDate ? c.lastOrder.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : (c.lastOrder ? new Date(c.lastOrder).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A')}
                                            </p>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

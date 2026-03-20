"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    Users,
    Search,
    Filter,
    Mail,
    Phone,
    BadgeCheck,
    TrendingUp,
    Loader2,
    Calendar,
    ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
                    // Fetch user data for currency
                    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                    if (userDoc.exists()) {
                        setUserData(userDoc.data());
                    }

                    const ordersQuery = query(
                        collection(db, "orders"),
                        where("resellerId", "==", firebaseUser.uid)
                    );
                    const ordersSnap = await getDocs(ordersQuery);
                    const orders = ordersSnap.docs.map(doc => doc.data());

                    // Aggregate unique customers
                    const customerMap: Record<string, any> = {};
                    orders.forEach(o => {
                        const email = o.customerEmail?.toLowerCase() || 'guest';
                        const orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : (o.createdAt ? new Date(o.createdAt) : null);

                        if (!customerMap[email]) {
                            customerMap[email] = {
                                name: o.customerName || 'Guest User',
                                email: email,
                                phone: o.customerPhone || 'N/A',
                                totalSpent: 0,
                                orderCount: 0,
                                lastOrder: o.createdAt,
                                isVerified: o.status === 'delivered' || o.status === 'shipped'
                            };
                        }
                        customerMap[email].totalSpent += Number(o.resellPrice || 0);
                        customerMap[email].orderCount += 1;
                        if (o.status === 'delivered' || o.status === 'shipped') {
                            customerMap[email].isVerified = true;
                        }

                        const currentLastOrderDate = customerMap[email].lastOrder?.toDate ? customerMap[email].lastOrder.toDate() : (customerMap[email].lastOrder ? new Date(customerMap[email].lastOrder) : null);

                        if (orderDate && (!currentLastOrderDate || orderDate > currentLastOrderDate)) {
                            customerMap[email].lastOrder = o.createdAt;
                        }
                    });

                    setCustomers(Object.values(customerMap));
                } catch (err) {
                    console.error("Error fetching customers:", err);
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const getCurrencySymbol = (code: string = "USD") => {
        switch (code) {
            case "EUR": return "€";
            case "GBP": return "£";
            default: return "$";
        }
    };
    const currencySymbol = getCurrencySymbol(userData?.currency);

    const activeThisWeekCount = customers.filter(c => {
        if (!c.lastOrder) return false;
        const lastOrderDate = c.lastOrder?.toDate ? c.lastOrder.toDate() : (c.lastOrder ? new Date(c.lastOrder) : null);
        if (!lastOrderDate) return false;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return lastOrderDate > sevenDaysAgo;
    }).length;

    const totalLTV = customers.reduce((acc, curr) => acc + curr.totalSpent, 0);
    const avgLTV = customers.length > 0 ? totalLTV / customers.length : 0;

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="h-[80vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24 text-left">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                <div className="space-y-4 text-left">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400">Buyer Relationship Matrix</span>
                    </div>
                    <div className="text-left">
                        <h1 className="text-5xl font-black text-white tracking-tighter italic leading-none">Customer Nexus</h1>
                        <p className="text-zinc-500 font-extrabold text-sm uppercase tracking-widest leading-relaxed opacity-80 max-w-xl mt-4">
                            Manage your buyer base and track lifetime value (LTV) through encrypted nodes.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] flex items-center gap-6 shadow-2xl relative overflow-hidden group">
                         <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
                         <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                             <TrendingUp className="w-8 h-8 text-blue-500" />
                         </div>
                         <div>
                             <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest leading-none mb-2 italic">Global LTV</p>
                             <p className="text-2xl font-black text-white italic tracking-tighter uppercase">{currencySymbol}{totalLTV.toLocaleString()}</p>
                         </div>
                    </div>
                </div>
            </div>

            {/* Customer Intelligence Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                    { label: "Active Nodes", value: customers.length, icon: Users, color: "blue" },
                    { label: "Loyalty Tier", value: customers.filter(c => c.orderCount > 1).length, icon: BadgeCheck, color: "emerald" },
                    { label: "Avg Node LTV", value: `${currencySymbol}${avgLTV.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: "indigo" },
                    { label: "Sync Last 7D", value: activeThisWeekCount.toString(), icon: Calendar, color: "amber" },
                ].map((stat, i) => (
                    <div key={i} className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem] relative overflow-hidden group shadow-2xl hover:border-zinc-700 transition-all hover:-translate-y-2 duration-500">
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-${stat.color}-500/5 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-${stat.color}-500/10 transition-colors`} />
                        <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-500/10 border border-${stat.color}-500/20 flex items-center justify-center mb-6 shadow-2xl`}>
                            <stat.icon className={`w-7 h-7 text-${stat.color}-500`} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2 italic">{stat.label}</p>
                        <h3 className="text-3xl font-black text-white italic tracking-tighter">{stat.value}</h3>
                    </div>
                ))}
            </div>

            {/* Relationship Ledger */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-[3.5rem] overflow-hidden shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
                <div className="p-10 border-b border-zinc-800 flex flex-col md:flex-row gap-8 justify-between items-center bg-zinc-950/20 backdrop-blur-3xl relative z-10">
                    <div className="relative w-full md:w-[450px] group/search">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-hover/search:text-blue-500 transition-colors" />
                        <Input
                            placeholder="SEARCH BY NODE OR IDENTIFIER..."
                            className="pl-16 bg-zinc-950/50 border-zinc-800 rounded-[1.8rem] h-16 text-xs font-black uppercase tracking-widest focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all italic shadow-inner w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4">
                        <Button className="h-16 px-10 rounded-[1.5rem] bg-zinc-950 border border-zinc-800 font-black text-[10px] uppercase tracking-widest gap-3 italic hover:bg-zinc-900 hover:border-zinc-700 transition-all shadow-xl">
                            <Filter className="w-5 h-5 text-zinc-600" /> PROTOCOL FILTERS
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto relative z-10">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-zinc-950/50 border-b border-zinc-800">
                                <th className="py-8 px-10 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 italic">Merchant Identity</th>
                                <th className="py-8 px-10 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 italic">Auth Details</th>
                                <th className="py-8 px-10 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 italic">Nodes</th>
                                <th className="py-8 px-10 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 italic">Settlement LTV</th>
                                <th className="py-8 px-10 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 italic text-right">Synchronization</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-40 text-center relative overflow-hidden">
                                         <div className="absolute inset-0 bg-blue-500/[0.02] pointer-events-none" />
                                         <Users className="w-20 h-20 text-zinc-800 mx-auto mb-6 opacity-20" />
                                         <p className="text-zinc-600 font-black uppercase tracking-widest italic text-sm">No synchronized nodes found in this sector.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((c, i) => (
                                    <tr key={i} className="hover:bg-zinc-950/50 transition-all group/row cursor-default">
                                        <td className="py-10 px-10">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-950 border border-zinc-800 flex items-center justify-center font-black text-2xl text-blue-500 shadow-inner italic group-hover/row:scale-110 group-hover/row:border-blue-500/30 transition-all duration-500">
                                                    {c.name[0]}
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-lg font-black text-white italic tracking-tighter uppercase leading-none group-active:text-blue-500 transition-colors">{c.name}</p>
                                                    {c.isVerified ? (
                                                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 w-fit">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest italic">Auth_Verified</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-full border border-zinc-700 w-fit">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                                                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic">Guest_Node</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-10 px-10">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 text-zinc-400 group-hover/row:text-white transition-colors">
                                                    <Mail className="w-4 h-4 text-zinc-600" />
                                                    <span className="text-[12px] font-black uppercase tracking-widest italic">{c.email}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-zinc-600">
                                                    <Phone className="w-4 h-4" />
                                                    <span className="text-[10px] font-black tracking-widest italic">{c.phone}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-10 px-10">
                                            <div className="flex items-center gap-3 group/purch">
                                                <div className="w-10 h-10 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 font-black text-sm group-hover/purch:text-white group-hover/purch:border-blue-500/20 transition-all">
                                                    {c.orderCount}
                                                </div>
                                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">Transmissions</span>
                                            </div>
                                        </td>
                                        <td className="py-10 px-10">
                                            <p className="text-xl font-black text-white italic tracking-tighter leading-none">{currencySymbol}{c.totalSpent.toLocaleString()}</p>
                                            {c.totalSpent > (avgLTV * 1.5) && (
                                                <div className="flex items-center gap-1.5 text-[9px] font-black text-blue-500 mt-2 uppercase tracking-widest italic">
                                                    <ArrowUpRight className="w-3 h-3" /> Elite_Yield
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-10 px-10 text-right">
                                            <p className="text-sm font-black text-white italic tracking-tighter uppercase leading-none mb-2">
                                                {c.lastOrder?.toDate ? c.lastOrder.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : (c.lastOrder ? new Date(c.lastOrder).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A')}
                                            </p>
                                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic leading-none">
                                                {c.lastOrder?.toDate ? c.lastOrder.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (c.lastOrder ? new Date(c.lastOrder).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}
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


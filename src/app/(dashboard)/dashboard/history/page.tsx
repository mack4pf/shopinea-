"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    History, ArrowUpRight, ArrowDownLeft, Zap, Crown, Loader2,
    Search, Clock, CheckCircle2, XCircle, ShoppingCart, ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TransactionHistoryPage() {
    const [user, setUser] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"all" | "financial" | "orders">("all");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            if (u) {
                setUser(u);
                const qT = query(collection(db, "transactions"), where("userId", "==", u.uid), orderBy("createdAt", "desc"));
                const snapT = await getDocs(qT);
                const txs = snapT.docs.map(doc => ({ id: doc.id, ...doc.data(), displayType: 'financial' }));

                const qO = query(collection(db, "orders"), where("resellerId", "==", u.uid), orderBy("createdAt", "desc"));
                const snapO = await getDocs(qO);
                const orders = snapO.docs.map(doc => {
                    const d = doc.data();
                    return { id: doc.id, ...d, type: 'order', displayType: 'orders', amount: d.resellPrice || 0, description: `Order for ${d.productName || 'Product'}`, status: d.status || 'pending' };
                });

                const subQ = query(collection(db, "subscription_requests"), where("userId", "==", u.uid));
                const subSnap = await getDocs(subQ);
                const subs = subSnap.docs.map(doc => ({
                    id: doc.id, ...doc.data(), type: 'subscription_request', displayType: 'financial',
                    amount: doc.data().amount || 0, description: `Subscription: ${doc.data().planName || 'Plan'}`
                }));

                const combined = [...txs, ...orders, ...subs].sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setHistory(combined);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filtered = history.filter(t => {
        const matchesSearch = t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description?.toLowerCase().includes(searchQuery.toLowerCase());
        if (activeTab === "all") return matchesSearch;
        return matchesSearch && t.displayType === activeTab;
    });

    const getIcon = (type: string) => {
        switch (type) {
            case 'ad_deposit': return <Zap className="w-4 h-4 text-blue-500" />;
            case 'earning': return <ArrowDownLeft className="w-4 h-4 text-emerald-500" />;
            case 'withdrawal': return <ArrowUpRight className="w-4 h-4 text-rose-500" />;
            case 'deposit': return <ArrowDownRight className="w-4 h-4 text-emerald-400" />;
            case 'order': return <ShoppingCart className="w-4 h-4 text-zinc-400" />;
            case 'subscription_payment': return <Crown className="w-4 h-4 text-amber-500" />;
            case 'subscription_request': return <Clock className="w-4 h-4 text-zinc-400" />;
            default: return <History className="w-4 h-4 text-zinc-400" />;
        }
    };

    const getTypeBg = (type: string) => {
        if (type === 'earning' || type === 'deposit' || type === 'ad_deposit') return 'bg-emerald-500/10';
        if (type === 'withdrawal') return 'bg-red-500/10';
        if (type === 'order') return 'bg-zinc-500/10';
        return 'bg-blue-500/10';
    };

    const getStatusStyle = (status: string) => {
        if (status === 'completed' || status === 'delivered' || status === 'paid') return 'bg-emerald-500/10 text-emerald-400';
        if (status === 'rejected' || status === 'cancelled' || status === 'declined') return 'bg-red-500/10 text-red-400';
        return 'bg-amber-500/10 text-amber-400';
    };

    if (loading) return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">History</h1>
                    <p className="text-sm text-zinc-500 mt-1">Complete record of all transactions and orders.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-center px-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg">
                        <p className="text-xs text-zinc-500">Total Records</p>
                        <p className="text-lg font-semibold text-white">{history.length}</p>
                    </div>
                </div>
            </div>

            {/* Search + Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                        placeholder="Search transactions..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/40 transition-colors"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-lg p-1">
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'financial', label: 'Transactions' },
                        { id: 'orders', label: 'Orders' },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                            className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                                activeTab === tab.id ? "bg-white/[0.1] text-white" : "text-zinc-600 hover:text-zinc-300")}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/[0.06] text-xs font-medium text-zinc-500">
                                <th className="py-3 px-5">Description</th>
                                <th className="py-3 px-4">Type</th>
                                <th className="py-3 px-4">Amount</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-5 text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center">
                                        <History className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                                        <p className="text-sm text-zinc-500">No records found.</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((t) => (
                                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="py-4 px-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTypeBg(t.type)}`}>
                                                    {getIcon(t.type)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-zinc-200">#{t.id.slice(0, 8)}</p>
                                                    <p className="text-xs text-zinc-600 truncate max-w-[200px]">{t.description || t.type?.replace('_', ' ')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-xs text-zinc-400 capitalize">{t.type?.replace(/_/g, ' ')}</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <p className={cn("text-sm font-semibold",
                                                (t.type === 'earning' || t.type === 'deposit' || t.type === 'ad_deposit') ? 'text-emerald-400' : 'text-white'
                                            )}>
                                                {(t.type === 'earning' || t.type === 'deposit' || t.type === 'ad_deposit') ? '+' : ''}${t.amount?.toLocaleString()}
                                            </p>
                                            {t.bonus > 0 && <p className="text-[10px] text-emerald-400">+${t.bonus} bonus</p>}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium capitalize ${getStatusStyle(t.status)}`}>
                                                {t.status || 'pending'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-5 text-right">
                                            <p className="text-sm text-zinc-300">{t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString() : 'N/A'}</p>
                                            <p className="text-[10px] text-zinc-600">{t.createdAt?.toDate ? t.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
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

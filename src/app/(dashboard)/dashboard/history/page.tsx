"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { 
    History, 
    ArrowUpRight, 
    ArrowDownLeft, 
    Zap, 
    Crown, 
    Loader2, 
    Search,
    Filter,
    Clock,
    CheckCircle2,
    XCircle,
    Calendar,
    ShoppingCart,
    Package,
    ArrowDownRight,
    ArrowUpLeft,
    ShieldCheck
} from "lucide-react";
import { Input } from "@/components/ui/input";
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
                
                // 1. Fetch Transactions (Financial)
                const qT = query(
                    collection(db, "transactions"),
                    where("userId", "==", u.uid),
                    orderBy("createdAt", "desc")
                );
                const snapT = await getDocs(qT);
                const txs = snapT.docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data(), 
                    displayType: 'financial' 
                }));
                
                // 2. Fetch Orders
                const qO = query(
                    collection(db, "orders"),
                    where("resellerId", "==", u.uid),
                    orderBy("createdAt", "desc")
                );
                const snapO = await getDocs(qO);
                const orders = snapO.docs.map(doc => {
                    const d = doc.data();
                    return {
                        id: doc.id,
                        ...d,
                        type: 'order',
                        displayType: 'orders',
                        amount: d.resellPrice || 0,
                        description: `Order for ${d.productName || 'Asset'}`,
                        status: d.status || 'pending'
                    };
                });

                // 3. Fetch Subscription Requests
                const subQ = query(
                    collection(db, "subscription_requests"),
                    where("userId", "==", u.uid)
                );
                const subSnap = await getDocs(subQ);
                const subs = subSnap.docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data(), 
                    type: 'subscription_request',
                    displayType: 'financial',
                    amount: doc.data().amount || 0,
                    description: `Subscription: ${doc.data().planName || 'Plan'}`
                }));

                // Combine and Sort
                const combined = [...txs, ...orders, ...subs].sort((a: any, b: any) => {
                    const timeA = a.createdAt?.seconds || 0;
                    const timeB = b.createdAt?.seconds || 0;
                    return timeB - timeA;
                });

                setHistory(combined);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filtered = history.filter(t => {
        const matchesSearch = 
            t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description?.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (activeTab === "all") return matchesSearch;
        return matchesSearch && t.displayType === activeTab;
    });

    const getIcon = (type: string) => {
        switch(type) {
            case 'ad_deposit': return <Zap className="w-5 h-5 text-blue-500" />;
            case 'earning': return <ArrowDownLeft className="w-5 h-5 text-emerald-500" />;
            case 'withdrawal': return <ArrowUpRight className="w-5 h-5 text-rose-500" />;
            case 'deposit': return <ArrowDownRight className="w-5 h-5 text-emerald-400" />;
            case 'order': return <ShoppingCart className="w-5 h-5 text-zinc-400" />;
            case 'subscription_payment': return <Crown className="w-5 h-5 text-amber-500" />;
            case 'subscription_request': return <Clock className="w-5 h-5 text-zinc-400 animate-pulse" />;
            default: return <History className="w-5 h-5 text-zinc-400" />;
        }
    };

    if (loading) return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <History className="w-5 h-5 text-blue-500" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500 leading-none">Security Protocol System</span>
                    </div>
                    <h1 className="text-6xl font-black tracking-tighter italic uppercase text-white leading-none">Chronos Ledger</h1>
                    <p className="text-zinc-600 font-extrabold uppercase tracking-[0.3em] text-[10px] pl-1">Immutable Transaction Matrix • Order Settlement Log</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
                        <Input 
                            placeholder="SEARCH NODE_ID..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-14 bg-zinc-950 border-zinc-900 h-18 rounded-[2rem] font-black text-white shadow-xl italic uppercase tracking-widest text-[10px] focus:ring-4 focus:ring-blue-500/10 transition-all" 
                        />
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-4 p-2 bg-zinc-950/50 border border-zinc-900 rounded-[2rem] w-fit shadow-inner">
                {[
                    { id: 'all', label: 'Global Log' },
                    { id: 'financial', label: 'Liquidity Streams' },
                    { id: 'orders', label: 'Order Pipeline' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all italic",
                            activeTab === tab.id 
                                ? "bg-blue-600 text-white shadow-2xl shadow-blue-500/20 scale-105" 
                                : "text-zinc-600 hover:text-zinc-400"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Ledger Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-[3.5rem] overflow-hidden shadow-2xl relative">
                <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
                <div className="overflow-x-auto relative z-10">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-950/50 border-b border-zinc-800">
                            <tr className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
                                <th className="p-10">Node ID / Descriptor</th>
                                <th className="p-6">Flow Vector</th>
                                <th className="p-6">Capital Net</th>
                                <th className="p-6">Authorization</th>
                                <th className="p-10 text-right">Synchronization</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/30">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-32 text-center grayscale opacity-30">
                                        <Package className="w-16 h-16 mx-auto mb-6 text-zinc-700" />
                                        <p className="text-[11px] font-black uppercase text-zinc-600 tracking-[0.5em] italic">Null Entry in Matrix Segment</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((t) => (
                                    <tr key={t.id} className="hover:bg-zinc-800/10 transition-all group active:scale-[0.995]">
                                        <td className="p-10">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 rounded-[1.5rem] bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 group-hover:border-blue-500/30 transition-all">
                                                    {getIcon(t.type)}
                                                </div>
                                                <div>
                                                    <p className="text-base font-black italic text-white leading-none mb-1.5 uppercase tracking-tighter">#{t.id.slice(0, 8)}</p>
                                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">{t.description || t.type?.replace('_', ' ')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-950/50 px-3 py-1.5 rounded-lg border border-zinc-800 italic">
                                                {t.type?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <p className={cn(
                                                "text-2xl font-black italic tracking-tighter leading-none",
                                                t.type === 'earning' || t.type === 'ad_deposit' || t.type === 'deposit' ? 'text-emerald-500' : 'text-white'
                                            )}>
                                                {t.type === 'earning' || t.type === 'ad_deposit' || t.type === 'deposit' ? '+' : '-'}${t.amount?.toLocaleString()}
                                            </p>
                                            {t.bonus > 0 && <p className="text-[9px] font-black text-emerald-600 mt-1 uppercase italic">+${t.bonus} INCENTIVE</p>}
                                        </td>
                                        <td className="p-6">
                                            <div className={cn(
                                                "inline-flex items-center gap-3 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border italic shadow-lg",
                                                t.status === 'completed' || t.status === 'delivered' || t.status === 'paid'
                                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10' 
                                                    : t.status === 'rejected' || t.status === 'cancelled'
                                                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/10'
                                                    : 'bg-amber-500/10 text-amber-500 border-amber-500/10'
                                            )}>
                                                {t.status === 'completed' || t.status === 'delivered' || t.status === 'paid' ? <CheckCircle2 className="w-4 h-4 shadow-emerald-500" /> : t.status === 'rejected' ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4 animate-spin" />}
                                                {t.status?.toUpperCase() || 'SYNCHRONIZING'}
                                            </div>
                                        </td>
                                        <td className="p-10 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black text-white uppercase tracking-widest italic">{t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString() : 'REALTIME CORE'}</span>
                                                <span className="text-[9px] font-bold text-zinc-600 mt-1 uppercase tracking-widest">{t.createdAt?.toDate ? t.createdAt.toDate().toLocaleTimeString() : 'AWAITING TIMESTAMP'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Summary Card */}
            <div className="p-10 bg-zinc-950 border border-zinc-900 rounded-[3.5rem] flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-blue-600/[0.02] pointer-events-none" />
                <div className="flex items-center gap-8 relative">
                    <div className="w-20 h-20 bg-blue-600/10 rounded-[2rem] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                        <ShieldCheck className="w-10 h-10 text-blue-500" />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Chronos Ledger Finalized</h4>
                        <p className="text-zinc-600 font-black text-[10px] uppercase tracking-[0.2em] italic max-w-sm leading-relaxed">All operations are permanently anchored to the distributed nodal registry for audit transparency.</p>
                    </div>
                </div>
                <div className="flex gap-4 relative">
                    <div className="p-6 bg-zinc-900 rounded-[2rem] border border-zinc-800 text-center min-w-[140px]">
                        <p className="text-[9px] font-black text-zinc-600 uppercase mb-2 tracking-widest leading-none">Global Nodes</p>
                        <p className="text-3xl font-black text-white italic tracking-tighter">{history.length}</p>
                    </div>
                    <div className="p-6 bg-zinc-900 rounded-[2rem] border border-zinc-800 text-center min-w-[140px]">
                        <p className="text-[9px] font-black text-zinc-600 uppercase mb-2 tracking-widest leading-none">Active Flow</p>
                        <p className="text-3xl font-black text-blue-500 italic tracking-tighter">{filtered.length}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

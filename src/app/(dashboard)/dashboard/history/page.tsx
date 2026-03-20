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
    Calendar
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function TransactionHistoryPage() {
    const [user, setUser] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            if (u) {
                setUser(u);
                
                // Fetch Transactions
                const q = query(
                    collection(db, "transactions"),
                    where("userId", "==", u.uid),
                    orderBy("createdAt", "desc")
                );
                const snap = await getDocs(q);
                const txs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                // Also fetch subscription requests to show pending ones
                const subQ = query(
                    collection(db, "subscription_requests"),
                    where("userId", "==", u.uid),
                    where("status", "==", "pending")
                );
                const subSnap = await getDocs(subQ);
                const subs = subSnap.docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data(), 
                    type: 'subscription_request',
                    status: 'pending' 
                }));

                setTransactions([...subs, ...txs].sort((a: any, b: any) => 
                    (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
                ));
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filtered = transactions.filter(t => 
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getIcon = (type: string) => {
        switch(type) {
            case 'ad_deposit': return <Zap className="w-5 h-5 text-blue-500" />;
            case 'earning': return <ArrowDownLeft className="w-5 h-5 text-emerald-500" />;
            case 'withdraw': return <ArrowUpRight className="w-5 h-5 text-rose-500" />;
            case 'subscription_payment': return <Crown className="w-5 h-5 text-amber-500" />;
            case 'subscription_request': return <Clock className="w-5 h-5 text-zinc-400 animate-pulse" />;
            default: return <History className="w-5 h-5 text-zinc-400" />;
        }
    };

    if (loading) return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                        <History className="w-5 h-5 text-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 leading-none">Security Protocol</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tight italic uppercase text-white">Merchant Ledger</h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] pl-1">Immutable Transaction History • Escrow Verification</p>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input 
                        placeholder="Search ledger ID..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 bg-zinc-950 border-zinc-800 h-14 rounded-2xl font-bold text-white shadow-xl italic" 
                    />
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-950/50 border-b border-zinc-800">
                            <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                <th className="p-10">Reference</th>
                                <th className="p-6">Flow Type</th>
                                <th className="p-6">Capital Value</th>
                                <th className="p-6">Network Status</th>
                                <th className="p-10 text-right">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/30">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                        <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest italic">No transaction records found in decentralized ledger</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((t) => (
                                    <tr key={t.id} className="hover:bg-zinc-800/20 transition-all group">
                                        <td className="p-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                    {getIcon(t.type)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black italic text-white leading-none mb-1 uppercase tracking-tight">#{t.id.slice(0, 10)}</p>
                                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t.description || t.type.replace('_', ' ')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">{t.type}</td>
                                        <td className="p-6">
                                            <p className={cn(
                                                "text-lg font-black italic tracking-tighter",
                                                t.type === 'earning' || t.type === 'ad_deposit' ? 'text-emerald-500' : 'text-white'
                                            )}>
                                                {t.type === 'earning' || t.type === 'ad_deposit' ? '+' : '-'}${t.amount?.toLocaleString()}
                                            </p>
                                        </td>
                                        <td className="p-6">
                                            <div className={cn(
                                                "inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border",
                                                t.status === 'completed' 
                                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10' 
                                                    : t.status === 'rejected'
                                                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/10'
                                                    : 'bg-amber-500/10 text-amber-500 border-amber-500/10'
                                            )}>
                                                {t.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : t.status === 'rejected' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3 animate-spin" />}
                                                {t.status?.toUpperCase() || 'PROPAGATING'}
                                            </div>
                                        </td>
                                        <td className="p-10 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString() : 'REALTIME'}</span>
                                                <span className="text-[9px] font-bold text-zinc-600 mt-0.5">{t.createdAt?.toDate ? t.createdAt.toDate().toLocaleTimeString() : 'PENDING'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="p-10 bg-blue-600/5 border border-blue-600/10 rounded-[3rem] flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none mb-1">Audit Log Finalized</h4>
                        <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest">Transactions are recorded on the secure central ledger</p>
                    </div>
                </div>
                <div className="hidden md:block">
                    <History className="w-12 h-12 text-zinc-800" />
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc, collection, query, where, orderBy, getDocs, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    History,
    CreditCard,
    Info,
    Plus,
    Loader2,
    TrendingUp,
    Filter,
    Download,
    Zap,
    Gift,
    Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DepositModal from "@/components/modals/DepositModal";
import RefundModal from "@/components/modals/RefundModal";
import WithdrawalModal from "@/components/modals/WithdrawalModal";
import { AdDepositModal } from "@/components/modals/AdDepositModal";

export default function WalletPage() {
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [isAdModalOpen, setIsAdModalOpen] = useState(false);

    const refreshUserData = async (uid: string) => {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
            setUserData({ uid: userDoc.id, ...userDoc.data() });
        }
    };

    const fetchTransactions = async (uid: string) => {
        try {
            const transQuery = query(
                collection(db, "transactions"),
                where("userId", "==", uid),
                orderBy("createdAt", "desc"),
                limit(30)
            );
            const transSnap = await getDocs(transQuery);
            setTransactions(transSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (err) {
            console.error("Error fetching transactions:", err);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                await refreshUserData(firebaseUser.uid);
                await fetchTransactions(firebaseUser.uid);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const currencySymbol = "$"; 

    if (loading) {
        return (
            <div className="h-[80vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const stats = [
        { label: "Available Earning", value: `${currencySymbol}${(userData?.payoutBalance || 0).toLocaleString()}`, icon: Wallet, color: "emerald", desc: "Ready for withdrawal" },
        { label: "Locked Earning", value: `${currencySymbol}${(userData?.pendingPayout || 0).toLocaleString()}`, icon: Clock, color: "amber", desc: "Awaiting order delivery" },
        { label: "Buying Wallet", value: `${currencySymbol}${(userData?.walletBalance || 0).toLocaleString()}`, icon: CreditCard, color: "blue", desc: "For supplier inventory" },
        { label: "Ad Wallet", value: `${currencySymbol}${(userData?.adWalletBalance || 0).toLocaleString()}`, icon: Zap, color: "indigo", desc: "For marketing & growth" },
    ];

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <Wallet className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400">Vault Diagnostics</span>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter italic leading-none">Capital Nexus</h1>
                    <p className="text-zinc-500 font-extrabold text-sm uppercase tracking-widest leading-relaxed opacity-80 max-w-xl">
                        Monitor multi-currency liquidity streams and authorize internal node transfers.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    <Button
                        onClick={() => setIsRefundModalOpen(true)}
                        variant="outline"
                        className="h-16 px-10 rounded-[1.5rem] border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900 text-zinc-500 hover:text-white font-black text-[11px] tracking-widest uppercase transition-all shadow-xl italic"
                    >
                        RECALL FUNDS
                    </Button>
                    <Button
                        onClick={() => setIsAdModalOpen(true)}
                        className="h-16 px-10 rounded-[1.5rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-emerald-500/20 hover:scale-105 transition-all active:scale-95 italic border-b-4 border-emerald-800 active:border-b-0 gap-3"
                    >
                        <Zap className="w-6 h-6" />
                        REFUEL ADS
                    </Button>
                    <Button
                        onClick={() => setIsWithdrawModalOpen(true)}
                        className="h-16 px-10 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-blue-500/20 hover:scale-105 transition-all active:scale-95 italic border-b-4 border-blue-800 active:border-b-0 gap-3"
                    >
                        <Plus className="w-6 h-6" />
                        WITHDRAW
                    </Button>
                </div>
            </div>

            {/* Core Liquidity Nodes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3.5rem] relative overflow-hidden group hover:border-zinc-700 transition-all shadow-2xl">
                        <div className={`absolute top-0 right-0 w-40 h-40 bg-${stat.color}-500/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-${stat.color}-500/10 transition-colors`} />
                        <div className="relative z-10 space-y-6">
                            <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-500/10 flex items-center justify-center border border-${stat.color}-500/20 shadow-2xl shadow-${stat.color}-500/10`}>
                                <stat.icon className={`w-7 h-7 text-${stat.color}-500`} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2 leading-none">{stat.label}</p>
                                <h3 className="text-4xl font-black text-white tracking-tighter italic leading-none">{stat.value}</h3>
                                <p className="text-[10px] font-black text-zinc-700 mt-4 uppercase tracking-[0.2em] italic">{stat.desc}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Historical Ledger */}
                <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-[3.5rem] overflow-hidden shadow-2xl">
                    <div className="p-10 border-b border-zinc-800 bg-zinc-950/20 backdrop-blur-3xl flex items-center justify-between">
                        <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-4 italic leading-none">
                            <History className="w-6 h-6 text-zinc-500" />
                            Activity Ledger
                        </h3>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">{transactions.length} NODES LOGGED</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-zinc-950/30 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
                                <tr>
                                    <th className="py-8 px-10">Transmission Source</th>
                                    <th className="py-8 px-8">Net Volume</th>
                                    <th className="py-8 px-10 text-right">Settlement</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/30">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="py-32 text-center opacity-30 grayscale">
                                            <History className="w-16 h-16 mx-auto mb-6 text-zinc-700" />
                                            <p className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.5em] italic">No Protocol Activity</p>
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-zinc-800/20 transition-all group font-black uppercase">
                                            <td className="py-10 px-10">
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center shadow-2xl ${t.type === 'deposit' || t.type === 'earning' || t.type === 'ad_deposit'
                                                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                            : t.type === 'marketing' || t.type === 'purchase'
                                                                ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                                                : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                        }`}>
                                                        {t.type === 'ad_deposit' ? <Zap className="w-5 h-5" /> :
                                                         t.type === 'deposit' || t.type === 'earning' ? <ArrowDownRight className="w-5 h-5" /> :
                                                         <ArrowUpRight className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-black text-white italic tracking-tighter leading-none mb-1">
                                                            {t.type.replace(/_/g, ' ')}
                                                        </p>
                                                        <p className="text-[10px] font-black text-zinc-600 tracking-widest italic mt-2 uppercase">
                                                            {t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString() : 'N/A'} • {t.method || 'Protocol'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-10 px-8">
                                                <p className="text-2xl font-black text-white italic tracking-tighter leading-none">{currencySymbol}{t.amount?.toLocaleString()}</p>
                                                {t.bonus > 0 && <p className="text-[9px] font-black text-emerald-500 mt-2 tracking-widest animate-pulse">+${t.bonus} INCENTIVE</p>}
                                            </td>
                                            <td className="py-10 px-10 text-right">
                                                <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full border italic shadow-2xl ${t.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{t.status}</span>
                                                    {t.status === 'completed' ? <Shield className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Security Perimeter */}
                <div className="space-y-10">
                    <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3.5rem] space-y-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-blue-500/[0.02] pointer-events-none" />
                        <div className="flex items-center gap-4 relative">
                            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                <Shield className="w-6 h-6 text-blue-500" />
                            </div>
                            <h3 className="text-lg font-black text-white uppercase tracking-widest italic">Security Perimeter</h3>
                        </div>
                        <div className="space-y-6">
                            <div className="p-6 bg-zinc-950/50 rounded-[2rem] border border-zinc-800/50 shadow-inner group/escrow hover:border-blue-500/30 transition-all">
                                <p className="text-[10px] font-black uppercase text-zinc-600 mb-3 tracking-widest leading-none">Escrow Protocol</p>
                                <p className="text-[11px] font-black text-zinc-500 leading-relaxed uppercase tracking-widest italic opacity-80">
                                    Liquidity is held in multi-sig escrow during fulfillment to prevent unauthorized exits.
                                </p>
                            </div>
                            <div className="p-6 bg-emerald-500/5 rounded-[2rem] border border-emerald-500/10 shadow-inner group/bonus hover:border-emerald-500/30 transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <Gift className="w-5 h-5 text-emerald-500" />
                                    <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest leading-none">Yield Bonus</p>
                                </div>
                                <p className="text-[11px] font-black text-emerald-100/30 leading-relaxed uppercase tracking-widest italic">
                                    Strategic deposits exceed $100 initiate automated ad-wallet incentives.
                                </p>
                            </div>
                        </div>
                    </div>
                    <Button 
                        onClick={() => setIsDepositModalOpen(true)} 
                        className="w-full bg-white hover:bg-zinc-100 text-black h-20 rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-white/5 border-b-4 border-zinc-300 active:border-b-0 italic"
                    >
                        ACCESS LIQUIDITY TOP-UP
                    </Button>
                </div>
            </div>

            <WithdrawalModal
                isOpen={isWithdrawModalOpen}
                onClose={() => setIsWithdrawModalOpen(false)}
                userData={userData}
                currencySymbol={currencySymbol}
                onSuccess={() => {
                    if (user) refreshUserData(user.uid);
                }}
            />

            <DepositModal
                isOpen={isDepositModalOpen}
                onClose={() => setIsDepositModalOpen(false)}
                userId={user?.uid}
                currencySymbol={currencySymbol}
            />

            <AdDepositModal 
                isOpen={isAdModalOpen}
                onClose={() => setIsAdModalOpen(false)}
                userId={user?.uid}
            />

            <RefundModal
                isOpen={isRefundModalOpen}
                onClose={() => setIsRefundModalOpen(false)}
                userId={user?.uid}
                availableBalance={userData?.walletBalance || 0}
                currencySymbol={currencySymbol}
            />
        </div>
    );
}

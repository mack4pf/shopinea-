"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc, collection, query, where, orderBy, getDocs, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    Wallet, ArrowUpRight, ArrowDownRight, Clock, History,
    CreditCard, Plus, Loader2, Zap, Gift, Shield, XCircle
} from "lucide-react";
import DepositModal from "@/components/modals/DepositModal";
import RefundModal from "@/components/modals/RefundModal";
import WithdrawalModal from "@/components/modals/WithdrawalModal";
import AdDepositModal from "@/components/modals/AdDepositModal";

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
        if (userDoc.exists()) setUserData({ uid: userDoc.id, ...userDoc.data() });
    };

    const fetchTransactions = async (uid: string) => {
        try {
            const transQuery = query(collection(db, "transactions"), where("userId", "==", uid), orderBy("createdAt", "desc"), limit(30));
            const transSnap = await getDocs(transQuery);
            setTransactions(transSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (err) { console.error("Error fetching transactions:", err); }
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

    if (loading) return (
        <div className="h-[80vh] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
    );

    const walletCards = [
        { label: "Available Earnings", value: `${currencySymbol}${(userData?.payoutBalance || 0).toLocaleString()}`, icon: Wallet, iconColor: "text-emerald-500", iconBg: "bg-emerald-500/10", desc: "Ready to withdraw" },
        { label: "Locked Earnings", value: `${currencySymbol}${(userData?.pendingPayout || 0).toLocaleString()}`, icon: Clock, iconColor: "text-amber-500", iconBg: "bg-amber-500/10", desc: "Awaiting delivery" },
        { label: "Buying Wallet", value: `${currencySymbol}${(userData?.walletBalance || 0).toLocaleString()}`, icon: CreditCard, iconColor: "text-blue-500", iconBg: "bg-blue-500/10", desc: "For supplier costs" },
        { label: "Ads Budget", value: `${currencySymbol}${(userData?.adWalletBalance || 0).toLocaleString()}`, icon: Zap, iconColor: "text-violet-500", iconBg: "bg-violet-500/10", desc: "Marketing spend" },
    ];

    const getTypeIcon = (type: string) => {
        if (type === 'deposit' || type === 'earning' || type === 'ad_deposit') return <ArrowDownRight className="w-4 h-4" />;
        return <ArrowUpRight className="w-4 h-4" />;
    };

    const getTypeBg = (type: string) => {
        if (type === 'deposit' || type === 'earning' || type === 'ad_deposit') return 'bg-emerald-500/10 text-emerald-500';
        if (type === 'marketing' || type === 'purchase') return 'bg-blue-500/10 text-blue-500';
        return 'bg-red-500/10 text-red-500';
    };

    const getStatusStyle = (status: string) => {
        if (status === 'completed') return 'bg-emerald-500/10 text-emerald-400';
        if (status === 'declined') return 'bg-red-500/10 text-red-400';
        return 'bg-amber-500/10 text-amber-400';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Wallet</h1>
                    <p className="text-sm text-zinc-500 mt-1">Manage your balances, deposits, and withdrawals.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => setIsRefundModalOpen(true)}
                        className="px-4 py-2.5 text-sm font-medium rounded-lg bg-white/[0.06] border border-white/[0.08] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.1] transition-colors">
                        Refund
                    </button>
                    <button onClick={() => setIsDepositModalOpen(true)}
                        className="px-4 py-2.5 text-sm font-medium rounded-lg bg-white/[0.06] border border-white/[0.08] text-zinc-300 hover:bg-white/[0.1] transition-colors flex items-center gap-2">
                        <CreditCard className="w-4 h-4" /> Deposit
                    </button>
                    <button onClick={() => setIsAdModalOpen(true)}
                        className="px-4 py-2.5 text-sm font-medium rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Fund Ads
                    </button>
                    <button onClick={() => setIsWithdrawModalOpen(true)}
                        className="px-4 py-2.5 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Withdraw
                    </button>
                </div>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {walletCards.map((card, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.05] transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-medium text-zinc-500">{card.label}</span>
                            <div className={`w-8 h-8 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                                <card.icon className={`w-4 h-4 ${card.iconColor}`} />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-white">{card.value}</p>
                        <p className="text-xs text-zinc-600 mt-1">{card.desc}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Transactions */}
                <div className="lg:col-span-2 bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
                    <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                            <History className="w-4 h-4 text-zinc-500" />
                            Transaction History
                        </h3>
                        <span className="text-xs text-zinc-600">{transactions.length} transactions</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/[0.04] text-xs font-medium text-zinc-500">
                                    <th className="py-3 px-5">Type</th>
                                    <th className="py-3 px-4">Amount</th>
                                    <th className="py-3 px-5 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="py-16 text-center">
                                            <History className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                                            <p className="text-sm text-zinc-500">No transactions yet.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTypeBg(t.type)}`}>
                                                        {getTypeIcon(t.type)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-zinc-200 capitalize">{t.type.replace(/_/g, ' ')}</p>
                                                        <p className="text-xs text-zinc-600">
                                                            {t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <p className="text-sm font-semibold text-white">{currencySymbol}{t.amount?.toLocaleString()}</p>
                                                {t.bonus > 0 && <p className="text-[10px] text-emerald-400">+${t.bonus} bonus</p>}
                                            </td>
                                            <td className="py-4 px-5 text-right">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium capitalize ${getStatusStyle(t.status)}`}>
                                                    {t.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar info */}
                <div className="space-y-4">
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="w-4 h-4 text-blue-400" />
                            <h3 className="text-sm font-semibold text-zinc-300">Payment Security</h3>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                            Your earnings are held securely until delivery is confirmed. Once confirmed, funds are moved to your Available Earnings.
                        </p>
                    </div>
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Gift className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-sm font-semibold text-zinc-300">Deposit Bonus</h3>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                            Deposits over $100 may qualify for automatic ad wallet bonuses.
                        </p>
                    </div>
                    <button onClick={() => setIsDepositModalOpen(true)}
                        className="w-full py-3 bg-white text-zinc-900 font-medium text-sm rounded-lg hover:bg-zinc-100 transition-colors">
                        Make a Deposit
                    </button>
                </div>
            </div>

            <WithdrawalModal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} userData={userData} currencySymbol={currencySymbol} onSuccess={() => { if (user) refreshUserData(user.uid); }} />
            <DepositModal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} userId={user?.uid} currencySymbol={currencySymbol} />
            <AdDepositModal isOpen={isAdModalOpen} onClose={() => setIsAdModalOpen(false)} userId={user?.uid} />
            <RefundModal isOpen={isRefundModalOpen} onClose={() => setIsRefundModalOpen(false)} userId={user?.uid} availableBalance={userData?.walletBalance || 0} currencySymbol={currencySymbol} />
        </div>
    );
}

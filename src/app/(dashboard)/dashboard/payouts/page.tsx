"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    CreditCard,
    ArrowUpRight,
    Clock,
    History,
    Plus,
    ShieldCheck,
    AlertCircle,
    Loader2,
    Building,
    Wallet as CryptoWallet,
    Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AddPayoutMethodModal from "@/components/modals/AddPayoutMethodModal";
import WithdrawFundsModal from "@/components/modals/WithdrawFundsModal";
import { Smartphone, Bitcoin } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

export default function PayoutsPage() {
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [payouts, setPayouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

    const refreshUserData = async (uid: string) => {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
            setUserData(userDoc.data());
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                }

                // Fetch Payouts
                try {
                    const payoutQuery = query(
                        collection(db, "payouts"),
                        where("userId", "==", firebaseUser.uid),
                        orderBy("createdAt", "desc"),
                        limit(20)
                    );
                    const payoutSnap = await getDocs(payoutQuery);
                    setPayouts(payoutSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                } catch (err) {
                    console.error("Error fetching payouts:", err);
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const currency = useCurrency(userData);

    if (loading) {
        return (
            <div className="h-[80vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                            <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-400">Capital Management</span>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter italic leading-none">Payout Pipeline</h1>
                    <p className="text-zinc-500 font-extrabold text-sm uppercase tracking-widest leading-relaxed opacity-80 max-w-xl">
                        Authorize fund transfers and manage your liquidity channels via secure protocols.
                    </p>
                </div>
                <Button 
                    onClick={() => setIsWithdrawModalOpen(true)}
                    className="h-20 px-12 rounded-[2rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-emerald-500/20 hover:scale-105 transition-all active:scale-95 italic border-b-4 border-emerald-800 active:border-b-0"
                >
                    INITIATE WITHDRAWAL 🚀
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Finance Infrastructure */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Settlement Channels */}
                    <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3.5rem] space-y-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/[0.02] transition-colors duration-700" />
                        <div className="flex justify-between items-center relative">
                            <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-4 italic">
                                <CreditCard className="w-6 h-6 text-zinc-600" />
                                Liquidity Nodes
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 relative">
                            {userData?.payoutMethods && userData.payoutMethods.length > 0 ? (
                                userData.payoutMethods.map((method: any) => (
                                    <div key={method.id} className="p-8 bg-zinc-950/50 rounded-[2.5rem] border border-zinc-800 relative overflow-hidden group/item hover:border-blue-500/50 transition-all shadow-inner">
                                        <div className="space-y-6">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl ${method.type === 'card' ? 'bg-blue-600 shadow-blue-500/20' :
                                                    method.type === 'crypto' ? 'bg-orange-600 shadow-orange-500/20' : 'bg-emerald-600 shadow-emerald-500/20'
                                                }`}>
                                                {method.type === 'card' ? <CreditCard className="w-7 h-7" /> :
                                                    method.type === 'crypto' ? <Bitcoin className="w-7 h-7" /> : <Smartphone className="w-7 h-7" />}
                                            </div>
                                            <div>
                                                <p className="text-lg font-black text-white italic tracking-tighter uppercase leading-none mb-2">{method.label}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{method.type}</span>
                                                    <div className="w-1 h-1 rounded-full bg-zinc-800" />
                                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic animate-pulse">VERIFIED Node</span>
                                                </div>
                                                {method.type === 'card' && <p className="text-[11px] font-mono text-zinc-500 mt-4 tracking-widest opacity-60">{method.name}</p>}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-10 border border-dashed border-zinc-800 rounded-[2.5rem] text-center space-y-4 flex flex-col items-center justify-center min-h-[220px] bg-zinc-950/20 opacity-40">
                                    <p className="text-[11px] font-black text-zinc-600 uppercase tracking-widest italic">No Secure Channels Configured</p>
                                </div>
                            )}
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="p-10 border-2 border-dashed border-zinc-800 rounded-[2.5rem] text-center hover:border-blue-500/50 hover:bg-blue-600/5 transition-all group/add flex flex-col items-center justify-center min-h-[220px]"
                            >
                                <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-800 flex items-center justify-center text-blue-500 mb-4 group-hover/add:scale-110 group-hover/add:bg-blue-600 group-hover/add:text-white transition-all shadow-xl">
                                    <Plus className="w-8 h-8" />
                                </div>
                                <p className="text-[11px] font-black text-white uppercase tracking-widest italic">Link Protocol</p>
                            </button>
                        </div>
                    </div>

                    {/* Historical Ledger */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[3.5rem] overflow-hidden shadow-2xl">
                        <div className="p-10 border-b border-zinc-800 bg-zinc-950/20 backdrop-blur-3xl flex items-center justify-between">
                            <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-4 italic leading-none">
                                <History className="w-6 h-6 text-zinc-600" />
                                Transaction Ledger
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{payouts.length} RECORDS FOUND</span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-zinc-950/30 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
                                    <tr>
                                        <th className="py-8 px-10">Timestamp / Signature</th>
                                        <th className="py-8 px-8">Transfer Volume</th>
                                        <th className="py-8 px-8">Destination Path</th>
                                        <th className="py-8 px-10 text-right">Settlement State</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/30">
                                    {payouts.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-32 text-center opacity-30 grayscale">
                                                <History className="w-16 h-16 mx-auto mb-6 text-zinc-700" />
                                                <p className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.5em] italic">No Blockchain Activity</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        payouts.map((p) => (
                                            <tr key={p.id} className="hover:bg-zinc-800/30 transition-all group font-black uppercase">
                                                <td className="py-10 px-10">
                                                    <p className="text-base font-black text-white italic tracking-tighter mb-1 leading-none">
                                                        {p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                                    </p>
                                                    <p className="text-[10px] font-black text-zinc-600 tracking-widest italic uppercase mt-2">
                                                        HEX_ID: #{p.id.slice(0, 10)}
                                                    </p>
                                                </td>
                                                <td className="py-10 px-8">
                                                    <p className="text-2xl font-black text-white italic tracking-tighter">{currency.money(p.amount || 0)}</p>
                                                </td>
                                                <td className="py-10 px-8">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 text-zinc-500">
                                                            <Building className="w-4 h-4" />
                                                        </div>
                                                        <span className="text-[11px] font-black text-zinc-500 tracking-widest">{p.method || 'Standard Wire'}</span>
                                                    </div>
                                                </td>
                                                <td className="py-10 px-10 text-right">
                                                    <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full border italic shadow-2xl ${p.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                                        'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                                        }`}>
                                                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">{p.status}</span>
                                                        {p.status === 'completed' ? <ShieldCheck className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Tactical Sidebar */}
                <div className="space-y-10">
                    <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3.5rem] space-y-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-emerald-500/[0.02] pointer-events-none" />
                        <div className="flex items-center gap-4 relative">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                <ShieldCheck className="w-6 h-6 text-emerald-500" />
                            </div>
                            <h3 className="text-lg font-black text-white uppercase tracking-widest italic">Compliance</h3>
                        </div>
                        <p className="text-[11px] font-extrabold text-zinc-500 leading-relaxed uppercase tracking-widest opacity-80 italic">
                            All exits are monitored by automated AML protocols. Payout methods are locked during pending requests to prevent biometric spoofing.
                        </p>
                        <div className="space-y-2 pt-6">
                            <div className="flex justify-between text-[10px] font-black uppercase py-4 border-b border-zinc-800/50">
                                <span className="text-zinc-600 tracking-widest">SLA Window</span>
                                <span className="text-white italic">24 - 48 HRS</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-black uppercase py-4">
                                <span className="text-zinc-600 tracking-widest">Network Fee</span>
                                <span className="text-emerald-500 italic shadow-[0_0_15px_rgba(16,185,129,0.2)]">0.00 %</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-600/10 p-10 rounded-[3.5rem] border border-blue-600/20 space-y-6 shadow-2xl group hover:bg-blue-600/[0.15] transition-all duration-500">
                        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform">
                            <Info className="w-8 h-8" />
                        </div>
                        <div className="space-y-3">
                            <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">Support Node</h4>
                            <p className="text-[11px] font-black text-blue-500/60 leading-relaxed uppercase tracking-widest">
                                Processing delays exceeding 48 hours mandate manual intervention. Contact our financial division immediately.
                            </p>
                        </div>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl h-16 text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/40 border-b-4 border-blue-800 active:border-b-0 italic">
                            CONNECT TO FIN-OPS
                        </Button>
                    </div>
                </div>
            </div>
            <AddPayoutMethodModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    if (user) refreshUserData(user.uid);
                }}
                userId={user?.uid}
            />
            <WithdrawFundsModal
                isOpen={isWithdrawModalOpen}
                onClose={() => {
                    setIsWithdrawModalOpen(false);
                    if (user) refreshUserData(user.uid);
                }}
                userId={user?.uid}
                availableBalance={userData?.payoutBalance || 0}
                payoutMethods={userData?.payoutMethods || []}
                userEmail={user?.email || ""}
                locked={!!(userData?.withdrawalsLocked || userData?.payoutLocked)}
                currencyCode={currency.currencyCode}
                currencySymbol={currency.currencySymbol}
                exchangeRate={currency.rates[currency.currencyCode] || 1}
            />
        </div>
    );
}


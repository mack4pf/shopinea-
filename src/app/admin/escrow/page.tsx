"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase/config";
import { collection, query, getDocs, orderBy, updateDoc, doc, increment, where, serverTimestamp, getDoc, addDoc } from "firebase/firestore";
import { 
    ShieldCheck, 
    Box, 
    Clock, 
    CheckCircle2, 
    XCircle, 
    Loader2,
    DollarSign,
    Target,
    BarChart3,
    ArrowUpRight,
    TrendingUp,
    Shield,
    Trash2,
    History,
    Crown,
    Package,
    Building2,
    Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { onAuthStateChanged } from "firebase/auth";

export default function EscrowOpsPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
    const [subscriptionRequests, setSubscriptionRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            // Fetch Orders
            const ordersSnap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc")));
            setOrders(ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // Fetch Payout Requests
            const payoutSnap = await getDocs(query(collection(db, "payouts"), where("status", "==", "pending"), orderBy("createdAt", "desc")));
            setPayoutRequests(payoutSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // Fetch Subscription Requests
            const subSnap = await getDocs(query(collection(db, "subscription_requests"), where("status", "==", "pending"), orderBy("createdAt", "desc")));
            setSubscriptionRequests(subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch escrow operations.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (u) {
                const userDoc = await getDoc(doc(db, "users", u.uid));
                if (userDoc.exists() && userDoc.data()?.isAdmin) {
                    fetchData();
                } else {
                    if (typeof window !== 'undefined') window.location.href = '/admin/login';
                }
            } else {
                if (typeof window !== 'undefined') window.location.href = '/admin/login';
            }
        });
        return () => unsub();
    }, []);

    const handleReleaseEscrow = async (orderId: string) => {
        setProcessingId(orderId);
        try {
            const order = orders.find(o => o.id === orderId);
            const userRef = doc(db, "users", order.resellerId);
            
            // 1. Mark Order as Released
            await updateDoc(doc(db, "orders", orderId), {
                status: "delivered",
                releasedAt: serverTimestamp()
            });

            // 2. Clear Pending Payout / Move to Payout Balance
            await updateDoc(userRef, {
                pendingPayout: increment(-(order.resellerProfit || 0)),
                payoutBalance: increment(order.resellerProfit || 0)
            });

            // 3. Mark Earning Transaction as Completed
            const transQuery = query(collection(db, "transactions"), where("referenceId", "==", orderId), where("type", "==", "earning"));
            const transSnap = await getDocs(transQuery);
            if (!transSnap.empty) {
                await updateDoc(doc(db, "transactions", transSnap.docs[0].id), {
                    status: "completed",
                    description: `Profit released for Order #${orderId.slice(0, 8)} — delivered successfully`
                });
            }

            toast.success("Capital Released to Merchant!");
            fetchData();
        } catch (err) {
            toast.error("Release protocol failed.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleApproveSubscription = async (req: any) => {
        setProcessingId(req.id);
        try {
            const userRef = doc(db, "users", req.userId);
            const reqRef = doc(db, "subscription_requests", req.id);

            await updateDoc(userRef, {
                plan: req.planId,
                planName: req.planName,
                planStartDate: serverTimestamp(),
                planExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            });

            await updateDoc(reqRef, {
                status: "completed",
                approvedAt: serverTimestamp()
            });

            // Log Transaction
            await addDoc(collection(db, "transactions"), {
                userId: req.userId,
                type: "subscription_payment",
                amount: req.amount,
                planId: req.planId,
                status: "completed",
                createdAt: serverTimestamp()
            });

            toast.success("Tier Activated!");
            fetchData();
        } catch (err) {
            toast.error("Activation failed.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleApprovePayout = async (payout: any) => {
        setProcessingId(payout.id);
        try {
            await updateDoc(doc(db, "payouts", payout.id), {
                status: "completed",
                completedAt: serverTimestamp()
            });
            toast.success("Payout Finalized!");
            fetchData();
        } catch (err) {
            toast.error("Payout protocol failed.");
        } finally {
            setProcessingId(null);
        }
    }

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-zinc-950">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 leading-none">Capital Settlement</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tight italic uppercase text-white">Escrow Operations</h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] pl-1">Profit Release • Withdrawal Settle • Subscription Verification</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Pending Releases Section */}
                <div className="bg-emerald-600/5 border border-emerald-600/10 p-10 rounded-[3rem] space-y-8 shadow-2xl relative overflow-hidden h-fit">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-600/5 rounded-full blur-[100px] -mr-40 -mt-40" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 bg-emerald-500/10 rounded-[1.5rem] flex items-center justify-center">
                            <Box className="w-8 h-8 text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white italic tracking-tight leading-none mb-1">Escrow Release</h2>
                            <p className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em]">Pending Profit Release ({orders.filter(o => o.status === 'shipped').length})</p>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        {orders.filter(o => o.status === 'shipped').length === 0 ? (
                            <div className="py-10 text-center bg-zinc-950/50 rounded-[2rem] border border-zinc-800 border-dashed">
                                <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest italic">All escrow profits settled</p>
                            </div>
                        ) : (
                            orders.filter(o => o.status === 'shipped').map((o) => (
                                <div key={o.id} className="bg-zinc-950 border border-zinc-800 p-8 rounded-[2.5rem] space-y-6 group hover:border-emerald-500/50 transition-all shadow-xl">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center font-black text-[10px] text-zinc-500 border border-zinc-800 uppercase group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-md">
                                                <Package className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black italic text-white leading-none mb-1 uppercase tracking-tight">{o.customerName || 'Anonymous'}</p>
                                                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{o.productName} • {o.customerCountry}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black italic text-emerald-500 tracking-tighter">${o.resellerProfit?.toLocaleString()}</p>
                                            <p className="text-[9px] font-black text-zinc-600 uppercase">Profit Component</p>
                                        </div>
                                    </div>

                                    <Button 
                                        onClick={() => handleReleaseEscrow(o.id)}
                                        disabled={!!processingId}
                                        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black italic rounded-xl gap-2 shadow-xl shadow-emerald-500/20 text-[9px] uppercase tracking-widest"
                                    >
                                        {processingId === o.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                                        RELEASE ESCROW ASSETS
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Tier & Payout Combined Section */}
                <div className="space-y-10">
                    {/* Tier Activations */}
                    <div className="bg-amber-600/5 border border-amber-600/10 p-10 rounded-[3rem] space-y-8 shadow-2xl relative overflow-hidden h-fit">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-600/5 rounded-full blur-[100px] -mr-40 -mt-40" />
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-14 h-14 bg-amber-500/10 rounded-[1.5rem] flex items-center justify-center">
                                <Crown className="w-8 h-8 text-amber-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white italic tracking-tight leading-none mb-1">Tier Verification</h2>
                                <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em]">Pending Network Tiers ({subscriptionRequests.length})</p>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            {subscriptionRequests.length === 0 ? (
                                <div className="py-10 text-center bg-zinc-950/50 rounded-[2rem] border border-zinc-800 border-dashed">
                                    <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest italic">All network tiers validated</p>
                                </div>
                            ) : (
                                subscriptionRequests.map((req) => (
                                    <div key={req.id} className="bg-zinc-950 border border-zinc-800 p-6 rounded-[2rem] group hover:border-amber-500/50 transition-all">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <p className="text-xs font-black italic text-white uppercase tracking-tight">{req.userName || 'Merchant'}</p>
                                                <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">{req.planName} Tier Request</p>
                                            </div>
                                            <p className="text-xl font-black italic text-white tracking-tighter">${req.amount}</p>
                                        </div>
                                        <Button 
                                            onClick={() => handleApproveSubscription(req)}
                                            disabled={!!processingId}
                                            className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-black italic rounded-xl gap-2 shadow-xl shadow-amber-500/20 text-[9px] uppercase tracking-widest"
                                        >
                                            {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                            ACTIVATE TIER PRIVILEGES
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Withdrawal Settle */}
                    <div className="bg-blue-600/5 border border-blue-600/10 p-10 rounded-[3rem] space-y-8 shadow-2xl relative overflow-hidden h-fit">
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-14 h-14 bg-blue-500/10 rounded-[1.5rem] flex items-center justify-center">
                                <DollarSign className="w-8 h-8 text-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white italic tracking-tight leading-none mb-1">Fleet Withdrawal</h2>
                                <p className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em]">Pending Settlement ({payoutRequests.length})</p>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            {payoutRequests.length === 0 ? (
                                <div className="py-10 text-center bg-zinc-950/50 rounded-[2rem] border border-zinc-800 border-dashed">
                                    <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest italic">All merchant withdrawals settled</p>
                                </div>
                            ) : (
                                payoutRequests.map((p) => (
                                    <div key={p.id} className="bg-zinc-950 border border-zinc-800 p-6 rounded-[2rem] group hover:border-blue-500/50 transition-all">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <p className="text-xs font-black italic text-white uppercase tracking-tight">{p.userName || 'Merchant'}</p>
                                                <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">{p.method?.toUpperCase()} • {p.bankName || p.paypalEmail}</p>
                                            </div>
                                            <p className="text-xl font-black italic text-white tracking-tighter">${p.amount}</p>
                                        </div>
                                        <Button 
                                            onClick={() => handleApprovePayout(p)}
                                            disabled={!!processingId}
                                            className="w-full h-12 bg-white text-black font-black italic rounded-xl gap-2 shadow-xl shadow-white/5 text-[9px] uppercase tracking-widest"
                                        >
                                            {processingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                            SETTLE TRANCHE
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

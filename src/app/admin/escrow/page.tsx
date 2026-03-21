"use client";

import { useState, useEffect, useMemo } from "react";
import { db, auth } from "@/lib/firebase/config";
import { collection, query, getDocs, orderBy, updateDoc, doc, increment, where, serverTimestamp, getDoc, addDoc, writeBatch } from "firebase/firestore";
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
    Send,
    User,
    Dice5,
    CheckSquare,
    MoreHorizontal,
    LayoutDashboard,
    Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { onAuthStateChanged } from "firebase/auth";
import { cn } from "@/lib/utils";

export default function EscrowOpsPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
    const [subscriptionRequests, setSubscriptionRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [randomAmount, setRandomAmount] = useState<number>(5);

    const fetchData = async () => {
        try {
            // Fetch Orders (only shipped ones for release)
            const ordersSnap = await getDocs(query(collection(db, "orders"), where("status", "==", "shipped"), orderBy("createdAt", "desc")));
            setOrders(ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // Fetch Payout Requests
            const payoutSnap = await getDocs(query(collection(db, "payouts"), orderBy("createdAt", "desc")));
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

    // Grouping Logic
    const groupedOrders = useMemo(() => {
        const groups: Record<string, { userId: string, userName: string, storeName: string, orders: any[] }> = {};
        orders.forEach(o => {
            const uid = o.resellerId;
            if (!groups[uid]) {
                groups[uid] = {
                    userId: uid,
                    userName: o.resellerName || "Unknown Merchant",
                    storeName: o.storeName || "Official Node",
                    orders: []
                };
            }
            groups[uid].orders.push(o);
        });
        return Object.values(groups).filter(g => 
            g.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
            g.userId.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [orders, searchQuery]);

    const handleReleaseMultiple = async (orderIds: string[], userId: string) => {
        setProcessingId(`multi-${userId}`);
        const batch = writeBatch(db);
        try {
            let totalProfit = 0;
            for (const id of orderIds) {
                const order = orders.find(o => o.id === id);
                if (!order) continue;
                totalProfit += (order.resellerProfit || 0);

                // Update Order Status
                batch.update(doc(db, "orders", id), {
                    status: "delivered",
                    releasedAt: serverTimestamp()
                });

                // Completed Transaction Note
                const transQuery = query(collection(db, "transactions"), where("referenceId", "==", id), where("type", "==", "earning"));
                const transSnap = await getDocs(transQuery);
                if (!transSnap.empty) {
                    batch.update(doc(db, "transactions", transSnap.docs[0].id), {
                        status: "completed",
                        description: `Profit released for Order #${id.slice(0, 8)}`
                    });
                }
            }

            // Update User Balance
            batch.update(doc(db, "users", userId), {
                pendingPayout: increment(-totalProfit),
                payoutBalance: increment(totalProfit)
            });

            await batch.commit();
            toast.success(`Released ${orderIds.length} orders successfully!`);
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error("Multi-release protocol failed.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleRandomRelease = async (userId: string, count: number) => {
        const userGroup = groupedOrders.find(g => g.userId === userId);
        if (!userGroup) return;
        const shuffled = [...userGroup.orders].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, Math.min(count, shuffled.length)).map(o => o.id);
        if (selected.length > 0) {
            handleReleaseMultiple(selected, userId);
        } else {
            toast.error("No orders available for release.");
        }
    };

    const syncTransactionStatus = async (payoutId: string, status: string, userId: string, amount: number) => {
        try {
            let tQuery = query(collection(db, "transactions"), where("payoutId", "==", payoutId));
            let snap = await getDocs(tQuery);
            if (snap.empty) {
                const fallbackQuery = query(collection(db, "transactions"), where("userId", "==", userId));
                const fallbackSnap = await getDocs(fallbackQuery);
                const matchingDocs = fallbackSnap.docs.filter(d => {
                    const data = d.data();
                    return data.type === "withdrawal" && data.amount === amount && data.status !== status;
                });
                if (matchingDocs.length > 0) {
                    await updateDoc(doc(db, "transactions", matchingDocs[0].id), { status, updatedAt: serverTimestamp() });
                }
            } else {
                const tDoc = snap.docs[0];
                await updateDoc(doc(db, "transactions", tDoc.id), { status, updatedAt: serverTimestamp() });
            }
        } catch (err) {
            console.error("Sync Tx Error:", err);
        }
    };

    const handleApprovePayout = async (payout: any) => {
        setProcessingId(payout.id);
        try {
            await updateDoc(doc(db, "payouts", payout.id), {
                status: "completed",
                completedAt: serverTimestamp()
            });
            await syncTransactionStatus(payout.id, "completed", payout.userId, payout.amount);

            // Send Confirmation Email
            try {
                const userDoc = await getDoc(doc(db, "users", payout.userId));
                if (userDoc.exists() && userDoc.data().email) {
                    await fetch("/api/send-email", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            type: "custom",
                            to: userDoc.data().email,
                            from: "Shoplinea Finance <billing@shoplinea.shop>",
                            data: {
                                subject: "Withdrawal Successful",
                                html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
                                    <h2 style="color: #111827; margin-bottom: 16px;">Funds Disbursed</h2>
                                    <p style="color: #4b5563; line-height: 1.6;">Your withdrawal of <strong>$${payout.amount?.toLocaleString()}</strong> has been successfully processed and disbursed.</p>
                                    <p style="color: #4b5563; line-height: 1.6;">The funds have been sent to your selected payout network (${payout.method?.toUpperCase()}). Depending on the network, it may take some time to reflect in your external account.</p>
                                </div>`
                            }
                        })
                    });
                }
            } catch (err) {
                console.error("Failed to send payout email", err);
            }

            toast.success("Payout Finalized & Email Sent!");
            fetchData();
        } catch (err) {
            toast.error("Payout protocol failed.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleDeclinePayout = async (payout: any) => {
        const reason = window.prompt("Enter detailed decline reason (this will be sent to the merchant):", "Security Risk / Verification Required");
        if (!reason) return;

        setProcessingId(`decline-${payout.id}`);
        try {
            await updateDoc(doc(db, "payouts", payout.id), {
                status: "declined",
                declinedAt: serverTimestamp(),
                declineReason: reason
            });
            await syncTransactionStatus(payout.id, "declined", payout.userId, payout.amount);

            // Give the money back to the user internally
            await updateDoc(doc(db, "users", payout.userId), {
                payoutBalance: increment(payout.amount),
                totalWithdrawn: increment(-payout.amount)
            });

            const userDoc = await getDoc(doc(db, "users", payout.userId));
            if (userDoc.exists() && userDoc.data().email) {
                await fetch("/api/send-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "custom",
                        to: userDoc.data().email,
                        from: "Shoplinea Security <support@shoplinea.shop>",
                        data: {
                            subject: "Important: Withdrawal Request Declined",
                            html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
                                <h2 style="color: #ef4444; margin-bottom: 16px;">Withdrawal Declined</h2>
                                <p style="color: #4b5563; line-height: 1.6;">Your withdrawal request for <strong>$${payout.amount?.toLocaleString()}</strong> has been declined.</p>
                                <div style="margin: 20px 0; padding: 15px; background-color: #fef2f2; border-radius: 8px; border: 1px dashed #f87171;">
                                    <h3 style="color: #991b1b; margin-top: 0; font-size: 14px; text-transform: uppercase;">Official Reason:</h3>
                                    <p style="color: #b91c1c; font-weight: bold; margin-bottom: 0;">${reason}</p>
                                </div>
                                <p style="color: #4b5563; line-height: 1.6;">Your funds have been securely returned to your internal Shoplinea wallet. Please correct any issues and try again or contact support.</p>
                            </div>`
                        }
                    })
                });
            }

            toast.success("Payout Declined & Refended! Email Sent.");
            fetchData();
        } catch (err) {
            toast.error("Decline protocol failed.");
        } finally {
            setProcessingId(null);
        }
    };

    const handlePendingPayout = async (payout: any) => {
        setProcessingId(`pending-${payout.id}`);
        try {
            await updateDoc(doc(db, "payouts", payout.id), {
                status: "pending",
                updatedAt: serverTimestamp()
            });
            await syncTransactionStatus(payout.id, "pending", payout.userId, payout.amount);
            
            toast.success("Payout set back to Pending.");
            fetchData();
        } catch (err) {
            toast.error("Status update failed.");
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

    if (loading) return <div className="h-screen flex items-center justify-center bg-zinc-950"><Loader2 className="w-12 h-12 animate-spin text-blue-600" /></div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-1000 pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 shadow-2xl">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500 leading-none">Security Ops Center</span>
                    </div>
                    <h1 className="text-6xl font-black tracking-tighter italic uppercase text-white leading-none">Escrow Terminal</h1>
                    <p className="text-zinc-600 font-extrabold uppercase tracking-[0.3em] text-[10px] pl-1">Hierarchical Asset Liquidation • Matrix Authorization</p>
                </div>
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
                    <Input 
                        placeholder="FILTER BY MERCHANT_ID..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-14 bg-zinc-950 border-zinc-900 h-18 rounded-[2rem] font-black text-white shadow-xl italic uppercase tracking-widest text-[10px] focus:ring-4 focus:ring-emerald-500/10 transition-all" 
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* MERCHANT ESCROW RELEASE (Left 2 Columns) */}
                <div className="lg:col-span-2 space-y-10">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                            <LayoutDashboard className="w-6 h-6 text-emerald-500" />
                            <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">Active Escrows</h2>
                        </div>
                        <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20 italic">
                            {orders.length} PENDING NODES
                        </span>
                    </div>

                    {groupedOrders.length === 0 ? (
                        <div className="p-32 bg-zinc-900 border border-dashed border-zinc-800 rounded-[3.5rem] flex flex-col items-center justify-center grayscale opacity-30">
                            <Box className="w-20 h-20 text-zinc-700 mb-8" />
                            <p className="text-[11px] font-black uppercase text-zinc-600 tracking-[0.5em] italic">Null Entry in Settlement Buffer</p>
                        </div>
                    ) : (
                        groupedOrders.map((group) => (
                            <div key={group.userId} className="bg-zinc-900 border border-zinc-800 rounded-[3.5rem] overflow-hidden shadow-2xl relative group/card">
                                <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
                                
                                <div className="p-10 border-b border-zinc-950 bg-zinc-950/20 backdrop-blur-3xl flex flex-col md:flex-row justify-between gap-8">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[2rem] bg-zinc-950 border border-zinc-800 flex items-center justify-center text-emerald-500 shadow-inner">
                                            <User className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none mb-2">{group.userName}</h3>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{group.storeName}</span>
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[9px] font-black text-emerald-500 uppercase italic">Active Nodes: {group.orders.length}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 bg-zinc-950 px-4 py-2 rounded-xl border border-zinc-800">
                                            <Dice5 className="w-4 h-4 text-zinc-600" />
                                            <Input 
                                                type="number" 
                                                value={randomAmount} 
                                                onChange={e => setRandomAmount(parseInt(e.target.value))}
                                                className="w-12 h-6 bg-transparent border-none p-0 text-white font-black text-xs text-center"
                                            />
                                        </div>
                                        <Button 
                                            onClick={() => handleRandomRelease(group.userId, randomAmount)}
                                            disabled={!!processingId}
                                            variant="outline" 
                                            className="h-14 font-black text-[9px] tracking-widest uppercase italic border-zinc-800 hover:bg-emerald-600 hover:text-white transition-all rounded-[1.2rem] px-6"
                                        >
                                            RANDOM_SEED
                                        </Button>
                                        <Button 
                                            onClick={() => handleReleaseMultiple(group.orders.map(o => o.id), group.userId)}
                                            disabled={!!processingId}
                                            className="h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] tracking-widest uppercase italic rounded-[1.2rem] px-8 shadow-2xl shadow-emerald-500/20 border-b-4 border-emerald-800 active:border-b-0"
                                        >
                                            RELEASE_ALL
                                        </Button>
                                    </div>
                                </div>

                                <div className="p-8 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                                    {group.orders.map((o) => (
                                        <div key={o.id} className="p-6 bg-zinc-950 border border-zinc-800 rounded-[2rem] flex items-center justify-between group/row hover:border-emerald-500/30 transition-all shadow-inner">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800 text-zinc-600 shadow-xl group-hover/row:scale-110 transition-transform">
                                                    <Package className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <p className="text-base font-black text-white italic tracking-tighter uppercase leading-none mb-1.5">{o.productName}</p>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">CID: {o.id.slice(-8).toUpperCase()}</span>
                                                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 italic">SIMULATED_TRANS</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-8">
                                                <div className="text-right">
                                                    <p className="text-xl font-black text-white italic tracking-tighter leading-none">${o.resellerProfit?.toLocaleString()}</p>
                                                    <p className="text-[9px] font-black text-emerald-500 uppercase mt-1 italic">YIELD</p>
                                                </div>
                                                <Button 
                                                    onClick={() => handleReleaseMultiple([o.id], group.userId)}
                                                    disabled={!!processingId}
                                                    variant="ghost" 
                                                    className="w-12 h-12 rounded-xl text-emerald-500/40 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all"
                                                >
                                                    <Send className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Tiers & Withdrawals (Right Column) */}
                <div className="space-y-12">
                    {/* Subscription Requests */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[3.5rem] p-10 space-y-10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20" />
                        <div className="flex items-center gap-5 relative z-10">
                            <div className="w-14 h-14 bg-amber-500/10 rounded-[1.5rem] flex items-center justify-center border border-amber-500/20 shadow-2xl shadow-amber-500/10">
                                <Crown className="w-7 h-7 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tight leading-none mb-1">Tier Authorizing</h3>
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic">{subscriptionRequests.length} QUEUED TRANCHES</p>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            {subscriptionRequests.length === 0 ? (
                                <div className="p-10 border border-dashed border-zinc-800 rounded-[2rem] text-center grayscale opacity-30">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 italic">Clear Buffer</p>
                                </div>
                            ) : (
                                subscriptionRequests.map(req => (
                                    <div key={req.id} className="p-6 bg-zinc-950 border border-zinc-800 rounded-[2rem] space-y-6 shadow-inner group/sub hover:border-amber-500/20 transition-all">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-base font-black text-white italic tracking-tighter uppercase leading-none mb-2">{req.userName || 'Unknown'}</p>
                                                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest italic">{req.planName} PROTOCOL</span>
                                            </div>
                                            <p className="text-xl font-black text-white italic tracking-tighter">${req.amount}</p>
                                        </div>
                                        <Button 
                                            onClick={() => handleApproveSubscription(req)}
                                            disabled={!!processingId}
                                            className="w-full h-14 bg-amber-600 hover:bg-amber-700 text-white font-black italic rounded-xl text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-amber-500/20 border-b-4 border-amber-800 active:border-b-0 transition-all"
                                        >
                                            {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "ACTIVATE_NODE"}
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Payout Requests */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[3.5rem] p-10 space-y-10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20" />
                        <div className="flex items-center gap-5 relative z-10">
                            <div className="w-14 h-14 bg-blue-500/10 rounded-[1.5rem] flex items-center justify-center border border-blue-500/20 shadow-2xl shadow-blue-500/10">
                                <DollarSign className="w-7 h-7 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tight leading-none mb-1">Exit Settlement</h3>
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest italic">{payoutRequests.length} CAP_FLIGHT_EVENTS</p>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                             {payoutRequests.length === 0 ? (
                                <div className="p-10 border border-dashed border-zinc-800 rounded-[2rem] text-center grayscale opacity-30">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 italic">Static Liquidity</p>
                                </div>
                            ) : (
                                payoutRequests.map(p => (
                                    <div key={p.id} className="p-6 bg-zinc-950 border border-zinc-800 rounded-[2.5rem] space-y-6 shadow-inner group/payout hover:border-blue-500/20 transition-all">
                                        <div className="flex flex-col gap-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-base font-black text-white italic tracking-tighter uppercase leading-none mb-2">{p.userName}</p>
                                                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest italic">{p.method?.toUpperCase()} • {p.methodDetails?.bankName || p.methodDetails?.network}</span>
                                                </div>
                                                <p className="text-2xl font-black text-white italic tracking-tighter">${p.amount?.toLocaleString()}</p>
                                            </div>
                                            <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                                                <p className="text-[10px] font-black text-zinc-600 uppercase mb-2 tracking-widest">NODE_ID / ADDRESS</p>
                                                <p className="text-[11px] font-mono text-zinc-400 break-all select-all font-bold">{p.methodDetails?.accountNumber || p.methodDetails?.address}</p>
                                            </div>
                                            <div className="flex justify-between items-center px-1">
                                                <span className={cn(
                                                    "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-md border",
                                                    p.status === 'completed' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' :
                                                    p.status === 'declined' ? 'text-rose-500 border-rose-500/20 bg-rose-500/5' :
                                                    'text-amber-500 border-amber-500/20 bg-amber-500/5 animate-pulse'
                                                )}>
                                                    STATUS: {p.status || 'PENDING'}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            {p.status === 'pending' || p.status === 'declined' ? (
                                                <Button 
                                                    onClick={() => handleApprovePayout(p)}
                                                    disabled={!!processingId}
                                                    className="w-full h-12 bg-white hover:bg-zinc-200 text-black font-black italic rounded-xl text-[10px] uppercase tracking-widest shadow-lg border-b-4 border-zinc-300 active:border-b-0 transition-all gap-2"
                                                >
                                                    {processingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> SETTLE</>}
                                                </Button>
                                            ) : null}

                                            {p.status === 'pending' ? (
                                                <Button 
                                                    onClick={() => handleDeclinePayout(p)}
                                                    disabled={!!processingId}
                                                    className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white font-black italic rounded-xl text-[10px] uppercase tracking-widest shadow-lg border-b-4 border-rose-800 active:border-b-0 transition-all gap-2"
                                                >
                                                    {processingId === `decline-${p.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4" /> DECLINE</>}
                                                </Button>
                                            ) : null}

                                            {p.status === 'completed' || p.status === 'declined' ? (
                                                <Button 
                                                    onClick={() => handlePendingPayout(p)}
                                                    disabled={!!processingId}
                                                    variant="outline"
                                                    className="w-full h-12 bg-transparent border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-white font-black italic rounded-xl text-[10px] uppercase tracking-widest shadow-lg transition-all gap-2"
                                                >
                                                    {processingId === `pending-${p.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Clock className="w-4 h-4" /> QUEUE</>}
                                                </Button>
                                            ) : null}
                                        </div>
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


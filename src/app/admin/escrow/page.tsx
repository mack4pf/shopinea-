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

            const userDoc = await getDoc(doc(db, "users", payout.userId));
            if (userDoc.exists() && userDoc.data().email) {
                await fetch("/api/send-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "custom",
                        to: userDoc.data().email,
                        data: {
                            subject: "Withdrawal Status Updated",
                            html: `<p>Your withdrawal request for <strong>$${payout.amount?.toLocaleString()}</strong> is now back under review.</p>
                                <p><strong>Status:</strong> Pending</p>
                                <p>We will email you again once the request is approved or declined.</p>`
                        }
                    })
                });
            }
            
            toast.success("Payout set back to Pending & Email Sent.");
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
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Escrow</h1>
                    <p className="text-sm text-zinc-500 mt-1">Manage order releases, payouts, and subscription approvals.</p>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input 
                        placeholder="Filter by merchant..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white/[0.04] border-white/[0.08] h-10 rounded-lg text-white text-sm placeholder:text-zinc-600" 
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Releases - Left 2 Columns */}
                <div className="lg:col-span-2 space-y-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-white">Active Escrows</h2>
                        <span className="text-xs text-zinc-500 bg-white/[0.04] px-2.5 py-1 rounded border border-white/[0.06]">{orders.length} pending</span>
                    </div>

                    {groupedOrders.length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center bg-white/[0.02] border border-white/[0.04] rounded-xl">
                            <Box className="w-10 h-10 text-zinc-700 mb-3" />
                            <p className="text-sm text-zinc-600">No orders pending release</p>
                        </div>
                    ) : (
                        groupedOrders.map((group) => (
                            <div key={group.userId} className="bg-white/[0.02] border border-white/[0.04] rounded-xl overflow-hidden">
                                <div className="px-4 py-3 border-b border-white/[0.04] flex flex-col md:flex-row justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                                            <User className="w-4 h-4 text-zinc-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{group.userName}</p>
                                            <p className="text-xs text-zinc-500">{group.storeName} • {group.orders.length} orders</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 rounded-lg">
                                            <Dice5 className="w-3.5 h-3.5 text-zinc-500" />
                                            <Input 
                                                type="number" 
                                                value={randomAmount} 
                                                onChange={e => setRandomAmount(parseInt(e.target.value))}
                                                className="w-12 h-5 bg-transparent border-none p-0 text-white text-xs text-center"
                                            />
                                        </div>
                                        <button
                                            onClick={() => handleRandomRelease(group.userId, randomAmount)}
                                            disabled={!!processingId}
                                            className="h-8 px-3 text-xs font-medium bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-zinc-300 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            Random
                                        </button>
                                        <button
                                            onClick={() => handleReleaseMultiple(group.orders.map(o => o.id), group.userId)}
                                            disabled={!!processingId}
                                            className="h-8 px-3 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {processingId === `multi-${group.userId}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Release All'}
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                                    {group.orders.map((o) => (
                                        <div key={o.id} className="px-3 py-2.5 bg-white/[0.02] border border-white/[0.04] rounded-lg flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center">
                                                    <Package className="w-3.5 h-3.5 text-zinc-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{o.productName}</p>
                                                    <p className="text-xs text-zinc-500">#{o.id.slice(-8).toUpperCase()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <p className="text-sm font-semibold text-white">${o.resellerProfit?.toLocaleString()}</p>
                                                <button
                                                    onClick={() => handleReleaseMultiple([o.id], group.userId)}
                                                    disabled={!!processingId}
                                                    className="w-7 h-7 rounded-lg text-emerald-400/50 hover:text-emerald-400 hover:bg-emerald-500/10 flex items-center justify-center transition-colors"
                                                >
                                                    <Send className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Right sidebar - Subscriptions & Payouts */}
                <div className="space-y-6">
                    {/* Subscription Requests */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Crown className="w-4 h-4 text-amber-400" />
                                <h3 className="text-sm font-semibold text-white">Subscriptions</h3>
                            </div>
                            <span className="text-xs text-zinc-500">{subscriptionRequests.length}</span>
                        </div>

                        <div className="space-y-3">
                            {subscriptionRequests.length === 0 ? (
                                <p className="text-xs text-zinc-600 py-4 text-center">No pending requests</p>
                            ) : (
                                subscriptionRequests.map(req => (
                                    <div key={req.id} className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-medium text-white">{req.userName || 'Unknown'}</p>
                                                <p className="text-xs text-amber-400">{req.planName}</p>
                                            </div>
                                            <p className="text-sm font-semibold text-white">${req.amount}</p>
                                        </div>
                                        <button
                                            onClick={() => handleApproveSubscription(req)}
                                            disabled={!!processingId}
                                            className="w-full h-8 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                                        >
                                            {processingId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Activate Plan'}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Payout Requests */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-blue-400" />
                                <h3 className="text-sm font-semibold text-white">Payouts</h3>
                            </div>
                            <span className="text-xs text-zinc-500">{payoutRequests.length}</span>
                        </div>

                        <div className="space-y-3">
                            {payoutRequests.length === 0 ? (
                                <p className="text-xs text-zinc-600 py-4 text-center">No pending payouts</p>
                            ) : (
                                payoutRequests.map(p => (
                                    <div key={p.id} className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-medium text-white">{p.userName}</p>
                                                <p className="text-xs text-zinc-500">{p.method?.toUpperCase()}</p>
                                            </div>
                                            <p className="text-sm font-semibold text-white">${p.amount?.toLocaleString()}</p>
                                        </div>
                                        <div className="p-2 bg-white/[0.03] border border-white/[0.04] rounded-lg">
                                            <p className="text-[10px] text-zinc-600 mb-1">Account / Address</p>
                                            <p className="text-xs font-mono text-zinc-400 break-all">{p.methodDetails?.accountNumber || p.methodDetails?.address}</p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className={cn(
                                                "text-[10px] font-medium px-2 py-0.5 rounded border",
                                                p.status === 'completed' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' :
                                                p.status === 'declined' ? 'text-rose-400 border-rose-500/20 bg-rose-500/10' :
                                                'text-amber-400 border-amber-500/20 bg-amber-500/10'
                                            )}>
                                                {p.status || 'pending'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(p.status === 'pending' || p.status === 'declined') && (
                                                <button
                                                    onClick={() => handleApprovePayout(p)}
                                                    disabled={!!processingId}
                                                    className="h-8 text-xs font-medium bg-white text-black hover:bg-zinc-200 rounded-lg flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                                                >
                                                    {processingId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><CheckCircle2 className="w-3.5 h-3.5" /> Settle</>}
                                                </button>
                                            )}
                                            {p.status === 'pending' && (
                                                <button
                                                    onClick={() => handleDeclinePayout(p)}
                                                    disabled={!!processingId}
                                                    className="h-8 text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                                                >
                                                    {processingId === `decline-${p.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><XCircle className="w-3.5 h-3.5" /> Decline</>}
                                                </button>
                                            )}
                                            {(p.status === 'completed' || p.status === 'declined') && (
                                                <button
                                                    onClick={() => handlePendingPayout(p)}
                                                    disabled={!!processingId}
                                                    className="h-8 text-xs font-medium bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-zinc-400 rounded-lg flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                                                >
                                                    {processingId === `pending-${p.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Clock className="w-3.5 h-3.5" /> Queue</>}
                                                </button>
                                            )}
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

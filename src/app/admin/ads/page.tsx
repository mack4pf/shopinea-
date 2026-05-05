"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase/config";
import { collection, query, getDocs, orderBy, updateDoc, doc, increment, where, serverTimestamp, getDoc, arrayUnion, deleteDoc } from "firebase/firestore";
import { 
    Megaphone, 
    Zap, 
    Clock, 
    CheckCircle2, 
    XCircle, 
    Loader2,
    DollarSign,
    Target,
    BarChart3,
    ArrowUpRight,
    TrendingUp,
    Play,
    Pause,
    AlertCircle,
    UserCircle,
    Calendar,
    Wallet,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { onAuthStateChanged } from "firebase/auth";

export default function AdCommandPage() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [adDeposits, setAdDeposits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            // Fetch All Ad Campaigns
            const campSnap = await getDocs(query(collection(db, "campaigns"), orderBy("createdAt", "desc")));
            setCampaigns(campSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            // Fetch Pending Ad Deposits
            const adDepQuery = query(
                collection(db, "transactions"),
                where("type", "==", "ad_deposit"),
                where("status", "==", "pending")
            );
            const adDepSnap = await getDocs(adDepQuery);
            setAdDeposits(adDepSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch ad network data.");
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

    const handleApproveCampaign = async (camp: any) => {
        setProcessingId(camp.id);
        try {
            await updateDoc(doc(db, "campaigns", camp.id), {
                status: "active",
                approvedAt: serverTimestamp()
            });

            const sellerDoc = await getDoc(doc(db, "users", camp.sellerId));
            if (sellerDoc.exists() && sellerDoc.data().email) {
                await fetch("/api/send-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "custom",
                        to: sellerDoc.data().email,
                        data: {
                            subject: `Ad Campaign Approved - ${camp.platform?.toUpperCase()}`,
                            html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
                                <h2 style="color: #111827; margin-bottom: 16px;">Traffic Protocol Active</h2>
                                <p style="color: #4b5563; line-height: 1.6;">Your <strong>${camp.platform?.toUpperCase() || 'network'}</strong> ad campaign has been approved and is now actively delivering traffic.</p>
                                <p style="color: #4b5563; line-height: 1.6;">You can track conversions and impressions in your dashboard.</p>
                            </div>`
                        }
                    })
                });
            }

            toast.success("Ad Campaign Propagated & Email Sent!");
            fetchData();
        } catch (err) {
            toast.error("Failed to activate campaign.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectCampaign = async (camp: any) => {
        const reason = window.prompt("Enter the rejection reason. This will be emailed to the merchant:");
        const cleanReason = reason?.trim();
        if (!cleanReason) {
            toast.error("A rejection reason is required.");
            return;
        }

        setProcessingId(`reject-${camp.id}`);
        try {
            const refundAmount = Number(camp.totalBudget || 0);
            await updateDoc(doc(db, "campaigns", camp.id), {
                status: "rejected",
                rejectionReason: cleanReason,
                rejectedAt: serverTimestamp()
            });

            if (camp.sellerId && refundAmount > 0) {
                await updateDoc(doc(db, "users", camp.sellerId), camp.isPostpaid ? {
                    pendingAdDebt: increment(-refundAmount)
                } : {
                    adWalletBalance: increment(refundAmount)
                });
            }

            const sellerDoc = await getDoc(doc(db, "users", camp.sellerId));
            if (sellerDoc.exists() && sellerDoc.data().email) {
                await fetch("/api/send-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "custom",
                        to: sellerDoc.data().email,
                        data: {
                            subject: `Ad Campaign Rejected - ${camp.platform?.toUpperCase() || "ADS"}`,
                            html: `<p>Your ${camp.platform?.toUpperCase() || "ad"} campaign was rejected during review.</p>
                                <p><strong>Reason:</strong> ${cleanReason}</p>
                                ${refundAmount > 0 ? `<p><strong>Refund:</strong> $${refundAmount.toLocaleString()} has been ${camp.isPostpaid ? "removed from your pending ad debt" : "returned to your ad wallet"}.</p>` : ""}
                                <p>You can make the required changes and submit a new campaign anytime.</p>`
                        }
                    })
                });
            }

            toast.success("Campaign rejected, funds refunded, and email sent.");
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error("Failed to reject campaign.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleBoost = async (campId: string, impressions: number, clicks: number, countryText: string) => {
        try {
            const updates: any = {};
            if (impressions > 0) updates.impressions = increment(impressions);
            if (clicks > 0) updates.clicks = increment(clicks);
            
            // Add countries if supplied
            if (countryText.trim()) {
                updates.countryReach = arrayUnion(...countryText.split(',').map((c: string) => c.trim().toUpperCase()));
            }

            if (Object.keys(updates).length > 0) {
                await updateDoc(doc(db, "campaigns", campId), updates);
                toast.success("Campaign performance injected.");
                fetchData();
            }
        } catch (err) {
            toast.error("Failed to inject performance.");
        }
    };

    const handleDeleteCampaign = async (campId: string) => {
        if (!window.confirm("Permenantly delete this campaign?")) return;
        setProcessingId(campId);
        try {
            await deleteDoc(doc(db, "campaigns", campId));
            toast.success("Campaign deleted.");
            fetchData();
        } catch (e) {
            toast.error("Failed to delete campaign.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleApproveAdDeposit = async (dep: any) => {
        setProcessingId(dep.id);
        try {
            const userRef = doc(db, "users", dep.userId);
            const depRef = doc(db, "transactions", dep.id);

            // 1. Credit Ad Wallet + Apply Bonus
            await updateDoc(userRef, {
                adWalletBalance: increment(dep.amount + (dep.bonus || 0))
            });

            // 2. Mark Deposit as Completed
            await updateDoc(depRef, {
                status: "completed",
                approvedAt: serverTimestamp()
            });

            const userDoc = await getDoc(userRef);
            if (userDoc.exists() && userDoc.data().email) {
                await fetch("/api/send-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "custom",
                        to: userDoc.data().email,
                        data: {
                            subject: "Ad Wallet Deposit Approved",
                            html: `<p>Hello ${userDoc.data().displayName || userDoc.data().fullName || "Merchant"},</p>
                                <p>Your ad wallet deposit has been approved.</p>
                                <p><strong>Amount:</strong> $${dep.amount?.toLocaleString()}</p>
                                ${(dep.bonus || 0) > 0 ? `<p><strong>Bonus:</strong> $${dep.bonus.toLocaleString()}</p>` : ""}
                                <p><strong>Total credited:</strong> $${(dep.amount + (dep.bonus || 0)).toLocaleString()}</p>`
                        }
                    })
                });
            }

            toast.success("Merchant Ad Wallet Credited & Email Sent!");
            fetchData();
        } catch (err) {
            toast.error("Deposit confirmation failed.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectAdDeposit = async (dep: any) => {
        const reason = window.prompt("Enter the deposit rejection reason. This will be emailed to the merchant:");
        const cleanReason = reason?.trim();
        if (!cleanReason) {
            toast.error("A rejection reason is required.");
            return;
        }

        setProcessingId(`reject-deposit-${dep.id}`);
        try {
            const userRef = doc(db, "users", dep.userId);
            await updateDoc(doc(db, "transactions", dep.id), {
                status: "declined",
                declineReason: cleanReason,
                declinedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            const userDoc = await getDoc(userRef);
            if (userDoc.exists() && userDoc.data().email) {
                await fetch("/api/send-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "custom",
                        to: userDoc.data().email,
                        data: {
                            subject: "Ad Wallet Deposit Rejected",
                            html: `<p>Hello ${userDoc.data().displayName || userDoc.data().fullName || "Merchant"},</p>
                                <p>Your ad wallet deposit request for <strong>$${dep.amount?.toLocaleString()}</strong> was rejected.</p>
                                <p><strong>Reason:</strong> ${cleanReason}</p>
                                <p>Please submit a new receipt after correcting the issue.</p>`
                        }
                    })
                });
            }

            toast.success("Ad deposit rejected & email sent.");
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error("Deposit rejection failed.");
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-zinc-950">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <div>
                <h1 className="text-2xl font-bold text-white">Ad Network</h1>
                <p className="text-sm text-zinc-500 mt-1">Manage campaigns, ad deposits, and performance metrics.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Campaigns */}
                <div className="bg-white/[0.03] border border-white/[0.06] p-5 rounded-xl space-y-4 h-fit">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-indigo-400" />
                            <h2 className="text-sm font-semibold text-white">Campaigns</h2>
                        </div>
                        <span className="text-xs text-zinc-500 bg-white/[0.04] px-2.5 py-1 rounded border border-white/[0.06]">{campaigns.filter(c => c.status === 'scheduled' || c.status === 'reviewing').length} pending</span>
                    </div>

                    <div className="space-y-3">
                        {campaigns.length === 0 ? (
                            <div className="py-8 text-center">
                                <p className="text-sm text-zinc-600">No campaigns found</p>
                            </div>
                        ) : (
                            campaigns.map((c) => {
                                const todayStr = new Date().toISOString().split('T')[0];
                                const isExpired = c.endDate && c.endDate < todayStr;
                                const dStatus = isExpired ? 'completed' : c.status;
                                return (
                                <div key={c.id} className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-lg group hover:border-indigo-500/30 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-xs font-semibold text-zinc-400 border border-white/[0.06] uppercase">
                                                {c.platform?.slice(0,1) || 'A'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{c.productName || 'Campaign'}</p>
                                                <p className="text-xs text-zinc-500">{c.platform || 'General'} • {c.totalBudget ? `$${c.totalBudget.toLocaleString()}` : 'Custom'}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5">
                                            <span className={cn(
                                                "inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded border",
                                                dStatus === 'active' 
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                                    : (dStatus === 'scheduled' || dStatus === 'reviewing')
                                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                    : dStatus === 'completed'
                                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                            )}>
                                                {dStatus || 'queued'}
                                            </span>
                                            <button 
                                                onClick={() => handleDeleteCampaign(c.id)}
                                                className="text-zinc-600 hover:text-rose-400 transition-colors p-1"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {(dStatus === 'scheduled' || dStatus === 'reviewing') && (
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                        <button
                                            onClick={() => handleApproveCampaign(c)}
                                            disabled={!!processingId}
                                            className="w-full h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                                        >
                                            {processingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                            Activate Campaign
                                        </button>
                                        <button
                                            onClick={() => handleRejectCampaign(c)}
                                            disabled={!!processingId}
                                            className="w-full h-9 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                                        >
                                            {processingId === `reject-${c.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                                            Reject
                                        </button>
                                        </div>
                                    )}

                                    {dStatus === 'active' && (
                                        <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
                                            <p className="text-xs text-zinc-500">Inject performance metrics</p>
                                            <form 
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    const form = e.target as any;
                                                    handleBoost(
                                                        c.id, 
                                                        parseInt(form.impressions.value || '0'), 
                                                        parseInt(form.clicks.value || '0'),
                                                        form.countries.value || ''
                                                    );
                                                    form.reset();
                                                }}
                                                className="space-y-3"
                                            >
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input 
                                                        type="number" 
                                                        name="impressions"
                                                        placeholder="+ Impressions" 
                                                        className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white px-3 focus:border-indigo-500/40 transition-colors placeholder:text-zinc-600"
                                                    />
                                                    <input 
                                                        type="number" 
                                                        name="clicks"
                                                        placeholder="+ Clicks" 
                                                        className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white px-3 focus:border-indigo-500/40 transition-colors placeholder:text-zinc-600"
                                                    />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    name="countries"
                                                    placeholder="Countries (e.g. US, UK, CA)" 
                                                    className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white px-3 focus:border-indigo-500/40 transition-colors placeholder:text-zinc-600"
                                                />
                                                <button type="submit" className="w-full h-9 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white text-xs font-medium rounded-lg transition-colors">
                                                    Inject Metrics
                                                </button>
                                            </form>
                                            {c.countryReach && c.countryReach.length > 0 && (
                                                <div className="mt-2 text-[8px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 p-2 rounded-lg break-words">
                                                    📍 {Array.isArray(c.countryReach) ? c.countryReach.join(', ') : c.countryReach}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )})
                        )}
                    </div>
                </div>

                {/* Ad Wallet Deposits */}
                <div className="bg-white/[0.03] border border-white/[0.06] p-5 rounded-xl space-y-4 h-fit">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-blue-400" />
                            <h2 className="text-sm font-semibold text-white">Ad Deposits</h2>
                        </div>
                        <span className="text-xs text-zinc-500 bg-white/[0.04] px-2.5 py-1 rounded border border-white/[0.06]">{adDeposits.length} pending</span>
                    </div>

                    <div className="space-y-3">
                        {adDeposits.length === 0 ? (
                            <div className="py-8 text-center">
                                <p className="text-sm text-zinc-600">No pending deposits</p>
                            </div>
                        ) : (
                            adDeposits.map((d) => (
                                <div key={d.id} className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-lg">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-sm font-medium text-white">{d.userName || 'Merchant'}</p>
                                            <p className="text-xs text-zinc-500">{d.method?.toUpperCase() || 'Transfer'} • {d.asset?.toUpperCase()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-white">${d.amount?.toLocaleString()}</p>
                                            {d.bonus > 0 && <p className="text-xs text-emerald-400">+${d.bonus} bonus</p>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => handleApproveAdDeposit(d)}
                                            disabled={!!processingId}
                                            className="w-full h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                                        >
                                            {processingId === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleRejectAdDeposit(d)}
                                            disabled={!!processingId}
                                            className="w-full h-9 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                                        >
                                            {processingId === `reject-deposit-${d.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center shrink-0">
                        <BarChart3 className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-xs text-zinc-500">Total Impressions</p>
                        <p className="text-xl font-bold text-white">142.8M+</p>
                    </div>
                </div>
                <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-xs text-zinc-500">Avg Conversion Rate</p>
                        <p className="text-xl font-bold text-white">8.4%</p>
                    </div>
                </div>
                <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-xs text-zinc-500">Active Campaigns</p>
                        <p className="text-xl font-bold text-white">{campaigns.filter(c => c.status === 'active').length}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

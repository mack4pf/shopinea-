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

            toast.success("Merchant Ad Wallet Credited!");
            fetchData();
        } catch (err) {
            toast.error("Deposit confirmation failed.");
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
        <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                        <Megaphone className="w-5 h-5 text-indigo-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 leading-none">Marketing Ops</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tight italic uppercase text-white">Ad Network Hub</h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] pl-1">Campaign Propagation • Wallet Refuels • Traffic Approval</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Meta & TikTok Campaigns */}
                <div className="bg-indigo-600/5 border border-indigo-600/10 p-10 rounded-[3rem] space-y-8 shadow-2xl relative overflow-hidden h-fit">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/5 rounded-full blur-[100px] -mr-40 -mt-40" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 bg-indigo-500/10 rounded-[1.5rem] flex items-center justify-center">
                            <Target className="w-8 h-8 text-indigo-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white italic tracking-tight leading-none mb-1">AI Ad Propagation</h2>
                            <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em]">Live Traffic Requests ({campaigns.filter(c => c.status === 'scheduled' || c.status === 'reviewing').length})</p>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        {campaigns.length === 0 ? (
                            <div className="py-10 text-center bg-zinc-950/50 rounded-[2rem] border border-zinc-800 border-dashed">
                                <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest italic">No active traffic requests</p>
                            </div>
                        ) : (
                            campaigns.map((c) => {
                                const todayStr = new Date().toISOString().split('T')[0];
                                const isExpired = c.endDate && c.endDate < todayStr;
                                const dStatus = isExpired ? 'completed' : c.status;
                                return (
                                <div key={c.id} className="bg-zinc-950 border border-zinc-800 p-6 rounded-[2rem] group hover:border-indigo-500/50 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center font-black text-[10px] text-zinc-500 border border-zinc-800 uppercase group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-all">
                                                {c.platform?.slice(0,1) || 'A'}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black italic text-white leading-none mb-1 uppercase tracking-tight">{c.productName || 'Global Campaign'}</p>
                                                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{c.platform || 'General'} Network • {c.totalBudget ? `$${c.totalBudget.toLocaleString()}` : 'Custom Budget'}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-full border",
                                                dStatus === 'active' 
                                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10' 
                                                    : (dStatus === 'scheduled' || dStatus === 'reviewing')
                                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/10 animate-pulse'
                                                    : dStatus === 'completed'
                                                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/10'
                                                    : 'bg-rose-500/10 text-rose-500 border-rose-500/10'
                                            )}>
                                                {dStatus?.toUpperCase() || 'QUEUED'}
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteCampaign(c.id)}
                                                className="text-zinc-600 hover:text-rose-500 transition-colors p-1"
                                                title="Delete Campaign"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {(dStatus === 'scheduled' || dStatus === 'reviewing') && (
                                        <Button 
                                            onClick={() => handleApproveCampaign(c)}
                                            disabled={!!processingId}
                                            className="w-full h-12 bg-white text-black font-black italic rounded-xl gap-2 shadow-xl shadow-white/5 text-[9px] uppercase tracking-widest mt-2"
                                        >
                                            {processingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                            ACTIVATE CAMPAIGN
                                        </Button>
                                    )}

                                    {dStatus === 'active' && (
                                        <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
                                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest italic">Inject Performance Metrics</p>
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
                                                        className="w-full h-10 bg-zinc-900 border-zinc-800 rounded-lg text-[10px] font-black text-white px-3 focus:border-indigo-500 transition-colors uppercase placeholder:text-zinc-600"
                                                    />
                                                    <input 
                                                        type="number" 
                                                        name="clicks"
                                                        placeholder="+ Conversions" 
                                                        className="w-full h-10 bg-zinc-900 border-zinc-800 rounded-lg text-[10px] font-black text-white px-3 focus:border-indigo-500 transition-colors uppercase placeholder:text-zinc-600"
                                                    />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    name="countries"
                                                    placeholder="Add Countries (e.g. US, UK, CA)" 
                                                    className="w-full h-10 bg-zinc-900 border-zinc-800 rounded-lg text-[10px] font-black text-white px-3 focus:border-indigo-500 transition-colors uppercase placeholder:text-zinc-600"
                                                />
                                                <Button type="submit" variant="secondary" className="w-full h-10 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white font-black text-[9px] uppercase tracking-widest">
                                                    INJECT DATA PROTOCOL
                                                </Button>
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

                {/* Ad Wallet Refuels */}
                <div className="bg-indigo-600/5 border border-indigo-600/10 p-10 rounded-[3rem] space-y-8 shadow-2xl relative overflow-hidden h-fit">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 rounded-full blur-[100px] -mr-40 -mt-40" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 bg-blue-500/10 rounded-[1.5rem] flex items-center justify-center">
                            <Wallet className="w-8 h-8 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white italic tracking-tight leading-none mb-1">Capital Inflow</h2>
                            <p className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em]">Merchant Ad Refuels ({adDeposits.length})</p>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        {adDeposits.length === 0 ? (
                            <div className="py-10 text-center bg-zinc-950/50 rounded-[2rem] border border-zinc-800 border-dashed">
                                <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest italic">No pending refuel operations</p>
                            </div>
                        ) : (
                            adDeposits.map((d) => (
                                <div key={d.id} className="bg-zinc-950 border border-zinc-800 p-8 rounded-[2.5rem] space-y-6 group hover:border-blue-500/50 transition-all shadow-xl">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center font-black text-[10px] text-zinc-500 border border-zinc-800 uppercase group-hover:bg-blue-600 group-hover:text-white transition-all shadow-md">
                                                <DollarSign className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black italic text-white leading-none mb-1 uppercase tracking-tight">{d.userName || 'Merchant'}</p>
                                                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{d.method?.toUpperCase() || 'TRANSFER'} • {d.asset?.toUpperCase()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black italic text-white tracking-tighter">${d.amount?.toLocaleString()}</p>
                                            {d.bonus > 0 && <p className="text-[9px] font-black text-emerald-500 uppercase">Bonus +${d.bonus}</p>}
                                        </div>
                                    </div>

                                    <Button 
                                        onClick={() => handleApproveAdDeposit(d)}
                                        disabled={!!processingId}
                                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black italic rounded-xl gap-2 shadow-xl shadow-blue-500/20 text-[9px] uppercase tracking-widest"
                                    >
                                        {processingId === d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                        CONFIRM CAPITAL INFLOW
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-10 bg-indigo-600/5 border border-indigo-600/10 rounded-[3rem] shadow-2xl space-y-4">
                    <BarChart3 className="w-10 h-10 text-indigo-500" />
                    <div>
                        <h4 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none mb-1">Global Impression Flux</h4>
                        <p className="text-4xl font-black text-white italic tracking-tighter">142.8M+</p>
                        <p className="text-zinc-600 font-bold text-[9px] uppercase tracking-widest mt-2">Active AI-Optimized AI Ad Delivery Instances</p>
                    </div>
                </div>
                <div className="p-10 bg-blue-600/5 border border-blue-600/10 rounded-[3rem] shadow-2xl space-y-4">
                    <TrendingUp className="w-10 h-10 text-blue-500" />
                    <div>
                        <h4 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none mb-1">Conversion Velocity</h4>
                        <p className="text-4xl font-black text-white italic tracking-tighter">8.4%</p>
                        <p className="text-zinc-600 font-bold text-[9px] uppercase tracking-widest mt-2">Avg merchant scaling ROI across Meta & TikTok</p>
                    </div>
                </div>
                <div className="p-10 bg-rose-600/5 border border-rose-600/10 rounded-[3rem] shadow-2xl space-y-4">
                    <CheckCircle2 className="w-10 h-10 text-rose-500" />
                    <div>
                        <h4 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none mb-1">Active Ad Units</h4>
                        <p className="text-4xl font-black text-white italic tracking-tighter">{campaigns.filter(c => c.status === 'active').length}</p>
                        <p className="text-zinc-600 font-bold text-[9px] uppercase tracking-widest mt-2">Validated merchant campaigns in high-burn rotation</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

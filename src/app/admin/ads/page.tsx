"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase/config";
import { collection, query, getDocs, orderBy, updateDoc, doc, increment, where, serverTimestamp, getDoc } from "firebase/firestore";
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
    Wallet
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

    const handleApproveCampaign = async (campId: string) => {
        setProcessingId(campId);
        try {
            await updateDoc(doc(db, "campaigns", campId), {
                status: "active",
                approvedAt: serverTimestamp()
            });
            toast.success("Ad Campaign Propagated!");
            fetchData();
        } catch (err) {
            toast.error("Failed to activate campaign.");
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
                            <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em]">Live Traffic Requests ({campaigns.filter(c => c.status === 'scheduled').length})</p>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        {campaigns.length === 0 ? (
                            <div className="py-10 text-center bg-zinc-950/50 rounded-[2rem] border border-zinc-800 border-dashed">
                                <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest italic">No active traffic requests</p>
                            </div>
                        ) : (
                            campaigns.map((c) => (
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
                                        <div className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-full border",
                                            c.status === 'active' 
                                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10' 
                                                : c.status === 'scheduled'
                                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/10 animate-pulse'
                                                : 'bg-rose-500/10 text-rose-500 border-rose-500/10'
                                        )}>
                                            {c.status?.toUpperCase() || 'QUEUED'}
                                        </div>
                                    </div>

                                    {c.status === 'scheduled' && (
                                        <Button 
                                            onClick={() => handleApproveCampaign(c.id)}
                                            disabled={!!processingId}
                                            className="w-full h-12 bg-white text-black font-black italic rounded-xl gap-2 shadow-xl shadow-white/5 text-[9px] uppercase tracking-widest"
                                        >
                                            {processingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                            ACTIVATE CAMPAIGN
                                        </Button>
                                    )}
                                </div>
                            ))
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

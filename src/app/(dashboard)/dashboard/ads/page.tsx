"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy, onSnapshot, doc, getDoc, addDoc, serverTimestamp, updateDoc, increment } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    Megaphone, Target, Sparkles, Plus, Loader2, Rocket, Wallet,
    Globe, Youtube, Facebook, Zap, Lock, Calendar, Coins,
    UserCheck, AlertTriangle, Play, Check, ShoppingCart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdDepositModal } from "@/components/modals/AdDepositModal";
import { KYCModal } from "@/components/modals/KYCModal";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Campaign {
    id: string;
    productName: string | string[];
    targetType: 'store' | 'products';
    status: string;
    impressions: number;
    clicks: number;
    spend: number;
    platform: string;
    startDate: string;
    endDate: string;
    dailyBudget: number;
    isPostpaid: boolean;
    countryReach?: string | string[];
}

export default function AdsPage() {
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showKYCModal, setShowKYCModal] = useState(false);
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [creatingCampaign, setCreatingCampaign] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);

    const [targetType, setTargetType] = useState<'store' | 'products'>('store');
    const [selectedPlatform, setSelectedPlatform] = useState("meta");
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [budget, setBudget] = useState("100");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [startTime, setStartTime] = useState("09:00");
    const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
    const [paymentMode, setPaymentMode] = useState<'now' | 'later'>('now');

    const todayStr = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                const userRef = doc(db, "users", firebaseUser.uid);
                const unsubUser = onSnapshot(userRef, (snap) => { setUserData({ id: firebaseUser.uid, ...snap.data() }); });
                const q = query(collection(db, "campaigns"), where("sellerId", "==", firebaseUser.uid), orderBy("createdAt", "desc"));
                const unsubSnap = onSnapshot(q, (snapshot) => {
                    setCampaigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Campaign[]);
                    setLoading(false);
                });
                return () => { unsubUser(); unsubSnap(); };
            } else { setLoading(false); }
        });
        return () => unsubscribe();
    }, []);

    const calculateDays = () => {
        if (!startDate || !endDate) return 0;
        const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
    };

    const days = calculateDays();
    const dailySpend = days > 0 ? (parseFloat(budget) / days) : 0;
    const budgetNum = parseFloat(budget) || 0;
    const maxDays = budgetNum < 100 ? 20 : 365;

    const getMaxEndDate = () => {
        if (!startDate) return "";
        const d = new Date(startDate);
        d.setDate(d.getDate() + maxDays - 1);
        return d.toISOString().split('T')[0];
    };

    const toggleProduct = (name: string) => {
        setSelectedProducts(p => p.includes(name) ? p.filter(i => i !== name) : [...p, name]);
    };

    const handleCreateCampaign = async () => {
        if (targetType === 'products' && selectedProducts.length === 0) { toast.error("Select at least one product."); return; }
        if (!startDate || !endDate) { toast.error("Please pick start and end dates."); return; }
        if (days <= 0) { toast.error("End date must be after start date."); return; }
        if (days > maxDays) { toast.error(`Max campaign length is ${maxDays} days for this budget.`); return; }
        if (startDate < todayStr) { toast.error("Start date cannot be in the past."); return; }
        if (!budgetNum || budgetNum <= 0) { toast.error("Enter a valid budget."); return; }

        if (paymentMode === 'now') {
            if ((userData?.adWalletBalance || 0) < budgetNum) {
                toast.error(`Insufficient balance ($${userData?.adWalletBalance || 0}). Please add funds.`);
                setShowCampaignModal(false);
                setTimeout(() => setShowDepositModal(true), 300);
                return;
            }
        } else {
            if (userData?.kycStatus !== 'verified') {
                toast.error("Identity verification required for postpaid ads.");
                setShowCampaignModal(false);
                setTimeout(() => setShowKYCModal(true), 300);
                return;
            }
        }

        setCreatingCampaign(true);
        if (targetType === 'products') { setGeneratingAI(true); await new Promise(r => setTimeout(r, 4500)); setGeneratingAI(false); }

        try {
            if (paymentMode === 'now') {
                await updateDoc(doc(db, "users", user.uid), { adWalletBalance: increment(-budgetNum) });
            } else {
                await updateDoc(doc(db, "users", user.uid), { pendingAdDebt: increment(budgetNum) });
            }

            await addDoc(collection(db, "campaigns"), {
                sellerId: user.uid, targetType,
                productName: targetType === 'products' ? selectedProducts : 'Store Wide',
                platform: selectedPlatform, totalBudget: budgetNum, dailyBudget: dailySpend,
                startDate, endDate,
                startTime: scheduleMode === 'later' ? startTime : new Date().toTimeString().slice(0, 5),
                scheduleMode, status: "reviewing", impressions: 0, clicks: 0, spend: 0,
                isPostpaid: paymentMode === 'later', countryReach: [], createdAt: serverTimestamp()
            });

            await fetch("/api/send-email", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "custom", to: user.email,
                    data: {
                        subject: `Campaign Submitted - ${selectedPlatform.toUpperCase()}`,
                        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb;border-radius:12px;border:1px solid #e5e7eb;">
                            <h2 style="color:#111827;">Campaign Submitted</h2>
                            <p style="color:#4b5563;">Your ${selectedPlatform.toUpperCase()} campaign is under review. We'll notify you once it's approved.</p>
                        </div>`
                    }
                })
            });

            toast.success(`Campaign submitted for review on ${selectedPlatform.toUpperCase()}.`);
            setShowCampaignModal(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to create campaign.");
        } finally { setCreatingCampaign(false); }
    };

    if (loading) return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

    const platformIcons: Record<string, any> = { meta: Facebook, tiktok: Target, google: Globe };

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Advertising</h1>
                    <p className="text-sm text-zinc-500 mt-1">Create and manage ad campaigns to reach more buyers.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-lg">
                        <Wallet className="w-4 h-4 text-blue-400" />
                        <div>
                            <p className="text-xs text-zinc-500">Ad Balance</p>
                            <p className="text-sm font-semibold text-white">${(userData?.adWalletBalance || 0).toLocaleString()}</p>
                        </div>
                        <button onClick={() => setShowDepositModal(true)} className="ml-2 p-1.5 bg-blue-600 rounded-md text-white hover:bg-blue-700 transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <button onClick={() => setShowCampaignModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                        <Zap className="w-4 h-4" /> New Campaign
                    </button>
                </div>
            </div>

            {/* Platform cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { name: "Meta", icon: Facebook, color: "text-blue-400", bg: "bg-blue-500/10" },
                    { name: "TikTok", icon: Target, color: "text-rose-400", bg: "bg-rose-500/10" },
                    { name: "Google", icon: Globe, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                    { name: "YouTube", icon: Youtube, color: "text-red-400", bg: "bg-red-500/10" },
                ].map((p, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex items-center gap-3 hover:bg-white/[0.05] transition-colors cursor-pointer">
                        <div className={`w-10 h-10 ${p.bg} rounded-lg flex items-center justify-center`}>
                            <p.icon className={`w-5 h-5 ${p.color}`} />
                        </div>
                        <span className="text-sm font-medium text-zinc-300">{p.name}</span>
                    </div>
                ))}
            </div>

            {/* Campaigns Table */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
                <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-300">Your Campaigns</h3>
                    <span className="text-xs text-zinc-600">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</span>
                </div>

                {campaigns.length === 0 ? (
                    <div className="py-16 text-center">
                        <Rocket className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">No campaigns yet</h3>
                        <p className="text-sm text-zinc-500 max-w-sm mx-auto mb-6">Create your first campaign to start reaching buyers.</p>
                        <button onClick={() => setShowCampaignModal(true)}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                            Create Campaign
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/[0.04] text-xs font-medium text-zinc-500">
                                        <th className="py-3 px-5">Campaign</th>
                                        <th className="py-3 px-4">Budget</th>
                                        <th className="py-3 px-4">Impressions</th>
                                        <th className="py-3 px-4">Clicks</th>
                                        <th className="py-3 px-4">Billing</th>
                                        <th className="py-3 px-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                    {campaigns.map((camp) => {
                                        const isExpired = camp.endDate && camp.endDate < todayStr;
                                        const displayStatus = isExpired ? 'completed' : camp.status;
                                        const PlatformIcon = platformIcons[camp.platform] || Globe;
                                        return (
                                            <tr key={camp.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="py-4 px-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center">
                                                            <PlatformIcon className="w-4 h-4 text-zinc-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-white truncate max-w-[200px]">
                                                                {Array.isArray(camp.productName) ? camp.productName.join(", ") : camp.productName}
                                                            </p>
                                                            <p className="text-xs text-zinc-600">{camp.platform} • {camp.startDate?.slice(5)} → {camp.endDate?.slice(5)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <p className="text-sm font-medium text-white">${camp.dailyBudget?.toFixed(2)}/day</p>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <p className="text-sm text-zinc-300">{(camp.impressions || 0).toLocaleString()}</p>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <p className="text-sm text-zinc-300">{(camp.clicks || 0).toLocaleString()}</p>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={cn("text-[11px] font-medium px-2 py-1 rounded-md",
                                                        camp.isPostpaid ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400')}>
                                                        {camp.isPostpaid ? 'Postpaid' : 'Prepaid'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <span className={cn("text-[11px] font-medium px-2.5 py-1 rounded-md capitalize",
                                                        displayStatus === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                                                        displayStatus === 'completed' ? 'bg-blue-500/10 text-blue-400' :
                                                        'bg-zinc-500/10 text-zinc-400')}>
                                                        {displayStatus}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden space-y-2 p-3">
                            {campaigns.map((camp) => {
                                const isExpired = camp.endDate && camp.endDate < todayStr;
                                const displayStatus = isExpired ? 'completed' : camp.status;
                                const PlatformIcon = platformIcons[camp.platform] || Globe;
                                return (
                                    <div key={camp.id} className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
                                                    <PlatformIcon className="w-4 h-4 text-zinc-400" />
                                                </div>
                                                <p className="text-sm font-medium text-white truncate max-w-[180px]">
                                                    {Array.isArray(camp.productName) ? camp.productName.join(", ") : camp.productName}
                                                </p>
                                            </div>
                                            <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded capitalize",
                                                displayStatus === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                                                displayStatus === 'completed' ? 'bg-blue-500/10 text-blue-400' :
                                                'bg-zinc-500/10 text-zinc-400')}>
                                                {displayStatus}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div><p className="text-[10px] text-zinc-600">Budget</p><p className="text-xs font-medium text-white">${camp.dailyBudget?.toFixed(2)}/d</p></div>
                                            <div><p className="text-[10px] text-zinc-600">Impressions</p><p className="text-xs font-medium text-white">{(camp.impressions || 0).toLocaleString()}</p></div>
                                            <div><p className="text-[10px] text-zinc-600">Clicks</p><p className="text-xs font-medium text-white">{(camp.clicks || 0).toLocaleString()}</p></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Modals */}
            <AdDepositModal isOpen={showDepositModal} onClose={() => setShowDepositModal(false)} userId={user?.uid} />
            <KYCModal isOpen={showKYCModal} onClose={() => setShowKYCModal(false)} userId={user?.uid} />

            <Modal isOpen={showCampaignModal} onClose={() => setShowCampaignModal(false)} title="Create Campaign" description="Set up your ad campaign across Meta, TikTok, or Google.">
                {generatingAI ? (
                    <div className="py-16 flex flex-col items-center justify-center space-y-4">
                        <Sparkles className="w-12 h-12 text-blue-500 animate-spin" />
                        <h3 className="text-lg font-semibold text-white">Preparing your campaign...</h3>
                        <p className="text-sm text-zinc-500">Generating content for {selectedPlatform}</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Target type */}
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-zinc-400">Campaign Target</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setTargetType('store')}
                                    className={cn("p-4 rounded-xl border flex flex-col items-center gap-2 transition-colors",
                                        targetType === 'store' ? "border-blue-500 bg-blue-500/10" : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15]")}>
                                    <Globe className={cn("w-6 h-6", targetType === 'store' ? "text-blue-400" : "text-zinc-600")} />
                                    <span className={cn("text-xs font-medium", targetType === 'store' ? "text-blue-400" : "text-zinc-500")}>Entire Store</span>
                                </button>
                                <button onClick={() => setTargetType('products')}
                                    className={cn("p-4 rounded-xl border flex flex-col items-center gap-2 transition-colors",
                                        targetType === 'products' ? "border-emerald-500 bg-emerald-500/10" : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15]")}>
                                    <ShoppingCart className={cn("w-6 h-6", targetType === 'products' ? "text-emerald-400" : "text-zinc-600")} />
                                    <span className={cn("text-xs font-medium", targetType === 'products' ? "text-emerald-400" : "text-zinc-500")}>Specific Products</span>
                                </button>
                            </div>
                        </div>

                        {/* Product selector */}
                        {targetType === 'products' && (
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-zinc-400">Select Products ({selectedProducts.length})</Label>
                                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-3 border border-white/[0.06] rounded-lg bg-white/[0.02]">
                                    {userData?.storeProducts?.map((p: any) => (
                                        <button key={p.id} onClick={() => toggleProduct(p.name)}
                                            className={cn("flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                                                selectedProducts.includes(p.name) ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]')}>
                                            <div className={cn("w-5 h-5 rounded border flex items-center justify-center",
                                                selectedProducts.includes(p.name) ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-700')}>
                                                {selectedProducts.includes(p.name) && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <span className="text-sm text-zinc-300 truncate">{p.name}</span>
                                        </button>
                                    ))}
                                    {(!userData?.storeProducts || userData.storeProducts.length === 0) && (
                                        <p className="text-xs text-zinc-600 text-center py-6">Add products to your store first.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Platform */}
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-zinc-400">Platform</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {['meta', 'tiktok', 'google'].map((p) => (
                                    <button key={p} onClick={() => setSelectedPlatform(p)}
                                        className={cn("py-3 rounded-lg border text-xs font-medium capitalize transition-colors",
                                            selectedPlatform === p ? 'bg-blue-600 border-blue-600 text-white' : 'border-white/[0.08] bg-white/[0.03] text-zinc-500 hover:text-zinc-300')}>
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Schedule */}
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-zinc-400">Start Time</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => { setScheduleMode('now'); setStartDate(todayStr); }}
                                    className={cn("py-3 rounded-lg border text-xs font-medium transition-colors flex items-center justify-center gap-2",
                                        scheduleMode === 'now' ? 'bg-blue-600 border-blue-600 text-white' : 'border-white/[0.08] bg-white/[0.03] text-zinc-500')}>
                                    <Play className="w-3.5 h-3.5" /> Start Now
                                </button>
                                <button onClick={() => setScheduleMode('later')}
                                    className={cn("py-3 rounded-lg border text-xs font-medium transition-colors flex items-center justify-center gap-2",
                                        scheduleMode === 'later' ? 'bg-violet-600 border-violet-600 text-white' : 'border-white/[0.08] bg-white/[0.03] text-zinc-500')}>
                                    <Calendar className="w-3.5 h-3.5" /> Schedule
                                </button>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-zinc-400">Start Date</Label>
                                <Input type="date" value={startDate} min={todayStr}
                                    onChange={(e) => { setStartDate(e.target.value); if (endDate && endDate < e.target.value) setEndDate(""); }}
                                    className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-zinc-400">End Date</Label>
                                <Input type="date" value={endDate} min={startDate || todayStr} max={getMaxEndDate()}
                                    onChange={(e) => setEndDate(e.target.value)} disabled={!startDate}
                                    className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white disabled:opacity-30" />
                            </div>
                        </div>

                        {scheduleMode === 'later' && (
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-zinc-400">Start Time</Label>
                                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                                    className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white" />
                            </div>
                        )}

                        {days > 0 && (
                            <div className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.04] rounded-lg">
                                <span className="text-xs text-zinc-500">Duration: {days} days</span>
                                <span className="text-xs font-medium text-white">${dailySpend.toFixed(2)}/day</span>
                            </div>
                        )}

                        {/* Budget */}
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label className="text-xs font-medium text-zinc-400">Total Budget</Label>
                                <span className="text-sm font-semibold text-white">${budget}</span>
                            </div>
                            <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)}
                                className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white" />
                            {budgetNum > 0 && budgetNum < 100 && (
                                <p className="text-[10px] text-amber-400">Budgets under $100 are limited to {maxDays} days.</p>
                            )}
                        </div>

                        {/* Payment */}
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-zinc-400">Payment</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setPaymentMode('now')}
                                    className={cn("p-4 rounded-xl border flex flex-col items-center gap-2 transition-colors",
                                        paymentMode === 'now' ? "border-white bg-white/[0.08]" : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15]")}>
                                    <Coins className={cn("w-5 h-5", paymentMode === 'now' ? "text-white" : "text-zinc-600")} />
                                    <span className={cn("text-xs font-medium", paymentMode === 'now' ? "text-white" : "text-zinc-500")}>Prepaid</span>
                                </button>
                                <button onClick={() => setPaymentMode('later')}
                                    className={cn("p-4 rounded-xl border flex flex-col items-center gap-2 transition-colors relative",
                                        paymentMode === 'later' ? "border-amber-500 bg-amber-500/10" : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15]")}>
                                    {userData?.kycStatus !== 'verified' && <Lock className="absolute top-2 right-2 w-3 h-3 text-zinc-700" />}
                                    <UserCheck className={cn("w-5 h-5", paymentMode === 'later' ? "text-amber-400" : "text-zinc-600")} />
                                    <span className={cn("text-xs font-medium", paymentMode === 'later' ? "text-amber-400" : "text-zinc-500")}>Postpaid</span>
                                </button>
                            </div>
                            {paymentMode === 'later' && (
                                <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-400/80">Postpaid campaigns must be settled within 48 hours. Requires identity verification.</p>
                                </div>
                            )}
                        </div>

                        <Button onClick={handleCreateCampaign} disabled={creatingCampaign}
                            className={cn("w-full h-12 font-medium rounded-lg text-sm gap-2",
                                paymentMode === 'later' ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white")}>
                            {creatingCampaign ? <Loader2 className="w-4 h-4 animate-spin" /> : "Launch Campaign"}
                        </Button>
                    </div>
                )}
            </Modal>
        </div>
    );
}

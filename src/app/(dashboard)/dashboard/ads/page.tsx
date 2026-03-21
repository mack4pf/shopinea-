"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy, onSnapshot, doc, getDoc, addDoc, serverTimestamp, updateDoc, increment } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    Megaphone,
    Target,
    Sparkles,
    Plus,
    Loader2,
    Rocket,
    Wallet,
    Globe,
    Youtube,
    Facebook,
    Zap,
    CheckCircle2,
    Lock,
    ArrowUpRight,
    Calendar,
    Coins,
    UserCheck,
    AlertTriangle,
    Play,
    Check,
    ShoppingCart,
    Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdDepositModal } from "@/components/modals/AdDepositModal";
import { KYCModal } from "@/components/modals/KYCModal";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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

    // Campaign Form State
    const [targetType, setTargetType] = useState<'store' | 'products'>('store');
    const [selectedPlatform, setSelectedPlatform] = useState("meta");
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [budget, setBudget] = useState("100");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [startTime, setStartTime] = useState("09:00");
    const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
    const [paymentMode, setPaymentMode] = useState<'now' | 'later'>('now');

    // Today's date string for min attribute
    const todayStr = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                const userRef = doc(db, "users", firebaseUser.uid);

                const unsubUser = onSnapshot(userRef, (snap) => {
                    setUserData({ id: firebaseUser.uid, ...snap.data() });
                });

                const q = query(
                    collection(db, "campaigns"),
                    where("sellerId", "==", firebaseUser.uid),
                    orderBy("createdAt", "desc")
                );

                const unsubSnap = onSnapshot(q, (snapshot) => {
                    const list = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as Campaign[];
                    setCampaigns(list);
                    setLoading(false);
                });

                return () => {
                    unsubUser();
                    unsubSnap();
                };
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const calculateDays = () => {
        if (!startDate || !endDate) return 0;
        const d1 = new Date(startDate);
        const d2 = new Date(endDate);
        const diff = d2.getTime() - d1.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
    };

    const days = calculateDays();
    const dailySpend = days > 0 ? (parseFloat(budget) / days) : 0;

    // Max days: 20 for budgets < $100, unlimited for $100+
    const budgetNum = parseFloat(budget) || 0;
    const maxDays = budgetNum < 100 ? 20 : 365;

    // Max end date based on start date and maxDays
    const getMaxEndDate = () => {
        if (!startDate) return "";
        const d = new Date(startDate);
        d.setDate(d.getDate() + maxDays - 1);
        return d.toISOString().split('T')[0];
    };

    const toggleProduct = (name: string) => {
        if (selectedProducts.includes(name)) {
            setSelectedProducts(p => p.filter(i => i !== name));
        } else {
            setSelectedProducts(p => [...p, name]);
        }
    };

    const handleCreateCampaign = async () => {
        // Validate product selection
        if (targetType === 'products' && selectedProducts.length === 0) {
            toast.error("Please select at least one product.");
            return;
        }
        // Validate dates
        if (!startDate || !endDate) {
            toast.error("Please pick start and end dates.");
            return;
        }
        if (days <= 0) {
            toast.error("End date must be after start date.");
            return;
        }
        // Enforce max days
        if (days > maxDays) {
            toast.error(`For a $${budgetNum} budget, max campaign length is ${maxDays} days.`);
            return;
        }
        // Validate start date is not in the past
        if (startDate < todayStr) {
            toast.error("Start date cannot be in the past.");
            return;
        }

        if (!budgetNum || budgetNum <= 0) {
            toast.error("Please enter a valid budget.");
            return;
        }

        const currentAdBalance = userData?.adWalletBalance || 0;

        // PAY NOW: Check balance, if not enough -> open deposit modal
        if (paymentMode === 'now') {
            if (currentAdBalance < budgetNum) {
                toast.error(`Insufficient Ad Balance ($${currentAdBalance}). Please deposit at least $${budgetNum}.`);
                setShowCampaignModal(false);
                setTimeout(() => setShowDepositModal(true), 300);
                return;
            }
        } else {
            // PAY LATER: Check KYC
            if (userData?.kycStatus !== 'verified') {
                toast.error("KYC Verification required for Postpaid Ads.");
                setShowCampaignModal(false);
                setTimeout(() => setShowKYCModal(true), 300);
                return;
            }
        }

        // All good — create campaign
        setCreatingCampaign(true);
        if (targetType === 'products') {
            setGeneratingAI(true);
            await new Promise(r => setTimeout(r, 4500));
            setGeneratingAI(false);
        }

        try {
            if (paymentMode === 'now') {
                await updateDoc(doc(db, "users", user.uid), {
                    adWalletBalance: increment(-budgetNum)
                });
            } else {
                await updateDoc(doc(db, "users", user.uid), {
                    pendingAdDebt: increment(budgetNum)
                });
            }

            await addDoc(collection(db, "campaigns"), {
                sellerId: user.uid,
                targetType,
                productName: targetType === 'products' ? selectedProducts : 'Store Wide',
                platform: selectedPlatform,
                totalBudget: budgetNum,
                dailyBudget: dailySpend,
                startDate,
                endDate,
                startTime: scheduleMode === 'later' ? startTime : new Date().toTimeString().slice(0, 5),
                scheduleMode,
                status: "reviewing",
                impressions: 0,
                clicks: 0,
                spend: 0,
                isPostpaid: paymentMode === 'later',
                countryReach: [],
                createdAt: serverTimestamp()
            });

            await fetch("/api/send-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "custom",
                    to: user.email,
                    data: {
                        subject: `Ad Campaign Protocol - ${selectedPlatform.toUpperCase()}`,
                        html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
                            <h2 style="color: #111827; margin-bottom: 16px;">Campaign Initialization Queued</h2>
                            <p style="color: #4b5563; line-height: 1.6;">Your ad is currently being reviewed by <strong>${selectedPlatform.toUpperCase()}</strong>.</p>
                            <p style="color: #4b5563; line-height: 1.6;">Please note that you are using our ad manager accounts to run your ads, ensuring all operations are fully connected within our ecosystem.</p>
                            <p style="color: #4b5563; line-height: 1.6;">Our compliance nodes will notify you once the traffic protocol is approved and active.</p>
                        </div>`
                    }
                })
            });

            toast.success(`Your ad is currently being reviewed by ${selectedPlatform.toUpperCase()}`);
            setShowCampaignModal(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to launch campaign.");
        } finally {
            setCreatingCampaign(false);
        }
    };

    if (loading) return (
        <div className="h-[80vh] flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
    );

    return (
        <div className="space-y-12 pb-16 animate-in fade-in duration-700">
            {/* Ad Wallet & Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start lg:items-center gap-10 bg-zinc-900 border border-zinc-800 p-12 rounded-[3.5rem] relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -mr-64 -mt-64" />

                <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <Megaphone className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400">Global Sales Accelerator</span>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter italic leading-none">Campaigns</h1>
                    <p className="text-zinc-500 font-extrabold text-sm tracking-tight uppercase tracking-widest opacity-80">Scale to thousands of orders daily with One-Click AI Ads.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 w-full md:w-auto relative z-10">
                    <div className="bg-zinc-950/50 backdrop-blur-3xl p-6 px-10 rounded-[2.5rem] border border-zinc-800 flex items-center gap-8 shadow-2xl">
                        <div className="w-16 h-16 rounded-[2rem] bg-blue-600/10 flex items-center justify-center border border-blue-600/20 shadow-inner">
                            <Wallet className="w-8 h-8 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.2em] mb-1">Ad Capacity</p>
                            <h3 className="text-3xl font-black text-white tracking-tighter italic">${(userData?.adWalletBalance || 0).toLocaleString()}</h3>
                        </div>
                        <Button onClick={() => setShowDepositModal(true)} size="sm" className="ml-6 bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest flex gap-2 shadow-2xl shadow-blue-500/30">
                            <Plus className="w-4 h-4" /> REFUEL
                        </Button>
                    </div>
                    <Button onClick={() => setShowCampaignModal(true)} className="h-[92px] px-12 rounded-[2.5rem] bg-white text-zinc-950 font-black flex gap-4 hover:scale-105 transition-all shadow-2xl uppercase text-[11px] tracking-[0.1em] italic group">
                        <Zap className="w-6 h-6 fill-zinc-950 group-hover:animate-bounce" />
                        LAUNCH NEW ADS 🚀
                    </Button>
                </div>
            </div>

            {/* Platform Shortcuts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                    { name: "Meta Business", icon: Facebook, color: "text-blue-500", bg: "bg-blue-500/10", border: 'border-blue-500/20' },
                    { name: "TikTok Ads", icon: Target, color: "text-rose-500", bg: "bg-rose-500/10", border: 'border-rose-500/20' },
                    { name: "Google Search", icon: Globe, color: "text-emerald-500", bg: "bg-emerald-500/10", border: 'border-emerald-500/20' },
                    { name: "YT Shorts", icon: Youtube, color: "text-red-500", bg: "bg-red-500/10", border: 'border-red-500/20' },
                ].map((p, i) => (
                    <div key={i} className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 p-8 rounded-[2.5rem] flex items-center justify-between hover:border-blue-500/50 hover:shadow-2xl transition-all cursor-pointer group shadow-xl">
                        <div className="flex items-center gap-6">
                            <div className={`w-16 h-16 rounded-[1.5rem] ${p.bg} border ${p.border} flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all shadow-lg`}>
                                <p.icon className={`w-8 h-8 ${p.color}`} />
                            </div>
                            <h4 className="font-black text-[11px] uppercase tracking-[0.2em] text-zinc-400 group-hover:text-white transition-colors">{p.name}</h4>
                        </div>
                        <ArrowUpRight className="w-5 h-5 text-zinc-800 group-hover:text-blue-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                    </div>
                ))}
            </div>

            {/* Campaign Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl">
                <div className="p-10 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/20 backdrop-blur-xl">
                    <h3 className="text-2xl font-black text-white tracking-tighter italic">Ad Analytics Engine</h3>
                    <div className="flex items-center gap-4">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border-4 border-emerald-500/20" />
                        <span className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.3em]">Quantum Real-time Monitor</span>
                    </div>
                </div>

                {campaigns.length === 0 ? (
                    <div className="py-32 text-center px-10 space-y-10">
                        <div className="w-32 h-32 bg-zinc-950 rounded-[3rem] flex items-center justify-center mx-auto shadow-2xl border border-zinc-800 group hover:rotate-6 transition-transform">
                            <Rocket className="w-16 h-16 text-zinc-800 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-4xl font-black text-white tracking-tighter leading-none italic uppercase">Reach: Zero</h3>
                            <p className="text-zinc-600 font-extrabold text-sm max-w-sm mx-auto uppercase tracking-widest opacity-60">
                                Start your first automated campaign to begin receiving qualified traffic and buyer inquiries.
                            </p>
                        </div>
                        <Button onClick={() => setShowCampaignModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white h-16 px-16 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-500/30 active:scale-95 transition-all">
                            INITIALIZE DEPLOYMENT 🚀
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] border-b border-zinc-800 bg-zinc-950/30">
                                    <th className="px-12 py-8">Target / Channel</th>
                                    <th className="px-12 py-8">Capital Flow</th>
                                    <th className="px-12 py-8 text-right">Reach</th>
                                    <th className="px-12 py-8 text-right">Conversion</th>
                                    <th className="px-12 py-8 text-right">Billing</th>
                                    <th className="px-12 py-8 text-center">Protocol Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {campaigns.map((camp) => {
                                    const isExpired = camp.endDate && camp.endDate < todayStr;
                                    const displayStatus = isExpired ? 'completed' : camp.status;
                                    return (
                                    <tr key={camp.id} className="hover:bg-zinc-800/30 transition-all group">
                                        <td className="px-12 py-10">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-950 flex items-center justify-center border border-zinc-800 group-hover:border-blue-500 group-hover:bg-blue-600/10 transition-all duration-500 shadow-xl">
                                                    {camp.platform === 'meta' && <Facebook className="w-7 h-7 text-blue-500 group-hover:scale-110 transition-transform" />}
                                                    {camp.platform === 'tiktok' && <Target className="w-7 h-7 text-rose-500 group-hover:scale-110 transition-transform" />}
                                                    {camp.platform === 'google' && <Globe className="w-7 h-7 text-emerald-500 group-hover:scale-110 transition-transform" />}
                                                </div>
                                                <div>
                                                    <p className="text-md font-black text-white italic tracking-tighter leading-none mb-2">{Array.isArray(camp.productName) ? camp.productName.join(", ") : camp.productName}</p>
                                                    <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.2em]">{camp.platform} NETWORK</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-12 py-10">
                                            <p className="text-sm font-black text-white italic tracking-tighter">${camp.dailyBudget?.toLocaleString()}/cycle</p>
                                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1 opacity-60">{camp.startDate?.slice(5)} → {camp.endDate?.slice(5)}</p>
                                            {camp.countryReach && camp.countryReach.length > 0 && (
                                                <div className="mt-3 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl inline-block">
                                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                                                        📍 {Array.isArray(camp.countryReach) ? camp.countryReach.join(', ') : camp.countryReach}
                                                    </p>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-12 py-10 text-right font-black text-zinc-500 group-hover:text-blue-500 transition-colors italic text-lg tracking-tighter">
                                            {(camp.impressions || 0).toLocaleString()}
                                        </td>
                                        <td className="px-12 py-10 text-right">
                                            <p className="font-black text-white text-lg tracking-tighter italic">{(camp.clicks || 0).toLocaleString()}</p>
                                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Inquiries</p>
                                        </td>
                                        <td className="px-12 py-10 text-right font-black">
                                            <span className={`text-[10px] uppercase font-black px-4 py-2 rounded-xl italic tracking-widest ${camp.isPostpaid ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                                                {camp.isPostpaid ? 'POSTPAID' : 'PREPAID'}
                                            </span>
                                        </td>
                                        <td className="px-12 py-10 text-center">
                                            <span className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic
                                                ${displayStatus === "active"
                                                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                                                    : displayStatus === "completed"
                                                    ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                                    : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                                                }`}>
                                                {displayStatus}
                                            </span>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            <AdDepositModal
                isOpen={showDepositModal}
                onClose={() => setShowDepositModal(false)}
                userId={user?.uid}
            />

            <KYCModal
                isOpen={showKYCModal}
                onClose={() => setShowKYCModal(false)}
                userId={user?.uid}
            />

            <Modal
                isOpen={showCampaignModal}
                onClose={() => setShowCampaignModal(false)}
                title="Assemble Smart Campaign"
                description="Our AI engine will analyze your products to create high-conversion video ads."
            >
                {generatingAI ? (
                    <div className="py-24 flex flex-col items-center justify-center space-y-10">
                        <div className="relative">
                            <Sparkles className="w-20 h-20 text-blue-500 animate-spin" />
                            <div className="absolute inset-0 w-20 h-20 bg-blue-500/30 blur-2xl scale-150 rounded-full" />
                        </div>
                        <div className="text-center space-y-4">
                            <h3 className="text-3xl font-black text-white italic tracking-tighter">Forging Creative Assets...</h3>
                            <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.3em] animate-pulse">Neural Engine active for {selectedPlatform}</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {/* Target Selection */}
                        <div className="space-y-5">
                            <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em] leading-none pl-1">Targeting Protocol</Label>
                            <div className="grid grid-cols-2 gap-6">
                                <button
                                    onClick={() => setTargetType('store')}
                                    className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 group ${targetType === 'store' ? 'border-blue-600 bg-blue-600/10 shadow-2xl shadow-blue-600/10' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}
                                >
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${targetType === 'store' ? 'bg-blue-600 text-white rotate-6' : 'bg-zinc-900 text-zinc-700 group-hover:text-zinc-500'}`}>
                                        <Globe className="w-8 h-8" />
                                    </div>
                                    <span className={`text-[11px] font-black uppercase tracking-[0.2em] italic ${targetType === 'store' ? 'text-white' : 'text-zinc-600'}`}>GLOBAL STORE</span>
                                </button>
                                <button
                                    onClick={() => setTargetType('products')}
                                    className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 group ${targetType === 'products' ? 'border-emerald-600 bg-emerald-600/10 shadow-2xl shadow-emerald-600/10' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}
                                >
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${targetType === 'products' ? 'bg-emerald-600 text-white rotate-6' : 'bg-zinc-900 text-zinc-700 group-hover:text-zinc-500'}`}>
                                        <ShoppingCart className="w-8 h-8" />
                                    </div>
                                    <span className={`text-[11px] font-black uppercase tracking-[0.2em] italic ${targetType === 'products' ? 'text-white' : 'text-zinc-600'}`}>SPECIFIC ASSETS</span>
                                </button>
                            </div>
                        </div>

                        {/* Product Multi-Select */}
                        {targetType === 'products' && (
                            <div className="space-y-5 animate-in slide-in-from-top-4 duration-500">
                                <div className="flex items-center justify-between px-1">
                                    <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em] leading-none">Asset Inventory ({selectedProducts.length})</Label>
                                    <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-sm animate-pulse">AI VIDEO ACTIVE</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 max-h-56 overflow-y-auto p-4 border border-zinc-800 rounded-[2rem] bg-zinc-950/50 backdrop-blur-md">
                                    {userData?.storeProducts?.map((p: any) => (
                                        <button
                                            key={p.id}
                                            onClick={() => toggleProduct(p.name)}
                                            className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all group ${selectedProducts.includes(p.name) ? 'bg-emerald-500/10 border-emerald-500' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}
                                        >
                                            <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${selectedProducts.includes(p.name) ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-zinc-700 group-hover:border-zinc-600'}`}>
                                                {selectedProducts.includes(p.name) && <Check className="w-4 h-4 text-white" />}
                                            </div>
                                            <span className={`text-[11px] font-black truncate ${selectedProducts.includes(p.name) ? 'text-white' : 'text-zinc-500'}`}>{p.name}</span>
                                        </button>
                                    ))}
                                    {(!userData?.storeProducts || userData.storeProducts.length === 0) && (
                                        <div className="col-span-2 py-12 text-center bg-zinc-900/50 rounded-[2rem] border border-dashed border-zinc-800">
                                            <p className="text-[10px] font-black uppercase text-zinc-700 tracking-widest italic">Inventory Offline — Source products first</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="space-y-5">
                            <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em] leading-none pl-1">Network Deployment</Label>
                            <div className="grid grid-cols-3 gap-4">
                                {['meta', 'tiktok', 'google'].map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setSelectedPlatform(p)}
                                        className={`h-16 rounded-[1.5rem] flex items-center justify-center border-2 font-black uppercase tracking-widest text-[11px] italic transition-all ${selectedPlatform === p ? 'bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-600/20 scale-105' : 'bg-zinc-950 border-zinc-800 text-zinc-700 hover:border-zinc-700'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Schedule Mode: Run Now vs Later */}
                        <div className="space-y-5">
                            <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em] leading-none pl-1">Execution Schedule</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => { setScheduleMode('now'); setStartDate(todayStr); }}
                                    className={`p-6 rounded-[2rem] border-2 transition-all flex items-center gap-4 group ${
                                        scheduleMode === 'now' ? 'border-blue-600 bg-blue-600/10 text-white shadow-2xl shadow-blue-600/10' : 'border-zinc-800 bg-zinc-950 text-zinc-600 hover:border-zinc-700'
                                    }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${scheduleMode === 'now' ? 'bg-blue-600 text-white animate-pulse' : 'bg-zinc-900 text-zinc-800 group-hover:text-zinc-600'}`}>
                                        <Play className="w-6 h-6 fill-current" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[11px] font-black uppercase tracking-wider italic">Instant Run</p>
                                        <p className="text-[9px] font-black text-zinc-600 group-hover:text-zinc-500">Live within 60s</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setScheduleMode('later')}
                                    className={`p-6 rounded-[2rem] border-2 transition-all flex items-center gap-4 group ${
                                        scheduleMode === 'later' ? 'border-indigo-600 bg-indigo-600/10 text-white shadow-2xl shadow-indigo-600/10' : 'border-zinc-800 bg-zinc-950 text-zinc-600 hover:border-zinc-700'
                                    }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${scheduleMode === 'later' ? 'bg-indigo-600 text-white' : 'bg-zinc-900 text-zinc-800 group-hover:text-zinc-600'}`}>
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[11px] font-black uppercase tracking-wider italic">Scheduled</p>
                                        <p className="text-[9px] font-black text-zinc-600 group-hover:text-zinc-500">Pick T-Minus Time</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Date Range */}
                        <div className="space-y-8 bg-zinc-950/50 p-8 rounded-[2.5rem] border border-zinc-800 shadow-inner">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em]">Temporal Window</Label>
                                {budgetNum > 0 && budgetNum < 100 && (
                                    <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 shadow-sm">
                                        RESTRICTED: {maxDays} DAYS MAX
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest pl-1">Start Point</Label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        min={todayStr}
                                        onChange={(e) => {
                                            setStartDate(e.target.value);
                                            if (endDate && endDate < e.target.value) setEndDate("");
                                        }}
                                        className="h-16 bg-zinc-900 border-zinc-800 rounded-2xl font-black text-white px-6 focus:border-blue-500 transition-colors cursor-pointer"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest pl-1">End Point</Label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        min={startDate || todayStr}
                                        max={getMaxEndDate()}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="h-16 bg-zinc-900 border-zinc-800 rounded-2xl font-black text-white px-6 focus:border-blue-500 transition-colors disabled:opacity-30 cursor-pointer"
                                        disabled={!startDate}
                                    />
                                </div>
                            </div>

                            {/* Time picker — only for scheduled */}
                            {scheduleMode === 'later' && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
                                    <Label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest pl-1">Specific Time Code</Label>
                                    <Input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="h-16 bg-indigo-500/10 border-indigo-500/30 rounded-2xl font-black text-white px-6 focus:border-indigo-500 transition-colors cursor-pointer"
                                    />
                                    <p className="text-[9px] text-zinc-600 font-extrabold pl-1 uppercase tracking-widest italic opacity-60">System will sync at exact local timestamp</p>
                                </div>
                            )}

                            {/* Days summary */}
                            {days > 0 && (
                                <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 flex items-center justify-between shadow-2xl">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-2xl bg-zinc-950 flex items-center justify-center border border-zinc-800 text-zinc-500">
                                            <Calendar className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-1">Duration</p>
                                            <p className="text-xl font-black italic text-white">{days} CYCLES</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-1">Burn Rate</p>
                                        <p className="text-xl font-black italic text-white">${dailySpend.toFixed(2)}/DAY</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-5">
                            <div className="flex justify-between items-end px-1">
                                <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em]">Capital Allocation</Label>
                                <div className="text-right">
                                    <span className="text-3xl font-black text-white italic tracking-tighter">${budget}</span>
                                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Ad Units Locked</p>
                                </div>
                            </div>
                            <Input
                                type="number"
                                className="h-20 bg-zinc-950 border-zinc-800 rounded-[2rem] text-3xl font-black text-white px-10 focus:border-blue-500 transition-all shadow-inner"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                            />
                        </div>

                        {/* Payment Strategy */}
                        <div className="space-y-5">
                            <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em] leading-none pl-1">Billing Protocol</Label>
                            <div className="grid grid-cols-2 gap-6">
                                <button
                                    onClick={() => setPaymentMode('now')}
                                    className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 group ${paymentMode === 'now' ? 'border-white bg-white text-zinc-950 shadow-2xl' : 'border-zinc-800 bg-zinc-950 text-zinc-600 hover:border-zinc-700'}`}
                                >
                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${paymentMode === 'now' ? 'bg-zinc-950 text-white' : 'bg-zinc-900 text-zinc-800 group-hover:text-zinc-600'}`}>
                                        <Coins className="w-7 h-7" />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] italic">Prepaid</span>
                                </button>
                                <button
                                    onClick={() => setPaymentMode('later')}
                                    className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 group relative overflow-hidden ${paymentMode === 'later' ? 'border-amber-500 bg-amber-500/10 text-amber-500 shadow-2xl shadow-amber-500/10' : 'border-zinc-800 bg-zinc-950 text-zinc-600 hover:border-zinc-700'}`}
                                >
                                    {userData?.kycStatus !== 'verified' && <Lock className="absolute top-6 right-6 w-5 h-5 text-zinc-800 group-hover:text-amber-500/50 transition-colors" />}
                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${paymentMode === 'later' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-zinc-900 text-zinc-800 group-hover:text-zinc-600'}`}>
                                        <UserCheck className="w-7 h-7" />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] italic">Postpaid</span>
                                </button>
                            </div>
                            {paymentMode === 'later' && (
                                <div className="p-8 bg-amber-500/10 border border-amber-500/20 rounded-[2.5rem] flex gap-5 items-start animate-in fade-in duration-500 shadow-xl shadow-amber-900/5">
                                    <div className="p-3 bg-amber-500/20 rounded-xl">
                                        <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                                    </div>
                                    <p className="text-[10px] font-extrabold text-amber-500/80 leading-relaxed italic uppercase tracking-[0.05em]">
                                        Postpaid ads must be cleared within 48h of completion. Unpaid debts will be attached to your legal profile and reported to Authorities. KYC verification is required.
                                    </p>
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={handleCreateCampaign}
                            disabled={creatingCampaign}
                            className={`w-full h-24 text-white font-black rounded-[2.5rem] shadow-2xl flex gap-6 transition-all hover:scale-[1.03] active:scale-95 text-xs tracking-[0.2em] italic uppercase ${paymentMode === 'later' ? 'bg-amber-600 shadow-amber-600/20' : 'bg-blue-600 shadow-blue-600/20'}`}
                        >
                            {creatingCampaign ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                                <>
                                    {paymentMode === 'now' ? 'AUTHORIZE & DEPLOY CAMPAIGN 🚀' : 'SCHEDULE POSTPAID LAUNCH 📡'}
                                    <Play className="w-6 h-6 fill-current" />
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </Modal>
        </div>
    );
}

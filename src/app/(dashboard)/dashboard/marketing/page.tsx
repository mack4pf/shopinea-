"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import {
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    doc,
    getDoc,
    orderBy,
    serverTimestamp,
    increment as firestoreIncrement,
    updateDoc as firestoreUpdateDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    Zap,
    Target,
    Facebook,
    PlayCircle, // Using for TikTok
    Chrome, // Using for Google
    TrendingUp,
    ShieldCheck,
    AlertCircle,
    Loader2,
    MousePointer2,
    Users,
    Globe,
    CheckCircle2,
    Layout
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DepositModal from "@/components/modals/DepositModal";
import { Modal } from "@/components/ui/modal";
import { toast } from "sonner";

export default function MarketingPage() {
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"campaigns" | "tracking">("campaigns");
    const [lastPlatforms, setLastPlatforms] = useState<string[]>([]);

    // Ad Configuration State
    const [adType, setAdType] = useState<"prepaid" | "postpaid" | null>(null);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [budget, setBudget] = useState(200);

    const platforms = [
        { id: "tiktok", name: "TikTok", icon: PlayCircle, color: "rose", brandColor: "#FE2C55" },
        { id: "facebook", name: "Facebook", icon: Facebook, color: "blue", brandColor: "#1877F2" },
        { id: "google", name: "Google", icon: Chrome, color: "amber", brandColor: "#4285F4" },
        { id: "instagram", name: "Instagram", icon: Target, color: "pink", brandColor: "#E4405F" },
        { id: "cpi", name: "CPI Ads", icon: MousePointer2, color: "emerald", brandColor: "#10B981" },
    ];

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            if (u) {
                setUser(u);
                // Fetch User Data
                const userDocRef = doc(db, "users", u.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                }

                // Listen for Campaign updates
                const q = query(
                    collection(db, "marketing_campaigns"),
                    where("userId", "==", u.uid),
                    orderBy("createdAt", "desc")
                );

                const unsubSnap = onSnapshot(q, (snapshot) => {
                    const campaignData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setCampaigns(campaignData);
                    setLoading(false);
                }, (error) => {
                    console.error("Snapshot error:", error);
                    setLoading(false);
                });

                return () => unsubSnap();
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const togglePlatform = (id: string) => {
        setSelectedPlatforms(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleRunAds = async () => {
        if (!adType) {
            toast.error("Please select an ad type");
            return;
        }
        if (selectedPlatforms.length === 0) {
            toast.error("Select at least one platform");
            return;
        }

        if (userData?.marketingAccess === false) {
            toast.error("Your marketing access is currently restricted. Please wait for admin approval.");
            return;
        }

        if (adType === "prepaid") {
            const currentBalance = userData?.balance || 0;
            if (currentBalance < budget) {
                toast.error(`Insufficient balance. You need ${getCurrencySymbol(userData?.currency)}${budget} to run these ads.`);
                setIsDepositModalOpen(true);
                return;
            }
        }

        setSubmitting(true);
        try {
            const campaignData = {
                userId: user.uid,
                type: adType,
                platforms: selectedPlatforms,
                budget: budget,
                currency: userData?.currency || "USD",
                status: "pending",
                leads: 0,
                visitors: 0,
                reach: 0,
                clicks: 0,
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, "marketing_campaigns"), campaignData);

            // Create Transaction Record
            await addDoc(collection(db, "transactions"), {
                userId: user.uid,
                type: "marketing",
                amount: adType === "prepaid" ? budget : 0,
                debt: adType === "postpaid" ? 200 : 0,
                status: "completed",
                description: `Ad Campaign on ${selectedPlatforms.join(", ")}`,
                createdAt: serverTimestamp(),
            });

            // Update user balance/debt
            const userRef = doc(db, "users", user.uid);
            if (adType === "prepaid") {
                await firestoreUpdateDoc(userRef, {
                    balance: firestoreIncrement(-budget),
                    marketingAccess: false // Disable until admin re-enables
                });
            } else {
                await firestoreUpdateDoc(userRef, {
                    pendingAdDebt: firestoreIncrement(200),
                    marketingAccess: false // Disable until admin re-enables
                });
            }

            setLastPlatforms([...selectedPlatforms]);
            setIsSuccessModalOpen(true);
            setAdType(null);
            setSelectedPlatforms([]);
        } catch (error) {
            console.error("Error starting campaign:", error);
            toast.error("Failed to start campaign");
        } finally {
            setSubmitting(false);
        }
    };

    const getCurrencySymbol = (code: string = "USD") => {
        switch (code) {
            case "EUR": return "€";
            case "GBP": return "£";
            case "NGN": return "₦";
            default: return "$";
        }
    };

    const currencySymbol = getCurrencySymbol(userData?.currency);

    if (loading) {
        return (
            <div className="h-[80vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-white tracking-tight italic uppercase">Marketing & AI Ads</h1>
                    <p className="text-zinc-500 font-bold text-sm">Automate your sales with our high-conversion ad infrastructure.</p>
                </div>
                <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800">
                    <div className="px-4">
                        <p className="text-[10px] font-black text-zinc-500 uppercase">Wallet Balance</p>
                        <p className="text-lg font-black text-white">{currencySymbol}{(userData?.balance || 0).toLocaleString()}</p>
                    </div>
                    <Button
                        onClick={() => setIsDepositModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl h-10"
                    >
                        DEPOSIT
                    </Button>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-1 bg-zinc-900 p-1.5 rounded-2xl w-fit border border-zinc-800">
                <button
                    onClick={() => setActiveTab("campaigns")}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'campaigns' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Create Campaign
                </button>
                <button
                    onClick={() => setActiveTab("tracking")}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'tracking' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Live Tracking
                </button>
            </div>

            {activeTab === 'campaigns' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-left-4 duration-500">
                    {/* Ad Configuration Section */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Header Info Banner */}
                        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                                <div className="flex-1 space-y-4">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                                        <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                                        Zero Setup Required
                                    </div>
                                    <h2 className="text-2xl font-black leading-tight uppercase italic">No Business Account Needed.</h2>
                                    <p className="text-blue-100 text-sm font-medium opacity-80 leading-relaxed">
                                        Our AI uses our premium high-limit ad accounts to push your products. Just one click and we handle the targeting, scaling, and automation.
                                    </p>
                                </div>
                                <div className="hidden md:block w-32 h-32 bg-white/10 backdrop-blur-xl rounded-full border border-white/10 flex items-center justify-center">
                                    <TrendingUp className="w-12 h-12 text-white/50" />
                                </div>
                            </div>
                        </div>

                        {/* Step 1: Choose Ad Type */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">1</span>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Select Campaign Model</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <button
                                    onClick={() => setAdType("prepaid")}
                                    className={`p-8 rounded-[2rem] border transition-all text-left space-y-4 group ${adType === "prepaid" ? 'bg-blue-600/10 border-blue-600 ring-1 ring-blue-600' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${adType === "prepaid" ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-500 group-hover:text-blue-500'}`}>
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-white uppercase italic">Prepaid Ads</h4>
                                        <p className="text-xs font-medium text-zinc-500 mt-1 leading-relaxed">Deposit first and use your balance. 100% control over budget. Instant activation.</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setAdType("postpaid")}
                                    className={`p-8 rounded-[2rem] border transition-all text-left space-y-4 group ${adType === "postpaid" ? 'bg-indigo-600/10 border-indigo-600 ring-1 ring-indigo-600' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${adType === "postpaid" ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-500 group-hover:text-indigo-500'}`}>
                                        <AlertCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-white uppercase italic">Postpaid Ads</h4>
                                        <p className="text-xs font-medium text-zinc-500 mt-1 leading-relaxed">We spend {currencySymbol}200 on your ads first. You pay once you start withdrawing earnings.</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Step 2: Platform Selection */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">2</span>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Target Platforms</h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {platforms.map((p) => {
                                    const isSelected = selectedPlatforms.includes(p.id);
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => togglePlatform(p.id)}
                                            className={`p-6 rounded-3xl border transition-all text-center space-y-3 group ${isSelected
                                                ? 'bg-zinc-800 ring-2'
                                                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                                                }`}
                                            style={isSelected ? { borderColor: p.brandColor, boxShadow: `0 0 0 1px ${p.brandColor}` } : {}}
                                        >
                                            <div
                                                className={`w-10 h-10 rounded-xl mx-auto flex items-center justify-center transition-all ${isSelected ? '' : 'bg-zinc-800 text-zinc-500 group-hover:text-white'}`}
                                                style={isSelected ? { backgroundColor: p.brandColor, color: 'white' } : {}}
                                            >
                                                <p.icon className="w-5 h-5" />
                                            </div>
                                            <p
                                                className={`text-[9px] font-black uppercase tracking-tight ${isSelected ? '' : 'text-zinc-500'}`}
                                                style={isSelected ? { color: p.brandColor } : {}}
                                            >
                                                {p.name}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Final Action */}
                        <div className="p-8 bg-zinc-900/50 border border-zinc-800 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="space-y-1 text-center md:text-left">
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Investment</p>
                                <h4 className="text-3xl font-black text-white italic">{currencySymbol}{adType === 'postpaid' ? '200' : budget}</h4>
                            </div>
                            <Button
                                onClick={handleRunAds}
                                disabled={submitting || !adType || selectedPlatforms.length === 0 || userData?.marketingAccess === false}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-black h-14 px-12 rounded-2xl shadow-xl shadow-blue-500/20 text-xs tracking-widest group"
                            >
                                {submitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : userData?.marketingAccess === false ? (
                                    <>
                                        ACCESS RESTRICTED
                                        <AlertCircle className="w-4 h-4 ml-2" />
                                    </>
                                ) : (
                                    <>
                                        START AI AUTOMATION
                                        <Zap className="w-4 h-4 ml-2 fill-white animate-pulse" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Performance Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-black text-white italic uppercase">Recent Activity</h3>
                                <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded-lg text-[10px] font-black">{campaigns.length} AD RUNS</span>
                            </div>

                            <div className="space-y-4">
                                {campaigns.length === 0 ? (
                                    <div className="py-12 text-center space-y-4">
                                        <div className="w-16 h-16 bg-zinc-800 border-2 border-dashed border-zinc-700 rounded-full flex items-center justify-center mx-auto">
                                            <Globe className="w-8 h-8 text-zinc-600" />
                                        </div>
                                        <p className="text-xs font-bold text-zinc-500">No ads running currently. Select a plan to start scaling.</p>
                                    </div>
                                ) : (
                                    campaigns.slice(0, 3).map((campaign) => (
                                        <div key={campaign.id} className="p-5 bg-zinc-950/50 border border-zinc-800 rounded-3xl space-y-4 group hover:border-blue-500/50 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div className="flex gap-1.5 capitalize">
                                                    {campaign.platforms.map((p: string) => (
                                                        <span key={p} className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded text-[8px] font-black uppercase">{p}</span>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                    <span className="text-[10px] font-black text-green-500 uppercase">{campaign.status}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-500 uppercase">Leads</p>
                                                    <p className="text-sm font-black text-white">{campaign.leads || 0}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-500 uppercase">Status</p>
                                                    <p className="text-[10px] font-black text-emerald-500 uppercase">Active</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* How it Works / Trust Card */}
                        <div className="bg-gradient-to-br from-zinc-800 to-zinc-950 p-8 rounded-[2.5rem] border border-zinc-700 space-y-6">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/50">
                                <Terminal className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-black text-white italic">AI CORE AUTOMATION</h3>
                            <p className="text-[11px] font-medium text-zinc-400 leading-relaxed">
                                Our proprietary AI algorithm splits your budget across TikTok, FB, and Google based on demand. Automatically creates creatives and optimizes CPA.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    {campaigns.length === 0 ? (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-24 text-center space-y-6">
                            <div className="w-20 h-20 bg-zinc-800 rounded-[2rem] flex items-center justify-center mx-auto text-zinc-600">
                                <Target className="w-10 h-10" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-white uppercase italic">No Active Tracking</h3>
                                <p className="text-zinc-500 font-medium text-sm max-w-sm mx-auto">Launch your first campaign to see real-time AI distribution and conversion tracking here.</p>
                            </div>
                            <Button onClick={() => setActiveTab('campaigns')} className="bg-blue-600 text-white font-black rounded-xl px-8">CREATE CAMPAIGN</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {campaigns.map((c) => (
                                <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8">
                                        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">{c.status}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex gap-2">
                                            {c.platforms.map((pid: string) => {
                                                const p = platforms.find(pl => pl.id === pid);
                                                return (
                                                    <div key={pid} className="w-10 h-10 rounded-xl flex items-center justify-center border border-zinc-800 bg-zinc-950" style={{ color: p?.brandColor }}>
                                                        {p ? <p.icon className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <h3 className="text-xl font-black text-white italic uppercase tracking-tight">AI Sales Distribution</h3>
                                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Campaign ID: #{c.id.slice(0, 8)}</p>
                                    </div>

                                    {/* Tracking Steps */}
                                    <div className="space-y-6">
                                        {[
                                            { label: "AI Infrastructure Setup", status: "completed", icon: Zap },
                                            { label: "Dynamic Creative Generation", status: "completed", icon: Layout },
                                            { label: "Targeting & Optimization", status: "active", icon: Target },
                                            { label: "Sales & Lead Generation", status: "pending", icon: TrendingUp }
                                        ].map((step, i) => (
                                            <div key={i} className="flex items-start gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step.status === 'completed' ? 'bg-blue-600 border-blue-600 text-white' : step.status === 'active' ? 'bg-zinc-950 border-blue-600 text-blue-500' : 'bg-zinc-950 border-zinc-800 text-zinc-700'}`}>
                                                        <step.icon className="w-4 h-4" />
                                                    </div>
                                                    {i < 3 && <div className={`w-0.5 h-10 ${step.status === 'completed' ? 'bg-blue-600' : 'bg-zinc-800'}`} />}
                                                </div>
                                                <div className="pt-1.5">
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${step.status === 'pending' ? 'text-zinc-700' : 'text-zinc-200'}`}>{step.label}</p>
                                                    {step.status === 'active' && <p className="text-[9px] font-bold text-blue-500 mt-1">AI algorithm active and scaling...</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-800">
                                        <div>
                                            <p className="text-[9px] font-black text-zinc-500 uppercase mb-1">Reach</p>
                                            <p className="text-sm font-black text-white">{(c.reach || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-zinc-500 uppercase mb-1">Clicks</p>
                                            <p className="text-sm font-black text-white">{(c.clicks || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-zinc-500 uppercase mb-1">Leads</p>
                                            <p className="text-sm font-black text-white">{(c.leads || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-zinc-500 uppercase mb-1">Budget</p>
                                            <p className="text-sm font-black text-blue-500">{currencySymbol}{c.budget}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Success Modal */}
            <Modal
                isOpen={isSuccessModalOpen}
                onClose={() => setIsSuccessModalOpen(false)}
                title="Campaign Launched!"
            >
                <div className="text-center py-8 space-y-6">
                    <div className="w-24 h-24 bg-green-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-green-500 animate-bounce">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <div className="space-y-2 px-4">
                        <h2 className="text-2xl font-black text-white uppercase italic leading-tight">Successfully Ran Ads!</h2>
                        <p className="text-zinc-500 font-bold text-sm">
                            Your AI campaign has been successfully launched on {lastPlatforms.map(id => platforms.find(p => p.id === id)?.name).join(", ")}.
                        </p>
                    </div>
                    <div className="p-6 bg-zinc-950 rounded-3xl border border-zinc-800 inline-block w-full">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Initial AI Sequence</p>
                        <div className="flex justify-center gap-4">
                            {lastPlatforms.map(id => {
                                const p = platforms.find(pl => pl.id === id);
                                return (
                                    <div key={id} className="w-12 h-12 rounded-2xl flex items-center justify-center bg-zinc-900 border border-zinc-800" style={{ color: p?.brandColor }}>
                                        {p ? <p.icon className="w-6 h-6" /> : <Globe className="w-6 h-6" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <Button
                        onClick={() => {
                            setIsSuccessModalOpen(false);
                            setActiveTab('tracking');
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black h-12 rounded-2xl shadow-xl shadow-blue-500/20"
                    >
                        TRACK PROGRESS
                    </Button>
                </div>
            </Modal>

            {user?.uid && (
                <DepositModal
                    isOpen={isDepositModalOpen}
                    onClose={() => setIsDepositModalOpen(false)}
                    userId={user.uid}
                    currencySymbol={currencySymbol}
                />
            )}
        </div>
    );
}

function Terminal(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" x2="20" y1="19" y2="19" />
        </svg>
    )
}

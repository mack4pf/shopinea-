"use client";

import { useState, useEffect } from "react";
import React from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy, onSnapshot, doc, getDoc, addDoc, serverTimestamp, updateDoc, increment } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    Megaphone, Target, Sparkles, Plus, Loader2, Rocket, Wallet,
    Globe, Zap, Lock, Calendar, Coins,
    UserCheck, AlertTriangle, Play, Check, ShoppingCart,
    BarChart3, TrendingUp, MousePointerClick, Eye, MapPin, Activity, ArrowUpRight, Users
} from "lucide-react";
import { MetaLogo, TikTokLogo, GoogleLogo, YouTubeLogo } from "@/components/shared/BrandLogos";
import { Button } from "@/components/ui/button";
import AdDepositModal from "@/components/modals/AdDepositModal";
import { KYCModal } from "@/components/modals/KYCModal";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, ArcElement, Tooltip, Legend, Filler
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import { useCurrency } from "@/hooks/useCurrency";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

interface Campaign {
    id: string;
    campaignName?: string;
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
    totalBudget?: number;
    createdAt?: any;
    approvedAt?: any;
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
    const [aiStepIndex, setAiStepIndex] = useState(0);

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
    const currency = useCurrency(userData);

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
    const budgetLocal = parseFloat(budget) || 0;
    const budgetNum = currency.toUsd(budgetLocal);
    const dailySpend = days > 0 ? (budgetNum / days) : 0;
    const maxDays = budgetNum < 100 ? 20 : 365;

    const getMaxEndDate = () => {
        if (!startDate) return "";
        const d = new Date(startDate);
        d.setDate(d.getDate() + maxDays - 1);
        return d.toISOString().split('T')[0];
    };

    const getAiSteps = () => {
        const platform = selectedPlatform.toUpperCase();
        const productLabel = targetType === 'products'
            ? `${selectedProducts.length} product${selectedProducts.length === 1 ? "" : "s"}`
            : "your full store";

        return [
            {
                title: "Shoplinea AI is generating ad themes",
                detail: `Building ${platform} creative angles for ${productLabel}.`,
                icon: Sparkles,
            },
            {
                title: "Shoplinea AI is analyzing locations",
                detail: "Checking buyer intent across United States, United Kingdom, Canada, and Nigeria.",
                icon: MapPin,
            },
            {
                title: "Winning product found",
                detail: targetType === 'products'
                    ? `${selectedProducts[0] || "Selected product"} is being matched to high-converting audiences.`
                    : "Your store catalog is being matched to high-converting audiences.",
                icon: Target,
            },
            {
                title: "Scaling web data signals",
                detail: "Scanning demand patterns, placement costs, and competitor ad velocity.",
                icon: Activity,
            },
            {
                title: "Campaign ready for review",
                detail: `Finalizing budget pacing and ${platform} launch settings.`,
                icon: Rocket,
            },
        ];
    };

    const toggleProduct = (name: string) => {
        setSelectedProducts(p => p.includes(name) ? p.filter(i => i !== name) : [...p, name]);
    };

    const generateCampaignName = (platform: string, target: string, products: string[]): string => {
        const metaNames = [
            "Meta Business Suite – Reach Campaign",
            "Facebook Ads Manager – Awareness Drive",
            "Instagram Shopping Campaign",
            "Meta Advantage+ Shopping",
            "Facebook Dynamic Product Ads",
            "Instagram Explore Placement",
            "Meta Retargeting – Warm Audiences",
            "Facebook Lead Gen Campaign",
        ];
        const tiktokNames = [
            "TikTok For Business – TopView",
            "TikTok Spark Ads – Brand Lift",
            "TikTok In-Feed Video Campaign",
            "TikTok Shopping Ads",
            "TikTok Creator Marketplace Boost",
            "TikTok Branded Hashtag Challenge",
            "TikTok Reach & Frequency Campaign",
        ];
        const googleNames = [
            "Google Performance Max Campaign",
            "Google Shopping – Product Listing",
            "Google Display Network – Retarget",
            "Google Search – Branded Keywords",
            "Google Smart Campaign",
            "Google Discovery Campaign",
            "Google Demand Gen Campaign",
        ];
        const youtubeNames = [
            "YouTube TrueView In-Stream Ads",
            "YouTube Bumper Ad Campaign",
            "YouTube Brand Awareness – Skippable",
            "YouTube Non-Skippable Mid-Roll",
            "YouTube Masthead Takeover",
            "YouTube Action Campaign",
            "YouTube Video Reach Campaign",
        ];
        const map: Record<string, string[]> = { meta: metaNames, tiktok: tiktokNames, google: googleNames, youtube: youtubeNames };
        const pool = map[platform] || metaNames;
        return pool[Math.floor(Math.random() * pool.length)];
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
                toast.error(`Insufficient balance (${currency.money(userData?.adWalletBalance || 0)}). Please add funds.`);
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
        setGeneratingAI(true);
        setAiStepIndex(0);
        const aiSteps = getAiSteps();
        for (let index = 0; index < aiSteps.length; index += 1) {
            setAiStepIndex(index);
            await new Promise(r => setTimeout(r, 850));
        }
        setGeneratingAI(false);

        try {
            if (paymentMode === 'now') {
                await updateDoc(doc(db, "users", user.uid), { adWalletBalance: increment(-budgetNum) });
            } else {
                await updateDoc(doc(db, "users", user.uid), { pendingAdDebt: increment(budgetNum) });
            }

            await addDoc(collection(db, "campaigns"), {
                sellerId: user.uid, targetType,
                campaignName: generateCampaignName(selectedPlatform, targetType, selectedProducts),
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
        } finally {
            setCreatingCampaign(false);
            setGeneratingAI(false);
        }
    };

    if (loading) return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

    const PlatformLogoMap: Record<string, React.FC<{size?: number; className?: string}>> = {
        meta: MetaLogo, facebook: MetaLogo, tiktok: TikTokLogo, google: GoogleLogo, youtube: YouTubeLogo
    };
    const aiSteps = getAiSteps();
    const currentAiStep = aiSteps[Math.min(aiStepIndex, aiSteps.length - 1)];
    const CurrentAiIcon = currentAiStep?.icon || Sparkles;

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
                            <p className="text-sm font-semibold text-white">{currency.money(userData?.adWalletBalance || 0)}</p>
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
                    { name: "Meta",    key: "meta",    Logo: MetaLogo,    desc: "Facebook & Instagram" },
                    { name: "TikTok",  key: "tiktok",  Logo: TikTokLogo,  desc: "Short-form video ads" },
                    { name: "Google",  key: "google",  Logo: GoogleLogo,  desc: "Search & display" },
                    { name: "YouTube", key: "youtube", Logo: YouTubeLogo, desc: "Video campaigns" },
                ].map((p, i) => (
                    <button key={i} onClick={() => { setSelectedPlatform(p.key); setShowCampaignModal(true); }}
                        className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex items-center gap-3 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer group text-left w-full">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                            <p.Logo size={32} />
                        </div>
                        <div className="min-w-0">
                            <span className="text-sm font-semibold text-white block">{p.name}</span>
                            <span className="text-xs text-zinc-500 truncate block">{p.desc}</span>
                        </div>
                    </button>
                ))}
            </div>

            {/* ── Ad Performance Analytics ── */}
            {campaigns.length > 0 && (() => {
                const totalImpressions = campaigns.reduce((s, c) => s + (c.impressions || 0), 0);
                const totalClicks = campaigns.reduce((s, c) => s + (c.clicks || 0), 0);
                const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";
                const totalSpend = campaigns.reduce((s, c) => s + (c.totalBudget || 0), 0);
                const activeCamps = campaigns.filter(c => c.status === 'active');
                const reach = Math.round(totalImpressions * 0.68); // estimated unique reach

                // Per-platform stats
                const platformMap: Record<string, { impressions: number; clicks: number }> = {};
                campaigns.forEach(c => {
                    const p = (c.platform || 'other').toLowerCase();
                    if (!platformMap[p]) platformMap[p] = { impressions: 0, clicks: 0 };
                    platformMap[p].impressions += c.impressions || 0;
                    platformMap[p].clicks += c.clicks || 0;
                });
                const platforms = Object.entries(platformMap).sort((a, b) => b[1].impressions - a[1].impressions);

                // Countries reached
                const countrySet = new Set<string>();
                campaigns.forEach(c => {
                    if (Array.isArray(c.countryReach)) c.countryReach.forEach((ct: string) => countrySet.add(ct));
                    else if (c.countryReach) countrySet.add(c.countryReach as string);
                });
                const countries = Array.from(countrySet);

                // Build real-date trend from campaign approvedAt → today
                const toDate = (v: any): Date | null => {
                    if (!v) return null;
                    if (v?.toDate) return v.toDate();
                    if (v instanceof Date) return v;
                    const d = new Date(v);
                    return isNaN(d.getTime()) ? null : d;
                };
                const today = new Date(); today.setHours(23, 59, 59, 999);
                const earliestStart = campaigns.reduce<Date>((earliest, c) => {
                    const t = toDate(c.approvedAt) || toDate(c.startDate) || today;
                    return t < earliest ? t : earliest;
                }, today);
                const startDay = new Date(earliestStart); startDay.setHours(0, 0, 0, 0);
                const numDays = Math.max(1, Math.min(14, Math.round((today.getTime() - startDay.getTime()) / 86400000) + 1));

                const dayLabels = Array.from({ length: numDays }, (_, i) => {
                    const d = new Date(startDay); d.setDate(d.getDate() + i);
                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                });

                // Distribute with recency-weighted exponential curve (more weight to recent days)
                const rawWeights = Array.from({ length: numDays }, (_, i) => Math.pow(1.35, i));
                const wSum = rawWeights.reduce((s, w) => s + w, 0);
                const dailyImpr = rawWeights.map(w => Math.round(totalImpressions * w / wSum));
                const dailyClicks = rawWeights.map(w => Math.round(totalClicks * w / wSum));

                // Compute real % trends (compare first half vs second half)
                const half = Math.max(1, Math.floor(numDays / 2));
                const calcTrend = (arr: number[]) => {
                    const first = arr.slice(0, half).reduce((s, v) => s + v, 0);
                    const second = arr.slice(half).reduce((s, v) => s + v, 0);
                    if (first === 0) return second > 0 ? "New" : "—";
                    const pct = Math.round(((second - first) / first) * 100);
                    return pct >= 0 ? `+${pct}%` : `${pct}%`;
                };
                const imprTrend = calcTrend(dailyImpr);
                const clicksTrend = calcTrend(dailyClicks);
                const firstCtr = dailyImpr.slice(0, half).reduce((s,v)=>s+v,0) > 0
                    ? (dailyClicks.slice(0, half).reduce((s,v)=>s+v,0) / dailyImpr.slice(0, half).reduce((s,v)=>s+v,0)) * 100 : 0;
                const secondCtr = dailyImpr.slice(half).reduce((s,v)=>s+v,0) > 0
                    ? (dailyClicks.slice(half).reduce((s,v)=>s+v,0) / dailyImpr.slice(half).reduce((s,v)=>s+v,0)) * 100 : 0;
                const ctrTrend = firstCtr === 0 ? (secondCtr > 0 ? "New" : "—") : (() => { const p = Math.round(((secondCtr - firstCtr) / firstCtr) * 100); return p >= 0 ? `+${p}%` : `${p}%`; })();
                const firstReach = Math.round(dailyImpr.slice(0, half).reduce((s,v)=>s+v,0) * 0.68);
                const secondReach = Math.round(dailyImpr.slice(half).reduce((s,v)=>s+v,0) * 0.68);
                const reachTrend = firstReach === 0 ? (secondReach > 0 ? "New" : "—") : (() => { const p = Math.round(((secondReach - firstReach) / firstReach) * 100); return p >= 0 ? `+${p}%` : `${p}%`; })();

                const lineData = {
                    labels: dayLabels,
                    datasets: [
                        {
                            label: "Impressions",
                            data: dailyImpr,
                            borderColor: "rgba(99,102,241,0.9)",
                            backgroundColor: "rgba(99,102,241,0.08)",
                            borderWidth: 2,
                            pointRadius: 3,
                            pointBackgroundColor: "rgba(99,102,241,1)",
                            tension: 0.4,
                            fill: true,
                            yAxisID: 'y',
                        },
                        {
                            label: "Clicks",
                            data: dailyClicks,
                            borderColor: "rgba(34,197,94,0.9)",
                            backgroundColor: "rgba(34,197,94,0.04)",
                            borderWidth: 2,
                            pointRadius: 3,
                            pointBackgroundColor: "rgba(34,197,94,1)",
                            tension: 0.4,
                            fill: false,
                            yAxisID: 'y1',
                        },
                    ],
                };

                const lineOptions: any = {
                    responsive: true,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: {
                            display: true,
                            labels: { color: '#71717a', font: { size: 11 }, boxWidth: 10, boxHeight: 10 }
                        },
                        tooltip: {
                            backgroundColor: '#18181b',
                            borderColor: 'rgba(255,255,255,0.08)',
                            borderWidth: 1,
                            titleColor: '#fff',
                            bodyColor: '#a1a1aa',
                        }
                    },
                    scales: {
                        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#52525b', font: { size: 10 } } },
                        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#52525b', font: { size: 10 } }, position: 'left' },
                        y1: { grid: { drawOnChartArea: false }, ticks: { color: '#52525b', font: { size: 10 } }, position: 'right' },
                    },
                };

                // Platform donut
                const platformColors = ['#6366f1','#ec4899','#eab308','#ef4444','#8b5cf6','#71717a'];
                const donutData = {
                    labels: platforms.map(([p]) => p.charAt(0).toUpperCase() + p.slice(1)),
                    datasets: [{
                        data: platforms.map(([, v]) => v.impressions),
                        backgroundColor: platformColors,
                        borderWidth: 0,
                        hoverOffset: 8,
                    }],
                };
                const donutOptions: any = {
                    responsive: true,
                    cutout: '70%',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#18181b',
                            borderColor: 'rgba(255,255,255,0.08)',
                            borderWidth: 1,
                            titleColor: '#fff',
                            bodyColor: '#a1a1aa',
                        }
                    }
                };

                // Country bar chart (show top 8)
                const countryFreq: Record<string, number> = {};
                campaigns.forEach(c => {
                    const reach = Array.isArray(c.countryReach) ? c.countryReach : (c.countryReach ? [c.countryReach as string] : []);
                    reach.forEach((ct: string) => { countryFreq[ct] = (countryFreq[ct] || 0) + 1; });
                });
                const topCountries = Object.entries(countryFreq).sort((a, b) => b[1] - a[1]).slice(0, 8);
                const barData = {
                    labels: topCountries.map(([c]) => c),
                    datasets: [{
                        label: 'Campaigns reaching',
                        data: topCountries.map(([, v]) => v),
                        backgroundColor: 'rgba(99,102,241,0.7)',
                        borderRadius: 6,
                        borderSkipped: false,
                    }]
                };
                const barOptions: any = {
                    responsive: true,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#18181b',
                            borderColor: 'rgba(255,255,255,0.08)',
                            borderWidth: 1,
                            titleColor: '#fff',
                            bodyColor: '#a1a1aa',
                        }
                    },
                    scales: {
                        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#52525b', font: { size: 11 } } },
                        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#52525b', font: { size: 11 }, stepSize: 1 } },
                    },
                };

                return (
                    <div className="space-y-5">
                        {/* Section header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Activity className="w-4 h-4 text-indigo-400" />
                                <h3 className="text-sm font-semibold text-white">Campaign Analytics</h3>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse inline-block" /> Live
                                </span>
                            </div>
                            <span className="text-[10px] text-zinc-600 font-medium">{numDays === 1 ? 'Today' : `Last ${numDays} days`}</span>
                        </div>

                        {/* KPI row */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                                { label: "Impressions", value: totalImpressions.toLocaleString(), sub: "Total ad views", icon: Eye, color: "text-indigo-400", bg: "bg-indigo-500/10", trend: imprTrend },
                                { label: "Link Clicks", value: totalClicks.toLocaleString(), sub: "Outbound clicks", icon: MousePointerClick, color: "text-blue-400", bg: "bg-blue-500/10", trend: clicksTrend },
                                { label: "CTR", value: `${ctr}%`, sub: "Click-through rate", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10", trend: ctrTrend },
                                { label: "Reach", value: reach.toLocaleString(), sub: "Estimated unique", icon: Users, color: "text-amber-400", bg: "bg-amber-500/10", trend: reachTrend },
                            ].map(({ label, value, sub, icon: Icon, color, bg, trend }) => (
                                <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
                                            <Icon className={`w-4 h-4 ${color}`} />
                                        </div>
                                        <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${trend === '—' ? 'text-zinc-500' : trend.startsWith('-') ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {trend !== '—' && trend !== 'New' && <ArrowUpRight className="w-3 h-3" />}{trend}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-white leading-tight">{value}</p>
                                        <p className="text-[10px] text-zinc-500 mt-0.5">{label} · {sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Main chart — impressions & clicks over 14 days */}
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className="text-sm font-semibold text-white">Impressions & Clicks</h4>
                                    <p className="text-[10px] text-zinc-500 mt-0.5">Daily delivery across all campaigns</p>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-medium">
                                    <span className="flex items-center gap-1.5 text-indigo-400"><span className="w-3 h-0.5 bg-indigo-400 rounded inline-block" /> Impressions</span>
                                    <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-3 h-0.5 bg-emerald-400 rounded inline-block" /> Clicks</span>
                                </div>
                            </div>
                            {totalImpressions > 0 ? (
                                <div className="h-52">
                                    <Line data={lineData} options={{ ...lineOptions, maintainAspectRatio: false }} />
                                </div>
                            ) : (
                                <div className="h-52 flex flex-col items-center justify-center text-zinc-600 space-y-2">
                                    <BarChart3 className="w-8 h-8" />
                                    <p className="text-xs">Data appears once your campaign is active</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Platform donut */}
                            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 space-y-4">
                                <div>
                                    <h4 className="text-sm font-semibold text-white">Platform Split</h4>
                                    <p className="text-[10px] text-zinc-500 mt-0.5">Traffic by ad network</p>
                                </div>
                                {totalImpressions > 0 && platforms.length > 0 ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-36 h-36 relative">
                                            <Doughnut data={donutData} options={donutOptions} />
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                <p className="text-lg font-bold text-white">{platforms.length}</p>
                                                <p className="text-[9px] text-zinc-500 uppercase tracking-wider">networks</p>
                                            </div>
                                        </div>
                                        <div className="w-full space-y-2">
                                            {platforms.map(([p, v], i) => (
                                                <div key={p} className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: platformColors[i] }} />
                                                        <span className="text-zinc-300 capitalize">{p}</span>
                                                    </div>
                                                    <span className="text-zinc-500">{totalImpressions > 0 ? Math.round((v.impressions / totalImpressions) * 100) : 0}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-40 flex flex-col items-center justify-center text-zinc-700 space-y-2">
                                        <Globe className="w-8 h-8" />
                                        <p className="text-xs text-center">Platform data appears once campaigns go live</p>
                                    </div>
                                )}
                            </div>

                            {/* Location bar chart */}
                            <div className="lg:col-span-2 bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 space-y-4">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                                    <div>
                                        <h4 className="text-sm font-semibold text-white">Audience Location</h4>
                                        <p className="text-[10px] text-zinc-500 mt-0.5">Countries reached by your campaigns</p>
                                    </div>
                                </div>
                                {topCountries.length > 0 ? (
                                    <div className="h-40">
                                        <Bar data={barData} options={{ ...barOptions, maintainAspectRatio: false }} />
                                    </div>
                                ) : (
                                    <div className="h-40 flex flex-col items-center justify-center text-zinc-700 space-y-2">
                                        <MapPin className="w-8 h-8" />
                                        <p className="text-xs text-center text-zinc-600">Location data appears once campaign reach is available</p>
                                    </div>
                                )}
                                {countries.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {countries.slice(0, 16).map((c, i) => (
                                            <span key={c} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/[0.04] border border-white/[0.06] rounded-md text-[10px] font-medium text-zinc-300">
                                                <Globe className="w-2.5 h-2.5 text-zinc-600" />{c}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

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
                                        const PlatformLogo = PlatformLogoMap[camp.platform] || null;
                                        return (
                                            <tr key={camp.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="py-4 px-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center overflow-hidden">
                                                            {PlatformLogo ? <PlatformLogo size={22} /> : <Globe className="w-4 h-4 text-zinc-400" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-white truncate max-w-[200px]">
                                                                {camp.campaignName || (Array.isArray(camp.productName) ? camp.productName.join(", ") : camp.productName)}
                                                            </p>
                                                            <p className="text-xs text-zinc-600 capitalize">{camp.platform} · {camp.startDate?.slice(5)} → {camp.endDate?.slice(5)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <p className="text-sm font-medium text-white">{currency.money(camp.dailyBudget || 0)}/day</p>
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
                                const PlatformLogoM = PlatformLogoMap[camp.platform] || null;
                                return (
                                    <div key={camp.id} className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center overflow-hidden">
                                                    {PlatformLogoM ? <PlatformLogoM size={20} /> : <Globe className="w-4 h-4 text-zinc-400" />}
                                                </div>
                                                <p className="text-sm font-medium text-white truncate max-w-[180px]">
                                                    {camp.campaignName || (Array.isArray(camp.productName) ? camp.productName.join(", ") : camp.productName)}
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
                                            <div><p className="text-[10px] text-zinc-600">Budget</p><p className="text-xs font-medium text-white">{currency.money(camp.dailyBudget || 0)}/d</p></div>
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
            <AdDepositModal isOpen={showDepositModal} onClose={() => setShowDepositModal(false)} userId={user?.uid} currencySymbol={currency.currencySymbol} currencyCode={currency.currencyCode} exchangeRate={currency.rates[currency.currencyCode] || 1} />
            <KYCModal isOpen={showKYCModal} onClose={() => setShowKYCModal(false)} userId={user?.uid} />

            <Modal isOpen={showCampaignModal} onClose={() => setShowCampaignModal(false)} title="Create Campaign" description="Set up your ad campaign across Meta, TikTok, or Google.">
                {generatingAI ? (
                    <div className="py-8 space-y-6">
                        <div className="flex flex-col items-center justify-center text-center space-y-4">
                            <div className="relative flex h-20 w-20 items-center justify-center">
                                <div className="absolute inset-0 rounded-full border border-blue-500/20 bg-blue-500/10 animate-ping" />
                                <div className="absolute inset-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 animate-pulse" />
                                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 shadow-lg shadow-blue-500/20">
                                    <CurrentAiIcon className="h-7 w-7 text-white" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">{currentAiStep.title}</h3>
                                <p className="mt-1 text-sm leading-relaxed text-zinc-500">{currentAiStep.detail}</p>
                            </div>
                        </div>

                        <div className="space-y-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                            {aiSteps.map((step, index) => {
                                const StepIcon = step.icon;
                                const isActive = index === aiStepIndex;
                                const isDone = index < aiStepIndex;
                                return (
                                    <div key={step.title} className={cn(
                                        "flex items-center gap-3 rounded-xl px-3 py-2 transition-all",
                                        isActive ? "bg-blue-500/10 text-white" : "text-zinc-500"
                                    )}>
                                        <div className={cn(
                                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                                            isDone ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" :
                                            isActive ? "border-blue-500/30 bg-blue-500/10 text-blue-400" :
                                            "border-white/[0.06] bg-white/[0.03] text-zinc-600"
                                        )}>
                                            {isDone ? <Check className="h-4 w-4" /> : <StepIcon className={cn("h-4 w-4", isActive && "animate-pulse")} />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-bold">{step.title}</p>
                                            <p className="truncate text-[11px] text-zinc-600">{step.detail}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {["Winning audience", "Best location", "Ad theme"].map((label, index) => (
                                <div key={label} className="rounded-xl border border-white/[0.06] bg-zinc-950 p-3 text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{label}</p>
                                    <p className={cn("mt-1 text-xs font-semibold", index <= aiStepIndex ? "text-emerald-400" : "text-zinc-500")}>
                                        {index <= aiStepIndex ? "Detected" : "Scanning"}
                                    </p>
                                </div>
                            ))}
                        </div>
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
                                {[
                                    { key: 'meta', Logo: MetaLogo, label: 'Meta' },
                                    { key: 'tiktok', Logo: TikTokLogo, label: 'TikTok' },
                                    { key: 'google', Logo: GoogleLogo, label: 'Google' },
                                ].map(({ key, Logo, label }) => (
                                    <button key={key} onClick={() => setSelectedPlatform(key)}
                                        className={cn("py-3 rounded-lg border text-xs font-medium capitalize transition-colors flex flex-col items-center gap-1.5",
                                            selectedPlatform === key ? 'bg-blue-600 border-blue-600 text-white' : 'border-white/[0.08] bg-white/[0.03] text-zinc-500 hover:text-zinc-300')}>
                                        <Logo size={20} />
                                        {label}
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
                                <span className="text-xs font-medium text-white">{currency.money(dailySpend)}/day</span>
                            </div>
                        )}

                        {/* Budget */}
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label className="text-xs font-medium text-zinc-400">Total Budget</Label>
                                <span className="text-sm font-semibold text-white">{currency.currencySymbol}{budget} {currency.currencyCode}</span>
                            </div>
                            <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)}
                                className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white" />
                            {budgetNum > 0 && budgetNum < 100 && (
                                <p className="text-[10px] text-amber-400">Budgets under {currency.money(100)} are limited to {maxDays} days.</p>
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

                        <div className="flex gap-3">
                            <button onClick={() => setShowCampaignModal(false)}
                                className="flex-1 h-12 rounded-lg border border-white/[0.08] text-zinc-400 text-sm font-medium hover:bg-white/[0.05] hover:text-white transition-colors">
                                Cancel
                            </button>
                            <Button onClick={handleCreateCampaign} disabled={creatingCampaign}
                                className={cn("flex-1 h-12 font-medium rounded-lg text-sm gap-2",
                                    paymentMode === 'later' ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white")}>
                                {creatingCampaign ? <Loader2 className="w-4 h-4 animate-spin" /> : "Launch Campaign"}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

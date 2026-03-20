"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    Users,
    Link as LinkIcon,
    Copy,
    TrendingUp,
    DollarSign,
    Plus,
    Clock,
    CheckCircle2,
    UserPlus,
    Share2,
    Loader2,
    Calendar,
    Target,
    Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReferralsPage() {
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [referrals, setReferrals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [referralLink, setReferralLink] = useState("");

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const baseUrl = window.location.origin;
            const code = userData?.referralCode || user?.uid?.slice(0, 8) || '';
            setReferralLink(`${baseUrl}/register?ref=${code}`);
        }
    }, [userData, user]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                }

                // Fetch Referrals
                try {
                    const refQuery = query(
                        collection(db, "users"),
                        where("referredBy", "==", firebaseUser.uid),
                        orderBy("createdAt", "desc"),
                        limit(50)
                    );
                    const refSnap = await getDocs(refQuery);
                    setReferrals(refSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                } catch (err) {
                    console.error("Error fetching referrals:", err);
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }



    const getCurrencySymbol = (code: string = "USD") => {
        switch (code) {
            case "EUR": return "€";
            case "GBP": return "£";
            default: return "$";
        }
    };
    const currencySymbol = getCurrencySymbol(userData?.currency);

    const stats = [
        { label: "Total Referrals", value: referrals.length.toString(), icon: Users, color: "blue" },
        { label: "Active Referrals", value: referrals.filter(r => r.role === 'reseller').length.toString(), icon: Zap, color: "emerald" },
        { label: "Total Earnings", value: `${currencySymbol}${(userData?.referralEarnings || 0).toLocaleString()}`, icon: DollarSign, color: "indigo" },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-white tracking-tight">Referrals & Team</h1>
                    <p className="text-zinc-500 font-bold text-sm">Grow your network and earn commissions from every sale your referrals make.</p>
                </div>
            </div>

            {/* Referral Link Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-white/20 transition-all duration-700"></div>
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                            <LinkIcon className="w-3 h-3" />
                            Your Unique Referral Link
                        </div>
                        <h2 className="text-2xl font-black leading-tight">Share the opportunity and start earning today.</h2>
                        <div className="flex items-center gap-2 bg-black/20 backdrop-blur-xl p-2 rounded-2xl border border-white/10 w-full max-w-xl">
                            <span className="flex-1 px-4 text-sm font-bold truncate opacity-80">{referralLink}</span>
                            <Button
                                onClick={() => copyToClipboard(referralLink)}
                                className="bg-white text-blue-600 hover:bg-zinc-100 rounded-xl font-black text-xs gap-2 shrink-0"
                            >
                                <Copy className="w-4 h-4" />
                                COPY LINK
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] space-y-4 relative overflow-hidden group">
                        <div className={`absolute bottom-0 right-0 w-24 h-24 bg-${stat.color}-500/5 rounded-full blur-2xl -mr-8 -mb-8 group-hover:bg-${stat.color}-500/10 transition-all`} />
                        <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-500/10 flex items-center justify-center`}>
                            <stat.icon className={`w-6 h-6 text-${stat.color}-500`} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">{stat.label}</p>
                            <h3 className="text-3xl font-black text-white tracking-tighter">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Referrals List */}
                <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] space-y-8">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black text-white">Your Downline</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Tier: </span>
                            <span className="px-2 py-1 bg-blue-600/10 text-blue-500 rounded-lg text-[10px] font-black border border-blue-600/20">SILVER</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-zinc-800">
                                    <th className="pb-5 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Member</th>
                                    <th className="pb-5 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Joined</th>
                                    <th className="pb-5 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Orders</th>
                                    <th className="pb-5 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Earnings</th>
                                    <th className="pb-5 px-4 text-right text-[10px] font-black uppercase tracking-widest text-zinc-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {referrals.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-24 text-center">
                                            <div className="space-y-4">
                                                <UserPlus className="w-16 h-16 text-zinc-800 mx-auto" />
                                                <p className="text-zinc-500 font-bold text-sm">No referrals yet. Start sharing!</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    referrals.map((r) => (
                                        <tr key={r.id} className="hover:bg-zinc-800/30 transition-all group">
                                            <td className="py-5 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-blue-500">
                                                        {r.displayName?.[0] || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-white">{r.displayName || 'Unnamed User'}</p>
                                                        <p className="text-[10px] font-bold text-zinc-500">@{r.storeSlug || 'no-store'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-4">
                                                <p className="text-[11px] font-bold text-zinc-400">
                                                    {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                                </p>
                                            </td>
                                            <td className="py-5 px-4">
                                                <p className="text-sm font-black text-white">{r.stats?.totalOrders || 0}</p>
                                            </td>
                                            <td className="py-5 px-4">
                                                <p className="text-sm font-black text-emerald-500">{currencySymbol}{(r.stats?.resellerEarnings || 0).toLocaleString()}</p>
                                            </td>
                                            <td className="py-5 px-4 text-right">
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Benefits / Info */}
                <div className="space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] space-y-6">
                        <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-amber-500" />
                            <h3 className="text-lg font-black text-white">Commission Plan</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700/50 flex justify-between items-center group hover:border-blue-500/50 transition-colors">
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-white">Level 1 (Direct)</p>
                                    <p className="text-[10px] font-bold text-zinc-500">People you refer directly</p>
                                </div>
                                <span className="text-xl font-black text-blue-500">10%</span>
                            </div>
                            <div className="p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700/50 flex justify-between items-center opacity-60">
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-white">Level 2 (Indirect)</p>
                                    <p className="text-[10px] font-bold text-zinc-500">Referred by Level 1</p>
                                </div>
                                <span className="text-xl font-black text-zinc-500">2%</span>
                            </div>
                        </div>
                        <div className="bg-amber-500/10 p-5 rounded-[2rem] border border-amber-500/20 space-y-2">
                            <h4 className="text-xs font-black text-amber-500 flex items-center gap-2">
                                <Target className="w-3.5 h-3.5" />
                                How it works
                            </h4>
                            <p className="text-[11px] font-medium text-amber-200/80 leading-relaxed">
                                You earn 10% of the sale price from every successful order completed by your downline. Earnings are credited instantly to your wallet.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

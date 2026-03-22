"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Users, Copy, DollarSign, Zap, UserPlus, Loader2, Target, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReferralsPage() {
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [referrals, setReferrals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [referralLink, setReferralLink] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const code = userData?.referralCode || user?.uid?.slice(0, 8) || '';
            setReferralLink(`${window.location.origin}/register?ref=${code}`);
        }
    }, [userData, user]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                if (userDoc.exists()) setUserData(userDoc.data());
                try {
                    const refQuery = query(collection(db, "users"), where("referredBy", "==", firebaseUser.uid), orderBy("createdAt", "desc"), limit(50));
                    const refSnap = await getDocs(refQuery);
                    setReferrals(refSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                } catch (err) { console.error("Error fetching referrals:", err); }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const copyLink = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getCurrencySymbol = (code: string = "USD") => {
        switch (code) { case "EUR": return "€"; case "GBP": return "£"; default: return "$"; }
    };
    const currencySymbol = getCurrencySymbol(userData?.currency);

    if (loading) return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Referrals</h1>
                <p className="text-sm text-zinc-500 mt-1">Invite others and earn commissions on their sales.</p>
            </div>

            {/* Referral Link */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-xl text-white">
                <div className="flex items-center gap-2 mb-3">
                    <LinkIcon className="w-4 h-4" />
                    <span className="text-xs font-medium opacity-80">Your Referral Link</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex-1 bg-black/20 rounded-lg px-4 py-2.5 text-sm truncate">{referralLink}</div>
                    <button onClick={copyLink} className="px-4 py-2.5 bg-white text-blue-600 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-zinc-100 transition-colors shrink-0">
                        <Copy className="w-4 h-4" /> {copied ? "Copied!" : "Copy"}
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Total Referrals", value: referrals.length, icon: Users, iconColor: "text-blue-500", iconBg: "bg-blue-500/10" },
                    { label: "Active Sellers", value: referrals.filter(r => r.role === 'reseller').length, icon: Zap, iconColor: "text-emerald-500", iconBg: "bg-emerald-500/10" },
                    { label: "Earnings", value: `${currencySymbol}${(userData?.referralEarnings || 0).toLocaleString()}`, icon: DollarSign, iconColor: "text-violet-500", iconBg: "bg-violet-500/10" },
                ].map((card, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-zinc-500">{card.label}</span>
                            <div className={`w-8 h-8 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                                <card.icon className={`w-4 h-4 ${card.iconColor}`} />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-white">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Referral List */}
                <div className="lg:col-span-2 bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
                    <div className="p-5 border-b border-white/[0.06]">
                        <h3 className="text-sm font-semibold text-zinc-300">Your Referrals</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/[0.04] text-xs font-medium text-zinc-500">
                                    <th className="py-3 px-5">Member</th>
                                    <th className="py-3 px-4">Joined</th>
                                    <th className="py-3 px-4">Orders</th>
                                    <th className="py-3 px-4">Your Earnings</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {referrals.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-16 text-center">
                                            <UserPlus className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                                            <p className="text-sm text-zinc-500">No referrals yet. Share your link!</p>
                                        </td>
                                    </tr>
                                ) : (
                                    referrals.map((r) => (
                                        <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-sm font-semibold text-blue-400">
                                                        {r.displayName?.[0] || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{r.displayName || 'User'}</p>
                                                        <p className="text-xs text-zinc-600">@{r.storeSlug || 'no-store'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <p className="text-xs text-zinc-400">{r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString() : 'N/A'}</p>
                                            </td>
                                            <td className="py-4 px-4">
                                                <p className="text-sm font-medium text-white">{r.stats?.totalOrders || 0}</p>
                                            </td>
                                            <td className="py-4 px-4">
                                                <p className="text-sm font-semibold text-emerald-400">{currencySymbol}{(r.stats?.resellerEarnings || 0).toLocaleString()}</p>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Commission info */}
                <div className="space-y-4">
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Target className="w-4 h-4 text-amber-400" />
                            <h3 className="text-sm font-semibold text-zinc-300">Commission Rates</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-white/[0.03] rounded-lg">
                                <div>
                                    <p className="text-sm font-medium text-white">Direct Referrals</p>
                                    <p className="text-xs text-zinc-600">People you invite</p>
                                </div>
                                <span className="text-lg font-bold text-blue-400">10%</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white/[0.03] rounded-lg opacity-60">
                                <div>
                                    <p className="text-sm font-medium text-white">Level 2</p>
                                    <p className="text-xs text-zinc-600">Their referrals</p>
                                </div>
                                <span className="text-lg font-bold text-zinc-400">2%</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-5">
                        <h4 className="text-sm font-semibold text-zinc-300 mb-2">How it works</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                            You earn 10% of the sale price from every successful order completed by people you refer. Earnings are credited to your wallet instantly.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

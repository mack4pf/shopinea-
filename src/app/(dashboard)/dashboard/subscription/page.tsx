"use client";

import { useState, useEffect, type ElementType } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Crown, Rocket, Zap, Check, Loader2, Building2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubscriptionPaymentModal } from "@/components/modals/SubscriptionPaymentModal";
import { cn } from "@/lib/utils";
import { SUBSCRIPTION_PLANS } from "@/lib/plans";

const planVisuals: Record<string, { icon: ElementType; color: string; bg: string }> = {
    pro_300: { icon: Rocket, color: "text-blue-400", bg: "bg-blue-500/10" },
    elite_500: { icon: Zap, color: "text-violet-400", bg: "bg-violet-500/10" },
    venture_1200: { icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    enterprise_5000: { icon: Building2, color: "text-amber-400", bg: "bg-amber-500/10" },
};

export default function SubscriptionPage() {
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                setUserData(userDoc.data());
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Subscription</h1>
                    <p className="text-sm text-zinc-500 mt-1">Choose a plan that fits your business needs.</p>
                </div>
                <div className="px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-lg">
                    <p className="text-xs text-zinc-500">Current Plan</p>
                    <p className="text-sm font-semibold text-white">{userData?.planName || "Free"}</p>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {SUBSCRIPTION_PLANS.map((plan) => {
                    const isActive = userData?.plan === plan.id;
                    const visual = planVisuals[plan.id];
                    const Icon = visual.icon;
                    return (
                        <div key={plan.id}
                            className={cn("bg-white/[0.03] border rounded-xl p-6 flex flex-col transition-all",
                                isActive ? "border-blue-500/40 ring-1 ring-blue-500/20" : "border-white/[0.06] hover:border-white/[0.12]")}>
                            {isActive && (
                                <span className="text-[10px] font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md w-fit mb-4">Current Plan</span>
                            )}
                            <div className={`w-10 h-10 ${visual.bg} rounded-lg flex items-center justify-center mb-4`}>
                                <Icon className={`w-5 h-5 ${visual.color}`} />
                            </div>
                            <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                            <div className="flex items-baseline gap-1 mt-1 mb-6">
                                <span className="text-3xl font-bold text-white">${plan.price.toLocaleString()}</span>
                                <span className="text-xs text-zinc-500">{plan.billingLabel}</span>
                            </div>
                            <div className="space-y-3 flex-1 mb-6">
                                {plan.features.map((f, i) => (
                                    <div key={i} className="flex items-center gap-2.5">
                                        <div className="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                                        </div>
                                        <span className="text-xs text-zinc-400">{f}</span>
                                    </div>
                                ))}
                            </div>
                            <Button onClick={() => setSelectedPlanForPayment(plan)} disabled={isActive}
                                className={cn("w-full h-10 rounded-lg text-sm font-medium",
                                    isActive ? "bg-zinc-800 text-zinc-600 cursor-not-allowed" : "bg-white text-zinc-900 hover:bg-zinc-100")}>
                                {isActive ? "Active" : "Upgrade"}
                            </Button>
                        </div>
                    );
                })}
            </div>

            {/* Billing info */}
            {userData?.planExpiryDate && (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-zinc-300">Billing Cycle</p>
                        <p className="text-xs text-zinc-500 mt-0.5">Scale and Enterprise are yearly plans. Monthly plans renew every 30 days.</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-zinc-500">Next renewal</p>
                        <p className="text-sm font-semibold text-white">
                            {new Date(userData.planExpiryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>
                </div>
            )}

            <SubscriptionPaymentModal
                isOpen={!!selectedPlanForPayment}
                onClose={() => setSelectedPlanForPayment(null)}
                plan={selectedPlanForPayment}
                userId={user?.uid}
                userName={userData?.displayName || 'User'}
            />
        </div>
    );
}

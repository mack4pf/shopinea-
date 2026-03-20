"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { 
    Crown, 
    Rocket, 
    Zap, 
    ShieldCheck, 
    Check, 
    ArrowUpRight, 
    AlertCircle,
    Loader2,
    Building2,
    Calendar,
    Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SubscriptionPaymentModal } from "@/components/modals/SubscriptionPaymentModal";
import { cn } from "@/lib/utils";

const plans = [
    { 
        id: "pro_300", 
        name: "PRO 300", 
        price: 300, 
        icon: Rocket, 
        color: "text-blue-500", 
        bg: "bg-blue-500/10",
        features: ["AI Store Management v1", "Custom .shop Domain", "AI Ad Copy Generator", "100 Product Limit"]
    },
    { 
        id: "elite_500", 
        name: "ELITE 500", 
        price: 500, 
        icon: Zap, 
        color: "text-indigo-500", 
        bg: "bg-indigo-500/10",
        features: ["TikTok Viral Hook Research", "Competitor Price Tracker", "Unlimited Scaling", "Premium Themes"]
    },
    { 
        id: "venture_1200", 
        name: "VENTURE 1200", 
        price: 1200, 
        icon: Crown, 
        color: "text-emerald-500", 
        bg: "bg-emerald-500/10",
        features: ["Global Growth Manager", "Automated Outreach", "Logistics Priority", "Custom API Access"]
    },
    { 
        id: "enterprise_5000", 
        name: "ENTERPRISE 5000", 
        price: 5000, 
        icon: Building2, 
        color: "text-amber-500", 
        bg: "bg-amber-500/10",
        features: ["Multi-Store Management", "Zero Fee Processing", "Concierge Support", "AI Model Training"]
    }
];

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

    const handleUpgrade = (plan: any) => {
        setSelectedPlanForPayment(plan);
    };

    if (loading) return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

    const currentPlan = plans.find(p => p.id === userData?.plan);

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <Rocket className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400">Merchant Power-Grid</span>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter italic leading-none">Subscription Nexus</h1>
                    <p className="text-zinc-500 font-extrabold text-sm uppercase tracking-widest leading-relaxed opacity-80 max-w-xl">
                        Select your operational model and scale with the elite.
                    </p>
                </div>
                <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] flex items-center gap-6 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-2xl shadow-blue-500/10">
                        <Target className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] leading-none mb-2">Current Standing</p>
                        <p className="text-2xl font-black text-white italic tracking-tighter uppercase">{userData?.planName || "FREEMIUM_PROTOCOL"}</p>
                    </div>
                </div>
            </div>

            {/* Plan Nodes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {plans.map((plan) => (
                    <div 
                        key={plan.id}
                        className={cn(
                            "relative bg-zinc-900 p-10 rounded-[3.5rem] border transition-all duration-700 flex flex-col justify-between overflow-hidden group",
                            userData?.plan === plan.id 
                                ? "border-blue-500 shadow-2xl shadow-blue-500/10 bg-zinc-900/50 scale-105 z-10" 
                                : "border-zinc-800 hover:border-zinc-700 hover:shadow-2xl hover:-translate-y-2"
                        )}
                    >
                        <div className={`absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-blue-500/10 transition-colors`} />
                        
                        {userData?.plan === plan.id && (
                            <div className="absolute top-6 right-6 bg-blue-600 px-4 py-2 rounded-full flex items-center gap-2 shadow-2xl shadow-blue-500/20 active:scale-95 transition-all">
                                <Check className="w-3 h-3 text-white" />
                                <span className="text-[9px] font-black text-white uppercase tracking-[0.2em] italic">Active_Node</span>
                            </div>
                        )}

                        <div className="relative z-10">
                            <div className={cn("w-20 h-20 rounded-[1.8rem] flex items-center justify-center mb-10 shadow-2xl relative overflow-hidden", plan.bg)}>
                                <div className="absolute inset-0 bg-white/5 pointer-events-none" />
                                <plan.icon className={cn("w-10 h-10", plan.color)} />
                            </div>
                            
                            <div className="space-y-4">
                                <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{plan.name}</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black text-white tracking-tighter italic leading-none">${plan.price.toLocaleString()}</span>
                                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">/ Cycle</span>
                                </div>
                            </div>
                            
                            <div className="mt-8 pt-8 border-t border-zinc-800/50 space-y-4">
                                {plan.features.map((feature, i) => (
                                    <div key={i} className="flex items-center gap-4 group/feat">
                                        <div className="w-6 h-6 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800 transition-colors group-hover/feat:border-emerald-500/30">
                                            <Check className="w-3 h-3 text-emerald-500" />
                                        </div>
                                        <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest italic leading-none transition-colors group-hover/feat:text-white">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative z-10 mt-12 pt-12">
                            <Button 
                                onClick={() => handleUpgrade(plan)}
                                disabled={userData?.plan === plan.id}
                                className={cn(
                                    "w-full h-18 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] transition-all duration-300 italic border-b-4",
                                    userData?.plan === plan.id 
                                        ? "bg-zinc-800/50 text-zinc-700 cursor-not-allowed border-transparent" 
                                        : "bg-white text-black hover:scale-[1.05] active:scale-95 shadow-2xl shadow-white/5 border-zinc-300 active:border-b-0"
                                )}
                            >
                                {userData?.plan === plan.id ? "CURRENT_STANDING" : "ACTIVATE_NODE"}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Billing Ledger Info */}
            <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[3.5rem] flex flex-col md:flex-row items-center gap-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-emerald-500/[0.02] pointer-events-none" />
                <div className="w-24 h-24 bg-zinc-950 border border-zinc-800 rounded-[2.5rem] flex items-center justify-center flex-shrink-0 shadow-2xl group-hover:scale-105 transition-transform">
                    <Calendar className="w-10 h-10 text-zinc-500" />
                </div>
                <div className="flex-1 space-y-3 text-center md:text-left">
                    <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Automated Node Settlement</h4>
                    <p className="text-[12px] font-extrabold text-zinc-500 leading-relaxed uppercase tracking-widest opacity-80 max-w-2xl">
                        Subscription fees are processed via **Secure Protocol Deposits**. Maintain merchant stability by ensuring active node tier status every 30 terrestrial cycles.
                    </p>
                </div>
                {userData?.planExpiryDate && (
                    <div className="px-10 py-6 bg-zinc-950 border border-zinc-800 rounded-[2rem] text-center shadow-inner relative group/date">
                        <div className="absolute inset-0 bg-blue-500/[0.01] pointer-events-none" />
                        <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-2 leading-none">Billing Cycle End</p>
                        <p className="text-lg font-black text-white italic tracking-tighter truncate uppercase leading-none">
                            {new Date(userData.planExpiryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>
                )}
            </div>

            <SubscriptionPaymentModal 
                isOpen={!!selectedPlanForPayment}
                onClose={() => setSelectedPlanForPayment(null)}
                plan={selectedPlanForPayment}
                userId={user?.uid}
                userName={userData?.displayName || 'Merchant'}
            />
        </div>
    );
}

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { 
    CheckCircle2, 
    Zap, 
    Crown, 
    Rocket, 
    Building2,
    Check,
    ArrowRight,
    Globe,
    Search,
    BrainCircuit,
    UserCheck,
    Sparkles,
    ShieldCheck,
    TrendingUp
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const plans = [
    {
        name: "Starter",
        price: "29",
        description: "Perfect for starting your dropshipping journey.",
        features: [
            "Up to 50 active products",
            "Professional storefront",
            "Real-time order tracking",
            "Basic analytics",
            "Standard support",
            "0% transaction fees"
        ],
        icon: Rocket,
        color: "bg-blue-600/10",
        iconColor: "text-blue-500",
        border: "border-blue-500/20"
    },
    {
        name: "Professional",
        price: "79",
        description: "Scale your revenue with advanced management tools.",
        features: [
            "Unlimited products",
            "AI product recommendations",
            "Advanced sales analytics",
            "Priority fulfillment",
            "Premium store templates",
            "SEO optimization tools",
            "24/7 priority support"
        ],
        icon: Zap,
        color: "bg-indigo-600/10",
        iconColor: "text-indigo-500",
        border: "border-indigo-500/30",
        popular: true
    },
    {
        name: "Scale",
        price: "199",
        description: "For established businesses looking to dominate.",
        features: [
            "Everything in Professional+",
            "Bulk order processing",
            "Dedicated account manager",
            "White-label packaging",
            "Custom API access",
            "Influencer marketing tools",
            "Bi-weekly strategy calls"
        ],
        icon: TrendingUp,
        color: "bg-emerald-600/10",
        iconColor: "text-emerald-500",
        border: "border-emerald-500/20"
    },
    {
        name: "Enterprise",
        price: "499",
        description: "The ultimate solution for high-volume trade.",
        features: [
            "Everything in Scale+",
            "Multi-store management",
            "Full legal compliance suite",
            "Automated tax management",
            "Custom AI model training",
            "Volume-based rewards",
            "Concierge support 24/7"
        ],
        icon: Building2,
        color: "bg-purple-600/10",
        iconColor: "text-purple-500",
        border: "border-purple-500/20"
    }
];

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-[#09090b] text-white pt-32 pb-20 selection:bg-blue-500/30 overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
                <div className="absolute top-40 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-40 left-10 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
            </div>

            <div className="container relative z-10 px-6 max-w-7xl mx-auto">
                <div className="text-center space-y-4 mb-24 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                        <Sparkles className="w-4 h-4 text-blue-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Professional Infrastructure</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
                        Simple, transparent <br/>
                        <span className="text-zinc-500">pricing for every stage.</span>
                    </h1>
                    <p className="text-lg font-medium text-zinc-500 max-w-2xl mx-auto">
                        Choose the plan that fits your ambition. No hidden fees, no setup costs. Just world-class infrastructure to help you scale.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map((plan) => (
                        <div 
                            key={plan.name}
                            className={cn(
                                "group relative bg-zinc-900/40 border rounded-[2rem] p-8 transition-all duration-500 flex flex-col justify-between",
                                plan.popular 
                                    ? "border-blue-500/50 bg-blue-500/[0.02] shadow-2xl shadow-blue-500/10" 
                                    : "border-white/[0.06] hover:border-white/[0.12] hover:bg-zinc-900/60"
                            )}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-blue-600 rounded-full shadow-lg shadow-blue-500/20">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">Most Recommended</span>
                                </div>
                            )}

                            <div className="space-y-8">
                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border", plan.color, plan.border)}>
                                    <plan.icon className={cn("w-7 h-7", plan.iconColor)} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white tracking-tight">{plan.name}</h3>
                                    <p className="mt-2 text-xs font-medium text-zinc-500 leading-relaxed">
                                        {plan.description}
                                    </p>
                                </div>
                                
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-white tracking-tighter">${plan.price}</span>
                                    <span className="text-sm font-bold text-zinc-600 uppercase tracking-widest">/mo</span>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">What's included</p>
                                    <div className="space-y-3">
                                        {plan.features.map((feature) => (
                                            <div key={feature} className="flex items-center gap-3">
                                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-zinc-950 border border-white/[0.06] flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-emerald-500" />
                                                </div>
                                                <span className="text-xs font-medium text-zinc-400">{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 pt-8 border-t border-white/[0.04]">
                                <Link href="/register" className="block">
                                    <Button className={cn(
                                        "w-full h-12 rounded-xl font-bold transition-all gap-2",
                                        plan.popular 
                                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20" 
                                            : "bg-white text-zinc-950 hover:bg-zinc-200"
                                    )}>
                                        Get Started
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                {/* FAQ Section Placeholder / Extra Visuals */}
                <div className="mt-32 p-12 bg-zinc-900/40 border border-white/[0.06] rounded-[2.5rem] flex flex-col items-center text-center space-y-6">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                        <ShieldCheck className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="max-w-xl space-y-2">
                        <h4 className="text-2xl font-bold">14-Day Money Back Guarantee</h4>
                        <p className="text-zinc-500 font-medium">Test our platform risk-free. If you're not seeing the results you expected, we'll refund your subscription—no questions asked.</p>
                    </div>
                </div>
            </div>
            
            <footer className="container mx-auto px-6 mt-32 border-t border-white/[0.04] py-12 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-600">
                    &copy; 2026 Restock Technology Infrastructure. All rights reserved.
                </p>
            </footer>
        </div>
    );
}

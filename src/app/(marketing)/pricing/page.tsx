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
    UserCheck
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const plans = [
    {
        name: "Pro 300",
        price: "300",
        description: "Perfect for starting your automated e-commerce journey.",
        features: [
            "AI Store Management v1",
            "Custom .shop Domain",
            "AI Ad Copy Generator",
            "Support for 100 Products",
            "Basic SEO Indexer",
            "Weekly Growth Audits"
        ],
        icon: Rocket,
        color: "bg-blue-600",
        shadow: "shadow-blue-500/20"
    },
    {
        name: "Elite 500",
        price: "500",
        description: "Scale your revenue with advanced AI tools and scaling.",
        features: [
            "Everything in Pro 300+",
            "TikTok Viral Hook Research",
            "Competitor Price Tracker",
            "Unlimited Catalog Scaling",
            "Premium Store Themes",
            "AI Support Bot (v1)",
            "Daily Performance Audits"
        ],
        icon: Zap,
        color: "bg-indigo-600",
        shadow: "shadow-indigo-500/20",
        popular: true
    },
    {
        name: "Venture 1200",
        price: "1,200",
        description: "Complete agency-grade management for serious vendors.",
        features: [
            "Everything in Elite 500+",
            "White-Label Dashboards",
            "Dedicated Growth Manager",
            "Automated Influencer Outreach",
            "Priority Global Logistics",
            "Custom API Direct Access",
            "Bi-weekly Strategy Calls"
        ],
        icon: Crown,
        color: "bg-emerald-600",
        shadow: "shadow-emerald-500/20"
    },
    {
        name: "Enterprise 5000",
        price: "5,000",
        description: "The ultimate empire-building solution for high-volume trade.",
        features: [
            "Everything in Venture 1200+",
            "Multi-Store Cloud Management",
            "Zero Processing Fees",
            "24/7 Concierge Support",
            "Custom AI Model Training",
            "Full Legal Compliance Suite",
            "Tax Management Automations"
        ],
        icon: Building2,
        color: "bg-amber-600",
        shadow: "shadow-amber-500/20"
    }
];

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 pt-32 pb-20 overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
                <div className="absolute top-40 right-10 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-40 left-10 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px]" />
            </div>

            <div className="container relative z-10 px-6 max-w-7xl">
                <div className="text-center space-y-4 mb-20 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/10 rounded-full border border-blue-100 dark:border-blue-900/30">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Scale Your Empire</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter italic">
                        Select Your Plan. <br/>
                        <span className="text-slate-400">Automate Your Success.</span>
                    </h1>
                    <p className="text-lg font-bold text-slate-500 dark:text-zinc-500 leading-relaxed">
                        Choose the tier that matches your ambition. From startup to enterprise, our AI-powered ecosystem scales with you.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map((plan) => (
                        <div 
                            key={plan.name}
                            className={cn(
                                "group relative bg-white dark:bg-zinc-900/50 border rounded-[2.5rem] p-8 transition-all duration-500 hover:scale-[1.02] flex flex-col justify-between",
                                plan.popular 
                                    ? "border-blue-500 shadow-2xl shadow-blue-500/10 scale-[1.05]" 
                                    : "border-slate-100 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-xl"
                            )}
                        >
                            {plan.popular && (
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 bg-blue-600 rounded-full shadow-lg shadow-blue-500/20">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Most Popular</span>
                                </div>
                            )}

                            <div>
                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6", plan.color, plan.shadow)}>
                                    <plan.icon className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tight">{plan.name}</h3>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-slate-900 dark:text-whiteTracking-tighter">${plan.price}</span>
                                    <span className="text-sm font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest">/mo</span>
                                </div>
                                <p className="mt-4 text-[11px] font-bold text-slate-500 dark:text-zinc-500 leading-relaxed">
                                    {plan.description}
                                </p>

                                <div className="mt-8 space-y-4">
                                    {plan.features.map((feature) => (
                                        <div key={feature} className="flex items-center gap-3">
                                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-50 dark:bg-zinc-800 flex items-center justify-center border border-slate-100 dark:border-zinc-700">
                                                <Check className="w-3 h-3 text-emerald-500" />
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-10">
                                <Link href="/register">
                                    <Button className={cn(
                                        "w-full h-14 rounded-2xl font-black uppercase text-xs tracking-widest transition-all",
                                        plan.popular 
                                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20" 
                                            : "bg-slate-900 dark:bg-white text-white dark:text-black hover:scale-105"
                                    )}>
                                        Get Started Now
                                        <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-8 bg-zinc-50 dark:bg-zinc-900/30 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 flex flex-col items-center text-center space-y-4">
                        <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm">
                            <BrainCircuit className="w-6 h-6 text-blue-600" />
                        </div>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">AI Management</h4>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-500 leading-relaxed capitalize">Powerful algorithms handle inventory, pricing, and buyer targeting automatically.</p>
                    </div>
                    <div className="p-8 bg-zinc-50 dark:bg-zinc-900/30 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 flex flex-col items-center text-center space-y-4">
                        <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm">
                            <Globe className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Custom Domains</h4>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-500 leading-relaxed capitalize">Every plan includes your own professional .shop or .com domain to build trust.</p>
                    </div>
                    <div className="p-8 bg-zinc-50 dark:bg-zinc-900/30 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 flex flex-col items-center text-center space-y-4">
                        <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm">
                            <Search className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">SEO Supremacy</h4>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-500 leading-relaxed capitalize">Our tech-stack is built for speed and indexability, putting your products on front pages.</p>
                    </div>
                </div>
            </div>
            
            <footer className="container mt-32 border-t border-slate-100 dark:border-zinc-800 pt-12 pb-6 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
                    &copy; 2026 Shoplinea.shop — The Billion Dollar Pipeline.
                </p>
            </footer>
        </div>
    );
}

const Sparkles = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
        <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
);

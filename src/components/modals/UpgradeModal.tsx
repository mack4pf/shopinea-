"use client";

import React, { useEffect } from "react";
import { 
    X, 
    Zap, 
    Crown, 
    Rocket, 
    Check, 
    ArrowRight,
    TrendingUp,
    Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPlan?: string;
}

export function UpgradeModal({ isOpen, onClose, currentPlan }: UpgradeModalProps) {
    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
            
            <div 
                className="relative w-full max-w-4xl bg-zinc-950 border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(37,99,235,0.2)] animate-in zoom-in-95 duration-500"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                
                <button 
                    onClick={onClose}
                    className="absolute top-8 right-8 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all z-20"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col md:flex-row h-full">
                    {/* Left: Selling Points */}
                    <div className="md:w-5/12 p-12 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative">
                        <div className="relative z-10 space-y-8">
                            <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                                <Rocket className="w-8 h-8" />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-4xl font-black italic tracking-tighter leading-none uppercase">Scale Your <br/> Empire.</h2>
                                <p className="text-sm font-bold text-blue-100 opacity-80 leading-relaxed capitalize">
                                    Join the elite circle of merchants utilizing AI-powered scaling tools, viral hook research, and fully managed growth systems.
                                </p>
                            </div>

                            <div className="space-y-4 pt-4">
                                {[
                                    { icon: Zap, label: "AI Ad Copy Generator" },
                                    { icon: TrendingUp, label: "Competitor Tracking" },
                                    { icon: Shield, label: "Fraud Protection" }
                                ].map((benefit, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <benefit.icon className="w-4 h-4 text-blue-200" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{benefit.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Plan Highlight */}
                    <div className="flex-1 p-12 flex flex-col justify-center">
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Upgrade Recommendation</span>
                                <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">Activate PRO 300</h3>
                            </div>

                            <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2rem] space-y-6">
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest leading-none">Monthly Operating Cost</p>
                                    <span className="text-sm font-black text-white italic">$300 / mo</span>
                                </div>
                                <div className="space-y-3">
                                    {["Unlimited AI Management", "Custom .shop Domain", "Competitor Research Tool", "Priority Logistics"].map((f, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <Check className="w-4 h-4 text-blue-500" />
                                            <span className="text-xs font-bold text-zinc-300">{f}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 pt-4">
                                <Button 
                                    onClick={() => window.location.href = "/dashboard/subscription"}
                                    className="h-16 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-widest shadow-2xl shadow-blue-500/20 gap-3"
                                >
                                    ACTIVATE TIER NOW <ArrowRight className="w-4 h-4" />
                                </Button>
                                <button 
                                    onClick={onClose}
                                    className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                                >
                                    MAYBE LATER, I'M FINE WITH FREEMIUM
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

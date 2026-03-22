"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Globe, ShieldCheck, Zap, Layers, Cpu, Cloud, Database } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function SuppliersPage() {
    return (
        <main className="flex min-h-screen flex-col bg-[#09090b] text-white selection:bg-blue-500/30 overflow-hidden">
            {/* Hero */}
            <section className="relative min-h-[90vh] flex items-center justify-center pt-32 pb-20">
                <div className="absolute inset-0 z-0">
                    <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[180px]" />
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
                </div>
                
                <div className="container relative z-10 px-6 max-w-7xl mx-auto">
                    <div className="grid gap-16 lg:grid-cols-2 items-center">
                        <div className="space-y-8 animate-in fade-in slide-in-from-left-6 duration-700">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                                Global Supply Infrastructure
                            </div>
                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
                                Connect your supply <br/>
                                <span className="text-zinc-500">to a global network of </span>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-indigo-400">resellers.</span>
                            </h1>
                            <p className="text-lg font-medium text-zinc-500 max-w-xl leading-relaxed">
                                Join the Restock Supply Network. List your products and instantly reach thousands of professional merchants. We handle the storefronts, payments, and tier-1 logistics.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link href="/register">
                                    <Button size="lg" className="h-14 px-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-2xl shadow-blue-500/20 transition-all active:scale-[0.98]">
                                        Become a Supplier
                                        <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </Link>
                                <Link href="/pricing">
                                    <Button variant="outline" size="lg" className="h-14 px-10 rounded-xl bg-white/[0.04] border-white/[0.08] text-white hover:bg-white/[0.08] font-bold text-base transition-all active:scale-[0.98]">
                                        View Pricing
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        
                        <div className="relative group animate-in fade-in zoom-in-95 duration-1000">
                            <div className="absolute inset-0 bg-indigo-600/5 blur-[100px] rounded-full group-hover:bg-indigo-600/10 transition-colors" />
                            <div className="relative border border-white/[0.08] bg-zinc-900/50 p-3 rounded-[2rem] shadow-2xl backdrop-blur-3xl">
                                <div className="aspect-[4/3] rounded-[1.5rem] bg-zinc-950 overflow-hidden relative">
                                    <div className="absolute inset-0 flex items-center justify-center p-8 bg-gradient-to-br from-zinc-900 to-indigo-950/20">
                                        <div className="w-full space-y-6">
                                            <div className="h-4 w-1/4 bg-zinc-800 rounded-full" />
                                            <div className="grid grid-cols-4 gap-3">
                                                {[...Array(4)].map((_, i) => (
                                                    <div key={i} className="h-24 bg-zinc-900 border border-white/[0.04] rounded-xl flex items-center justify-center">
                                                        <Database className="w-6 h-6 text-zinc-800" />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="h-32 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center gap-6">
                                                <div className="w-12 h-12 rounded-full bg-indigo-500/20 animate-pulse" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-2 w-1/2 bg-indigo-500/40 rounded-full" />
                                                    <div className="h-2 w-3/4 bg-indigo-500/20 rounded-full" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Value Proposition */}
            <section className="py-24 bg-[#0c0c0e]/50 border-t border-white/[0.04]">
                <div className="container px-6 max-w-7xl mx-auto">
                    <div className="grid gap-12 md:grid-cols-3">
                        {[
                            { title: "Direct Distribution", desc: "Skip the middlemen. Connect your products directly to active retail channels worldwide.", icon: Layers, color: "text-blue-500", bg: "bg-blue-500/5" },
                            { title: "Secured Capital", desc: "No more payment delays. All transactions are held in escrow and released upon dispatch verification.", icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/5" },
                            { title: "Operational Intelligence", desc: "Receive real-time data on buyer demand, category trends, and inventory forecasting.", icon: BarChart3, color: "text-indigo-500", bg: "bg-indigo-500/5" }
                        ].map((item, i) => (
                            <div key={i} className="p-10 rounded-[2rem] bg-zinc-900/40 border border-white/[0.04] hover:bg-zinc-900/60 transition-all">
                                <div className={cn("w-14 h-14 items-center justify-center rounded-2xl flex mb-8 border border-white/[0.04]", item.bg)}>
                                    <item.icon className={cn("h-6 w-6", item.color)} />
                                </div>
                                <h3 className="text-xl font-bold mb-4 tracking-tight">{item.title}</h3>
                                <p className="text-zinc-500 leading-relaxed font-medium text-sm">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Global Infrastructure */}
            <section className="py-32 bg-[#09090b]">
                <div className="container px-6 max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div className="space-y-12">
                            <div className="space-y-4">
                                <div className="text-indigo-500 text-xs font-bold uppercase tracking-[0.2em] italic">Network Performance</div>
                                <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">Elite supply-chain <br/> infrastructure.</h2>
                                <p className="text-zinc-500 font-medium text-lg leading-relaxed">We provide the technical backbone for your manufacturing or distribution business to scale at light speed.</p>
                            </div>
                            
                            <div className="space-y-8">
                                {[
                                    { title: "Automated Fulfillment", desc: "Our system syncs directly with your warehouse to prioritize outgoing shipments.", icon: Zap },
                                    { title: "Cross-Border Compliance", desc: "We manage all global tax and trade regulations so your business stays protected.", icon: Globe },
                                    { title: "Tier-1 Cloud Support", desc: "Access 24/7 dedicated support from our technical logistics team.", icon: Cloud }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-6 group">
                                        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/[0.04] flex items-center justify-center shrink-0 group-hover:bg-indigo-600/10 transition-all duration-300">
                                            <item.icon className="w-5 h-5 text-zinc-500 group-hover:text-indigo-500 transition-colors" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg text-white mb-2 tracking-tight">{item.title}</h4>
                                            <p className="text-zinc-500 leading-relaxed font-medium text-sm">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                         <div className="relative">
                            <div className="absolute inset-0 bg-indigo-600/5 blur-[120px] rounded-full" />
                            <div className="relative p-8 bg-zinc-900/50 border border-white/[0.06] rounded-[2.5rem] space-y-8 backdrop-blur-3xl shadow-2xl">
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: "Partner Factories", val: "840+" },
                                        { label: "Current Nodes", val: "22" },
                                        { label: "Active Requests", val: "1.4k" },
                                        { label: "Avg. Resolution", val: "12m" }
                                    ].map((stat, i) => (
                                        <div key={i} className="p-5 bg-zinc-950/50 border border-white/[0.04] rounded-2xl space-y-1">
                                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-none">{stat.label}</p>
                                            <p className="text-2xl font-bold text-white tracking-tighter">{stat.val}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Supply Health Index</span>
                                        <span className="text-emerald-500 font-bold text-xs">Exemplary</span>
                                    </div>
                                    <div className="flex items-end gap-1 h-12">
                                        {[...Array(20)].map((_, i) => (
                                            <div key={i} className="flex-1 bg-indigo-500/20 rounded-full" style={{ height: `${Math.random() * 100}%` }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-40 bg-[#0c0c0e]/50 border-t border-white/[0.04] text-center">
                 <div className="container relative z-10 px-6 max-w-7xl mx-auto flex flex-col items-center">
                    <h2 className="text-4xl sm:text-7xl font-bold tracking-tight text-white max-w-3xl mb-12"> Partner with global <br/> retail innovators. </h2>
                    <Link href="/register">
                        <Button size="lg" className="h-16 px-12 rounded-2xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-lg shadow-2xl transition-all active:scale-[0.98]">
                            Apply as a Verified Supplier
                        </Button>
                    </Link>
                    <p className="mt-8 text-[11px] font-bold text-zinc-700 uppercase tracking-[0.3em]">Institutional Grade Logistics & Support</p>
                 </div>
            </section>
        </main>
    );
}

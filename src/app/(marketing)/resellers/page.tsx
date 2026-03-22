"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Boxes, DollarSign, Zap, ChartBar, Layout, Users, ShieldCheck, Globe, Truck } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function ResellersPage() {
    return (
        <main className="flex min-h-screen flex-col bg-[#09090b] text-white selection:bg-blue-500/30 overflow-hidden">
            {/* Hero */}
            <section className="relative min-h-[90vh] flex items-center justify-center pt-32 pb-20">
                <div className="absolute inset-0 z-0">
                    <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[180px]" />
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
                </div>
                
                <div className="container relative z-10 px-6 max-w-7xl mx-auto">
                    <div className="grid gap-16 lg:grid-cols-2 items-center">
                        <div className="space-y-8 animate-in fade-in slide-in-from-left-6 duration-700">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20 text-[10px] font-bold uppercase tracking-widest text-blue-500">
                                Global Reseller Network
                            </div>
                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
                                Scale your commerce <br/>
                                <span className="text-zinc-500">without the hassle of </span>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-blue-400">inventory.</span>
                            </h1>
                            <p className="text-lg font-medium text-zinc-500 max-w-xl leading-relaxed">
                                Join our network of over 12,000 professional resellers. Work from anywhere, define your margins, and let our global logistics handle the rest.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link href="/register">
                                    <Button size="lg" className="h-14 px-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-2xl shadow-blue-500/20 transition-all active:scale-[0.98]">
                                        Start Your Store
                                        <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </Link>
                                <Link href="/marketplace">
                                    <Button variant="outline" size="lg" className="h-14 px-10 rounded-xl bg-white/[0.04] border-white/[0.08] text-white hover:bg-white/[0.08] font-bold text-base transition-all active:scale-[0.98]">
                                        Browse Products
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        
                        <div className="relative group animate-in fade-in zoom-in-95 duration-1000">
                            <div className="absolute inset-0 bg-blue-600/5 blur-[100px] rounded-full group-hover:bg-blue-600/10 transition-colors" />
                            <div className="relative border border-white/[0.08] bg-zinc-900/50 p-3 rounded-[2rem] shadow-2xl backdrop-blur-3xl">
                                <div className="aspect-[4/3] rounded-[1.5rem] bg-zinc-950 overflow-hidden relative">
                                    <div className="absolute inset-0 flex items-center justify-center p-8 bg-gradient-to-br from-zinc-900 to-zinc-950">
                                        {/* Abstract UI Mockup replacement for image */}
                                        <div className="w-full space-y-6">
                                            <div className="h-4 w-1/3 bg-zinc-800 rounded-full" />
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="h-32 bg-zinc-900 border border-white/[0.04] rounded-2xl" />
                                                <div className="h-32 bg-zinc-900 border border-white/[0.04] rounded-2xl" />
                                                <div className="h-32 bg-zinc-900 border border-white/[0.04] rounded-2xl" />
                                            </div>
                                            <div className="h-20 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center">
                                                <ChartBar className="w-8 h-8 text-blue-500" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Roles & Features */}
            <section className="py-24 bg-[#0c0c0e]/50 border-t border-white/[0.04]">
                <div className="container px-6 max-w-7xl mx-auto space-y-16">
                    <div className="text-center space-y-4 max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Focus on what matters.</h2>
                        <p className="text-zinc-500 text-lg font-medium leading-relaxed">We provide the professional infrastructure, you provide the vision. Together we build commerce empires.</p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        {[
                            { title: "Smart Sourcing", desc: "Select high-margin products from verified global suppliers. No inventory holding required.", icon: Boxes, color: "text-blue-500", bg: "bg-blue-500/5" },
                            { title: "Dynamic Pricing", desc: "Set your own margins and retail prices. Keep 100% of your profit difference automatically.", icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/5" },
                            { title: "Professional Tools", desc: "Access high-end analytics, custom store templates, and automated customer relationship tools.", icon: Layout, color: "text-indigo-500", bg: "bg-indigo-500/5" }
                        ].map((item, i) => (
                            <div key={i} className="group relative bg-zinc-900/40 p-10 rounded-[2rem] border border-white/[0.04] hover:border-white/[0.1] hover:bg-zinc-900/60 transition-all">
                                <div className={cn("w-14 h-14 items-center justify-center rounded-2xl flex mb-8 border border-white/[0.04] transition-all group-hover:scale-110 shadow-xl", item.bg)}>
                                    <item.icon className={cn("h-6 w-6", item.color)} />
                                </div>
                                <h3 className="text-xl font-bold mb-4 tracking-tight text-white">{item.title}</h3>
                                <p className="text-zinc-500 leading-relaxed font-medium text-sm">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Network Benefits */}
            <section className="py-32 bg-[#09090b]">
                <div className="container px-6 max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div className="order-2 lg:order-1 relative">
                            <div className="absolute inset-0 bg-indigo-600/5 blur-[120px] rounded-full" />
                            <div className="relative p-8 bg-zinc-900/50 border border-white/[0.06] rounded-[2.5rem] space-y-8 backdrop-blur-3xl shadow-2xl">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                        <span>Network Reliability</span>
                                        <span className="text-emerald-500">99.9% Uptime</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[99.9%]" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: "Global Nodes", val: "142+" },
                                        { label: "Daily Transactions", val: "48k" },
                                        { label: "Verified Suppliers", val: "1.2k" },
                                        { label: "Avg. Delivery", val: "48h" }
                                    ].map((stat, i) => (
                                        <div key={i} className="p-5 bg-zinc-950/50 border border-white/[0.04] rounded-2xl space-y-1">
                                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-none">{stat.label}</p>
                                            <p className="text-2xl font-bold text-white tracking-tighter">{stat.val}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="order-1 lg:order-2 space-y-12">
                            <div className="space-y-4">
                                <div className="text-blue-500 text-xs font-bold uppercase tracking-[0.2em] italic">Operational Excellence</div>
                                <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">Built for elite <br/> business operations.</h2>
                                <p className="text-zinc-500 font-medium text-lg leading-relaxed">Our platform is designed to handle the complexities of global commerce so you don't have to.</p>
                            </div>
                            
                            <div className="space-y-8">
                                {[
                                    { title: "Encrypted Escrow", desc: "Your capital and margins are protected through our secure escrow system.", icon: ShieldCheck },
                                    { title: "Direct Logistics API", desc: "Interact directly with our shipping network to prioritize your high-volume orders.", icon: Truck },
                                    { title: "Community Intelligence", desc: "Gain insights from our network of top-performing merchants through shared data trends.", icon: Users }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-6 group">
                                        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/[0.04] flex items-center justify-center shrink-0 group-hover:bg-blue-600/10 transition-all duration-300">
                                            <item.icon className="w-5 h-5 text-zinc-500 group-hover:text-blue-500 transition-colors" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg text-white mb-2 tracking-tight">{item.title}</h4>
                                            <p className="text-zinc-500 leading-relaxed font-medium text-sm">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-40 bg-[#0c0c0e]/50 border-t border-white/[0.04] text-center">
                 <div className="container relative z-10 px-6 max-w-7xl mx-auto flex flex-col items-center">
                    <h2 className="text-4xl sm:text-7xl font-bold tracking-tight text-white max-w-3xl mb-12"> Ready to build your <br/> commerce empire? </h2>
                    <Link href="/register">
                        <Button size="lg" className="h-16 px-12 rounded-2xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-lg shadow-2xl transition-all active:scale-[0.98]">
                            Apply to Become a Reseller
                        </Button>
                    </Link>
                    <p className="mt-8 text-[11px] font-bold text-zinc-700 uppercase tracking-[0.3em]">No monthly fees for the first 30 days</p>
                 </div>
            </section>
        </main>
    );
}

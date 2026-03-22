import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Box, Globe, ShieldCheck, Truck, TrendingUp, Zap, ShoppingBag, Check, Plus, Search } from "lucide-react";
import { ReviewsSection } from "@/components/marketing/ReviewsSection";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[#09090b] text-white font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen w-full flex items-center justify-center pt-32 pb-20 overflow-hidden">
        {/* Abstract Glow Background */}
        <div className="absolute inset-0 z-0 flex items-center justify-center">
            <div className="w-[800px] h-[500px] bg-blue-600/10 rounded-full blur-[180px] absolute -top-40" />
            <div className="w-[600px] h-[400px] bg-indigo-600/5 rounded-full blur-[150px] absolute bottom-0 right-0" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
        </div>

        <div className="container relative z-10 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-[11px] font-bold text-zinc-400 backdrop-blur-md mb-10 transition-all hover:bg-white/[0.08] hover:border-white/[0.12] cursor-default">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            V0.4 Global Merchant Infrastructure
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[1.05] max-w-5xl mx-auto">
            The professional <br className="hidden md:block"/>
            <span className="text-zinc-500">infrastructure for </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-blue-400 animate-in fade-in duration-1000">global commerce.</span>
          </h1>
          
          <p className="mt-8 text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-medium opacity-80">
            Launch your professional online store in minutes. Access verified products, manage your margins, and ship globally without holding inventory.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-12 w-full sm:w-auto">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 px-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-2xl shadow-blue-500/20 transition-all active:scale-[0.98]">
                Get Started for Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/marketplace" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-10 rounded-xl bg-white/[0.04] border-white/[0.08] text-white hover:bg-white/[0.08] font-bold text-base transition-all active:scale-[0.98]">
                Browse Marketplace
              </Button>
            </Link>
          </div>

          {/* Trusted By */}
          <div className="pt-24 opacity-60 flex flex-col items-center gap-8">
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-600">Powering merchants across</p>
              <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-16 opacity-40 grayscale contrast-[1.2]">
                  {['Shopify', 'WooCommerce', 'BigCommerce', 'Wix', 'Amazon'].map((brand, i) => (
                      <span key={i} className="text-2xl font-black italic tracking-tighter opacity-80 hover:opacity-100 transition-all cursor-default">{brand}</span>
                  ))}
              </div>
          </div>
          
          {/* Main Hero Visual */}
          <div className="mt-32 w-full rounded-2xl border border-white/[0.08] p-2 bg-white/[0.02] backdrop-blur-3xl shadow-2xl relative group overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-1000">
             <div className="absolute inset-0 bg-blue-500/5 blur-[100px] rounded-full group-hover:bg-blue-500/10 transition-colors" />
             <div className="relative w-full aspect-[16/9] lg:aspect-[21/9] rounded-xl overflow-hidden bg-zinc-950 border border-white/[0.04]">
                 <Image 
                    src="/modern_saas_dashboard_ui_1774113588179.png" 
                    alt="Restock Merchant Dashboard" 
                    fill 
                    className="object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105" 
                    priority 
                 />
             </div>
          </div>
        </div>
      </section>

      {/* Value Prop */}
      <section className="py-24 border-t border-white/[0.04] bg-[#0c0c0e]/50">
        <div className="container px-6 max-w-7xl mx-auto">
            <div className="text-center mb-20 max-w-3xl mx-auto space-y-4">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Built for scale.</h2>
                <p className="text-zinc-500 text-lg md:text-xl font-medium leading-relaxed">Everything you need to run a high-volume commerce business without the operational overhead.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { title: "Verified Sourcing", desc: "Access a curated catalog of over 100,000+ premium products from verified global manufacturers.", icon: ShieldCheck },
                    { title: "Smart Fulfillment", desc: "We automate the entire shipping process. Orders are fulfilled globally from our distributed warehouse network.", icon: Truck },
                    { title: "High Margins", desc: "Define your own profit margins. We provide competitive wholesale rates so you can maximize your ROI.", icon: TrendingUp }
                ].map((item, i) => (
                    <div key={i} className="p-10 rounded-2xl bg-zinc-900/40 border border-white/[0.06] hover:border-white/[0.12] hover:bg-zinc-900/60 transition-all group flex flex-col items-center text-center">
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-8 border border-blue-500/20 group-hover:bg-blue-500/20 transition-all">
                            <item.icon className="w-6 h-6 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4 tracking-tight">{item.title}</h3>
                        <p className="text-zinc-500 leading-relaxed font-medium text-sm">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Deep Dive Features */}
      <section className="py-32 bg-[#09090b]">
        <div className="container px-6 max-w-7xl mx-auto">
          <div className="grid gap-20 lg:grid-cols-2 items-center">
            <div className="space-y-12">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-white/[0.08] bg-white/[0.04] text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        <Zap className="w-3.5 h-3.5 text-blue-500" /> Professional Engine
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] text-white">
                      Unified commerce operations.
                    </h2>
                </div>
                
                <div className="space-y-10">
                    {[
                        { title: "Secure Transactions", desc: "Every order is secured through our encrypted escrow system. We protect both merchants and buyers from fraud.", icon: ShieldCheck },
                        { title: "Advanced Analytics", desc: "Gain deep insights into your sales performance, traffic hotspots, and conversion patterns.", icon: TrendingUp },
                        { title: "24/7 Support", desc: "Our dedicated merchant support team is available around the clock to help you scale your business.", icon: Zap }
                    ].map((feature, i) => (
                        <div key={i} className="flex gap-6 group">
                            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/[0.04] flex items-center justify-center shrink-0 group-hover:bg-blue-600/10 group-hover:border-blue-500/20 transition-all duration-300">
                                <feature.icon className="w-5 h-5 text-zinc-500 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg text-white mb-2 tracking-tight">{feature.title}</h4>
                                <p className="text-zinc-500 leading-relaxed font-medium text-sm">{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="relative">
                {/* Visual Representation of Dashboard Elements */}
                <div className="bg-zinc-900/40 border border-white/[0.04] p-8 rounded-2xl shadow-2xl backdrop-blur-md space-y-8 animate-in zoom-in-95 duration-700">
                    <div className="flex justify-between items-center pb-6 border-b border-white/[0.04]">
                         <div className="space-y-1">
                             <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-bold">Total Sales (GMT)</div>
                             <div className="text-4xl font-bold text-white tracking-tighter">$284,103.50</div>
                         </div>
                         <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                             <TrendingUp className="w-6 h-6 text-blue-500" />
                         </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-zinc-500">
                            <span>Live Traffic Hotspots</span>
                            <span className="text-blue-400">Real-time</span>
                        </div>
                        <div className="space-y-3">
                            {[
                                { city: 'New York, US', rate: 45, color: 'bg-blue-500' },
                                { city: 'London, UK', rate: 25, color: 'bg-zinc-700' },
                                { city: 'Berlin, DE', rate: 15, color: 'bg-zinc-800' },
                                { city: 'Lagos, NG', rate: 15, color: 'bg-zinc-850' },
                            ].map((loc, i) => (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex justify-between text-[11px] font-bold text-zinc-400">
                                        <span>{loc.city}</span>
                                        <span>{loc.rate}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                                        <div className={cn("h-full rounded-full", loc.color)} style={{ width: `${loc.rate}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/[0.04] flex justify-between items-center">
                        <div className="flex -space-x-3">
                            {[1,2,3,4].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 overflow-hidden shrink-0">
                                    <Image src={`https://i.pravatar.cc/150?u=${i}`} alt="Avatar" width={32} height={32} />
                                </div>
                            ))}
                            <div className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-950 flex items-center justify-center text-[10px] font-bold text-zinc-500">+12k</div>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Global active merchants</p>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section Placeholder - Assuming it handles its own styling correctly now or I'll check it later */}
      <div className="border-t border-white/[0.04]">
        <ReviewsSection />
      </div>

      {/* Footer CTA */}
      <section className="relative py-40 overflow-hidden border-t border-white/[0.04] bg-[#0c0c0e]/50 text-center">
        <div className="container relative z-10 px-6 max-w-7xl mx-auto flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-10 shadow-2xl shadow-blue-500/10">
              <ShoppingBag className="w-7 h-7 text-blue-500" />
          </div>
          <h2 className="mb-6 text-4xl sm:text-7xl font-bold tracking-tight text-white max-w-3xl">
            Launch your global commerce business today.
          </h2>
          <p className="mb-12 max-w-2xl text-lg font-medium text-zinc-500 leading-relaxed">
            Create your merchant account and access our professional global network.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
             <Link href="/register">
                <Button size="lg" className="bg-white text-zinc-950 hover:bg-zinc-200 text-base px-10 h-14 rounded-xl font-bold shadow-2xl transition-all active:scale-[0.98]">
                  Get Started for Free
                </Button>
            </Link>
          </div>
          <p className="mt-8 text-[11px] font-bold text-zinc-700 uppercase tracking-[0.2em]">Merchant approval takes under 24 hours</p>
        </div>
      </section>
    </main>
  );
}

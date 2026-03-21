import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Box, Globe, ShieldCheck, Truck, TrendingUp, Zap, ShoppingBag } from "lucide-react";
import { ReviewsSection } from "@/components/marketing/ReviewsSection";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[#050505] text-white font-sans selection:bg-white/20">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] w-full flex items-center justify-center overflow-hidden border-b border-white/5">
        {/* Subtle, elegant background lighting */}
        <div className="absolute inset-0 z-0 flex items-center justify-center">
            <div className="w-[800px] h-[400px] bg-zinc-800/30 rounded-full blur-[150px] absolute top-[-100px]" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
        </div>

        <div className="container relative z-10 px-4 md:px-6 flex flex-col items-center text-center mt-16 pb-20">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold text-zinc-300 backdrop-blur-md mb-8">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
            Shoplinea.shop Enterprise Network
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-[6rem] font-medium tracking-tighter text-white leading-[1.05] max-w-5xl mx-auto">
            The infrastructure for <br className="hidden md:block"/>
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500 pb-2">elite global commerce.</span>
          </h1>
          
          <p className="mt-8 text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-light">
            Deploy a world-class digital storefront instantly. Source verified premium products, define your margins, and let our global logistics network handle fulfillment.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-12">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto text-sm px-10 h-14 rounded-full bg-white text-black hover:bg-zinc-200 transition-all font-bold shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                Create Merchant Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-sm px-10 h-14 rounded-full bg-transparent border-white/10 text-white font-bold hover:bg-white/5 transition-all">
                The Marketplace
              </Button>
            </Link>
          </div>

          <div className="pt-24 opacity-40">
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-500 mb-6">Powering commerce across</p>
              <div className="flex flex-wrap justify-center items-center gap-10 grayscale opacity-80">
                  <span className="text-xl font-bold tracking-tighter">North America</span>
                  <span className="text-xl font-bold tracking-tighter">Europe</span>
                  <span className="text-xl font-bold tracking-tighter">Asia-Pacific</span>
              </div>
          </div>
          
          <div className="mt-20 w-full max-w-6xl mx-auto rounded-[2rem] border border-white/10 p-2 bg-white/5 backdrop-blur-2xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative z-20">
             <div className="relative w-full aspect-[16/9] lg:aspect-[21/9] rounded-2xl overflow-hidden border border-white/10 bg-zinc-950">
                 <div className="absolute inset-0 bg-blue-500/10 blur-[100px]" />
                 <Image src="/hero-dashboard.png" alt="Enterprise Commerce Dashboard" fill className="object-cover relative z-10 opacity-90 hover:opacity-100 transition-opacity duration-700" priority />
             </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Grid */}
      <section className="bg-zinc-950/50 py-32 relative border-b border-white/5">
        <div className="container px-4 md:px-6">
            <div className="text-center mb-20 max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-medium tracking-tighter mb-6">Designed for scale.</h2>
                <p className="text-zinc-400 text-lg md:text-xl font-light">Whether you are a solo entrepreneur or operating a multi-national retail brand, our architecture scales with your demand natively.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-10 rounded-[2rem] bg-[#0a0a0a] border border-white/5 hover:border-white/10 transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-8 border border-white/5 group-hover:bg-white/10 transition-colors">
                        <Globe className="w-5 h-5 text-zinc-300" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-4">Instant Provisioning</h3>
                    <p className="text-zinc-500 leading-relaxed font-light">Launch a fully functional, highly optimized digital storefront in seconds. Our automated systems handle hosting, SSL, and inventory synchronization seamlessly.</p>
                </div>
                <div className="p-10 rounded-[2rem] bg-[#0a0a0a] border border-white/5 hover:border-white/10 transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-8 border border-white/5 group-hover:bg-white/10 transition-colors">
                        <TrendingUp className="w-5 h-5 text-zinc-300" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-4">Dynamic Economics</h3>
                    <p className="text-zinc-500 leading-relaxed font-light">Retain absolute control over your pricing strategy. Define your margins on a per-product basis and have profits routed directly to your secure escrow instantly.</p>
                </div>
                <div className="p-10 rounded-[2rem] bg-[#0a0a0a] border border-white/5 hover:border-white/10 transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-8 border border-white/5 group-hover:bg-white/10 transition-colors">
                        <Truck className="w-5 h-5 text-zinc-300" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-4">Frictionless Logistics</h3>
                    <p className="text-zinc-500 leading-relaxed font-light">Eliminate warehouse overhead. Our integrated fulfillment centers pick, pack, and ship orders globally under your brand's white-label packaging.</p>
                </div>
            </div>
        </div>
      </section>

      {/* Deep Dive Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="container px-4 md:px-6">
          <div className="grid gap-20 lg:grid-cols-2 items-center">
            <div className="space-y-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                    <Zap className="w-3 h-3 text-zinc-300" /> High-Performance Engine
                </div>
                <h2 className="text-4xl md:text-5xl font-medium tracking-tighter leading-[1.1]">
                  A unified platform for modern commerce operations.
                </h2>
                <div className="space-y-8">
                    {[
                        { title: "Enterprise Grade APIs", desc: "Interact directly with our robust inventory indexing to ensure you never oversell. Real-time synchronicity across all nodes.", icon: Box },
                        { title: "Secured Transactions", desc: "Every transaction is cryptographically secured. Our intelligent escrow system protects both the merchant and the end consumer.", icon: ShieldCheck },
                        { title: "Comprehensive Insight", desc: "Monitor traffic, conversion rates, and global distribution hotspots through your personal analytics command center.", icon: TrendingUp }
                    ].map((feature, i) => (
                        <div key={i} className="flex gap-6 group cursor-pointer">
                            <div className="w-12 h-12 rounded-xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/5 transition-colors">
                                <feature.icon className="w-5 h-5 text-zinc-400" />
                            </div>
                            <div>
                                <h4 className="font-medium text-lg text-white mb-2">{feature.title}</h4>
                                <p className="text-zinc-500 leading-relaxed font-light">{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="relative w-full aspect-square md:aspect-auto md:h-[600px] flex items-center justify-center">
                <div className="absolute inset-0 bg-white/5 blur-[120px] rounded-full" />
                <div className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-[#0a0a0a] p-8 shadow-2xl backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-10 pb-6 border-b border-white/5">
                         <div className="space-y-2">
                             <div className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Total Revenue</div>
                             <div className="text-3xl font-medium text-white tracking-tighter">$142,590.00</div>
                         </div>
                         <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                             <TrendingUp className="w-4 h-4 text-emerald-400" />
                         </div>
                    </div>
                    {/* Abstract Graph */}
                    <div className="w-full h-40 flex items-end justify-between gap-2">
                        {[30, 45, 25, 60, 40, 75, 55, 90, 85, 100].map((h, i) => (
                            <div key={i} className="w-full bg-zinc-800 rounded-t-sm hover:bg-zinc-600 transition-colors" style={{ height: `${h}%` }} />
                        ))}
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-between text-xs text-zinc-500 font-medium">
                        <span>Last 30 Days</span>
                        <span className="text-emerald-400">+24.5%</span>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <div className="border-t border-white/5">
        <ReviewsSection />
      </div>

      {/* CTA Section */}
      <section className="relative py-32 overflow-hidden border-t border-white/5 bg-zinc-950/50 text-center">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
        
        <div className="container relative z-10 px-4 md:px-6 flex flex-col items-center">
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-8">
              <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <h2 className="mb-6 text-4xl font-medium text-white sm:text-6xl tracking-tighter">
            Initiate Your Commerce Build.
          </h2>
          <p className="mb-10 max-w-2xl text-lg font-light text-zinc-400">
            Create your operational account today. Gain immediate access to global wholesale networks, secure escrow, and automated storefront generation.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-black hover:bg-zinc-200 text-sm px-12 h-14 rounded-full font-bold shadow-2xl transition-all">
              Create Merchant Account
            </Button>
          </Link>
          <p className="mt-6 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Deployment takes approximately 60 seconds</p>
        </div>
      </section>
    </main>
  );
}

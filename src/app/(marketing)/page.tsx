import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Globe, ShieldCheck, Zap, TrendingUp, Bot, Package, Rocket, Users, Star, Check, ChevronRight } from "lucide-react";
import { ReviewsSection } from "@/components/marketing/ReviewsSection";
import { ShopineaLogo } from "@/components/shared/ShopineaLogo";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[#07060f] text-white font-sans selection:bg-purple-500/30 overflow-hidden">
      {/* ═══════════════════════════════════════ HERO ══════════════════════════════════════ */}
      <section className="relative min-h-screen w-full flex items-center justify-center pt-36 pb-24 overflow-hidden">
        {/* Ambient light blobs */}
        <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-purple-700/20 rounded-full blur-[130px]" />
            <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[450px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px]" />
            <div className="absolute inset-0 pointer-events-none" style={{backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)", backgroundSize: "40px 40px"}} />
        </div>

        <div className="container relative z-10 px-6 max-w-6xl mx-auto flex flex-col items-center text-center gap-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2 text-[12px] font-semibold text-purple-300 backdrop-blur-md">
            <Bot className="w-3.5 h-3.5" />
            AI-Powered Dropshipping · The Future of E-Commerce
            <span className="flex h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[88px] font-extrabold tracking-[-0.03em] leading-[1.0] max-w-5xl">
            <span className="text-white">Drop. Sell.</span>
            <br />
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400">
                Profit.
              </span>
              {/* Underline decoration */}
              <svg className="absolute -bottom-2 left-0 w-full" height="6" viewBox="0 0 300 6" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <path d="M0 5 Q75 0 150 3 Q225 6 300 2" stroke="url(#uline)" strokeWidth="3" strokeLinecap="round" fill="none"/>
                <defs><linearGradient id="uline" x1="0" y1="0" x2="300" y2="0" gradientUnits="userSpaceOnUse"><stop stopColor="#c084fc"/><stop offset="1" stopColor="#22d3ee"/></linearGradient></defs>
              </svg>
            </span>
            <br />
            <span className="text-white/30 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">Powered by AI.</span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed font-medium">
            Shopinea is the world&apos;s most intelligent dropshipping platform. Find winning products, automate orders, and build a thriving e-commerce business — without ever touching inventory.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link href="/register">
              <Button size="lg" className="h-14 px-10 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-base shadow-2xl shadow-purple-500/25 border-none transition-all active:scale-[0.98] gap-2">
                Start for Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button variant="outline" size="lg" className="h-14 px-10 rounded-2xl bg-white/[0.04] border-white/[0.10] text-white hover:bg-white/[0.08] font-bold text-base transition-all active:scale-[0.98]">
                Browse Products
              </Button>
            </Link>
          </div>

          {/* Social proof pill */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 text-zinc-500 text-sm font-medium">
            <div className="flex -space-x-2.5">
              {["8B", "2C", "5F", "9A", "3D"].map((seed, i) => (
                <div key={i} className="w-9 h-9 rounded-full border-2 border-[#07060f] flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: `hsl(${i * 55 + 260}, 70%, 50%)` }}
                >{seed[0]}</div>
              ))}
            </div>
            <span><strong className="text-white font-bold">32,000+</strong> merchants already earning</span>
            <span className="hidden sm:block w-px h-4 bg-white/10" />
            <span className="flex items-center gap-1.5">
              {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
              <strong className="text-white">4.9</strong>/5 avg rating
            </span>
          </div>

          {/* Hero visual — mock dashboard */}
          <div className="mt-12 w-full max-w-5xl rounded-2xl border border-white/[0.08] bg-white/[0.02] p-1.5 backdrop-blur shadow-[0_0_80px_rgba(139,92,246,0.15)]">
            <div className="w-full rounded-xl overflow-hidden bg-[#0d0b1a] border border-white/[0.05]">
              {/* mock top bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05] bg-[#110f22]">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <div className="ml-4 flex-1 h-6 rounded-lg bg-white/[0.04] max-w-xs" />
                <div className="w-20 h-6 rounded-lg bg-purple-600/30" />
              </div>
              {/* mock dashboard body */}
              <div className="p-6 grid grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Stat cards */}
                {[
                  { label: "Total Revenue", val: "$48,320", color: "from-purple-600/30 to-indigo-600/30", border: "border-purple-500/20" },
                  { label: "Active Orders", val: "1,284", color: "from-cyan-600/20 to-blue-600/20", border: "border-cyan-500/20" },
                  { label: "AI Wins Today", val: "17 🔥", color: "from-fuchsia-600/20 to-pink-600/20", border: "border-fuchsia-500/20" },
                ].map((card, i) => (
                  <div key={i} className={`col-span-3 lg:col-span-2 rounded-xl border ${card.border} bg-gradient-to-br ${card.color} p-4`}>
                    <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-widest mb-1">{card.label}</p>
                    <p className="text-2xl font-extrabold text-white">{card.val}</p>
                    <div className="mt-3 h-1.5 rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500" style={{ width: `${55 + i * 15}%` }} />
                    </div>
                  </div>
                ))}
                {/* Chart area mock */}
                <div className="col-span-3 lg:col-span-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-xs text-zinc-400 font-semibold">Revenue over time</p>
                    <span className="text-[10px] px-2 py-1 rounded-md bg-purple-500/20 text-purple-400 font-bold">+38% this week</span>
                  </div>
                  <svg viewBox="0 0 400 80" className="w-full h-16" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4"/>
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <path d="M0 70 C40 65 60 50 100 45 S160 30 200 25 S280 15 320 20 S370 30 400 10 L400 80 L0 80 Z" fill="url(#chart-fill)"/>
                    <path d="M0 70 C40 65 60 50 100 45 S160 30 200 25 S280 15 320 20 S370 30 400 10" stroke="#a855f7" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  </svg>
                </div>
                {/* AI recommendation card */}
                <div className="col-span-3 lg:col-span-2 rounded-xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-600/10 to-purple-600/10 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-fuchsia-500/20 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                    </div>
                    <p className="text-[11px] font-bold text-fuchsia-300 uppercase tracking-widest">AI Pick</p>
                  </div>
                  <p className="text-sm font-bold text-white mb-1">Wireless Earbuds Pro</p>
                  <p className="text-[11px] text-zinc-500 mb-3">Trending +240% this week</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">+$22 margin</span>
                    <div className="px-2 py-1 rounded-lg bg-fuchsia-600/30 text-[10px] font-bold text-fuchsia-300">Import Now</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════ HOW IT WORKS ═══════════════════════════════════ */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-indigo-700/10 rounded-full blur-[120px]" />
        </div>
        <div className="container px-6 max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-bold uppercase tracking-widest mb-6">
              <Zap className="w-3 h-3" /> Simple Process
            </div>
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-5">From zero to selling<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">in 3 steps.</span></h2>
            <p className="text-zinc-500 text-lg max-w-xl mx-auto">No experience needed. No inventory. No shipping headaches. Just profits.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* connector line (desktop) */}
            <div className="hidden md:block absolute top-14 left-[calc(16.6%+1rem)] right-[calc(16.6%+1rem)] h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

            {[
              { step: "01", icon: Bot, color: "from-purple-500 to-indigo-600", glow: "shadow-purple-500/20", title: "AI Finds Winning Products", desc: "Our AI scans millions of products daily to surface high-margin, trending items you can list immediately." },
              { step: "02", icon: Package, color: "from-indigo-500 to-cyan-600", glow: "shadow-indigo-500/20", title: "Import & Customize", desc: "One click to add products to your store. Set your price, your margins, your brand — total control." },
              { step: "03", icon: Rocket, color: "from-cyan-500 to-teal-600", glow: "shadow-cyan-500/20", title: "Sell & Auto-Fulfill", desc: "When a customer orders, Shopinea automatically notifies the supplier and ships directly. You just collect profits." },
            ].map((s, i) => (
              <div key={i} className="relative flex flex-col items-center text-center p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all group">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-6 shadow-2xl ${s.glow} group-hover:scale-110 transition-transform`}>
                  <s.icon className="w-7 h-7 text-white" />
                </div>
                <span className="absolute top-6 right-6 text-6xl font-black text-white/[0.03] select-none">{s.step}</span>
                <h3 className="text-lg font-bold text-white mb-3 tracking-tight">{s.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed font-medium">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════ FEATURES ══════════════════════════════════════ */}
      <section className="py-32 bg-[#0a0816]/60 border-y border-white/[0.04]">
        <div className="container px-6 max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-300 text-[11px] font-bold uppercase tracking-widest mb-6">
              <Sparkles className="w-3 h-3" /> Everything Included
            </div>
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-5">Built different.<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">Powered by AI.</span></h2>
            <p className="text-zinc-500 text-lg max-w-xl mx-auto">Every tool you need to run a profitable dropshipping store, baked right in.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Bot, title: "AI Product Research", desc: "Real-time trend analysis and profit scoring powered by machine learning. Find winning products before your competitors.", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
              { icon: Globe, title: "Global Supplier Network", desc: "Access 50,000+ verified suppliers across 40+ countries. Diverse products, competitive prices, fast shipping.", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
              { icon: Zap, title: "One-Click Import", desc: "Browse the marketplace, click import, and your store is stocked instantly. Product details, photos, and pricing synced automatically.", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
              { icon: ShieldCheck, title: "Escrow Protection", desc: "Every transaction is secured through our encrypted escrow system. Your money is protected until delivery is confirmed.", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
              { icon: TrendingUp, title: "Smart Analytics", desc: "Deep sales insights, customer behavior patterns, and conversion optimization tips — all in one beautiful dashboard.", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
              { icon: Users, title: "Referral & Rewards", desc: "Earn extra income by referring other merchants. Our multi-tier referral program pays you on every sign-up and sale.", color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
            ].map((f, i) => (
              <div key={i} className={`p-7 rounded-2xl bg-white/[0.02] border ${f.border} hover:bg-white/[0.05] transition-all group`}>
                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-5 border ${f.border} group-hover:scale-110 transition-transform`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="text-base font-bold text-white mb-2 tracking-tight">{f.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════ STATS ════════════════════════════════════════ */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-[600px] h-[400px] bg-purple-700/8 rounded-full blur-[130px]" />
        </div>
        <div className="container px-6 max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: "32K+", label: "Active Merchants", color: "from-purple-400 to-fuchsia-400" },
              { value: "$4.2M", label: "Paid Out Monthly", color: "from-cyan-400 to-blue-400" },
              { value: "50K+", label: "Products in Catalog", color: "from-indigo-400 to-purple-400" },
              { value: "99.7%", label: "Fulfillment Rate", color: "from-emerald-400 to-teal-400" },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center text-center p-8 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.10] transition-all">
                <span className={`text-5xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r ${stat.color} mb-3`}>{stat.value}</span>
                <span className="text-zinc-500 text-sm font-semibold">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════ REVIEWS ════════════════════════════════════════ */}
      <div className="border-t border-white/[0.04] bg-[#08060f]">
        <ReviewsSection />
      </div>

      {/* ═════════════════════════════════ PRICING TEASER ══════════════════════════════════ */}
      <section className="py-32 relative overflow-hidden border-t border-white/[0.04]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[800px] h-[400px] bg-purple-700/12 rounded-full blur-[140px]" />
        </div>
        <div className="container px-6 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-bold uppercase tracking-widest mb-6">
              <Sparkles className="w-3 h-3" /> Flexible Plans
            </div>
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-5">Simple, honest <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">pricing.</span></h2>
            <p className="text-zinc-500 text-lg max-w-xl mx-auto">Professional plans built for real growth. Transparent monthly billing.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { name: "Starter", price: "$300", desc: "Up to 50 active products", features: ["Up to 50 active products", "Professional storefront", "Real-time order tracking", "Standard support"], cta: "Upgrade", highlight: false },
              { name: "Professional", price: "$500", desc: "Unlimited products", features: ["Unlimited products", "AI product recommendations", "Advanced sales analytics", "SEO optimization tools"], cta: "Upgrade", highlight: true },
              { name: "Scale", price: "$1,200", desc: "Built for scaling operations", features: ["Bulk order processing", "Dedicated account manager", "White-label packaging", "Custom API access"], cta: "Upgrade", highlight: false },
              { name: "Enterprise", price: "$5,000", desc: "For advanced multi-store operations", features: ["Multi-store management", "Full legal compliance suite", "Automated tax management", "Concierge support 24/7"], cta: "Upgrade", highlight: false },
            ].map((plan, i) => (
              <div key={i} className={`relative flex flex-col p-8 rounded-2xl border transition-all ${plan.highlight ? "bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border-purple-500/40 shadow-2xl shadow-purple-500/15 scale-105" : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"}`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-[11px] font-bold text-white shadow-lg">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-zinc-500 text-sm">/month</span>
                  </div>
                  <p className="text-zinc-500 text-sm">{plan.desc}</p>
                </div>
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2.5 text-sm text-zinc-300">
                      <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? "text-purple-400" : "text-zinc-600"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard/subscription">
                  <Button className={`w-full h-12 rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${plan.highlight ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-none shadow-lg shadow-purple-500/20" : "bg-white/[0.06] border border-white/[0.10] text-white hover:bg-white/[0.10]"}`}>
                    {plan.cta}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center mt-10 text-zinc-600 text-sm">Choose your plan and complete payment securely from your subscription dashboard.</p>
        </div>
      </section>

      {/* ═══════════════════════════════════════ CTA ════════════════════════════════════════ */}
      <section className="relative py-40 overflow-hidden border-t border-white/[0.04]">
        {/* Background glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[900px] h-[500px] bg-purple-700/15 rounded-full blur-[140px]" />
        </div>
        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)", backgroundSize: "48px 48px"}} />

        <div className="container relative z-10 px-6 max-w-4xl mx-auto flex flex-col items-center text-center">
          {/* Logo mark */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center mb-10 shadow-2xl shadow-purple-500/30">
            <Sparkles className="w-9 h-9 text-white" />
          </div>

          <h2 className="text-5xl sm:text-7xl font-extrabold tracking-[-0.03em] text-white mb-6">
            Your e-commerce<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400">
              empire starts now.
            </span>
          </h2>
          <p className="text-lg text-zinc-400 font-medium max-w-xl mb-12 leading-relaxed">
            Join 32,000+ merchants who are already building profitable online businesses with Shopinea&apos;s AI-powered platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/register">
              <Button size="lg" className="h-14 px-12 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-base shadow-2xl shadow-purple-500/30 border-none transition-all active:scale-[0.98] gap-2">
                <Rocket className="w-5 h-5" />
                Launch My Store — It&apos;s Free
              </Button>
            </Link>
          </div>
          <p className="mt-8 text-[11px] font-bold text-zinc-700 uppercase tracking-[0.25em]">No credit card required · Set up in under 5 minutes</p>
        </div>
      </section>
    </main>
  );
}


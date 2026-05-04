import { Truck, Package, Search, Globe, Zap, ShieldCheck } from "lucide-react";
import Link from "next/link";

const services = [
    {
        icon: Truck,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        title: "Global Dropshipping",
        desc: "Complete fulfillment solution. You sell, we ship. We automatically process orders and tracking numbers so you never touch inventory.",
    },
    {
        icon: Package,
        color: "text-violet-400",
        bg: "bg-violet-500/10",
        title: "Wholesale Bulk",
        desc: "Purchase in bulk at negotiated wholesale rates. Perfect for retail stores or Amazon FBA sellers looking for high-margin inventory.",
    },
    {
        icon: Search,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        title: "Product Sourcing",
        desc: "Our sourcing agents in China, Vietnam, and Turkey can find any product at the best price with verified quality checks.",
    },
    {
        icon: Globe,
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        title: "Private Labeling",
        desc: "Build your own brand. We handle custom packaging, logo printing, and inserts so customers remember your name.",
    },
    {
        icon: Zap,
        color: "text-rose-400",
        bg: "bg-rose-500/10",
        title: "Paid Ad Management",
        desc: "Run Meta, TikTok, and Google campaigns from your dashboard. Pre-paid and post-paid options available.",
    },
    {
        icon: ShieldCheck,
        color: "text-cyan-400",
        bg: "bg-cyan-500/10",
        title: "Escrow Protection",
        desc: "Every transaction is secured by our escrow system. Profits are released automatically upon confirmed delivery.",
    },
];

export default function ServicesPage() {
    return (
        <main className="flex min-h-screen flex-col bg-[#09090b] text-white">
            {/* Hero */}
            <section className="relative py-32 overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-600/8 rounded-full blur-[160px]" />
                </div>
                <div className="container relative px-6 max-w-6xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20 text-[11px] font-semibold uppercase tracking-widest text-blue-400 mb-6">
                        What We Offer
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-5">
                        Comprehensive{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                            commerce solutions
                        </span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg text-zinc-400 leading-relaxed">
                        Whether you&apos;re a solo entrepreneur or a growing enterprise, shopinea provides the infrastructure you need to scale without limits.
                    </p>
                </div>
            </section>

            {/* Services Grid */}
            <section className="py-16 pb-32">
                <div className="container px-6 max-w-6xl mx-auto">
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {services.map((s, i) => (
                            <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 hover:border-white/[0.12] transition-colors">
                                <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center mb-5`}>
                                    <s.icon className={`w-6 h-6 ${s.color}`} />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-3">{s.title}</h3>
                                <p className="text-zinc-400 leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 border-t border-white/[0.06]">
                <div className="container px-6 max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-5">Ready to expand your capabilities?</h2>
                    <p className="text-lg text-zinc-400 mb-10">Join thousands of merchants already using shopinea to grow their business.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/register" className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors">
                            Get Started Today
                        </Link>
                        <Link href="/pricing" className="px-8 py-3.5 bg-white/[0.06] border border-white/[0.08] text-zinc-300 hover:bg-white/[0.1] font-semibold rounded-xl transition-colors">
                            View Pricing
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}

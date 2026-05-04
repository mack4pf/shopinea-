import Link from "next/link";
import { Users, Target, Heart, Zap, Globe, Shield } from "lucide-react";

export default function AboutUsPage() {
    return (
        <main className="flex min-h-screen flex-col bg-[#09090b] text-white">
            {/* Hero */}
            <section className="relative py-32 overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-600/8 rounded-full blur-[160px]" />
                </div>
                <div className="container relative px-6 max-w-6xl mx-auto">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20 text-[11px] font-semibold uppercase tracking-widest text-blue-400 mb-6">
                            Our Mission
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
                            Empowering the{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                                next generation
                            </span>{" "}
                            of entrepreneurs.
                        </h1>
                        <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl">
                            shopinea is more than a platform — it&apos;s a launchpad. We believe that starting a business shouldn&apos;t require a fortune.
                            Our mission is to democratize access to the global supply chain, allowing anyone to build a thriving retail empire.
                        </p>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="border-y border-white/[0.06] py-12">
                <div className="container px-6 max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { label: "Active Resellers", value: "12,000+" },
                            { label: "Countries Served", value: "80+" },
                            { label: "Products Available", value: "50,000+" },
                            { label: "Orders Fulfilled", value: "2M+" },
                        ].map((stat, i) => (
                            <div key={i} className="text-center">
                                <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                                <p className="text-sm text-zinc-500">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How We Empower You */}
            <section className="py-24">
                <div className="container px-6 max-w-6xl mx-auto">
                    <div className="mb-14">
                        <h2 className="text-3xl md:text-4xl font-bold text-white">How we empower you</h2>
                        <p className="mt-3 text-zinc-400 text-lg">A complete ecosystem designed for your success.</p>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                        {[
                            {
                                icon: Users,
                                color: "text-blue-400",
                                bg: "bg-blue-500/10",
                                title: "You Are The Agent",
                                desc: "We connect suppliers directly to you. As a reseller, you act as the sales representative. Suppliers focus on production, you focus on the customer.",
                                cta: "Earn Affiliate Commissions & Sales Margins"
                            },
                            {
                                icon: Zap,
                                color: "text-violet-400",
                                bg: "bg-violet-500/10",
                                title: "Flexible Ad Financing",
                                desc: "Don't let cash flow stop your growth. We offer pre-paid and post-paid promotion packages. Scale your ads now and repay from your sales profits.",
                                cta: "Grow First, Pay Later"
                            },
                            {
                                icon: Target,
                                color: "text-emerald-400",
                                bg: "bg-emerald-500/10",
                                title: "AI-Powered Research",
                                desc: "Stop guessing. Our AI analyzes global market trends to curate lists of viral products daily. Spend less time researching and more time selling.",
                                cta: "Data-Driven Success"
                            },
                            {
                                icon: Globe,
                                color: "text-amber-400",
                                bg: "bg-amber-500/10",
                                title: "Smart Analytics",
                                desc: "Track your empire. Monitor traffic sources, conversion rates, and profit margins in real-time. Know exactly where your customers are coming from.",
                                cta: "Complete Visibility"
                            },
                        ].map((item, i) => (
                            <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 hover:border-white/[0.12] transition-colors">
                                <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center mb-5`}>
                                    <item.icon className={`w-6 h-6 ${item.color}`} />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                                <p className="text-zinc-400 leading-relaxed mb-4">{item.desc}</p>
                                <p className="text-sm font-semibold text-blue-400">{item.cta}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Core Values */}
            <section className="py-24 border-t border-white/[0.06]">
                <div className="container px-6 max-w-6xl mx-auto">
                    <div className="mb-14">
                        <h2 className="text-3xl md:text-4xl font-bold text-white">Our core values</h2>
                    </div>
                    <div className="grid gap-8 md:grid-cols-3">
                        {[
                            { icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", title: "Community First", desc: "We grow when you grow. We're dedicated to providing the support, education, and tools our community needs to thrive." },
                            { icon: Target, color: "text-violet-400", bg: "bg-violet-500/10", title: "Relentless Innovation", desc: "Commerce moves fast. We stay ahead of the curve with AI-driven insights, automated logistics, and cutting-edge tech." },
                            { icon: Shield, color: "text-emerald-400", bg: "bg-emerald-500/10", title: "Radical Transparency", desc: "No hidden fees. No mystery suppliers. We vet every partner and provide clear, honest pricing at every step." },
                        ].map((v, i) => (
                            <div key={i}>
                                <div className={`w-12 h-12 ${v.bg} rounded-xl flex items-center justify-center mb-5`}>
                                    <v.icon className={`w-6 h-6 ${v.color}`} />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-3">{v.title}</h3>
                                <p className="text-zinc-400 leading-relaxed">{v.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 border-t border-white/[0.06]">
                <div className="container px-6 max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-5">Built for remote workers, by remote workers</h2>
                    <p className="text-lg text-zinc-400 mb-10 leading-relaxed">
                        We understand the freedom of working from anywhere because that&apos;s how we built shopinea.
                        Our team is distributed globally, just like our supply chain.
                    </p>
                    <Link
                        href="/register"
                        className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                    >
                        Join Our Network
                    </Link>
                </div>
            </section>
        </main>
    );
}

import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CheckCircle2, CreditCard, Package, ShieldCheck, Store, Truck } from "lucide-react";

export const metadata: Metadata = {
    title: "Documentation",
    description: "Shopinea documentation for legitimate AI-powered dropshipping, store setup, order tracking, escrow review, subscriptions, and custom storefront workflows.",
};

const sections = [
    { title: "Create your account", icon: Store, text: "Register as a reseller or supplier, verify your email, complete onboarding, and configure your business profile." },
    { title: "Build your store", icon: Package, text: "Add products, set selling prices, customize your storefront, connect custom domains on eligible plans, and preview your public store." },
    { title: "Manage payments", icon: CreditCard, text: "Track pending payment, processing, shipped, delivered, failed, and void-no-payment orders through transparent order status pages." },
    { title: "Escrow workflow", icon: ShieldCheck, text: "Customer payments and merchant payouts are reviewed for order accuracy, payment confirmation, and compliance before settlement." },
    { title: "Fulfillment", icon: Truck, text: "Follow order movement from purchase through processing, shipment, and delivery confirmation." },
];

export default function DocumentationPage() {
    return (
        <div className="min-h-screen bg-[#09090b] text-white">
            <section className="mx-auto max-w-6xl px-6 py-24 space-y-12">
                <div className="max-w-3xl space-y-5">
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-300">
                        <BookOpen className="h-4 w-4" />
                        Shopinea Documentation
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight md:text-6xl">Run your store with clear, legitimate workflows.</h1>
                    <p className="text-base leading-7 text-zinc-400">
                        Shopinea gives merchants tools for product sourcing, storefront customization, AI-assisted store requests, payment review, order tracking, and payout compliance.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {sections.map((item) => (
                        <div key={item.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
                            <item.icon className="h-6 w-6 text-emerald-300" />
                            <h2 className="mt-4 text-lg font-bold">{item.title}</h2>
                            <p className="mt-2 text-sm leading-6 text-zinc-400">{item.text}</p>
                        </div>
                    ))}
                </div>

                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-6">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" />
                        <p className="text-sm leading-6 text-emerald-50">
                            Shopinea is built as a legitimate commerce infrastructure platform. Users must follow the Terms of Service, provide accurate information, and complete required payment, tax, or compliance reviews when applicable.
                        </p>
                    </div>
                </div>

                <Link href="/support" className="inline-flex rounded-xl bg-white px-5 py-3 text-sm font-bold text-zinc-950 hover:bg-zinc-200">
                    Visit Support Center
                </Link>
            </section>
        </div>
    );
}

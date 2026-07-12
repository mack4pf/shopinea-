import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookMarked, Megaphone, PackageSearch, Store, Wallet } from "lucide-react";

export const metadata: Metadata = {
    title: "Selling Guides",
    description: "Selling guides for building legitimate Shopinea stores, choosing products, pricing, fulfillment, ads, and payout readiness.",
};

const guides = [
    { title: "Choose products buyers trust", icon: PackageSearch, text: "Start with verified products, clear descriptions, realistic pricing, and enough margin to cover ads and fulfillment." },
    { title: "Build a credible storefront", icon: Store, text: "Use a clear store name, custom logo, consistent colors, transparent policies, and product pages that answer buyer questions." },
    { title: "Launch ads responsibly", icon: Megaphone, text: "Promote products with accurate claims, clean creatives, and a budget you can track from the dashboard." },
    { title: "Prepare for payouts", icon: Wallet, text: "Keep documents, tax obligations, payment records, and supplier costs clear so withdrawals can pass manual review." },
];

export default function GuidesPage() {
    return (
        <div className="min-h-screen bg-[#09090b] text-white">
            <section className="mx-auto max-w-6xl px-6 py-24 space-y-12">
                <div className="max-w-3xl space-y-5">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                        <BookMarked className="h-4 w-4" />
                        Selling Guides
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight md:text-6xl">Practical guides for serious online sellers.</h1>
                    <p className="text-base leading-7 text-zinc-400">
                        Learn how to set up a legitimate Shopinea store, choose products, launch ads, manage orders, and prepare your account for compliant withdrawals.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {guides.map((guide) => (
                        <div key={guide.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
                            <guide.icon className="h-6 w-6 text-emerald-300" />
                            <h2 className="mt-4 text-lg font-bold">{guide.title}</h2>
                            <p className="mt-2 text-sm leading-6 text-zinc-400">{guide.text}</p>
                        </div>
                    ))}
                </div>

                <Link href="/documentation" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-zinc-950 hover:bg-zinc-200">
                    Read documentation <ArrowRight className="h-4 w-4" />
                </Link>
            </section>
        </div>
    );
}

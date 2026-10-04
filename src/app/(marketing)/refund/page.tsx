import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, RefreshCcw, ShieldCheck } from "lucide-react";
import { SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
    title: "Refund and Dispute Policy",
    description: "Shoplinea refund, dispute, payment review, order issue, and buyer protection information.",
    alternates: { canonical: "/refund" },
};

const sections = [
    ["Order issues", "Buyers and merchants should report incorrect items, missing tracking, damaged products, duplicate payment attempts, or suspected payment issues through support as soon as possible."],
    ["Review process", "Shoplinea may review payment records, order status, supplier notes, delivery evidence, support messages, and checkout information before a refund or dispute decision is made."],
    ["Refund timing", "Refund timing depends on the payment method, supplier status, delivery stage, and the payment provider involved. Some reviews may require additional verification."],
    ["Merchant responsibilities", "Resellers must keep product descriptions accurate, respond to support requests, and provide any available order or supplier information needed for review."],
];

export default function RefundPage() {
    return (
        <main className="min-h-screen bg-[#09090b] text-white">
            <section className="mx-auto max-w-5xl px-6 py-24">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                    <RefreshCcw className="h-4 w-4" /> Refunds & disputes
                </div>
                <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">Clear review steps for payment and order issues.</h1>
                <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400">
                    Shoplinea reviews refunds and disputes through order records, payment status, delivery information, supplier notes, and support history.
                </p>

                <div className="mt-12 grid gap-4 md:grid-cols-2">
                    {sections.map(([title, text]) => (
                        <section key={title} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
                            <ShieldCheck className="h-5 w-5 text-emerald-300" />
                            <h2 className="mt-4 text-lg font-bold">{title}</h2>
                            <p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p>
                        </section>
                    ))}
                </div>

                <div className="mt-10 rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] p-6 text-sm leading-6 text-blue-50">
                    For refund or dispute help, contact <a className="font-bold underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or open Support from your dashboard.
                </div>

                <Link href="/support" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-zinc-950 hover:bg-zinc-200">
                    Contact support <ArrowRight className="h-4 w-4" />
                </Link>
            </section>
        </main>
    );
}

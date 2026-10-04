import type { Metadata } from "next";
import { BadgeCheck, FileCheck2, ShieldCheck } from "lucide-react";
import { LEGAL_EMAIL, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
    title: "AML, KYC, and Compliance",
    description: "Shoplinea account verification, KYC, AML review, sales license, reseller compliance, and payout review information.",
    alternates: { canonical: "/aml-kyc" },
};

const items = [
    ["Identity verification", "Users may be asked to provide identity or business details before payouts, postpaid ads, or sensitive account actions are enabled."],
    ["Payment review", "Deposits, withdrawals, card authorizations, escrow activity, and refund requests may be reviewed to reduce abuse and payment risk."],
    ["Sales license support", "Some countries require reseller permits, tax registrations, VAT numbers, or similar operating documents. Users can submit details in dashboard verification."],
    ["Prohibited activity", "Counterfeit goods, misleading listings, phishing, spam, review manipulation, payment abuse, and unlawful sales activity are not allowed."],
];

export default function AmlKycPage() {
    return (
        <main className="min-h-screen bg-[#09090b] text-white">
            <section className="mx-auto max-w-5xl px-6 py-24">
                <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-purple-300">
                    <ShieldCheck className="h-4 w-4" /> AML / KYC
                </div>
                <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">Compliance reviews that protect the platform.</h1>
                <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400">
                    Shoplinea uses account, payment, payout, order, and sales-license review workflows to help protect buyers, resellers, suppliers, and support teams.
                </p>
                <div className="mt-12 grid gap-4 md:grid-cols-2">
                    {items.map(([title, text]) => (
                        <section key={title} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
                            {title.includes("license") ? <FileCheck2 className="h-5 w-5 text-amber-300" /> : <BadgeCheck className="h-5 w-5 text-purple-300" />}
                            <h2 className="mt-4 text-lg font-bold">{title}</h2>
                            <p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p>
                        </section>
                    ))}
                </div>
                <div className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 text-sm leading-6 text-zinc-400">
                    Compliance questions: <a className="font-bold text-white underline" href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>. General support: <a className="font-bold text-white underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
                </div>
            </section>
        </main>
    );
}

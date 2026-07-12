import type { Metadata } from "next";
import { Lock, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "Shopinea Privacy Policy for account, order, payment review, storefront, analytics, and support data.",
};

const sections = [
    ["Information We Collect", "We collect account details, contact information, store settings, product activity, order data, payment review information, support messages, and platform usage analytics."],
    ["How We Use Data", "We use data to operate Shopinea, verify accounts, process orders, review payments, support withdrawals, secure stores, improve product workflows, and provide support."],
    ["Sharing", "We share information with service providers, payment processors, logistics partners, cloud infrastructure, and compliance reviewers only as needed to provide the platform."],
    ["Security", "We use technical and administrative safeguards for platform data. Users must protect their login credentials and provide accurate account information."],
    ["Retention", "We retain records as needed for account operation, transaction history, fraud prevention, compliance, tax, and dispute review."],
    ["Contact", "For privacy questions, contact privacy@shopinea.com."],
];

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#09090b] text-white">
            <section className="mx-auto max-w-4xl px-6 py-24 space-y-10">
                <div className="space-y-5">
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-300">
                        <Lock className="h-4 w-4" />
                        Privacy Policy
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight md:text-6xl">Privacy Policy</h1>
                    <p className="text-sm text-zinc-500">Last updated: July 2026</p>
                </div>

                <div className="space-y-4">
                    {sections.map(([title, text]) => (
                        <section key={title} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
                            <h2 className="text-lg font-bold">{title}</h2>
                            <p className="mt-2 text-sm leading-7 text-zinc-400">{text}</p>
                        </section>
                    ))}
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-6">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-300" />
                    <p className="text-sm leading-6 text-emerald-50">
                        Shopinea uses data to support legitimate commerce workflows, account safety, order transparency, and payment/payout review.
                    </p>
                </div>
            </section>
        </div>
    );
}

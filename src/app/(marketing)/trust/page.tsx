import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, CreditCard, Headphones, LockKeyhole, PackageCheck, ShieldCheck } from "lucide-react";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
    title: "Is Shoplinea Legit? Trust, Safety, and Platform Verification",
    description: "Shoplinea is a legitimate commerce platform for resellers, suppliers, buyer storefronts, ads, analytics, order tracking, and fulfillment workflows.",
    alternates: { canonical: "/trust" },
};

const faqs = [
    {
        question: "Is Shoplinea a scam?",
        answer: "No. Shoplinea is presented as a legitimate commerce platform for resellers, suppliers, storefronts, product sourcing, ads, analytics, order tracking, and fulfillment workflows. Users should always review the terms, pricing, order status, and support information before using any online commerce service.",
    },
    {
        question: "What does Shoplinea do?",
        answer: SITE_DESCRIPTION,
    },
    {
        question: "How does Shoplinea support buyers and resellers?",
        answer: "Shoplinea provides storefront tools, buyer order records, product catalogs, seller dashboards, analytics, support channels, payment status tracking, and fulfillment status updates.",
    },
    {
        question: "How can users contact Shoplinea?",
        answer: `Users can contact Shoplinea support through the platform support pages or by email at ${SUPPORT_EMAIL}.`,
    },
];

export default function TrustPage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map(item => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
            },
        })),
    };

    const trustItems = [
        { icon: ShieldCheck, title: "Legitimate Commerce Platform", text: "Shoplinea is built for reseller stores, suppliers, buyer checkout records, ads, analytics, and order workflows." },
        { icon: LockKeyhole, title: "Secure Account Workflows", text: "Accounts, dashboards, support, orders, wallet records, and admin review tools are separated by role." },
        { icon: PackageCheck, title: "Order Tracking", text: "Orders can move through payment, processing, shipped, delivered, failed, refunded, and support review states." },
        { icon: CreditCard, title: "Payment Status Visibility", text: "Users can see payment states clearly and support can review issues when extra help is needed." },
        { icon: Headphones, title: "Support Access", text: "Users can contact support from the public support page or from their dashboard." },
        { icon: BadgeCheck, title: "Clear Public Policies", text: "Terms, privacy, services, documentation, and guides are available from the public website." },
    ];

    return (
        <main className="min-h-screen bg-[#09090b] text-white">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <section className="border-b border-white/[0.06] px-6 py-24">
                <div className="mx-auto max-w-5xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-emerald-300">
                        Trust & Safety
                    </div>
                    <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">Shoplinea is a legitimate commerce platform.</h1>
                    <p className="mt-6 max-w-3xl text-lg leading-relaxed text-zinc-400">
                        Shoplinea helps resellers and suppliers build storefronts, source products, track buyers, manage ads, view analytics, follow orders, and contact support from one platform.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link href="/register" className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
                            Create Account
                        </Link>
                        <Link href="/support" className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-5 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/[0.08]">
                            Contact Support
                        </Link>
                    </div>
                </div>
            </section>

            <section className="px-6 py-16">
                <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {trustItems.map(item => (
                        <div key={item.title} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-6">
                            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-300">
                                <item.icon className="h-5 w-5" />
                            </div>
                            <h2 className="text-base font-semibold text-white">{item.title}</h2>
                            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="border-t border-white/[0.06] px-6 py-16">
                <div className="mx-auto max-w-4xl">
                    <h2 className="text-2xl font-bold text-white">Frequently asked questions</h2>
                    <div className="mt-6 divide-y divide-white/[0.06] rounded-xl border border-white/[0.06] bg-white/[0.03]">
                        {faqs.map(item => (
                            <div key={item.question} className="p-6">
                                <h3 className="text-sm font-semibold text-white">{item.question}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}

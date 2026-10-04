import type { Metadata } from "next";
import { Activity, BadgeCheck, Clock3, Mail, ShieldCheck } from "lucide-react";
import { LivePlatformStats } from "@/components/marketing/LivePlatformStats";
import { BILLING_EMAIL, LEGAL_EMAIL, PAYMENTS_EMAIL, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
    title: "Transparency and Platform Status",
    description: "Shoplinea transparency, platform status, live metrics, support response windows, policy updates, and official contacts.",
    alternates: { canonical: "/transparency" },
};

const contacts = [
    ["Support", SUPPORT_EMAIL],
    ["Legal", LEGAL_EMAIL],
    ["Billing", BILLING_EMAIL],
    ["Payments", PAYMENTS_EMAIL],
];

export default function TransparencyPage() {
    return (
        <main className="min-h-screen bg-[#09090b] text-white">
            <section className="mx-auto max-w-6xl px-6 py-24 space-y-12">
                <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                        <Activity className="h-4 w-4" /> Transparency
                    </div>
                    <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">Public platform status and trust information.</h1>
                    <p className="mt-5 text-base leading-7 text-zinc-400">
                        Shoplinea publishes public trust, policy, support, and platform status information so merchants and buyers can understand how the service operates.
                    </p>
                </div>

                <LivePlatformStats />

                <div className="grid gap-4 md:grid-cols-3">
                    {[
                        ["Platform status", "All core web dashboard services operational.", Activity],
                        ["Support response window", "Most account and payment reviews are handled within 24-48 hours.", Clock3],
                        ["Last policy update", "Public policy pages updated in October 2026.", BadgeCheck],
                    ].map(([title, text, Icon]: any) => (
                        <section key={title} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
                            <Icon className="h-5 w-5 text-emerald-300" />
                            <h2 className="mt-4 text-lg font-bold">{title}</h2>
                            <p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p>
                        </section>
                    ))}
                </div>

                <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 h-5 w-5 text-blue-300" />
                        <div>
                            <h2 className="text-lg font-bold">Legal entity details</h2>
                            <p className="mt-2 text-sm leading-6 text-zinc-400">
                                Shoplinea legal entity details are pending official public publication. Users should use the official domain, public policies, dashboard records, and domain-based emails listed below for support and verification.
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 grid gap-3 md:grid-cols-4">
                        {contacts.map(([label, email]) => (
                            <a key={email} href={`mailto:${email}`} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 hover:bg-white/[0.06]">
                                <Mail className="h-4 w-4 text-zinc-500" />
                                <p className="mt-3 text-xs font-bold uppercase tracking-widest text-zinc-500">{label}</p>
                                <p className="mt-1 break-all text-sm font-semibold text-white">{email}</p>
                            </a>
                        ))}
                    </div>
                </section>
            </section>
        </main>
    );
}

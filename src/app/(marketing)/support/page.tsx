import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy, Mail, MessageSquare, ShieldCheck, Timer } from "lucide-react";

export const metadata: Metadata = {
    title: "Support Center",
    description: "Shopinea Support Center for account, order, payment, payout, custom store, supplier, and reseller help.",
};

export default function SupportPage() {
    return (
        <div className="min-h-screen bg-[#09090b] text-white">
            <section className="mx-auto max-w-6xl px-6 py-24 space-y-12">
                <div className="max-w-3xl space-y-5">
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-300">
                        <LifeBuoy className="h-4 w-4" />
                        Support Center
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight md:text-6xl">Support for buyers, resellers, and suppliers.</h1>
                    <p className="text-base leading-7 text-zinc-400">
                        Get help with accounts, payment review, subscriptions, custom stores, order status, withdrawals, and product workflows.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {[
                        { icon: MessageSquare, title: "Dashboard support", text: "Logged-in users can open support from the dashboard for account-specific help." },
                        { icon: Mail, title: "Email support", text: "For general platform questions, contact support@shopinea.com with your account email and reference ID." },
                        { icon: Timer, title: "Review windows", text: "Manual payment, withdrawal, and custom-store reviews may require extra verification before completion." },
                    ].map((item) => (
                        <div key={item.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
                            <item.icon className="h-6 w-6 text-blue-300" />
                            <h2 className="mt-4 text-lg font-bold">{item.title}</h2>
                            <p className="mt-2 text-sm leading-6 text-zinc-400">{item.text}</p>
                        </div>
                    ))}
                </div>

                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-6">
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-300" />
                        <p className="text-sm leading-6 text-emerald-50">
                            Shopinea support reviews platform activity through order records, payment status, support notes, and account compliance history so disputes can be handled professionally.
                        </p>
                    </div>
                </div>

                <Link href="/dashboard/support" className="inline-flex rounded-xl bg-white px-5 py-3 text-sm font-bold text-zinc-950 hover:bg-zinc-200">
                    Open Dashboard Support
                </Link>
            </section>
        </div>
    );
}

import type { Metadata } from "next";
import { Code2, KeyRound, ShieldCheck, Webhook } from "lucide-react";

export const metadata: Metadata = {
    title: "API Reference",
    description: "Shopinea API reference for commerce infrastructure, storefronts, products, payment review, and order tracking integrations.",
};

const endpoints = [
    { method: "GET", path: "/api/verified-products", desc: "Read verified product data for storefront and marketplace use." },
    { method: "POST", path: "/api/import-products", desc: "Import supported product data into the platform catalog." },
    { method: "POST", path: "/api/checkout/card-payment", desc: "Submit card payment review data for verification workflows." },
    { method: "POST", path: "/api/send-email", desc: "Send approved transactional platform notifications." },
];

export default function ApiReferencePage() {
    return (
        <div className="min-h-screen bg-[#09090b] text-white">
            <section className="mx-auto max-w-6xl px-6 py-24 space-y-10">
                <div className="max-w-3xl space-y-5">
                    <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-violet-300">
                        <Code2 className="h-4 w-4" />
                        API Reference
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight md:text-6xl">Infrastructure endpoints for verified commerce workflows.</h1>
                    <p className="text-base leading-7 text-zinc-400">
                        Shopinea APIs support product import, checkout review, email notifications, and marketplace data. Access may require approved platform permissions.
                    </p>
                </div>

                <div className="grid gap-4">
                    {endpoints.map((endpoint) => (
                        <div key={endpoint.path} className="grid gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 md:grid-cols-[120px_1fr]">
                            <div className="font-mono text-xs font-bold text-emerald-300">{endpoint.method}</div>
                            <div>
                                <p className="font-mono text-sm text-white">{endpoint.path}</p>
                                <p className="mt-1 text-sm text-zinc-400">{endpoint.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {[
                        { icon: KeyRound, title: "Permissioned access", text: "Production integrations are reviewed before sensitive operations are enabled." },
                        { icon: ShieldCheck, title: "Compliance aware", text: "Payment, payout, and user data workflows are designed for careful administrative review." },
                        { icon: Webhook, title: "Operational events", text: "Use notifications and transaction states to keep stores and buyers informed." },
                    ].map((item) => (
                        <div key={item.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                            <item.icon className="h-5 w-5 text-blue-300" />
                            <h2 className="mt-4 text-sm font-bold">{item.title}</h2>
                            <p className="mt-2 text-sm leading-6 text-zinc-400">{item.text}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

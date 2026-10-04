import type { Metadata } from "next";
import { PackageCheck, Truck } from "lucide-react";

export const metadata: Metadata = {
    title: "Shipping and Fulfillment",
    description: "Shoplinea shipping, supplier fulfillment, tracking, delivery, and order status information.",
    alternates: { canonical: "/shipping" },
};

const statuses = [
    ["Pending", "Order received or awaiting payment/payment review."],
    ["Processing", "Supplier or fulfillment team is preparing the order."],
    ["Shipped", "Courier or tracking details may be attached to the order."],
    ["Delivered", "Order is marked complete after delivery confirmation."],
    ["Refunded", "Order was reversed after review."],
];

export default function ShippingPage() {
    return (
        <main className="min-h-screen bg-[#09090b] text-white">
            <section className="mx-auto max-w-5xl px-6 py-24">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300">
                    <Truck className="h-4 w-4" /> Shipping & fulfillment
                </div>
                <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">Tracked delivery workflows for buyer orders.</h1>
                <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400">
                    Shoplinea helps merchants coordinate supplier fulfillment, tracking updates, delivery notes, and buyer support from the order record.
                </p>
                <div className="mt-12 space-y-3">
                    {statuses.map(([title, text]) => (
                        <div key={title} className="flex gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                            <PackageCheck className="mt-0.5 h-5 w-5 text-cyan-300" />
                            <div>
                                <h2 className="font-bold">{title}</h2>
                                <p className="mt-1 text-sm leading-6 text-zinc-400">{text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}

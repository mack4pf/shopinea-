"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, doc, getDoc, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Image from "next/image";
import Link from "next/link";
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    ExternalLink,
    Loader2,
    MapPin,
    Package,
    Search,
    ShoppingBag,
    Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusMap: Record<string, { label: string; tone: string; step: number }> = {
    completed: { label: "Delivered", tone: "bg-emerald-50 text-emerald-700 border-emerald-200", step: 4 },
    delivered: { label: "Delivered", tone: "bg-emerald-50 text-emerald-700 border-emerald-200", step: 4 },
    shipped: { label: "On the way", tone: "bg-blue-50 text-blue-700 border-blue-200", step: 3 },
    awaiting_seller_fulfillment: { label: "Preparing", tone: "bg-violet-50 text-violet-700 border-violet-200", step: 2 },
    paid_to_site: { label: "Processing", tone: "bg-amber-50 text-amber-700 border-amber-200", step: 2 },
    awaiting_admin_confirmation: { label: "Processing", tone: "bg-amber-50 text-amber-700 border-amber-200", step: 2 },
};

const steps = ["Placed", "Processing", "Shipped", "Delivered"];

export default function BuyerOrdersPage() {
    const [user, setUser] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [sellerStores, setSellerStores] = useState<Record<string, { storeName?: string; storeSlug?: string }>>({});
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            if (!firebaseUser) {
                setLoading(false);
                return;
            }

            const ordersQuery = query(
                collection(db, "orders"),
                where("customerId", "==", firebaseUser.uid),
                orderBy("createdAt", "desc")
            );

            const unsubscribeOrders = onSnapshot(ordersQuery, async (snapshot) => {
                const nextOrders: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setOrders(nextOrders);
                setLoading(false);

                const missingSellerIds = Array.from(new Set(
                    nextOrders
                        .filter(order => order.resellerId && !order.storeSlug && !order.storeUrl)
                        .map(order => order.resellerId)
                ));

                const idsToFetch = missingSellerIds.filter(id => !sellerStores[id]);
                if (idsToFetch.length > 0) {
                    const entries = await Promise.all(idsToFetch.map(async (sellerId) => {
                        const sellerSnap = await getDoc(doc(db, "users", sellerId));
                        if (!sellerSnap.exists()) return null;
                        const data = sellerSnap.data();
                        return [sellerId, { storeName: data.storeName, storeSlug: data.storeSlug }] as const;
                    }));
                    setSellerStores(prev => ({
                        ...prev,
                        ...Object.fromEntries(entries.filter(Boolean) as Array<readonly [string, { storeName?: string; storeSlug?: string }]>),
                    }));
                }
            }, (error) => {
                console.error(error);
                setLoading(false);
            });

            return () => unsubscribeOrders();
        });

        return () => unsubscribeAuth();
    }, [sellerStores]);

    const filteredOrders = useMemo(() => {
        const clean = searchQuery.trim().toLowerCase();
        if (!clean) return orders;
        return orders.filter(order =>
            (order.productName || "").toLowerCase().includes(clean) ||
            (order.storeName || "").toLowerCase().includes(clean) ||
            order.id.toLowerCase().includes(clean)
        );
    }, [orders, searchQuery]);

    const totalSpent = orders.reduce((sum, order) => sum + Number(order.resellPrice || 0), 0);

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                    <ShoppingBag className="h-8 w-8 text-slate-400" />
                </div>
                <h1 className="text-2xl font-black text-slate-950">Sign in to view orders</h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">Your purchases, delivery updates, and receipts live here.</p>
                <Link href="/login" className="mt-6 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-black text-white hover:bg-slate-800">
                    Sign in
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-5 pb-16">
            <div className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6">
                <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-950">
                    <ArrowLeft className="h-4 w-4" />
                    Continue shopping
                </Link>
                <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-950">Your orders</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Track purchases, revisit stores, and follow delivery updates.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:w-80">
                        <div className="rounded-lg bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Orders</p>
                            <p className="mt-1 text-2xl font-black text-slate-950">{orders.length}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Spent</p>
                            <p className="mt-1 text-2xl font-black text-slate-950">${totalSpent.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex max-w-xl items-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search by product, store, or order number"
                        className="ml-2 w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    />
                </div>
            </div>

            {filteredOrders.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white py-20 text-center shadow-sm">
                    <ShoppingBag className="mx-auto h-12 w-12 text-slate-300" />
                    <h2 className="mt-4 text-xl font-black text-slate-950">No orders found</h2>
                    <p className="mt-2 text-sm text-slate-500">
                        {orders.length === 0 ? "When you buy something, it will show here." : "Try a different search."}
                    </p>
                    <Link href="/marketplace" className="mt-6 inline-flex rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-black text-white hover:bg-slate-800">
                        Start shopping
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map(order => {
                        const status = statusMap[order.status] || { label: "Pending", tone: "bg-slate-50 text-slate-600 border-slate-200", step: 1 };
                        const createdAt = order.createdAt?.toDate ? order.createdAt.toDate() : (order.createdAt ? new Date(order.createdAt) : null);
                        const sellerStore = sellerStores[order.resellerId] || {};
                        const storeSlug = order.storeSlug || sellerStore.storeSlug;
                        const storeHref = order.storeUrl || (storeSlug ? `/store/${storeSlug}` : "/marketplace");
                        const storeName = order.storeName || sellerStore.storeName || "Seller store";

                        return (
                            <article key={order.id} className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
                                <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                                            {order.productImage ? (
                                                <Image src={order.productImage} alt={order.productName || "Product"} fill className="object-cover" />
                                            ) : (
                                                <Package className="h-8 w-8 text-slate-300" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">#{order.id.slice(-8).toUpperCase()}</p>
                                            <h2 className="mt-1 text-base font-black text-slate-950">{order.productName || "Product"}</h2>
                                            <Link href={storeHref} className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-950">
                                                {storeName}
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                                        <div className="sm:text-right">
                                            <p className="text-xs font-bold text-slate-400">Total</p>
                                            <p className="text-lg font-black text-slate-950">${Number(order.resellPrice || 0).toLocaleString()}</p>
                                        </div>
                                        <span className={cn("rounded-full border px-3 py-1.5 text-xs font-black", status.tone)}>
                                            {status.label}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid gap-5 p-5 lg:grid-cols-[1fr_280px]">
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-4 gap-2">
                                            {steps.map((step, index) => {
                                                const done = index + 1 <= status.step;
                                                return (
                                                    <div key={step} className="space-y-2">
                                                        <div className={cn("h-2 rounded-full", done ? "bg-slate-950" : "bg-slate-200")} />
                                                        <p className={cn("text-[11px] font-black", done ? "text-slate-950" : "text-slate-400")}>{step}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-3">
                                            <div className="rounded-lg bg-slate-50 p-4">
                                                <Clock className="h-4 w-4 text-slate-400" />
                                                <p className="mt-2 text-xs font-bold text-slate-400">Ordered</p>
                                                <p className="mt-0.5 text-sm font-black text-slate-900">
                                                    {createdAt ? createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Recent"}
                                                </p>
                                            </div>
                                            <div className="rounded-lg bg-slate-50 p-4">
                                                <Truck className="h-4 w-4 text-slate-400" />
                                                <p className="mt-2 text-xs font-bold text-slate-400">Delivery</p>
                                                <p className="mt-0.5 text-sm font-black text-slate-900">Standard shipping</p>
                                            </div>
                                            <div className="rounded-lg bg-slate-50 p-4">
                                                <CheckCircle2 className="h-4 w-4 text-slate-400" />
                                                <p className="mt-2 text-xs font-bold text-slate-400">Payment</p>
                                                <p className="mt-0.5 text-sm font-black text-slate-900">{order.paymentType || "Online"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-slate-200 p-4">
                                        <p className="text-sm font-black text-slate-950">Ship to</p>
                                        <div className="mt-3 flex items-start gap-2">
                                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                                            <p className="text-sm leading-6 text-slate-500">
                                                {order.customerAddress || order.shippingAddress || "Address saved on order"}
                                            </p>
                                        </div>
                                        <Link href={storeHref} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-800">
                                            View seller store
                                            <ExternalLink className="h-4 w-4" />
                                        </Link>
                                        <button className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
                                            Track package
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

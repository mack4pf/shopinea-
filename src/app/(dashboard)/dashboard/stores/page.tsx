"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { ExternalLink, Loader2, Megaphone, Package, Palette, Plus, Store } from "lucide-react";

export default function StoresPage() {
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) {
                setLoading(false);
                return;
            }

            const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
            setUserData(userDoc.exists() ? userDoc.data() : {});
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="h-[80vh] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
        );
    }

    const additionalStores = Array.isArray(userData?.additionalStores) ? userData.additionalStores : [];
    const stores = [
        {
            id: "primary",
            storeName: userData?.storeName || "My Store",
            storeSlug: userData?.storeSlug || "",
            storeTagline: userData?.storeTagline || "Premium sourced products, fast shipping.",
            storeProducts: Array.isArray(userData?.storeProducts) ? userData.storeProducts : [],
            primary: true,
        },
        ...additionalStores.map((store: any) => ({
            ...store,
            storeProducts: Array.isArray(store?.storeProducts) ? store.storeProducts : [],
            primary: false,
        })),
    ];
    const maxStores = Number(userData?.maxStores || 1);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Stores</h1>
                    <p className="text-sm text-zinc-500 mt-1">View every store, open live pages, and continue editing from Products.</p>
                </div>
                <Link
                    href="/dashboard/products"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700"
                >
                    <Plus className="h-4 w-4" />
                    Create or Edit Store
                </Link>
            </div>

            <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.07] p-5">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-violet-500/25 bg-violet-500/10">
                        <Megaphone className="h-5 w-5 text-violet-300" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-white">Ads spread across your store network</h2>
                        <p className="mt-1 text-xs leading-5 text-zinc-400">
                            When you run store-wide ads, your campaign can distribute traffic across all active stores on your plan so buyers can reach the best matching products.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {stores.map((store: any) => {
                    const productCount = store.storeProducts.length;
                    return (
                        <article key={store.id} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 space-y-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex min-w-0 items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.05]">
                                        <Store className="h-5 w-5 text-blue-300" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h2 className="truncate text-sm font-semibold text-white">{store.storeName}</h2>
                                            {store.primary && <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-300">Primary</span>}
                                        </div>
                                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{store.storeTagline}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg border border-white/[0.06] bg-zinc-950/50 p-3">
                                    <Package className="h-4 w-4 text-emerald-300" />
                                    <p className="mt-2 text-lg font-bold text-white">{productCount}</p>
                                    <p className="text-[10px] text-zinc-500">Products</p>
                                </div>
                                <div className="rounded-lg border border-white/[0.06] bg-zinc-950/50 p-3">
                                    <Palette className="h-4 w-4 text-amber-300" />
                                    <p className="mt-2 text-xs font-bold text-white">{store.storeTemplate || "classic"}</p>
                                    <p className="text-[10px] text-zinc-500">Template</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <Link
                                    href="/dashboard/products"
                                    className="inline-flex h-9 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-bold text-zinc-200 hover:bg-white/[0.1]"
                                >
                                    Edit
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => window.open(`/store/${store.storeSlug || ""}`, "_blank")}
                                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
                                >
                                    Preview
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </article>
                    );
                })}
            </div>

            {maxStores > 1 && (
                <p className="text-xs text-zinc-500">
                    {stores.length}/{maxStores} stores used. Create another store from the Products page.
                </p>
            )}
        </div>
    );
}

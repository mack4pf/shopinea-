"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    Package, Plus, Search, ExternalLink, Copy, Megaphone,
    TrendingUp, Loader2, Eye, Tag
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export default function ProductsPage() {
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const getCurrencySymbol = (code: string = "USD") => {
        switch (code) {
            case "EUR": return "€";
            case "GBP": return "£";
            default: return "$";
        }
    };

    const currencySymbol = getCurrencySymbol(userData?.currency);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                if (userDoc.exists()) setUserData(userDoc.data());
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Link copied to clipboard.");
    };

    if (loading) return (
        <div className="h-[80vh] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
    );

    const products = userData?.storeProducts || [];
    const filteredProducts = products.filter((p: any) =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalMargin = products.reduce((acc: number, p: any) => acc + ((p.resellPrice || 0) - (p.price || 0)), 0);
    const avgMargin = products.length ? (totalMargin / products.reduce((acc: number, p: any) => acc + (p.price || 0), 0) * 100).toFixed(0) : "0";

    const statCards = [
        { label: "Products", value: products.length },
        { label: "Out of Stock", value: "0" },
        { label: "Orders", value: userData?.stats?.orders || 0 },
        { label: "Avg Margin", value: `${avgMargin}%` },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Products</h1>
                    <p className="text-sm text-zinc-500 mt-1">Manage your product catalog and pricing.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.open(`${window.location.origin}/store/${userData?.storeSlug || ''}`, '_blank')}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-white/[0.06] border border-white/[0.08] text-zinc-300 hover:bg-white/[0.1] transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        View Store
                    </button>
                    <button
                        onClick={() => window.location.href = '/onboarding/reseller'}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Products
                    </button>
                </div>
            </div>

            {/* Search + Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="relative lg:col-span-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                        placeholder="Search products..."
                        className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/40 transition-colors"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-4 gap-3 lg:col-span-2">
                    {statCards.map((stat, i) => (
                        <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3 flex flex-col">
                            <span className="text-[11px] text-zinc-600 mb-1">{stat.label}</span>
                            <span className="text-lg font-semibold text-white">{stat.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] rounded-xl border border-dashed border-white/[0.08]">
                    <Package className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-white mb-2">No products yet</h2>
                    <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto">Add products from the marketplace to start selling.</p>
                    <button
                        onClick={() => window.location.href = '/onboarding/reseller'}
                        className="px-5 py-2.5 text-sm font-medium rounded-lg bg-white/[0.06] border border-white/[0.08] text-zinc-300 hover:bg-white/[0.1] transition-colors"
                    >
                        Browse Products
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredProducts.filter((p: any) => typeof p === 'object' && p !== null).map((product: any, idx: number) => {
                        const profit = (product.resellPrice || 0) - (product.price || 0);
                        const marginPct = product.price > 0 ? ((profit / product.price) * 100).toFixed(0) : "0";

                        return (
                            <div key={product.id || idx} className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/[0.12] transition-all group">
                                {/* Image */}
                                <div className="aspect-[4/3] bg-zinc-900 relative overflow-hidden">
                                    {product.image ? (
                                        <Image
                                            src={product.image}
                                            alt={product.name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Package className="w-16 h-16 text-zinc-800" />
                                        </div>
                                    )}
                                    {/* Badges */}
                                    <div className="absolute top-3 left-3 flex items-center gap-2">
                                        <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-md text-[11px] font-medium text-emerald-400 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                            Active
                                        </span>
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <button
                                            onClick={() => copyToClipboard(`${window.location.origin}/store/${userData?.storeSlug}/product/${product.id}`)}
                                            className="w-8 h-8 bg-black/40 backdrop-blur-md rounded-lg flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    {product.category && (
                                        <div className="absolute bottom-3 left-3">
                                            <span className="px-2.5 py-1 bg-blue-600/80 backdrop-blur-md rounded-md text-[10px] font-medium text-white">
                                                {product.category}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="p-5 space-y-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-white truncate">{product.name || "Product"}</h3>
                                        <p className="text-xs text-zinc-600 mt-0.5">SKU: {product.id?.toString().slice(-8).toUpperCase() || idx}</p>
                                    </div>

                                    {/* Pricing */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white/[0.04] rounded-lg px-3 py-2.5">
                                            <p className="text-[10px] text-zinc-600 mb-0.5">Cost</p>
                                            <p className="text-sm font-semibold text-zinc-300">{currencySymbol}{product.price?.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-blue-500/8 border border-blue-500/10 rounded-lg px-3 py-2.5">
                                            <p className="text-[10px] text-blue-400 mb-0.5">Selling Price</p>
                                            <p className="text-sm font-semibold text-white">{currencySymbol}{product.resellPrice?.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* Profit bar */}
                                    <div className="flex items-center justify-between py-3 border-t border-white/[0.04]">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                            <span className="text-xs text-zinc-500">Profit</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-semibold text-emerald-400">{currencySymbol}{profit.toLocaleString()}</span>
                                            <span className="text-[10px] font-medium text-emerald-500/60 bg-emerald-500/10 px-1.5 py-0.5 rounded">{marginPct}%</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-white/[0.04] text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.08] transition-colors">
                                            <Megaphone className="w-3.5 h-3.5" /> Promote
                                        </button>
                                        <button
                                            onClick={() => window.open(`/store/${userData?.storeSlug}`, '_blank')}
                                            className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-white/[0.04] text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.08] transition-colors"
                                        >
                                            <Eye className="w-3.5 h-3.5" /> Preview
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

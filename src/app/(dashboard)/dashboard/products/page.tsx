"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    Package, Plus, Search, ExternalLink, Copy, Megaphone,
    TrendingUp, Loader2, Eye, Palette, LayoutTemplate, Save, ImageIcon, Trash2
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ui/image-upload";
import { getDefaultStock, STORE_LAYOUTS, STORE_TEMPLATES, STORE_THEME_COLORS } from "@/lib/catalog";

export default function ProductsPage() {
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [customizing, setCustomizing] = useState(false);
    const [creatingStore, setCreatingStore] = useState(false);
    const [removingProductId, setRemovingProductId] = useState<string | null>(null);
    const [storeDraft, setStoreDraft] = useState({ storeName: "", storeTagline: "", themeColor: "#10b981", storeTemplate: "classic", storeLayout: "grid", storeLogo: "" });

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
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setUserData(data);
                    setStoreDraft({
                        storeName: data.storeName || "",
                        storeTagline: data.storeTagline || "",
                        themeColor: data.themeColor || "#10b981",
                        storeTemplate: data.storeTemplate || "classic",
                        storeLayout: data.storeLayout || "grid",
                        storeLogo: data.storeLogo || "",
                    });
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Link copied to clipboard.");
    };

    const saveStoreCustomization = async () => {
        if (!user?.uid) return;
        setCustomizing(true);
        try {
            const updates = {
                storeName: storeDraft.storeName.trim() || userData?.storeName || "My Store",
                storeTagline: storeDraft.storeTagline.trim() || "Premium sourced products, fast shipping.",
                themeColor: storeDraft.themeColor,
                storeTemplate: storeDraft.storeTemplate,
                storeLayout: storeDraft.storeLayout,
                storeLogo: storeDraft.storeLogo,
                updatedAt: new Date().toISOString(),
            };
            await updateDoc(doc(db, "users", user.uid), updates);
            setUserData((prev: any) => ({ ...prev, ...updates }));
            toast.success("Store design saved.");
        } catch (error) {
            console.error(error);
            toast.error("Could not save store design.");
        } finally {
            setCustomizing(false);
        }
    };

    const createAdditionalStore = async () => {
        if (!user?.uid) return;
        const maxStores = Number(userData?.maxStores || 1);
        const additionalStores = Array.isArray(userData?.additionalStores) ? userData.additionalStores : [];
        if (maxStores <= 1 || additionalStores.length + 1 >= maxStores) {
            toast.error("Upgrade your plan to create more stores.");
            return;
        }

        setCreatingStore(true);
        try {
            const storeNumber = additionalStores.length + 2;
            const baseSlug = (userData?.storeSlug || userData?.storeName || user?.displayName || "store")
                .toString()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");
            const newStore = {
                id: `store-${Date.now()}`,
                storeName: `${userData?.storeName || "My Store"} ${storeNumber}`,
                storeSlug: `${baseSlug}-${storeNumber}`,
                storeTagline: userData?.storeTagline || "Premium sourced products, fast shipping.",
                themeColor: userData?.themeColor || "#10b981",
                storeTemplate: userData?.storeTemplate || "classic",
                storeLayout: userData?.storeLayout || "grid",
                storeLogo: userData?.storeLogo || "",
                storeProducts: products,
                createdAt: new Date().toISOString(),
            };
            const nextStores = [...additionalStores, newStore];
            const nextSlugs = nextStores.map((store: any) => store.storeSlug);
            await updateDoc(doc(db, "users", user.uid), {
                additionalStores: nextStores,
                additionalStoreSlugs: nextSlugs,
                updatedAt: new Date().toISOString(),
            });
            setUserData((prev: any) => ({ ...prev, additionalStores: nextStores, additionalStoreSlugs: nextSlugs }));
            toast.success("New store created.");
            window.open(`${window.location.origin}/store/${newStore.storeSlug}`, "_blank");
        } catch (error) {
            console.error(error);
            toast.error("Could not create store.");
        } finally {
            setCreatingStore(false);
        }
    };

    const removeProduct = async (product: any, productIndex: number) => {
        if (!user?.uid) return;
        const productKey = product.id || `${product.name}-${productIndex}`;
        const confirmed = window.confirm(`Remove "${product.name || "this product"}" from your store?`);
        if (!confirmed) return;

        setRemovingProductId(productKey);
        try {
            const currentProducts = Array.isArray(userData?.storeProducts) ? userData.storeProducts : [];
            const nextProducts = currentProducts.filter((item: any, index: number) => {
                if (product.id) return item.id !== product.id;
                return !(index === currentProducts.findIndex((candidate: any) =>
                    candidate?.name === product.name &&
                    candidate?.price === product.price &&
                    candidate?.resellPrice === product.resellPrice
                ));
            });

            await updateDoc(doc(db, "users", user.uid), {
                storeProducts: nextProducts,
                updatedAt: new Date().toISOString(),
            });
            setUserData((prev: any) => ({ ...prev, storeProducts: nextProducts }));
            toast.success("Product removed from your store.");
        } catch (error) {
            console.error(error);
            toast.error("Could not remove product.");
        } finally {
            setRemovingProductId(null);
        }
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

    const FREE_PLAN_LIMIT = 20;
    const isFree = !userData?.plan || userData?.plan === "free";
    const atLimit = isFree && products.length >= FREE_PLAN_LIMIT;

    const totalMargin = products.reduce((acc: number, p: any) => acc + ((p.resellPrice || 0) - (p.price || 0)), 0);
    const avgMargin = products.length ? (totalMargin / products.reduce((acc: number, p: any) => acc + (p.price || 0), 0) * 100).toFixed(0) : "0";

    const statCards = [
        { label: "Products", value: products.length },
        { label: "Out of Stock", value: products.filter((p: any) => (p.stock ?? getDefaultStock(p.id || p.name)) <= 0).length },
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
                        onClick={() => {
                            if (atLimit) {
                                window.location.href = '/dashboard/subscription';
                            } else {
                                window.location.href = '/onboarding/reseller';
                            }
                        }}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                            atLimit 
                                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                        <Plus className="w-4 h-4" />
                        {atLimit ? 'Upgrade to Add More' : 'Add Products'}
                    </button>
                </div>
            </div>

            {/* Free Plan Limit Banner */}
            {isFree && (
                <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-4 rounded-xl border ${atLimit ? 'bg-amber-500/5 border-amber-500/20' : 'bg-blue-500/5 border-blue-500/20'}`}>
                    <div className="flex items-start gap-3 flex-1">
                        <span className="text-lg mt-0.5">🔒</span>
                        <div className="flex-1">
                            <p className="text-sm text-white leading-snug">
                                <strong className="font-extrabold text-white">Free plan: you can only view and add up to 20 products to your store.</strong>{" "}
                                <a href="/dashboard/subscription" className="text-blue-400 font-bold underline underline-offset-2 hover:text-blue-300 transition-colors">Upgrade your plan</a> to get more products.
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                                <div className="w-40 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-500 rounded-full ${atLimit ? 'bg-amber-500' : 'bg-blue-600'}`}
                                        style={{ width: `${Math.min(100, (products.length / FREE_PLAN_LIMIT) * 100)}%` }}
                                    />
                                </div>
                                <span className={`text-xs font-bold ${atLimit ? 'text-amber-400' : 'text-zinc-400'}`}>{products.length}/{FREE_PLAN_LIMIT} used</span>
                            </div>
                        </div>
                    </div>
                    {atLimit && (
                        <button 
                            onClick={() => window.location.href = '/dashboard/subscription'}
                            className="shrink-0 px-4 py-2 text-xs font-bold rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors"
                        >
                            Upgrade Plan
                        </button>
                    )}
                </div>
            )}

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

            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 space-y-5">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Palette className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-white">Store customization</h2>
                            <p className="text-xs text-zinc-500">Choose your logo, color, page style, product layout, name, and tagline.</p>
                        </div>
                    </div>
                    <button
                        onClick={saveStoreCustomization}
                        disabled={customizing}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 disabled:opacity-60 transition-colors"
                    >
                        {customizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save
                    </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-5">
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                            <ImageIcon className="w-3 h-3" /> Brand logo
                        </p>
                        <ImageUpload
                            value={storeDraft.storeLogo}
                            onChange={(url) => setStoreDraft(prev => ({ ...prev, storeLogo: url }))}
                            folder="/shoplinea/brands"
                            label="Upload brand logo"
                            helperText="PNG, JPG, WebP, or transparent logo."
                            compact
                        />
                    </div>
                    <div className="space-y-4">
                        <input
                            value={storeDraft.storeName}
                            onChange={(e) => setStoreDraft(prev => ({ ...prev, storeName: e.target.value }))}
                            placeholder="Store name"
                            className="h-11 w-full px-4 bg-zinc-950/50 border border-white/[0.08] rounded-lg text-sm text-white outline-none focus:border-blue-500/40"
                        />
                        <input
                            value={storeDraft.storeTagline}
                            onChange={(e) => setStoreDraft(prev => ({ ...prev, storeTagline: e.target.value }))}
                            placeholder="Store tagline"
                            className="h-11 w-full px-4 bg-zinc-950/50 border border-white/[0.08] rounded-lg text-sm text-white outline-none focus:border-blue-500/40"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Theme color</p>
                        <div className="flex flex-wrap gap-2">
                            {STORE_THEME_COLORS.map(color => (
                                <button
                                    key={color}
                                    onClick={() => setStoreDraft(prev => ({ ...prev, themeColor: color }))}
                                    className={`w-9 h-9 rounded-lg border transition-all ${storeDraft.themeColor === color ? 'border-white scale-105' : 'border-white/10'}`}
                                    style={{ backgroundColor: color }}
                                    aria-label={`Choose ${color}`}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Page style</p>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {STORE_TEMPLATES.map(template => (
                                <button
                                    key={template.id}
                                    onClick={() => setStoreDraft(prev => ({ ...prev, storeTemplate: template.id }))}
                                    className={`flex items-center justify-center gap-1.5 h-9 rounded-lg border text-[11px] font-bold transition-colors ${storeDraft.storeTemplate === template.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white'}`}
                                >
                                    <LayoutTemplate className="w-3 h-3" />
                                    {template.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Product layout</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {STORE_LAYOUTS.map(layout => (
                            <button
                                key={layout.id}
                                onClick={() => setStoreDraft(prev => ({ ...prev, storeLayout: layout.id }))}
                                className={`flex items-center justify-center gap-1.5 h-10 rounded-lg border text-xs font-bold transition-colors ${storeDraft.storeLayout === layout.id ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white'}`}
                            >
                                <LayoutTemplate className="w-3.5 h-3.5" />
                                {layout.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {Number(userData?.maxStores || 1) > 1 && (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-sm font-semibold text-white">Multiple stores</h2>
                        <p className="text-xs text-zinc-500 mt-1">
                            {(Array.isArray(userData?.additionalStores) ? userData.additionalStores.length : 0) + 1}/{userData?.maxStores} stores used on your plan.
                        </p>
                    </div>
                    <button
                        onClick={createAdditionalStore}
                        disabled={creatingStore}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
                    >
                        {creatingStore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Create Store
                    </button>
                </div>
            )}

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
                        const stock = Number(product.stock ?? getDefaultStock(product.id || product.name));
                        const productKey = product.id || `${product.name}-${idx}`;

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
                                        <span className={`px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-md text-[11px] font-medium flex items-center gap-1.5 ${stock > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${stock > 0 ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                            {stock > 0 ? `${stock} in stock` : 'Out of stock'}
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
                                    <div className="grid grid-cols-3 gap-2">
                                        <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-white/[0.04] text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.08] transition-colors">
                                            <Megaphone className="w-3.5 h-3.5" /> Promote
                                        </button>
                                        <button
                                            onClick={() => window.open(`/store/${userData?.storeSlug}`, '_blank')}
                                            className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-white/[0.04] text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.08] transition-colors"
                                        >
                                            <Eye className="w-3.5 h-3.5" /> Preview
                                        </button>
                                        <button
                                            onClick={() => removeProduct(product, idx)}
                                            disabled={removingProductId === productKey}
                                            className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-rose-500/10 text-xs font-medium text-rose-300 hover:bg-rose-500/20 disabled:opacity-60 transition-colors"
                                        >
                                            {removingProductId === productKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                            Remove
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

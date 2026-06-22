"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, limit, doc, updateDoc, increment, getDoc } from "firebase/firestore";
import {
    ShoppingBag,
    ShieldCheck,
    CheckCircle2,
    Truck,
    Search,
    Loader2,
    Eye,
    LogOut,
    Package,
    SearchX,
    MessageCircle,
    ShoppingCart,
    Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import InquiryModal from "@/components/modals/InquiryModal";
import CheckoutModal from "@/components/modals/CheckoutModal";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getDefaultStock } from "@/lib/catalog";
import { useCurrency } from "@/hooks/useCurrency";

const TEMPLATE_STYLES: Record<string, { page: string; hero: string; card: string; section: string; label: string }> = {
    classic: {
        page: "bg-[#f4f7fb] text-slate-900",
        hero: "bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900",
        card: "rounded-2xl",
        section: "The Collection",
        label: "Professional Experience",
    },
    spotlight: {
        page: "bg-slate-950 text-white",
        hero: "bg-slate-900",
        card: "rounded-xl",
        section: "Featured Drops",
        label: "Spotlight Store",
    },
    minimal: {
        page: "bg-white text-slate-950",
        hero: "bg-slate-100",
        card: "rounded-lg",
        section: "Catalog",
        label: "Minimal Store",
    },
    boutique: {
        page: "bg-rose-50 text-slate-950",
        hero: "bg-gradient-to-r from-rose-950 via-stone-900 to-slate-900",
        card: "rounded-3xl",
        section: "Curated Picks",
        label: "Boutique Edit",
    },
    bold: {
        page: "bg-zinc-950 text-white",
        hero: "bg-gradient-to-r from-zinc-950 via-zinc-900 to-orange-950",
        card: "rounded-md",
        section: "Hot Inventory",
        label: "Bold Storefront",
    },
};

const STORE_PRODUCT_GRID: Record<string, string> = {
    grid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
    featured: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7",
    compact: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4",
    editorial: "grid grid-cols-1 lg:grid-cols-2 gap-8",
};

export default function StorePage() {
    const { slug } = useParams();
    const router = useRouter();
    const [storeUser, setStoreUser] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});
    const [productViewsMap, setProductViewsMap] = useState<Record<string, number>>({});

    // Modal State
    const [inquiryProduct, setInquiryProduct] = useState<any>(null);
    const [checkoutProduct, setCheckoutProduct] = useState<any>(null);
    const currency = useCurrency(storeUser);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (u) => setUser(u));
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        const fetchStore = async () => {
            try {
                let q = query(
                    collection(db, "users"),
                    where("storeSlug", "==", slug),
                    limit(1)
                );
                let querySnapshot = await getDocs(q);
                let additionalStore: any = null;

                if (querySnapshot.empty) {
                    q = query(
                        collection(db, "users"),
                        where("additionalStoreSlugs", "array-contains", slug),
                        limit(1)
                    );
                    querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        const extraStores = querySnapshot.docs[0].data().additionalStores || [];
                        additionalStore = extraStores.find((store: any) => store.storeSlug === slug);
                    }
                }

                if (!querySnapshot.empty) {
                    const uDoc = querySnapshot.docs[0];
                    const ownerData = uDoc.data();
                    const uData = additionalStore
                        ? { uid: uDoc.id, ...ownerData, ...additionalStore, additionalStoreId: additionalStore.id }
                        : { uid: uDoc.id, ...ownerData } as any;
                    setStoreUser(uData);

                    // Increment store view
                    await updateDoc(doc(db, "users", uDoc.id), {
                        "stats.views": increment(1)
                    });

                    // Fetch order counts per product
                    const ordersSnap = await getDocs(query(collection(db, "orders"), where("resellerId", "==", uDoc.id)));
                    const counts: Record<string, number> = {};
                    ordersSnap.docs.forEach(d => {
                        const pid = d.data().productId;
                        if (pid) counts[pid] = (counts[pid] || 0) + 1;
                    });
                    setOrderCounts(counts);

                    // Read per-product view counts
                    const pvMap: Record<string, number> = uData.productViews || {};
                    setProductViewsMap(pvMap);
                }
            } catch (error) {
                console.error("Error fetching store:", error);
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchStore();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!storeUser) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] p-6 text-center text-white">
                <div className="w-20 h-20 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 border border-white/[0.06]">
                    <ShoppingBag className="w-10 h-10 text-zinc-600" />
                </div>
                <h1 className="text-2xl font-bold">Store Not Found</h1>
                <p className="text-zinc-500 mt-2 font-medium">This storefront might have been moved or taken offline.</p>
                <Button className="mt-8 rounded-xl bg-blue-600 hover:bg-blue-700 px-8 h-12 font-bold" onClick={() => router.push("/")}>Return Home</Button>
            </div>
        );
    }

    const products = Array.isArray(storeUser.storeProducts) ? storeUser.storeProducts : [];
    const accentColor = storeUser.themeColor || "#10b981";
    const template = TEMPLATE_STYLES[storeUser.storeTemplate || "classic"] || TEMPLATE_STYLES.classic;
    const storeLayout = storeUser.storeLayout || "grid";
    const tagline = storeUser.storeTagline || "Discover high-quality products from verified global suppliers.";
    // Top products for hero: those with an image, up to 4
    const heroProducts = products.filter((p: any) => p?.image).slice(0, 4);
    const filteredProducts = products.filter((p: any) => {
        if (!p) return false;
        const productLabel = (p.name || p.productName || "").toString().toLowerCase();
        return productLabel.includes(searchQuery.toLowerCase());
    });

    // Top sellers: products with the most orders
    const topSellers = [...products]
        .filter((p: any) => p && (orderCounts[p.id] || 0) > 0)
        .sort((a: any, b: any) => (orderCounts[b.id] || 0) - (orderCounts[a.id] || 0))
        .slice(0, 4);

    const handleProductView = async (product: any) => {
        if (!product?.id || !storeUser?.uid) return;
        // Increment local state immediately
        setProductViewsMap(prev => ({ ...prev, [product.id]: (prev[product.id] || 0) + 1 }));
        try {
            await updateDoc(doc(db, "users", storeUser.uid), {
                [`productViews.${product.id}`]: increment(1)
            });
        } catch { /* silent */ }
    };

    return (
        <div className={cn("min-h-screen selection:bg-emerald-200/70", template.page)}>
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 py-3">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-xl overflow-hidden bg-white border border-slate-200"
                            style={{ backgroundColor: storeUser.storeLogo ? "#ffffff" : accentColor }}>
                            {storeUser.storeLogo ? (
                                <Image src={storeUser.storeLogo} alt={`${storeUser.storeName || "Store"} logo`} width={40} height={40} className="h-full w-full object-contain p-1" />
                            ) : (
                                storeUser.storeName?.[0] || "S"
                            )}
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">{storeUser.storeName}</h1>
                            <div className="flex items-center gap-1.5 mt-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-700">Verified Storefront</span>
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:flex flex-1 max-w-md mx-12">
                        <div className="relative w-full group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-700 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search collection..."
                                className="w-full h-10 pl-11 rounded-lg bg-white border border-slate-200 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/60 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {user ? (
                            <div className="flex items-center gap-2">
                                <Link href="/buyer-orders">
                                    <Button variant="ghost" className="rounded-lg h-10 px-4 gap-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-xs font-bold uppercase tracking-tight">
                                        <Package className="w-4 h-4" />
                                        <span className="hidden sm:inline">My Orders</span>
                                    </Button>
                                </Link>
                                <Button
                                    onClick={() => signOut(auth)}
                                    variant="ghost"
                                    className="rounded-lg h-10 w-10 p-0 flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-100 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <Link href="/">
                                <Button className="rounded-lg font-bold h-10 px-6 brand-gradient text-white hover:opacity-90 transition-all text-xs">
                                    Sign In
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-12 max-w-7xl space-y-24">
                {/* Hero Banner */}
                <section className={cn("relative rounded-[2rem] overflow-hidden border border-slate-700/50 min-h-[420px] flex items-center", template.hero)}>
                    {/* Background product image collage */}
                    {heroProducts.length > 0 && (
                        <div className="absolute inset-0 flex overflow-hidden opacity-25">
                            {heroProducts.map((p: any, i: number) => (
                                <div key={i} className="flex-1 relative min-w-0">
                                    <Image
                                        src={p.image}
                                        alt={p.name || "product"}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/70 to-slate-900/40 z-[1]" />

                    <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12 w-full px-8 sm:px-16 py-16">
                        {/* Left: Text */}
                        <div className="flex-1 space-y-6 max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.07] rounded-full border border-white/[0.18] text-[10px] font-bold uppercase tracking-widest text-slate-200">
                                {storeUser.storeLogo && (
                                    <span className="h-5 w-5 overflow-hidden rounded-md bg-white">
                                        <Image src={storeUser.storeLogo} alt="" width={20} height={20} className="h-full w-full object-contain" />
                                    </span>
                                )}
                                {template.label}
                            </div>
                            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] text-white">
                                {storeUser.storeName} brings premium, trusted products to your customers.
                            </h2>
                            <p className="text-slate-200/80 font-medium text-lg leading-relaxed">
                                {tagline}
                            </p>
                            <div className="flex items-center gap-3">
                                <a href="#collection" className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl transition-colors text-sm shadow-lg"
                                    style={{ backgroundColor: accentColor }}>
                                    <ShoppingBag className="w-4 h-4" /> Shop Now
                                </a>
                                <div className="flex items-center gap-1.5 text-slate-300 text-xs font-bold">
                                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                    Escrow Protected
                                </div>
                            </div>
                        </div>

                        {/* Right: Product Showcase Grid */}
                        {heroProducts.length > 0 && (
                            <div className={`shrink-0 grid gap-3 ${heroProducts.length >= 4 ? 'grid-cols-2' : 'grid-cols-1'}`} style={{ width: heroProducts.length >= 4 ? 340 : 200 }}>
                                {heroProducts.slice(0, 4).map((p: any, i: number) => (
                                    <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-2xl group cursor-pointer" onClick={() => setInquiryProduct(p)}>
                                        <Image
                                            src={p.image}
                                            alt={p.name || "Product"}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                        <div className="absolute bottom-0 left-0 right-0 p-3">
                                            <p className="text-white text-[10px] font-bold line-clamp-1 leading-tight">{p.name}</p>
                                            <p className="text-emerald-300 text-[9px] font-bold mt-0.5">{currency.money(p.resellPrice || p.price || 0)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Products Section */}
                <div id="collection" className="space-y-12">
                    {/* Top Sellers strip */}
                    {topSellers.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-400/20 flex items-center justify-center">
                                    <Flame className="w-4 h-4 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Top Sellers</h3>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Most purchased in this store</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {topSellers.map((product: any, i: number) => (
                                    <div
                                        key={product.id}
                                        className="relative group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md hover:border-amber-300 transition-all"
                                        onClick={() => { handleProductView(product); setInquiryProduct(product); }}
                                    >
                                        {i === 0 && (
                                            <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-full uppercase tracking-wider shadow">
                                                <Flame className="w-2.5 h-2.5" /> #1 Best Seller
                                            </div>
                                        )}
                                        <div className="relative aspect-square overflow-hidden bg-slate-100">
                                            {product.image && (
                                                <Image src={product.image} alt={product.name || ""} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                            )}
                                        </div>
                                        <div className="p-3">
                                            <p className="text-xs font-bold text-slate-800 line-clamp-1 mb-1">{product.name}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-slate-900">{currency.money(product.resellPrice || product.price || 0)}</span>
                                                <span className="flex items-center gap-1 text-[9px] font-bold bg-white/90 border rounded-full px-2 py-0.5"
                                                    style={{ color: accentColor, borderColor: accentColor + '33' }}>
                                                    <ShoppingCart className="w-2.5 h-2.5" /> {(orderCounts[product.id] || 0).toLocaleString()} sold
                                                </span>
                                            </div>
                                            {(productViewsMap[product.id] || 0) > 0 && (
                                                <div className="flex items-center gap-1 mt-1.5 text-[9px] text-zinc-400 font-medium">
                                                    <Eye className="w-2.5 h-2.5" /> {(productViewsMap[product.id] || 0).toLocaleString()} views
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex items-end justify-between border-b border-slate-200 pb-6">
                        <div>
                            <h3 className="text-2xl font-bold">{template.section}</h3>
                            <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mt-1">
                                {filteredProducts.length} items available
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-600 text-[10px] font-bold uppercase tracking-[0.1em]">
                            <Truck className="w-3 h-3" /> Priority Express Shipping
                        </div>
                    </div>

                    <div className={STORE_PRODUCT_GRID[storeLayout] || STORE_PRODUCT_GRID.grid}>
                        {filteredProducts.length === 0 ? (
                            <div className="col-span-full py-40 flex flex-col items-center text-center space-y-4 bg-zinc-900/40 rounded-3xl border border-white/[0.04]">
                                <SearchX className="w-12 h-12 text-zinc-800" />
                                <div className="space-y-1">
                                    <h4 className="text-white font-bold">No items found</h4>
                                    <p className="text-zinc-600 text-sm font-medium">We couldn't find any products matching your search.</p>
                                </div>
                                <Button variant="outline" onClick={() => setSearchQuery("")} className="rounded-xl border-white/[0.1] hover:bg-white/[0.04] text-xs font-bold">Clear Search</Button>
                            </div>
                        ) : (
                            filteredProducts.map((product: any) => (
                                <ProductCard 
                                    key={product.id} 
                                    product={product}
                                    salesCount={orderCounts[product.id] || 0}
                                    viewCount={productViewsMap[product.id] || 0}
                                    cardRadius={template.card}
                                    layout={storeLayout}
                                    formattedPrice={currency.money(product.resellPrice ?? product.price ?? 0)}
                                    onInquiry={() => { handleProductView(product); setInquiryProduct(product); }}
                                    onBuyNow={() => { handleProductView(product); setCheckoutProduct(product); }}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Features Footer */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-8 py-20 border-t border-slate-200">
                    {[
                        { title: "Escrow Protection", desc: "Your payment is held securely and only released once your order is successfully delivered.", icon: ShieldCheck },
                        { title: "Verified Sourcing", desc: "Every product in this store is sourced from quality-vetted global manufacturers.", icon: ShoppingCart },
                        { title: "24/7 Assistance", desc: "Need help? Contact the merchant directly through our secure messaging system.", icon: MessageCircle }
                    ].map((f, i) => (
                        <div key={i} className="flex flex-col items-center text-center gap-4 p-8 bg-white rounded-3xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mb-2">
                                <f.icon className="w-6 h-6 text-emerald-700" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 tracking-tight">{f.title}</h4>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </section>
            </main>

            {/* Modals */}
            <InquiryModal
                isOpen={!!inquiryProduct}
                onClose={() => setInquiryProduct(null)}
                product={inquiryProduct}
                storeUser={storeUser}
                onProceedToCheckout={() => {
                    setCheckoutProduct(inquiryProduct);
                    setInquiryProduct(null);
                }}
            />

            <CheckoutModal
                isOpen={!!checkoutProduct}
                onClose={() => setCheckoutProduct(null)}
                product={checkoutProduct}
                storeUser={storeUser}
                storeSlug={String(slug || storeUser.storeSlug || "")}
            />

            <footer className="border-t border-slate-200 p-12 text-center text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">
                &copy; 2026 {storeUser.storeName}. Powered by Shopinea.
            </footer>
        </div>
    );
}

function ProductCard({ product, onInquiry, onBuyNow, salesCount = 0, viewCount = 0, cardRadius = "rounded-2xl", layout = "grid", formattedPrice }: { product: any; onInquiry: () => void; onBuyNow: () => void; salesCount?: number; viewCount?: number; cardRadius?: string; layout?: string; formattedPrice: string }) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const stock = Number(product.stock ?? getDefaultStock(product.id || product.name));
    const inStock = stock > 0;
    const isCompact = layout === "compact";
    const isEditorial = layout === "editorial";

    return (
        <div className={cn("group bg-white border border-slate-200 overflow-hidden hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 shadow-sm", isEditorial ? "grid md:grid-cols-[42%_1fr]" : "flex flex-col", cardRadius)}>
            <div className={cn("relative overflow-hidden bg-slate-100 cursor-pointer", isCompact ? "aspect-square" : isEditorial ? "aspect-[4/3] md:aspect-auto" : "aspect-[4/5]")} onClick={onInquiry}>
                {product.image ? (
                    <Image 
                        src={product.image} 
                        alt={product.name || product.productName || "Product image"} 
                        fill 
                        className={cn(
                            "object-cover transition-transform duration-700 group-hover:scale-105",
                            imageLoaded ? "opacity-100" : "opacity-0"
                        )}
                        onLoadingComplete={() => setImageLoaded(true)}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        <ShoppingBag className="w-16 h-16" />
                    </div>
                )}
                
                {/* Views + Sales badge */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
                    <div className={`px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-full border border-slate-200 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${inStock ? 'text-emerald-700' : 'text-rose-700'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${inStock ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {inStock ? `${stock} in stock` : 'Out of stock'}
                    </div>
                    {viewCount > 0 && (
                        <div className="px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-full border border-slate-200 text-[9px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <Eye className="w-3 h-3 text-emerald-600" />
                            {viewCount.toLocaleString()} views
                        </div>
                    )}
                    {salesCount > 0 && (
                        <div className="px-2.5 py-1 bg-amber-500/90 backdrop-blur-md rounded-full text-[9px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                            <Flame className="w-3 h-3" />
                            {salesCount.toLocaleString()} sold
                        </div>
                    )}
                </div>

                <div className="absolute bottom-4 left-4 right-4 translate-y-20 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out z-20">
                    <Button
                        onClick={(e) => { e.stopPropagation(); onBuyNow(); }}
                        disabled={!inStock}
                        className="w-full h-12 brand-gradient text-white font-bold rounded-xl shadow-2xl hover:opacity-90 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {inStock ? 'Buy Now' : 'Out of Stock'}
                    </Button>
                </div>
            </div>
            
            <div className={cn("flex flex-col flex-1", isCompact ? "p-4" : "p-6")}>
                <div className="flex-1 space-y-2 cursor-pointer" onClick={onInquiry}>
                   <h4 className={cn("font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-emerald-700 transition-colors", isCompact ? "text-xs" : "text-sm")}>{product.name || product.productName || "Untitled product"}</h4>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{product.category || 'Lifestyle'}</p>
                   {isEditorial && (
                    <p className="text-sm text-slate-500 line-clamp-3">{product.description}</p>
                   )}
                </div>
                
                <div className="flex justify-between items-end mt-6 pt-4 border-t border-slate-200">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-none mb-1">Price</p>
                        <p className={cn("font-bold tracking-tight text-slate-900", isCompact ? "text-lg" : "text-2xl")}>{formattedPrice}</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Verified</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button
                        onClick={onBuyNow}
                        disabled={!inStock}
                        className="h-10 rounded-lg bg-slate-950 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60"
                    >
                        Buy Now
                    </Button>
                    <Button
                        onClick={onInquiry}
                        variant="outline"
                        className="h-10 rounded-lg border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                        Enquiry
                    </Button>
                </div>
            </div>
        </div>
    );
}

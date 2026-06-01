"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, limit, orderBy, query, startAfter, where, type QueryConstraint } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Filter, LayoutGrid, Loader2, PackageOpen, Search, ShoppingBag } from "lucide-react";
import { auth, db } from "@/lib/firebase/config";
import { getFastProductImageUrl, getMarketplaceSourceLabel, getProductKey, PRODUCT_CATEGORIES, PRODUCT_PAGE_SIZE, type CatalogProduct, type ProductCursor } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/shared/Navbar";
import { cn } from "@/lib/utils";

export default function MarketplacePage() {
    const [products, setProducts] = useState<CatalogProduct[]>([]);
    const [liveProducts, setLiveProducts] = useState<CatalogProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [liveLoading, setLiveLoading] = useState(false);
    const [liveError, setLiveError] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [cursor, setCursor] = useState<ProductCursor>(null);
    const [hasMore, setHasMore] = useState(true);
    const [user, setUser] = useState<unknown>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const router = useRouter();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => setUser(u));
        return () => unsub();
    }, []);

    const buildQuery = (nextCursor?: ProductCursor) => {
        const constraints: QueryConstraint[] = selectedCategory === "All"
            ? [orderBy("sortOrder"), limit(PRODUCT_PAGE_SIZE)]
            : [where("category", "==", selectedCategory), limit(PRODUCT_PAGE_SIZE)];

        if (nextCursor) constraints.push(startAfter(nextCursor));
        return query(collection(db, "products"), ...constraints);
    };

    const loadLiveProducts = async () => {
        setLiveLoading(true);
        setLiveError(null);
        try {
            const res = await fetch("/api/verified-products");
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error || "Failed to load live products.");
            }
            const filteredByCategory = selectedCategory === "All"
                ? data
                : data.filter((product: CatalogProduct) => product.category === selectedCategory);
            setLiveProducts(filteredByCategory);
        } catch (error: any) {
            console.error(error);
            setLiveError(error?.message || "Unable to fetch live products.");
            setLiveProducts([]);
        } finally {
            setLiveLoading(false);
        }
    };

    const loadProducts = async (mode: "reset" | "more" = "reset") => {
        if (mode === "more") setLoadingMore(true);
        else setLoading(true);

        try {
            const snapshot = await getDocs(buildQuery(mode === "more" ? cursor : null));
            const nextProducts = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as CatalogProduct));
            setProducts((prev) => dedupeProducts(mode === "more" ? [...prev, ...nextProducts] : nextProducts));
            setCursor(snapshot.docs.at(-1) ?? null);
            setHasMore(snapshot.docs.length === PRODUCT_PAGE_SIZE);
        } catch (error) {
            console.error("Error fetching products:", error);
            setHasMore(false);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        setCursor(null);
        setProducts([]);
        setHasMore(true);
        void loadProducts("reset");
        void loadLiveProducts();
    }, [selectedCategory]);

    const combinedProducts = useMemo(() => dedupeProducts([...products, ...liveProducts]), [products, liveProducts]);
    const filtered = useMemo(() => {
        const term = searchQuery.trim().toLowerCase();
        if (!term) return combinedProducts;
        return combinedProducts.filter((p) => [p.name, p.category, p.description, p.source].some((value) => value?.toLowerCase().includes(term)));
    }, [combinedProducts, searchQuery]);
    const showLiveWarning = liveError && !liveLoading && liveProducts.length === 0 && products.length > 0;

    const handleProductClick = () => {
        router.push(user ? "/onboarding/reseller" : "/login?redirect=/onboarding/reseller");
    };

    return (
        <div className="min-h-screen bg-[#f5f7fb] pb-24 text-slate-900 selection:bg-emerald-200/70">
            <Navbar />
            <div className="h-20 sm:h-24" />

            <main className="container mx-auto max-w-7xl space-y-10 px-4 sm:px-6">
                <section className="grid gap-6 border-b border-slate-200 pb-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
                    <div className="max-w-2xl space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            Professional Sourcing
                        </div>
                        <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-6xl">
                            Products ready to sell.
                        </h1>
                        <p className="max-w-xl text-base font-medium leading-7 text-slate-600">
                            Browse the catalog in fast pages, filter by category, then add products to your store.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                            <strong className="font-semibold">Combined live feed + marketplace catalog</strong>
                            <p className="mt-2 text-xs text-slate-500">Showing products from DummyJSON, FakeStoreAPI, Shopify feeds, and the marketplace catalog all together.</p>
                        </div>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search all products..."
                                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500/50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                <section className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
                    <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                            <Filter className="h-4 w-4" />
                            Categories
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
                            {PRODUCT_CATEGORIES.map((category) => (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => setSelectedCategory(category)}
                                    className={cn(
                                        "shrink-0 rounded-xl border px-4 py-2.5 text-left text-sm font-bold transition-colors",
                                        selectedCategory === category
                                            ? "border-slate-900 bg-slate-900 text-white"
                                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                                    )}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </aside>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
                            <div className="flex items-center gap-2">
                                <LayoutGrid className="h-4 w-4" />
                                {loading || liveLoading ? "Loading" : `${filtered.length} showing`}
                            </div>
                            <span>Sort: Recommended</span>
                        </div>

                        {showLiveWarning && (
                            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                                <span className="text-lg">⚠️</span>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-amber-900">Live product feeds unavailable</p>
                                    <p className="text-xs text-amber-800 mt-1">{liveError}</p>
                                    <p className="text-xs text-amber-700 mt-2">Showing marketplace catalog products. Refresh to retry live feeds.</p>
                                </div>
                            </div>
                        )}

                        {liveError && combinedProducts.length === 0 ? (
                            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-center p-8">
                                <span className="text-3xl">⚠️</span>
                                <h3 className="mt-4 text-lg font-semibold text-slate-900">Could not load products</h3>
                                <p className="mt-2 text-sm text-slate-600 max-w-md">{liveError}</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                                >
                                    Reload Page
                                </button>
                            </div>
                        ) : loading || (liveLoading && combinedProducts.length === 0) ? (
                            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                <p className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Loading Products</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-center">
                                <PackageOpen className="mb-4 h-12 w-12 text-slate-400" />
                                <h3 className="font-bold text-slate-800">No products found</h3>
                                <p className="mt-1 text-sm font-medium text-slate-500">Try another category, clear search, or switch tab.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                {filtered.map((product) => (
                                    <MarketplaceCard key={product.id} product={product} onClick={handleProductClick} />
                                ))}
                            </div>
                        )}

                        {!loading && hasMore && (
                            <div className="flex justify-center pt-2">
                                <Button
                                    type="button"
                                    onClick={() => loadProducts("more")}
                                    disabled={loadingMore}
                                    className="h-12 rounded-xl bg-slate-900 px-8 font-bold text-white hover:bg-slate-800"
                                >
                                    {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Load More Products
                                </Button>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

function dedupeProducts(products: CatalogProduct[]) {
    const seen = new Set<string>();
    return products.filter((product) => {
        const key = getProductKey(product);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function MarketplaceCard({ product, onClick }: { product: CatalogProduct; onClick: () => void }) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageFailed, setImageFailed] = useState(false);
    const imageUrl = getFastProductImageUrl(product.image);
    const sourceLabel = getMarketplaceSourceLabel(product.source);

    const handleViewProduct = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        if (product.sourceUrl) {
            window.open(product.sourceUrl, "_blank");
        } else {
            onClick();
        }
    };

    return (
        <article
            onClick={onClick}
            className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-slate-300 hover:bg-slate-50"
        >
            <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
                {imageUrl && !imageFailed ? (
                    <Image
                        src={imageUrl}
                        alt={product.name || "Product"}
                        fill
                        sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                        unoptimized={imageUrl.includes("cdn.shopify.com")}
                        className={cn("object-cover transition duration-500 group-hover:scale-105", imageLoaded ? "opacity-100" : "opacity-0")}
                        onLoadingComplete={() => setImageLoaded(true)}
                        onError={() => {
                            setImageFailed(true);
                            setImageLoaded(true);
                        }}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <ShoppingBag className="h-20 w-20" />
                    </div>
                )}
                {!imageLoaded && imageUrl && !imageFailed && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
                    </div>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-700">
                    {sourceLabel}
                </span>
            </div>

            <div className="flex flex-1 flex-col p-5">
                <div className="flex-1 space-y-2">
                    <h4 className="line-clamp-2 text-sm font-black uppercase leading-tight tracking-tight text-slate-900">{product.name}</h4>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{product.category || "General Sourcing"}</p>
                </div>

                <div className="mt-6 flex items-end justify-between border-t border-slate-200 pt-4">
                    <div>
                        <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Base Cost</p>
                        <p className="text-2xl font-bold tracking-tighter text-slate-900">${Number(product.price || 0).toLocaleString()}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-500 transition-all group-hover:bg-emerald-600 group-hover:text-white">
                        <ArrowUpRight className="h-4 w-4" />
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={handleViewProduct}
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                    >
                        View Product
                    </button>
                    <Button className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-black text-white hover:bg-blue-700">
                        Add to Store
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </article>
    );
}

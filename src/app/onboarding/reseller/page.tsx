"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { 
    Check, 
    ShoppingBag, 
    ArrowRight, 
    Search, 
    Sparkles, 
    Loader2, 
    ChevronRight, 
    ChevronDown,
    Zap, 
    Plus,
    Tag,
    ChevronLeft
} from "lucide-react";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, startAfter, updateDoc, where, type QueryConstraint } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { getFastProductImageUrl, getProductKey, getMarketplaceSourceLabel, PRODUCT_CATEGORIES, type ProductCursor } from "@/lib/catalog";
import { products as seedProducts } from "@/lib/seed/products";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Product {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    description: string;
    category: string;
    image: string;
    isPromoted?: boolean;
    isFeatured?: boolean;
    sortOrder?: number;
    catalogVersion?: number;
    source?: string;
    sourceProductId?: string;
    sourceUrl?: string;
}

const FREE_PLAN_LIMIT = 20;
const ONBOARDING_PRODUCT_PAGE_SIZE = 120;
const getRandomStock = () => Math.floor(Math.random() * 41) + 10;

export default function ResellerOnboarding() {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<{ id: string, name: string, price: number, resellPrice: number }[]>([]);
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [existingProductIds, setExistingProductIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [cursor, setCursor] = useState<ProductCursor>(null);
    const [hasMore, setHasMore] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [launchSuccess, setLaunchSuccess] = useState(false);
    const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);

    // Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    const router = useRouter();
    const carouselRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            setUser(u);
            if (u) {
                try {
                    const userDoc = await getDoc(doc(db, "users", u.uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setUserData(data);
                        if (data.storeProducts) {
                            setExistingProductIds(new Set(data.storeProducts.map((p: any) => p.id)));
                        }
                    }
                } catch (err) { console.error(err); }
            }
        });
        return () => unsub();
    }, []);

    const buildProductQuery = useCallback((nextCursor?: ProductCursor) => {
        const constraints: QueryConstraint[] = selectedCategory === "All"
            ? [orderBy("sortOrder"), limit(ONBOARDING_PRODUCT_PAGE_SIZE)]
            : [where("category", "==", selectedCategory), limit(ONBOARDING_PRODUCT_PAGE_SIZE)];

        if (nextCursor) constraints.push(startAfter(nextCursor));
        return query(collection(db, "products"), ...constraints);
    }, [selectedCategory]);

    const loadProducts = useCallback(async (mode: "reset" | "more" = "reset") => {
        if (mode === "more") setLoadingMore(true);
        else setLoading(true);

        try {
            const snapshot = await getDocs(buildProductQuery(mode === "more" ? cursor : null));
            const nextProducts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
            const fallbackProducts = seedProducts.map((product) => ({
                id: getProductKey(product),
                ...product,
            })) as Product[];
            const categoryFallback = selectedCategory === "All"
                ? fallbackProducts
                : fallbackProducts.filter((product) => product.category === selectedCategory);
            const productsToShow = mode === "reset"
                ? [...nextProducts, ...categoryFallback]
                : nextProducts;
            setProducts(prev => dedupeProducts(mode === "more" ? [...prev, ...productsToShow] : productsToShow));
            setCursor(snapshot.docs.at(-1) ?? null);
            setHasMore(nextProducts.length > 0 && snapshot.docs.length === ONBOARDING_PRODUCT_PAGE_SIZE);
        } catch (error) {
            console.error(error);
            const fallbackProducts = seedProducts.map((product) => ({
                id: getProductKey(product),
                ...product,
            })) as Product[];
            setProducts(selectedCategory === "All"
                ? fallbackProducts
                : fallbackProducts.filter((product) => product.category === selectedCategory));
            setHasMore(false);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [buildProductQuery, cursor]);

    useEffect(() => {
        setCursor(null);
        setProducts([]);
        setHasMore(true);
        void loadProducts("reset");
    }, [selectedCategory]);

    const categories = useMemo(() => {
        return PRODUCT_CATEGORIES;
    }, []);

    const combinedProducts = useMemo(() => dedupeProducts(products), [products]);

    const featuredProducts = useMemo(() => {
        return combinedProducts.filter(p => p.isPromoted).slice(0, 10);
    }, [combinedProducts]);

    const filteredProducts = combinedProducts.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.source || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
        const isNotOwned = !existingProductIds.has(product.id);
        return matchesSearch && matchesCategory && isNotOwned;
    });

    const isFree = !userData?.plan || userData?.plan === "free";
    const currentStoreCount = userData?.storeProducts?.length || 0;
    const remainingFreeSlots = Math.max(0, FREE_PLAN_LIMIT - currentStoreCount);

    const toggleProduct = (product: Product) => {
        const isSelected = selectedProducts.some(p => p.id === product.id);
        if (isSelected) {
            setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
        } else {
            if (isFree && selectedProducts.length >= remainingFreeSlots) {
                toast.error(`Free plan limit: you can only add ${FREE_PLAN_LIMIT} products total. Upgrade to add more.`);
                return;
            }
            setSelectedProducts(prev => [...prev, {
                id: product.id,
                name: product.name,
                price: product.price,
                resellPrice: Math.ceil(product.price * 1.5)
            }]);
        }
    };

    const updateResellPrice = (id: string, newPrice: number) => {
        setSelectedProducts(prev => prev.map(p => p.id === id ? { ...p, resellPrice: newPrice } : p));
    };

    const handleComplete = async () => {
        const isAddMode = userData?.onboardingCompleted;
        if (!isAddMode && selectedProducts.length < 3) {
            toast.error("Please select at least 3 products to start your store.");
            return;
        }

        setSubmitting(true);
        try {
            if (user) {
                const productMap = new Map(combinedProducts.map(p => [p.id, p]));
                const formattedProducts = selectedProducts.map(p => ({
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    originalPrice: productMap.get(p.id)?.originalPrice || p.price,
                    resellPrice: p.resellPrice,
                    stock: getRandomStock(),
                    image: productMap.get(p.id)?.image || "",
                    description: productMap.get(p.id)?.description || "",
                    category: productMap.get(p.id)?.category || "",
                    source: productMap.get(p.id)?.source || "",
                    sourceUrl: "",
                }));

                const updates: any = {};
                if (isAddMode) {
                    const currentProducts = userData.storeProducts || [];
                    updates.storeProducts = [...currentProducts, ...formattedProducts];
                    updates.updatedAt = new Date().toISOString();
                } else {
                    updates.storeProducts = formattedProducts;
                    updates.onboardingCompleted = true;
                    updates.storeName = `${user.displayName || 'My'}'s Store`;
                    updates.storeSlug = (user.displayName || 'store').toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + user.uid.slice(0, 5);
                    updates.storeTagline = "Premium sourced products, fast shipping.";
                    updates.themeColor = "#10b981";
                    updates.storeTemplate = "classic";
                    updates.status = "active";
                    updates.updatedAt = new Date().toISOString();
                }

                await updateDoc(doc(db, "users", user.uid), updates);
                setLaunchSuccess(true);
                toast.success(isAddMode ? "Products added!" : "Store launched successfully!");
                setTimeout(() => router.push(isAddMode ? "/dashboard/products" : "/dashboard"), 2000);
            } else { router.push("/login"); }
        } catch (error) { console.error(error); setSubmitting(false); }
    };

    const scrollCarousel = (direction: 'left' | 'right') => {
        if (carouselRef.current) {
            const isMobile = window.innerWidth < 640;
            const scrollAmount = isMobile ? 260 : 400;
            carouselRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

    if (loading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;

    return (
        <div className="min-h-screen bg-[#09090b] text-white selection:bg-blue-500/30 pb-28 sm:pb-20">
            {/* Header / Progress Bar */}
            <header className="sticky top-0 z-50 bg-[#09090b]/90 backdrop-blur-md border-b border-white/[0.06] px-4 sm:px-6 py-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-lg">
                            <span className="text-zinc-950 font-bold text-lg sm:text-xl">R</span>
                        </div>
                        <div>
                            <h1 className="text-xs sm:text-sm font-bold tracking-tight">{userData?.onboardingCompleted ? "Add products" : "Build your store"}</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <div className="h-1.5 w-24 sm:w-32 bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-600 transition-all duration-500" 
                                        style={{ width: `${Math.min(100, (selectedProducts.length / 3) * 100)}%` }}
                                    />
                                </div>
                                <span className="text-[9px] sm:text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                                    {selectedProducts.length}/3
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="hidden sm:block text-right mr-1 sm:mr-2">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total</p>
                            <p className="text-sm font-bold text-white tracking-tight">
                                ${selectedProducts.reduce((acc, p) => acc + p.price, 0).toLocaleString()}
                            </p>
                        </div>
                        <Button
                            onClick={handleComplete}
                            disabled={selectedProducts.length < 3 || submitting}
                            className={cn(
                                "hidden sm:flex h-10 sm:h-11 px-4 sm:px-6 rounded-xl font-semibold text-sm transition-all shadow-xl",
                                (selectedProducts.length >= 3)
                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10"
                                : "bg-zinc-800 text-zinc-500 border border-white/[0.04]"
                            )}
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <>{userData?.onboardingCompleted ? 'Add' : 'Launch'} <ArrowRight className="w-4 h-4 ml-1 sm:ml-2" /></>
                            )}
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 sm:pt-10 space-y-6 sm:space-y-12">
                {/* Hero */}
                <section className="max-w-3xl animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="flex items-center gap-2 mb-2 sm:mb-4">
                        <span className="px-2 sm:px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md text-[9px] sm:text-[10px] font-bold text-blue-400 uppercase tracking-[0.1em]">
                            Global Dropshipping
                        </span>
                    </div>
                    <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">
                        Pick products, set prices, launch.
                    </h2>
                    <p className="text-zinc-500 mt-2 sm:mt-4 text-sm sm:text-base leading-relaxed font-medium">
                        Search, tap products, adjust the selling price, and finish from the button below.
                    </p>
                </section>

                {/* Featured Carousel */}
                <section className="hidden md:block space-y-4 sm:space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                            <h3 className="text-base sm:text-lg font-bold">Trending Recommendations</h3>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                            <button onClick={() => scrollCarousel('left')} className="p-1.5 sm:p-2 bg-zinc-900 border border-white/[0.06] rounded-full hover:bg-zinc-800 transition-colors">
                                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                            <button onClick={() => scrollCarousel('right')} className="p-1.5 sm:p-2 bg-zinc-900 border border-white/[0.06] rounded-full hover:bg-zinc-800 transition-colors">
                                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                        </div>
                    </div>
                    <div 
                        ref={carouselRef}
                        className="flex gap-3 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-4 px-1 -mx-4 sm:mx-0"
                    >
                        {featuredProducts.map(p => (
                            <div key={p.id} className="min-w-[260px] sm:min-w-[280px] sm:min-w-[320px] flex-shrink-0">
                                <ProductCard 
                                    product={p} 
                                    selectedData={selectedProducts.find(s => s.id === p.id)} 
                                    onToggle={() => toggleProduct(p)} 
                                    onPriceChange={(price: number) => updateResellPrice(p.id, price)} 
                                    onViewDetails={() => setDetailsProduct(p)}
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Main Discovery Section */}
                <section className="space-y-5 sm:space-y-8">
                    <div className="flex flex-col lg:flex-row gap-5 sm:gap-8 items-start">
                        {/* Sidebar Filters */}
                        <aside className="w-full lg:w-72 space-y-4 shrink-0 lg:sticky lg:top-24">
                            <div className="space-y-3 rounded-2xl border border-white/[0.06] bg-zinc-950/70 p-3 sm:p-4">
                                <h4 className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest">Find products</h4>
                                <div className="relative group">
                                    <Search className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-white transition-colors" />
                                    <input 
                                        placeholder="Search products..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full h-10 sm:h-11 pl-10 sm:pl-11 bg-zinc-900 border border-white/[0.06] rounded-xl text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 rounded-2xl border border-white/[0.06] bg-zinc-950/70 p-3 sm:p-4">
                                <h4 className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest">Categories</h4>
                                <div className="relative">
                                    <select
                                        value={selectedCategory}
                                        onChange={(event) => setSelectedCategory(event.target.value)}
                                        className="h-11 w-full appearance-none rounded-xl border border-white/[0.08] bg-zinc-900 px-3 pr-10 text-sm font-semibold text-white outline-none transition-all focus:border-blue-500/50"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat} className="bg-zinc-950 text-white">
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                                </div>
                                <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2">
                                    <p className="text-[11px] font-medium text-zinc-400">
                                        Showing <span className="font-bold text-white">{selectedCategory}</span>
                                    </p>
                                </div>
                            </div>

                            {isFree && (
                                <div className="p-4 sm:p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-2 sm:space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h5 className="text-[10px] sm:text-xs font-bold text-amber-400 uppercase tracking-tight">Free Plan</h5>
                                        <span className="text-[9px] sm:text-[10px] font-bold text-amber-400">{currentStoreCount + selectedProducts.length}/{FREE_PLAN_LIMIT}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-amber-500 transition-all duration-500 rounded-full" 
                                            style={{ width: `${Math.min(100, ((currentStoreCount + selectedProducts.length) / FREE_PLAN_LIMIT) * 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-[9px] sm:text-[10px] text-zinc-500 font-medium leading-relaxed">
                                        {remainingFreeSlots - selectedProducts.length > 0
                                            ? `You can add up to ${FREE_PLAN_LIMIT} products. ${remainingFreeSlots - selectedProducts.length} slot${remainingFreeSlots - selectedProducts.length !== 1 ? "s" : ""} remaining.`
                                            : "Upgrade to add unlimited products."}
                                    </p>
                                </div>
                            )}
                            <div className="hidden lg:block p-4 sm:p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-3 sm:space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                        <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                                    </div>
                                    <h5 className="text-xs sm:text-xs font-bold text-white uppercase tracking-tight">Active Plan Benefits</h5>
                                </div>
                                <ul className="space-y-2 sm:space-y-2.5">
                                    {['0% Commission Fees', 'Priority fulfillment', 'Real-time tracking'].map((item, i) => (
                                        <li key={i} className="flex items-center gap-2 text-[9px] sm:text-[10px] text-zinc-500 font-medium">
                                            <Check className="w-3 h-3 text-emerald-500" /> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </aside>

                        {/* Product Grid */}
                        <div className="flex-1 w-full space-y-5 sm:space-y-8">
                            {/* Free plan limit notice */}
                            <div className="hidden sm:flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 rounded-xl bg-blue-500/10 border border-blue-500/25">
                                <span className="text-lg sm:text-xl">🔒</span>
                                <p className="text-xs sm:text-sm text-white leading-snug">
                                    <strong className="font-extrabold text-white">Free plan: limited to 20 products.</strong>{" "}
                                    <a href="/dashboard/subscription" className="text-blue-400 font-bold underline underline-offset-2 hover:text-blue-300 transition-colors">Upgrade</a> for unlimited.
                                </p>
                            </div>

                            {selectedProducts.length > 0 && (
                                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs font-bold text-white">{selectedProducts.length} selected</p>
                                        <button onClick={() => setSelectedProducts([])} className="text-[11px] font-bold text-zinc-500 hover:text-white">Clear</button>
                                    </div>
                                    <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
                                        {selectedProducts.map(product => (
                                            <span key={product.id} className="shrink-0 rounded-lg border border-white/[0.08] bg-zinc-950 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
                                                {product.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between border-b border-white/[0.04] pb-4 sm:pb-6">
                                <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                                    {selectedCategory}
                                    <span className="px-2 py-0.5 bg-zinc-900 rounded-md text-[9px] sm:text-[10px] text-zinc-500 font-bold border border-white/[0.04]">
                                        {`${filteredProducts.length} results`}
                                    </span>
                                </h3>
                                <div className="hidden sm:flex items-center gap-2 sm:gap-4 text-xs">
                                   <label className="text-zinc-500 hidden sm:inline">Sort by:</label>
                                   <select className="bg-transparent text-white font-semibold outline-none cursor-pointer text-xs sm:text-sm">
                                        <option>Recommended</option>
                                        <option>Price: Low to High</option>
                                        <option>Price: High to Low</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
                                {filteredProducts.map(p => (
                                    <ProductCard 
                                        key={p.id} 
                                        product={p} 
                                        selectedData={selectedProducts.find(s => s.id === p.id)} 
                                        onToggle={() => toggleProduct(p)} 
                                        onPriceChange={(price: number) => updateResellPrice(p.id, price)} 
                                        onViewDetails={() => setDetailsProduct(p)}
                                    />
                                ))}
                                {filteredProducts.length === 0 && (
                                    <div className="col-span-full py-20 text-center">
                                        <div className="w-16 h-16 bg-white/[0.02] border border-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Search className="w-6 h-6 text-zinc-800" />
                                        </div>
                                        <h4 className="text-white font-semibold">No products found</h4>
                                        <p className="text-zinc-600 text-sm mt-1">Try adjusting your search or category filters.</p>
                                    </div>
                                )}
                            </div>
                            {hasMore && (
                                <div className="flex justify-center pt-2">
                                    <Button
                                        type="button"
                                        onClick={() => loadProducts("more")}
                                        disabled={loadingMore}
                                        className="h-11 rounded-xl bg-white px-6 font-bold text-zinc-950 hover:bg-zinc-200"
                                    >
                                        {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Load More Products
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            {/* Launch Success Modal Overlay */}
            {launchSuccess && (
                <div className="fixed inset-0 z-[100] bg-zinc-950/80 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-500">
                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/20 mb-8 animate-bounce">
                        <Check className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-4xl font-bold tracking-tight">Your store is live!</h2>
                    <p className="text-zinc-500 mt-2 font-medium">Preparing your dashboard experience...</p>
                </div>
            )}
            {detailsProduct && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950 shadow-2xl">
                        <div className="relative aspect-[16/10] bg-zinc-900">
                            {detailsProduct.image ? (
                                <Image
                                    src={getFastProductImageUrl(detailsProduct.image)}
                                    alt={detailsProduct.name}
                                    fill
                                    sizes="100vw"
                                    unoptimized={detailsProduct.image.includes("cdn.shopify.com")}
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-zinc-700">
                                    <ShoppingBag className="h-12 w-12" />
                                </div>
                            )}
                        </div>
                        <div className="space-y-4 p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{detailsProduct.category}</p>
                                    <h3 className="mt-1 text-lg font-bold text-white">{detailsProduct.name}</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setDetailsProduct(null)}
                                    className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-bold text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                                >
                                    Close
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Original Price</p>
                                    <p className="mt-1 text-sm font-bold text-zinc-300 line-through">
                                        ${Math.round((detailsProduct.originalPrice || detailsProduct.price / 0.3) * 100) / 100}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Reseller Cost</p>
                                    <p className="mt-1 text-sm font-bold text-emerald-300">${detailsProduct.price}</p>
                                </div>
                            </div>
                            <p className="max-h-40 overflow-y-auto text-sm leading-relaxed text-zinc-400">
                                {detailsProduct.description}
                            </p>
                            <Button
                                type="button"
                                onClick={() => {
                                    toggleProduct(detailsProduct);
                                    setDetailsProduct(null);
                                }}
                                className="h-11 w-full rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700"
                            >
                                Add to Store
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.08] bg-[#09090b]/95 px-4 py-3 backdrop-blur-md sm:hidden">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-bold text-white">{selectedProducts.length} selected</p>
                        <p className="text-[10px] text-zinc-500">${selectedProducts.reduce((acc, p) => acc + p.price, 0).toLocaleString()} cost</p>
                    </div>
                    <Button
                        onClick={handleComplete}
                        disabled={selectedProducts.length < 3 || submitting}
                        className={cn(
                            "h-11 min-w-36 rounded-xl font-semibold text-sm transition-all",
                            selectedProducts.length >= 3
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "bg-zinc-800 text-zinc-500 border border-white/[0.04]"
                        )}
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                            <>{userData?.onboardingCompleted ? 'Add' : 'Launch'} <ArrowRight className="w-4 h-4 ml-2" /></>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function dedupeProducts(products: Product[]) {
    const seen = new Set<string>();
    return products.filter((product) => {
        const key = getProductKey(product);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

 function ProductCard({ product, selectedData, onToggle, onPriceChange, onViewDetails }: { 
     product: Product, 
     selectedData: any, 
     onToggle: () => void, 
     onPriceChange: (price: number) => void,
     onViewDetails: () => void,
 }) {
     const isSelected = !!selectedData;
     const [imageLoaded, setImageLoaded] = useState(false);
     const [imageFailed, setImageFailed] = useState(false);
     const imageUrl = getFastProductImageUrl(product.image);
     const sourceLabel = getMarketplaceSourceLabel(product.source);
 
     return (
         <div className={cn(
             "group bg-zinc-900/40 border rounded-2xl overflow-hidden transition-all duration-300",
             isSelected ? "border-blue-500 bg-blue-500/[0.02] shadow-2xl" : "border-white/[0.06] hover:border-white/[0.12] hover:bg-zinc-900/60 shadow-lg"
         )}>
             <div className="relative aspect-[16/10] sm:aspect-square overflow-hidden cursor-pointer bg-zinc-950" onClick={onToggle}>
                 {imageUrl && !imageFailed ? (
                     <Image 
                         src={imageUrl} 
                         alt={product.name} 
                         fill 
                         sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                         unoptimized={imageUrl.includes("cdn.shopify.com")}
                         className={cn(
                             "object-cover transition-all duration-700 group-hover:scale-105",
                             imageLoaded ? "opacity-100" : "opacity-0"
                         )}
                         onLoadingComplete={() => setImageLoaded(true)}
                         onError={() => {
                             setImageFailed(true);
                             setImageLoaded(true);
                         }}
                     />
                 ) : (
                     <div className="absolute inset-0 flex items-center justify-center text-zinc-900 bg-zinc-950">
                         <ShoppingBag className="w-10 sm:w-12 h-10 sm:h-12" />
                     </div>
                 )}
                 {!imageLoaded && imageUrl && !imageFailed && (
                     <div className="absolute inset-0 flex items-center justify-center">
                         <Loader2 className="w-5 h-5 animate-spin text-zinc-800" />
                     </div>
                 )}
                 
                 {/* Selection Indicator */}
                 <div className={cn(
                     "absolute top-2 sm:top-3 right-2 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300",
                     isSelected ? "bg-blue-600 shadow-lg text-white" : "bg-black/20 backdrop-blur-md border border-white/10 text-transparent"
                 )}>
                     <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                 </div>
 
                 {/* Tags */}
                 <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 flex gap-1 sm:gap-2">
                     <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-black/60 backdrop-blur-md rounded-md text-[8px] sm:text-[9px] font-bold text-white border border-white/10 uppercase tracking-wider">
                         ${product.price}
                     </span>
                     <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-emerald-600 rounded-md text-[8px] sm:text-[9px] font-bold text-white uppercase tracking-wider shadow-lg">
                         {sourceLabel}
                     </span>
                 </div>
             </div>
 
             <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
                 <div onClick={onToggle} className="cursor-pointer">
                     <div className="flex items-center gap-1 mb-1">
                         <Tag className="w-3 h-3 text-zinc-600" />
                         <span className="text-[10px] sm:text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{product.category}</span>
                     </div>
                     <h3 className="text-sm sm:text-sm font-bold text-white line-clamp-1">{product.name}</h3>
                     <p className="text-xs text-zinc-500 mt-1 sm:mt-2 line-clamp-2 leading-relaxed opacity-80 h-7 sm:h-8">
                         {product.description}
                     </p>
                 </div>
 
                 <div className="h-px bg-white/[0.04]" />
 
                 <div className="space-y-2 sm:space-y-4">
                     <div className="space-y-1 sm:space-y-2">
                         <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                             <span>Your Selling Price</span>
                             <span className="text-blue-500">~50% Margin</span>
                         </div>
                         <div className="relative group">
                             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-sm font-bold">$</span>
                             <input
                                 type="number"
                                 value={isSelected ? selectedData.resellPrice : Math.ceil(product.price * 1.5)}
                                 onChange={(e) => {
                                     if (!isSelected) onToggle();
                                     onPriceChange(Number(e.target.value));
                                 }}
                                 className="w-full pl-6 sm:pl-7 px-3 sm:px-4 h-9 sm:h-11 rounded-xl bg-zinc-950 border border-white/[0.08] text-white text-sm font-bold focus:border-blue-500/50 transition-all outline-none"
                             />
                         </div>
                     </div>
 
                     {isSelected && (
                         <div className="flex justify-between items-center p-2 sm:p-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10 animate-in slide-in-from-top-2 duration-300">
                             <span className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Est. Profit</span>
                             <span className="text-xs sm:text-xs font-bold text-emerald-500">+${(selectedData.resellPrice - product.price).toLocaleString()}</span>
                         </div>
                     )}
 
                     <div className="grid grid-cols-[1fr_auto] gap-2">
                         <Button 
                             onClick={onToggle}
                             className={cn(
                                 "h-9 sm:h-10 rounded-xl text-xs font-bold transition-all gap-1 sm:gap-2",
                                 isSelected 
                                 ? "bg-zinc-800 text-white hover:bg-zinc-700" 
                                 : "bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white border border-blue-500/20"
                             )}
                         >
                             {isSelected ? <><Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Selected</> : <><Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Add</>}
                         </Button>
                         <button
                             type="button"
                             onClick={(event) => {
                                 event.stopPropagation();
                                 onViewDetails();
                             }}
                             className="h-9 sm:h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-[11px] font-bold text-zinc-400 hover:bg-white/[0.08] hover:text-white"
                         >
                             Details
                         </button>
                     </div>
                 </div>
             </div>
         </div>
     );
 }

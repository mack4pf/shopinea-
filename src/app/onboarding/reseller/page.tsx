"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { 
    Check, 
    ShoppingBag, 
    ArrowRight, 
    Search, 
    Filter, 
    Sparkles, 
    Loader2, 
    ChevronRight, 
    Globe, 
    ShieldCheck, 
    Zap, 
    Plus,
    Tag,
    ChevronLeft
} from "lucide-react";
import { doc, updateDoc, collection, getDocs, writeBatch, query, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { products as seedProducts, LOCAL_PRODUCT_IMAGES, CATALOG_VERSION } from "@/lib/seed/products";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    category: string;
    image: string;
    isPromoted?: boolean;
    isFeatured?: boolean;
    sortOrder?: number;
    catalogVersion?: number;
}

const FREE_PLAN_LIMIT = 20;

export default function ResellerOnboarding() {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<{ id: string, name: string, price: number, resellPrice: number }[]>([]);
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [existingProductIds, setExistingProductIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [launchSuccess, setLaunchSuccess] = useState(false);

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

     useEffect(() => {
         const initializeProducts = async () => {
             try {
                 const productsRef = collection(db, "products");
                 const snapshot = await getDocs(productsRef);
 
                 // Build name->doc map for existing products
                 const existingMap = new Map<string, any>();
                 snapshot.docs.forEach(d => {
                     const data = d.data();
                     existingMap.set(data.name, { id: d.id, ...data });
                 });
 
                 // Determine which seed products need to be added or updated
                 const upserts: Array<{ id?: string; name: string; price: number; description: string; category: string; image: string; isPromoted?: boolean; isFeatured?: boolean; sortOrder?: number; catalogVersion: number }> = [];
                 seedProducts.forEach(seed => {
                     const existing = existingMap.get(seed.name);
                     if (!existing) {
                         upserts.push(seed);
                     } else if ((existing.catalogVersion ?? 0) !== CATALOG_VERSION) {
                         upserts.push({ id: existing.id, ...seed });
                     }
                 });
 
                 // Batch upsert all changes
                 if (upserts.length > 0) {
                     const batch = writeBatch(db);
                     upserts.forEach(p => {
                         if (p.id) {
                             batch.update(doc(productsRef, p.id), p);
                         } else {
                             batch.set(doc(productsRef), p);
                         }
                     });
                     await batch.commit();
                 }
 
                 // Fetch fresh product list
                 const fresh = await getDocs(productsRef);
                 let fetched: Product[] = fresh.docs.map(d => ({ id: d.id, ...d.data() } as Product));

                // Deduplicate by name (safety net)
                const nameMap = new Map<string, Product>();
                fetched.forEach(p => {
                    const existing = nameMap.get(p.name);
                    if (!existing || (p.isFeatured && !existing.isFeatured)) nameMap.set(p.name, p);
                });
                fetched = Array.from(nameMap.values());

                // Sort by sortOrder
                fetched.sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));

                setProducts(fetched);
            } catch (error) { console.error(error); }
            finally { setLoading(false); }
        };
        initializeProducts();
    }, []);

    const categories = useMemo(() => {
        const cats = new Set(products.map(p => p.category));
        return ["All", ...Array.from(cats)];
    }, [products]);

    const featuredProducts = useMemo(() => {
        return products.filter(p => p.isPromoted).slice(0, 10);
    }, [products]);

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description.toLowerCase().includes(searchQuery.toLowerCase());
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
                const productImageMap = new Map(products.map(p => [p.id, p.image]));
                const formattedProducts = selectedProducts.map(p => ({
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    resellPrice: p.resellPrice,
                    image: productImageMap.get(p.id) || "",
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
            const scrollAmount = 400;
            carouselRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

    if (loading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;

    return (
        <div className="min-h-screen bg-[#09090b] text-white selection:bg-blue-500/30 pb-20">
            {/* Header / Progress Bar */}
            <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-md border-b border-white/[0.06] px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg">
                            <span className="text-zinc-950 font-bold text-xl">R</span>
                        </div>
                        <div>
                            <h1 className="text-sm font-bold tracking-tight">Onboarding</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <div className="h-1.5 w-32 bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-600 transition-all duration-500" 
                                        style={{ width: `${Math.min(100, (selectedProducts.length / 3) * 100)}%` }}
                                    />
                                </div>
                                <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                                    {selectedProducts.length}/3 products chosen
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:block text-right mr-2">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Selected Cost</p>
                            <p className="text-sm font-bold text-white tracking-tight">
                                ${selectedProducts.reduce((acc, p) => acc + p.price, 0).toLocaleString()}
                            </p>
                        </div>
                        <Button
                            onClick={handleComplete}
                            disabled={selectedProducts.length < 3 || submitting}
                            className={cn(
                                "h-11 px-6 rounded-xl font-semibold text-sm transition-all shadow-xl",
                                (selectedProducts.length >= 3)
                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10"
                                : "bg-zinc-800 text-zinc-500 border border-white/[0.04]"
                            )}
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <>{userData?.onboardingCompleted ? 'Add to Store' : 'Launch My Store'} <ArrowRight className="w-4 h-4 ml-2" /></>
                            )}
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 pt-12 space-y-20">
                {/* Hero */}
                <section className="max-w-3xl animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md text-[10px] font-bold text-blue-400 uppercase tracking-[0.1em]">
                            Global Dropshipping
                        </span>
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
                        Curate your professional <br className="hidden sm:block" /> product collection.
                    </h2>
                    <p className="text-zinc-500 mt-4 text-base sm:text-lg leading-relaxed font-medium">
                        Select high-quality products from verified global suppliers. We handle fulfillment, you handle the sales. Start with 3 items to launch.
                    </p>
                </section>

                {/* Featured Carousel */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-amber-500" />
                            <h3 className="text-lg font-bold">Trending Recommendations</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => scrollCarousel('left')} className="p-2 bg-zinc-900 border border-white/[0.06] rounded-full hover:bg-zinc-800 transition-colors">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={() => scrollCarousel('right')} className="p-2 bg-zinc-900 border border-white/[0.06] rounded-full hover:bg-zinc-800 transition-colors">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <div 
                        ref={carouselRef}
                        className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-4 px-1"
                    >
                        {featuredProducts.map(p => (
                            <div key={p.id} className="min-w-[280px] sm:min-w-[320px]">
                                <ProductCard 
                                    product={p} 
                                    selectedData={selectedProducts.find(s => s.id === p.id)} 
                                    onToggle={() => toggleProduct(p)} 
                                    onPriceChange={(price: number) => updateResellPrice(p.id, price)} 
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Main Discovery Section */}
                <section className="space-y-8">
                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        {/* Sidebar Filters */}
                        <aside className="w-full lg:w-64 space-y-8 shrink-0 lg:sticky lg:top-32">
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Search Products</h4>
                                <div className="relative group">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-white transition-colors" />
                                    <input 
                                        placeholder="Type to search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full h-11 pl-11 bg-zinc-900 border border-white/[0.06] rounded-xl text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Categories</h4>
                                <div className="flex flex-wrap lg:flex-col gap-2">
                                    {categories.map(cat => (
                                        <button 
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={cn(
                                                "flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
                                                selectedCategory === cat ? "bg-blue-600 text-white shadow-lg" : "bg-white/[0.02] border border-white/[0.04] text-zinc-500 hover:text-white"
                                            )}
                                        >
                                            {cat}
                                            <ChevronRight className={cn("w-3.5 h-3.5", selectedCategory === cat ? "opacity-100" : "opacity-0")} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {isFree && (
                                <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h5 className="text-xs font-bold text-amber-400 uppercase tracking-tight">Free Plan</h5>
                                        <span className="text-[10px] font-bold text-amber-400">{currentStoreCount + selectedProducts.length}/{FREE_PLAN_LIMIT}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-amber-500 transition-all duration-500 rounded-full" 
                                            style={{ width: `${Math.min(100, ((currentStoreCount + selectedProducts.length) / FREE_PLAN_LIMIT) * 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                                        {remainingFreeSlots - selectedProducts.length > 0
                                            ? `You can add up to ${FREE_PLAN_LIMIT} products. ${remainingFreeSlots - selectedProducts.length} slot${remainingFreeSlots - selectedProducts.length !== 1 ? "s" : ""} remaining.`
                                            : "Upgrade to add unlimited products to your store."}
                                    </p>
                                </div>
                            )}
                            <div className="p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                        <Zap className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <h5 className="text-xs font-bold text-white uppercase tracking-tight">Active Plan Benefits</h5>
                                </div>
                                <ul className="space-y-2.5">
                                    {['0% Commission Fees', 'Priority fulfillment', 'Real-time tracking'].map((item, i) => (
                                        <li key={i} className="flex items-center gap-2 text-[10px] text-zinc-500 font-medium">
                                            <Check className="w-3 h-3 text-emerald-500" /> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </aside>

                        {/* Product Grid */}
                        <div className="flex-1 space-y-10">
                            {/* Free plan limit notice */}
                            <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-blue-500/10 border border-blue-500/25">
                                <span className="text-xl">🔒</span>
                                <p className="text-sm text-white leading-snug">
                                    <strong className="font-extrabold text-white">Free plan: you can only view and add up to 20 products to your store.</strong>{" "}
                                    <a href="/dashboard/subscription" className="text-blue-400 font-bold underline underline-offset-2 hover:text-blue-300 transition-colors">Upgrade your plan</a> to unlock unlimited products.
                                </p>
                            </div>

                            <div className="flex items-center justify-between border-b border-white/[0.04] pb-6">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    {selectedCategory}
                                    <span className="px-2 py-0.5 bg-zinc-900 rounded-md text-[10px] text-zinc-500 font-bold border border-white/[0.04]">
                                        {filteredProducts.length} results
                                    </span>
                                </h3>
                                <div className="flex items-center gap-4 text-xs">
                                   <label className="text-zinc-500">Sort by:</label>
                                   <select className="bg-transparent text-white font-semibold outline-none cursor-pointer">
                                       <option>Recommended</option>
                                       <option>Price: Low to High</option>
                                       <option>Price: High to Low</option>
                                   </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredProducts.map(p => (
                                    <ProductCard 
                                        key={p.id} 
                                        product={p} 
                                        selectedData={selectedProducts.find(s => s.id === p.id)} 
                                        onToggle={() => toggleProduct(p)} 
                                        onPriceChange={(price: number) => updateResellPrice(p.id, price)} 
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
        </div>
    );
}

function ProductCard({ product, selectedData, onToggle, onPriceChange }: { 
    product: Product, 
    selectedData: any, 
    onToggle: () => void, 
    onPriceChange: (price: number) => void 
}) {
    const isSelected = !!selectedData;
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
        <div className={cn(
            "group bg-zinc-900/40 border rounded-2xl overflow-hidden transition-all duration-300",
            isSelected ? "border-blue-500 bg-blue-500/[0.02] shadow-2xl" : "border-white/[0.06] hover:border-white/[0.12] hover:bg-zinc-900/60 shadow-lg"
        )}>
            <div className="relative aspect-[4/3] sm:aspect-square overflow-hidden cursor-pointer bg-zinc-950" onClick={onToggle}>
                {product.image ? (
                    <Image 
                        src={product.image} 
                        alt={product.name} 
                        fill 
                        className={cn(
                            "object-cover transition-all duration-700 group-hover:scale-105",
                            imageLoaded ? "opacity-100" : "opacity-0"
                        )}
                        onLoadingComplete={() => setImageLoaded(true)}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-900 bg-zinc-950">
                        <ShoppingBag className="w-12 h-12" />
                    </div>
                )}
                {!imageLoaded && product.image && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-zinc-800" />
                    </div>
                )}
                
                {/* Selection Indicator */}
                <div className={cn(
                    "absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                    isSelected ? "bg-blue-600 shadow-lg text-white" : "bg-black/20 backdrop-blur-md border border-white/10 text-transparent"
                )}>
                    <Check className="w-4 h-4" />
                </div>

                {/* Tags */}
                <div className="absolute bottom-3 left-3 flex gap-2">
                    <span className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[9px] font-bold text-white border border-white/10 uppercase tracking-wider">
                        ${product.price}
                    </span>
                    <span className="px-2 py-1 bg-emerald-600 rounded-md text-[9px] font-bold text-white uppercase tracking-wider shadow-lg">
                        Verified
                    </span>
                </div>
            </div>

            <div className="p-5 space-y-4">
                <div onClick={onToggle} className="cursor-pointer">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <Tag className="w-3 h-3 text-zinc-600" />
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{product.category}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{product.name}</h3>
                    <p className="text-xs text-zinc-500 mt-2 line-clamp-2 leading-relaxed opacity-80 h-8">
                        {product.description}
                    </p>
                </div>

                <div className="h-px bg-white/[0.04]" />

                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                            <span>Your Selling Price</span>
                            <span className="text-blue-500">~50% Margin</span>
                        </div>
                        <div className="relative group">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 text-sm font-bold">$</span>
                            <input
                                type="number"
                                value={isSelected ? selectedData.resellPrice : Math.ceil(product.price * 1.5)}
                                onChange={(e) => {
                                    if (!isSelected) onToggle();
                                    onPriceChange(Number(e.target.value));
                                }}
                                className="w-full pl-7 px-4 h-11 rounded-xl bg-zinc-950 border border-white/[0.08] text-white text-sm font-bold focus:border-blue-500/50 transition-all outline-none"
                            />
                        </div>
                    </div>

                    {isSelected && (
                        <div className="flex justify-between items-center p-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10 animate-in slide-in-from-top-2 duration-300">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Est. Profit</span>
                            <span className="text-xs font-bold text-emerald-500">+${(selectedData.resellPrice - product.price).toLocaleString()}</span>
                        </div>
                    )}

                    <Button 
                        onClick={onToggle}
                        className={cn(
                            "w-full h-10 rounded-xl text-xs font-bold transition-all gap-2",
                            isSelected 
                            ? "bg-zinc-800 text-white hover:bg-zinc-700" 
                            : "bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white border border-blue-500/20"
                        )}
                    >
                        {isSelected ? <><Check className="w-3.5 h-3.5" /> Selected</> : <><Plus className="w-3.5 h-3.5" /> Add to Store</>}
                    </Button>
                </div>
            </div>
        </div>
    );
}

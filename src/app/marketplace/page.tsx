"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, writeBatch } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ShoppingBag, Loader2, ArrowUpRight, Search, LayoutGrid, Filter, ArrowRight, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { products as seedProducts, CATALOG_VERSION } from "@/lib/seed/products";
import { Navbar } from "@/components/shared/Navbar";

export default function MarketplacePage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => setUser(u));
        return () => unsub();
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const productsRef = collection(db, "products");
                const snapshot = await getDocs(productsRef);

                // Force-reseed if catalog is stale or has extra products
                const isStale = !snapshot.empty && (
                    snapshot.docs.some(d => (d.data().catalogVersion ?? 0) !== CATALOG_VERSION) ||
                    snapshot.docs.length > seedProducts.length
                );

                if (snapshot.empty || isStale) {
                    if (!snapshot.empty) {
                        const delBatch = writeBatch(db);
                        snapshot.docs.forEach(d => delBatch.delete(d.ref));
                        await delBatch.commit();
                    }
                    const seedBatch = writeBatch(db);
                    seedProducts.forEach(p => seedBatch.set(doc(productsRef), p));
                    await seedBatch.commit();
                }

                const fresh = await getDocs(productsRef);
                const fetched = fresh.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

                // Deduplicate by name, keep isFeatured version
                const uniqueMap = new Map();
                fetched.forEach((p: any) => {
                    if (!p.name) return;
                    const existing = uniqueMap.get(p.name);
                    if (!existing || (p.isFeatured && !existing.isFeatured)) uniqueMap.set(p.name, p);
                });

                const sorted = Array.from(uniqueMap.values()).sort((a: any, b: any) =>
                    (a.sortOrder ?? 99) - (b.sortOrder ?? 99)
                );
                setProducts(sorted);
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const handleProductClick = () => {
        if (!user) {
            router.push("/login?redirect=/onboarding/reseller");
        } else {
            router.push("/onboarding/reseller");
        }
    };

    const filtered = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="min-h-screen bg-[#f5f7fb] text-slate-900 selection:bg-emerald-200/70 pb-24">
            <Navbar />
            {/* Nav Space */}
            <div className="h-20 sm:h-24" />

            <main className="container mx-auto px-6 max-w-7xl space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Hero Header */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-10 border-b border-slate-200 pb-12">
                    <div className="max-w-xl space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                             Professional Sourcing
                        </div>
                            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 leading-tight">Millions of items. <br/> <span className="text-slate-500 font-medium">Ready to sell.</span></h1>
                            <p className="text-slate-600 font-medium text-lg max-w-lg">Browse our verified catalog of high-demand products and add them to your store with a single click.</p>
                    {/* Free plan notice */}
                    <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-blue-50 border border-blue-200 max-w-xl">
                        <span className="text-xl mt-0.5">🔒</span>
                        <p className="text-sm text-slate-700 leading-snug">
                            <strong className="font-extrabold text-slate-900">Free plan: you can only view and add up to 20 products to your store.</strong>{" "}
                            <a href="/dashboard/subscription" className="text-blue-600 font-bold underline underline-offset-2 hover:text-blue-800 transition-colors">Upgrade your plan</a> to unlock unlimited products.
                        </p>
                    </div>
                    </div>
                    
                    <div className="w-full md:w-96 space-y-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-700 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="w-full h-12 pl-12 pr-4 rounded-xl bg-white border border-slate-200 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50 transition-all text-slate-800"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="py-40 flex flex-col items-center justify-center space-y-6">
                        <div className="relative">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                            <div className="absolute inset-0 blur-xl bg-blue-600/20" />
                        </div>
                        <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.3em]">Loading Catalog...</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <LayoutGrid className="w-4 h-4" />
                                {filtered.length} products found
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="hidden sm:inline">Sort: Trending</span>
                                <Filter className="w-4 h-4" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filtered.length === 0 ? (
                                <div className="col-span-full py-40 border border-dashed border-slate-300 rounded-[2.5rem] flex flex-col items-center justify-center space-y-4 bg-white">
                                    <PackageOpen className="w-12 h-12 text-slate-400" />
                                    <h3 className="text-slate-800 font-bold">No products found</h3>
                                    <p className="text-slate-500 text-sm font-medium">Try searching for something else or browse categories.</p>
                                    <Button variant="outline" onClick={() => setSearchQuery("")} className="mt-4 rounded-xl border-slate-300 hover:bg-slate-50 text-xs font-bold">Clear Search</Button>
                                </div>
                            ) : (
                                filtered.map((product) => (
                                    <MarketplaceCard key={product.id} product={product} onClick={handleProductClick} />
                                ))
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function MarketplaceCard({ product, onClick }: { product: any, onClick: () => void }) {
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
        <div 
            onClick={onClick}
            className="group relative bg-white border border-slate-200 rounded-[2rem] overflow-hidden hover:bg-slate-50 hover:border-slate-300 transition-all duration-500 flex flex-col cursor-pointer shadow-sm"
        >
            <div className="aspect-[4/5] relative overflow-hidden bg-slate-100">
                {product.image ? (
                    <Image 
                        src={product.image} 
                        alt={product.name || "Product"} 
                        fill 
                        className={cn(
                            "object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:opacity-70",
                            imageLoaded ? "opacity-100" : "opacity-0"
                        )}
                        onLoadingComplete={() => setImageLoaded(true)}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <ShoppingBag className="w-20 h-20" />
                    </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-50" />
                
                {product.isFeatured && (
                    <div className="absolute top-4 left-4 z-10">
                        <span className="px-2.5 py-1 bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-widest rounded-full shadow-lg">
                            ⭐ Featured
                        </span>
                    </div>
                )}
                
                <div className="absolute bottom-6 left-6 right-6 translate-y-20 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out z-20">
                    <Button className="w-full h-12 brand-gradient text-white font-bold rounded-xl shadow-2xl hover:opacity-90 text-xs gap-2">
                        Add to Store
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
            
            <div className="p-8 flex flex-col flex-1">
                <div className="flex-1 space-y-2">
                    <h4 className="font-bold text-sm text-slate-900 line-clamp-2 leading-tight group-hover:text-emerald-700 transition-colors uppercase tracking-tight">{product.name}</h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{product.category || 'General Sourcing'}</p>
                </div>
                
                <div className="flex justify-between items-end mt-8 pt-4 border-t border-slate-200">
                    <div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Base Wholesale Cost</p>
                        <p className="text-2xl font-bold tracking-tighter text-slate-900">${product.price?.toLocaleString() || '0'}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <ArrowUpRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>
    );
}

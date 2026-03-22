"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ShoppingBag, Loader2, ArrowUpRight, Search, LayoutGrid, Filter, ArrowRight, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
                const snapshot = await getDocs(collection(db, "products"));
                const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
                
                const uniqueMap = new Map();
                fetched.forEach(p => {
                    if (p.name && !uniqueMap.has(p.name)) {
                        uniqueMap.set(p.name, p);
                    }
                });
                
                setProducts(Array.from(uniqueMap.values()));
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
        <div className="min-h-screen bg-[#09090b] text-white selection:bg-blue-500/30 pb-24">
            {/* Nav Space */}
            <div className="h-20 sm:h-24" />

            <main className="container mx-auto px-6 max-w-7xl space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Hero Header */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-10 border-b border-white/[0.04] pb-12">
                    <div className="max-w-xl space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.04] rounded-full border border-white/[0.08] text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                             Professional Sourcing
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">Millions of items. <br/> <span className="text-zinc-500 font-medium">Ready to sell.</span></h1>
                        <p className="text-zinc-500 font-medium text-lg max-w-lg">Browse our verified catalog of high-demand products and add them to your store with a single click.</p>
                    </div>
                    
                    <div className="w-full md:w-96 space-y-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-white transition-colors" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="w-full h-12 pl-12 pr-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm font-medium placeholder:text-zinc-700 focus:outline-none focus:border-blue-500/50 transition-all text-white"
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
                        <div className="flex items-center justify-between text-xs font-bold text-zinc-600 uppercase tracking-widest">
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
                                <div className="col-span-full py-40 border border-dashed border-white/[0.1] rounded-[2.5rem] flex flex-col items-center justify-center space-y-4 bg-white/[0.01]">
                                    <PackageOpen className="w-12 h-12 text-zinc-800" />
                                    <h3 className="text-white font-bold">No products found</h3>
                                    <p className="text-zinc-600 text-sm font-medium">Try searching for something else or browse categories.</p>
                                    <Button variant="outline" onClick={() => setSearchQuery("")} className="mt-4 rounded-xl border-white/[0.1] hover:bg-white/[0.04] text-xs font-bold">Clear Search</Button>
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
            className="group relative bg-zinc-900/40 border border-white/[0.06] rounded-[2rem] overflow-hidden hover:bg-zinc-900/60 hover:border-white/[0.12] transition-all duration-500 flex flex-col cursor-pointer"
        >
            <div className="aspect-[4/5] relative overflow-hidden bg-zinc-950">
                {product.image ? (
                    <Image 
                        src={product.image} 
                        alt={product.name} 
                        fill 
                        className={cn(
                            "object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:opacity-40",
                            imageLoaded ? "opacity-100" : "opacity-0"
                        )}
                        onLoadingComplete={() => setImageLoaded(true)}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <ShoppingBag className="w-20 h-20" />
                    </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60" />
                
                <div className="absolute bottom-6 left-6 right-6 translate-y-20 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out z-20">
                    <Button className="w-full h-12 bg-white text-zinc-950 font-bold rounded-xl shadow-2xl hover:bg-zinc-200 text-xs gap-2">
                        Add to Store
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
            
            <div className="p-8 flex flex-col flex-1">
                <div className="flex-1 space-y-2">
                    <h4 className="font-bold text-sm text-white line-clamp-2 leading-tight group-hover:text-blue-400 transition-colors uppercase tracking-tight">{product.name}</h4>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{product.category || 'General Sourcing'}</p>
                </div>
                
                <div className="flex justify-between items-end mt-8 pt-4 border-t border-white/[0.04]">
                    <div>
                        <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.2em] mb-1">Base Wholesale Cost</p>
                        <p className="text-2xl font-bold tracking-tighter text-white">${product.price?.toLocaleString() || '0'}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <ArrowUpRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ShoppingBag, Loader2, ArrowUpRight, Search } from "lucide-react";

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
                
                // Deduplicate by name
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
            router.push("/register");
        } else {
            router.push("/onboarding/reseller");
        }
    };

    const filtered = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white/20 pb-24">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/5">
                <div className="container mx-auto px-6 h-24 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/10">
                            <ShoppingBag className="w-5 h-5 text-zinc-300" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-medium tracking-tighter text-white leading-none mb-1">Global Marketplace</h1>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Live Inventory Network</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-16 space-y-12">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/10 pb-8">
                    <div className="max-w-xl">
                        <h2 className="text-4xl md:text-5xl font-medium tracking-tighter mb-4 text-white">Source Premium Goods.</h2>
                        <p className="text-zinc-400 font-light text-lg">Browse millions of vetted products ready for instant provisioning to your storefront.</p>
                    </div>
                    <div className="w-full md:w-96 relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-white transition-colors duration-300" />
                        <input
                            type="text"
                            placeholder="Search catalog..."
                            className="w-full pl-14 h-14 rounded-full bg-white/5 border border-white/5 text-sm font-bold placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-all text-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="py-32 flex flex-col items-center justify-center">
                        <Loader2 className="w-10 h-10 animate-spin text-zinc-500 mb-4" />
                        <p className="text-zinc-400 font-bold text-xs uppercase tracking-[0.2em]">Syncing Global Network...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filtered.length === 0 ? (
                            <div className="col-span-full py-32 text-center border whitespace-nowrap border-white/5 rounded-[2rem] bg-zinc-900/50">
                                <p className="text-zinc-500 font-medium">No products match your search.</p>
                            </div>
                        ) : (
                            filtered.map((product) => (
                                <div onClick={handleProductClick} key={product.id} className="group cursor-pointer flex flex-col bg-[#0a0a0a] border border-white/5 rounded-[2rem] overflow-hidden hover:border-white/10 transition-all duration-700 hover:-translate-y-2 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                                    <div className="aspect-[4/5] bg-zinc-900 relative overflow-hidden">
                                        {product.image ? (
                                            <>
                                                <Image
                                                    src={product.image}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:opacity-60"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                            </>
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-zinc-800 opacity-30 group-hover:scale-110 transition-transform duration-1000">
                                                <ShoppingBag className="w-32 h-32" />
                                            </div>
                                        )}
                                        <div className="absolute bottom-6 left-6 right-6 translate-y-20 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out z-30">
                                            <div className="w-full h-14 bg-white text-[#050505] flex items-center justify-center font-black rounded-full shadow-2xl hover:bg-zinc-200 text-xs tracking-[0.2em] uppercase">
                                                Add to Store
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-8 flex flex-col flex-1 relative z-10 bg-[#0a0a0a]">
                                        <h4 className="font-bold text-lg text-white line-clamp-2 leading-snug mb-4">{product.name}</h4>
                                        <div className="flex justify-between items-end mt-auto pt-4 border-t border-white/5">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">Base Cost</p>
                                                <p className="text-3xl font-medium tracking-tighter text-white">${product.price?.toLocaleString() || '0'}</p>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white group-hover:text-black transition-colors">
                                                <ArrowUpRight className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

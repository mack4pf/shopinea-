"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Check, ShoppingBag, ArrowRight, Search, Filter, Sparkles, Loader2, Factory, Shuffle, Smartphone, Users, ChevronRight, Globe, ShieldCheck, Zap } from "lucide-react";
import { doc, updateDoc, collection, getDocs, writeBatch, query, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { products as seedProducts } from "@/lib/seed/products";

// Define Product interface type based on our seed data
interface Product {
    id: string; // Firestore ID
    name: string;
    price: number;
    description: string;
    category: string;
    image: string;
}

export default function ResellerOnboarding() {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<{ id: string, name: string, price: number, resellPrice: number }[]>([]);
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [existingProductIds, setExistingProductIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [launchSuccess, setLaunchSuccess] = useState(false);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    const router = useRouter();

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
                } catch (err) {
                    console.error("Error fetching user data:", err);
                }
            }
        });
        return () => unsub();
    }, []);

    // Initial Data Load
    useEffect(() => {
        const initializeProducts = async () => {
            try {
                const productsRef = collection(db, "products");
                const snapshot = await getDocs(productsRef);

                if (snapshot.empty) {
                    console.log("No products found. Seeding...");
                    const batch = writeBatch(db);
                    seedProducts.forEach((product) => {
                        const newDocRef = doc(productsRef);
                        batch.set(newDocRef, product);
                    });
                    await batch.commit();
                    const newSnapshot = await getDocs(productsRef);
                    const fetched = newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
                    setProducts(fetched);
                } else {
                    const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
                    setProducts(fetched);
                }
            } catch (error) {
                console.error("Error initializing products:", error);
            } finally {
                setLoading(false);
            }
        };
        initializeProducts();
    }, []);

    const categories = useMemo(() => {
        const cats = new Set(products.map(p => p.category));
        return ["All", ...Array.from(cats)];
    }, [products]);

    const recommendedProducts = useMemo(() => {
        const promoted = products.filter(p => (p as any).isPromoted);
        return promoted.length > 0 ? promoted : products.slice(0, 4);
    }, [products]);

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
        const matchesMinPrice = minPrice === "" || product.price >= Number(minPrice);
        const matchesMaxPrice = maxPrice === "" || product.price <= Number(maxPrice);
        const isNotOwned = !existingProductIds.has(product.id);
        return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice && isNotOwned;
    });

    const toggleProduct = (product: Product) => {
        const isSelected = selectedProducts.some(p => p.id === product.id);
        if (isSelected) {
            setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
        } else {
            setSelectedProducts(prev => [...prev, {
                id: product.id,
                name: product.name,
                price: product.price,
                resellPrice: Math.ceil(product.price * 1.5)
            }]);
        }
    };

    const updateResellPrice = (id: string, newPrice: number) => {
        setSelectedProducts(prev => prev.map(p =>
            p.id === id ? { ...p, resellPrice: newPrice } : p
        ));
    };

    const handleComplete = async () => {
        const isAddMode = userData?.onboardingCompleted;
        if (!isAddMode && selectedProducts.length < 5) return;

        setSubmitting(true);
        try {
            if (user) {
                const formattedProducts = selectedProducts.map(p => ({
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    resellPrice: p.resellPrice
                }));

                const updates: any = {};
                if (isAddMode) {
                    const currentProducts = userData.storeProducts || [];
                    updates.storeProducts = [...currentProducts, ...formattedProducts];
                    updates.updatedAt = new Date().toISOString();
                } else {
                    const storeName = `${user.displayName || 'My'}'s Store`;
                    const storeSlug = (user.displayName || 'store')
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, '-')
                        .replace(/-+/g, '-') + '-' + user.uid.slice(0, 5);

                    updates.storeProducts = formattedProducts;
                    updates.onboardingCompleted = true;
                    updates.storeName = storeName;
                    updates.storeSlug = storeSlug;
                    updates.status = "active";
                    updates.updatedAt = new Date().toISOString();
                }

                await updateDoc(doc(db, "users", user.uid), updates);
                
                try {
                    await fetch('/api/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'product-added',
                            to: user.email,
                            data: { userName: user.displayName, products: formattedProducts }
                        })
                    });
                } catch (e) {}

                setLaunchSuccess(true);
                setTimeout(() => {
                    router.push(isAddMode ? "/dashboard/products" : "/dashboard");
                }, 2000);
            } else {
                router.push("/login");
            }
        } catch (error) {
            console.error(error);
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 pb-24 relative animate-in fade-in duration-700">
            {/* Success Overlay */}
            {(submitting || launchSuccess) && (
                <div className="fixed inset-0 z-[100] bg-zinc-950/95 backdrop-blur-3xl flex flex-col items-center justify-center">
                    <div className="relative">
                        <div className="w-24 h-24 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                        {launchSuccess && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl">
                                    <Check className="text-white w-10 h-10" />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="mt-12 text-center space-y-4 px-6 max-w-sm">
                        <h2 className="text-3xl font-black text-white tracking-tight">
                            {launchSuccess ? "Success!" : "Setting Up Your Store..."}
                        </h2>
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
                            {launchSuccess ? "Redirecting..." : "Syncing Products..."}
                        </p>
                    </div>
                </div>
            )}

            {/* Sticky Header */}
            <div className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-2xl border-b border-zinc-900 px-4 md:px-12 py-6 flex items-center justify-between gap-6">
                <div className="flex-1">
                    <h1 className="text-xl md:text-2xl font-black text-white italic tracking-tighter leading-none mb-2">
                        {userData?.onboardingCompleted ? 'Add Products' : 'Launch Your Store'}
                    </h1>
                    <p className="text-[10px] md:text-xs text-zinc-500 font-bold uppercase tracking-widest">
                        {userData?.onboardingCompleted
                            ? `Selecting items for inventory`
                            : `Select ${Math.max(0, 5 - selectedProducts.length)} more products to proceed`
                        }
                    </p>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="hidden md:block text-right">
                        <p className="text-sm font-black text-white italic leading-none">{selectedProducts.length} SELECTED</p>
                        <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${selectedProducts.length >= 5 || userData?.onboardingCompleted ? 'text-emerald-500' : 'text-zinc-600'}`}>
                            {selectedProducts.length >= 5 || userData?.onboardingCompleted ? 'READY TO LAUNCH' : 'INCOMPLETE'}
                        </p>
                    </div>
                    <Button
                        onClick={handleComplete}
                        disabled={(selectedProducts.length < 5 && !userData?.onboardingCompleted) || submitting}
                        className={`h-14 px-10 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${
                            (selectedProducts.length >= 5 || userData?.onboardingCompleted)
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xl shadow-blue-500/20'
                            : 'bg-zinc-900 text-zinc-700'
                        }`}
                    >
                        {userData?.onboardingCompleted ? 'ADD TO STORE' : 'CONTINUE'}
                    </Button>
                </div>
            </div>

            <div className="container mx-auto max-w-7xl px-4 md:px-12 py-16 space-y-24">
                
                {/* Business Model Section */}
                <section className="space-y-12">
                    <div className="text-center">
                        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter italic uppercase">Business Model</h2>
                        <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-4">Transparent Global Commerce</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { icon: Factory, label: "Suppliers", desc: "Global Inventory", color: "blue" },
                            { icon: Shuffle, label: "Platform", desc: "Order Fulfillment", color: "indigo" },
                            { icon: Smartphone, label: "Your Store", desc: "Customer Facing", color: "violet" },
                            { icon: Users, label: "Customers", desc: "Revenue Stream", color: "emerald" }
                        ].map((step, i) => (
                            <div key={i} className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] flex flex-col items-center text-center group hover:border-blue-500/50 transition-all shadow-2xl">
                                <div className="w-16 h-16 rounded-2xl bg-zinc-950 flex items-center justify-center mb-6 border border-zinc-800 group-hover:bg-blue-600 transition-colors">
                                    <step.icon className="h-8 w-8 text-white" />
                                </div>
                                <h3 className="font-black text-white text-sm uppercase tracking-widest mb-2">{step.label}</h3>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest opacity-60">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Suppliers Section */}
                <section className="space-y-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <Globe className="text-blue-500 h-5 w-5" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Global Suppliers</span>
                            </div>
                            <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">Verified Partners</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                            { name: "AppScenic", origin: "UK / EU / US" },
                            { name: "DropCommerce", origin: "North America" },
                            { name: "Wiio", origin: "Global" },
                            { name: "Syncee", origin: "Worldwide" },
                            { name: "GogoDrop", origin: "Asia" }
                        ].map((s, i) => (
                            <div key={i} className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl hover:border-blue-500/30 transition-all">
                                <ShieldCheck className="w-6 h-6 text-blue-500 mb-4" />
                                <h3 className="font-black text-white text-sm mb-1">{s.name}</h3>
                                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest italic">{s.origin}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Marketplace Controls */}
                <section className="bg-zinc-900 p-8 rounded-[3rem] border border-zinc-800 shadow-2xl space-y-8">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-700" />
                            <input
                                placeholder="SEARCH CATALOG..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-16 pr-6 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 focus:border-blue-500 transition-all text-sm font-black text-white italic tracking-widest uppercase"
                            />
                        </div>
                        <div className="flex gap-4">
                            <input
                                type="number"
                                placeholder="MIN $"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                className="w-32 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 text-center text-xs font-black text-white focus:border-blue-500 transition-all"
                            />
                            <input
                                type="number"
                                placeholder="MAX $"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                className="w-32 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 text-center text-xs font-black text-white focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-8 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border italic ${
                                    selectedCategory === cat ? 'bg-white text-zinc-950 border-white' : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:text-white'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Hot Picks */}
                <section className="space-y-10">
                    <div className="flex items-center gap-4">
                        <Sparkles className="text-amber-500 h-8 w-8" />
                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Trending Products</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {recommendedProducts.map((p) => (
                            <ProductCard
                                key={p.id}
                                product={p}
                                selectedData={selectedProducts.find(s => s.id === p.id)}
                                onToggle={() => toggleProduct(p)}
                                onPriceChange={(price: number) => updateResellPrice(p.id, price)}
                            />
                        ))}
                    </div>
                </section>

                {/* Main Grid */}
                <section id="catalog" className="grid grid-cols-1 md:grid-cols-4 gap-8 border-t border-zinc-900 pt-16">
                        {filteredProducts.map((p) => (
                            <ProductCard
                                key={p.id}
                                product={p}
                                selectedData={selectedProducts.find(s => s.id === p.id)}
                                onToggle={() => toggleProduct(p)}
                                onPriceChange={(price: number) => updateResellPrice(p.id, price)}
                            />
                        ))}
                </section>
            </div>
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
        <div className={`group bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-2xl ${isSelected ? 'border-blue-500 ring-4 ring-blue-500/10' : 'hover:border-zinc-700'}`}>
            <div className="relative aspect-square overflow-hidden cursor-pointer bg-zinc-950" onClick={onToggle}>
                {product.image ? (
                    <Image 
                        src={product.image} 
                        alt={product.name} 
                        fill 
                        className={`object-cover transition-all duration-700 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoadingComplete={() => setImageLoaded(true)}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-800"><ShoppingBag className="w-12 h-12" /></div>
                )}
                {!imageLoaded && product.image && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-zinc-800" />
                    </div>
                )}
                <div className={`absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 text-white' : 'bg-black/40 backdrop-blur-md text-transparent border border-white/10'}`}>
                    <Check className="w-5 h-5" />
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-xl text-[10px] font-black text-white italic border border-white/10 tracking-widest uppercase">${product.price}</span>
                    <span className="px-3 py-1.5 bg-blue-600 rounded-xl text-[9px] font-black text-white italic tracking-widest uppercase shadow-xl">COST</span>
                </div>
            </div>
            <div className="p-6 space-y-4">
                <div>
                    <h3 className="text-sm font-black text-white italic tracking-tight line-clamp-1 uppercase">{product.name}</h3>
                    <p className="text-[10px] text-zinc-500 mt-2 line-clamp-2 italic leading-relaxed uppercase tracking-widest font-bold opacity-60 h-8">{product.description}</p>
                </div>
                {isSelected && (
                    <div className="space-y-4 animate-in slide-in-from-top-2">
                        <div className="h-px bg-zinc-800" />
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 text-xs font-black">$</span>
                            <input
                                type="number"
                                value={selectedData.resellPrice}
                                onChange={(e) => onPriceChange(Number(e.target.value))}
                                className="w-full pl-8 h-12 rounded-xl bg-zinc-950 border border-blue-500/50 text-white text-xs font-black italic focus:ring-0"
                            />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <span className="text-zinc-600 italic">Expected Profit</span>
                            <span className="text-emerald-500 italic">+${(selectedData.resellPrice - product.price).toLocaleString()}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

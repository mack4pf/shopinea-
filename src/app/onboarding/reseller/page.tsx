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
    const marketRef = useRef<HTMLDivElement>(null);
    const filtersRef = useRef<HTMLDivElement>(null);

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

    // Initial Data Load & Seeding Logic
    useEffect(() => {
        const initializeProducts = async () => {
            try {
                const productsRef = collection(db, "products");
                const snapshot = await getDocs(productsRef);

                if (snapshot.empty) {
                    console.log("No products found. Seeding database...");
                    const batch = writeBatch(db);

                    // Create docs for each seed product
                    seedProducts.forEach((product) => {
                        const newDocRef = doc(productsRef); // Auto-ID
                        batch.set(newDocRef, product);
                    });

                    await batch.commit();
                    console.log("Seeding complete.");

                    // Fetch newly seeded products
                    const newSnapshot = await getDocs(productsRef);
                    const fetchedProducts = newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
                    
                    const uniqueMap = new Map();
                    fetchedProducts.forEach(p => {
                        if (p.name && !uniqueMap.has(p.name)) {
                            uniqueMap.set(p.name, p);
                        }
                    });
                    
                    setProducts(Array.from(uniqueMap.values()));
                } else {
                    const fetchedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
                    
                    const uniqueMap = new Map();
                    fetchedProducts.forEach(p => {
                        if (p.name && !uniqueMap.has(p.name)) {
                            uniqueMap.set(p.name, p);
                        }
                    });
                    
                    setProducts(Array.from(uniqueMap.values()));
                }
            } catch (error) {
                console.error("Error initializing products:", error);
            } finally {
                setLoading(false);
            }
        };

        initializeProducts();
    }, []);

    // Derived Data: Categories
    const categories = useMemo(() => {
        const cats = new Set(products.map(p => p.category));
        return ["All", ...Array.from(cats)];
    }, [products]);

    // Derived Data: Recommended Products (Use 'isPromoted' flag, fallback to top 4)
    const recommendedProducts = useMemo(() => {
        const promoted = products.filter(p => (p as any).isPromoted);
        if (promoted.length > 0) return promoted;
        return products.slice(0, 4);
    }, [products]);

    // Filter Logic
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
                resellPrice: Math.ceil(product.price * 1.5) // Default 50% markup
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
        // If NOT in add mode, enforce minimum 5 products
        if (!isAddMode && selectedProducts.length < 5) return;

        setSubmitting(true);

        try {
            if (user) {
                // Ensure all products have names and prices
                const formattedProducts = selectedProducts.map(p => ({
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    resellPrice: p.resellPrice
                }));

                const updates: any = {};

                if (isAddMode) {
                    // Append new products to existing list
                    const currentProducts = userData.storeProducts || [];
                    updates.storeProducts = [...currentProducts, ...formattedProducts];
                    updates.updatedAt = new Date().toISOString();
                } else {
                    // Initial Setup
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

                // Send email notification for products added
                try {
                    await fetch('/api/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'product-added',
                            to: user.email,
                            data: {
                                userName: user.displayName,
                                products: formattedProducts
                            }
                        })
                    });
                } catch (emailErr) {
                    console.error("Failed to send product added email:", emailErr);
                }

                setLaunchSuccess(true);
                // Give user a moment to see the success before redirect
                setTimeout(() => {
                    if (isAddMode) {
                        router.push("/dashboard/products");
                    } else {
                        router.push("/dashboard");
                    }
                }, 2000);
            } else {
                console.error("No user found");
                alert("Please log in again to save your store.");
                router.push("/login");
            }
        } catch (error) {
            console.error("Error completing onboarding:", error);
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
                    <p className="mt-4 text-gray-500">Loading marketplace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-24 relative">
            {/* Success/Launching Overlay */}
            {(submitting || launchSuccess) && (
                <div className="fixed inset-0 z-[100] bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl flex flex-col items-center justify-center animate-in fade-in duration-500">
                    <div className="relative">
                        <div className="w-24 h-24 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                        {launchSuccess && (
                            <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in duration-500">
                                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-xl shadow-blue-500/40">
                                    <Check className="text-white w-10 h-10" />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="mt-12 text-center space-y-4 px-6 max-w-sm">
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                            {launchSuccess ? "Store Published!" : "Building Your Empire..."}
                        </h2>
                        <p className="text-gray-500 font-medium">
                            {launchSuccess
                                ? (userData?.onboardingCompleted ? "Products added successfully! Redirecting..." : "Redirecting you to your new command center. Welcome to the future of commerce.")
                                : (userData?.onboardingCompleted ? "Adding products to your inventory..." : "We're synchronizing your selected products with our global supplier network and setting up your custom storefront URL.")}
                        </p>
                        {!launchSuccess && (
                            <div className="flex gap-1 justify-center">
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-zinc-800 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex-1">
                    <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-none mb-1">
                        {userData?.onboardingCompleted ? 'Add New Products' : 'Build Your Store'}
                    </h1>
                    <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {userData?.onboardingCompleted
                            ? `Select products to add to your existing collection.`
                            : `Select ${selectedProducts.length < 5 ? 5 - selectedProducts.length : 0} more products to launch.`
                        }
                    </p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-1 sm:mt-0">
                    <div className="text-left sm:text-right">
                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                            {selectedProducts.length} Products
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className={`h-1.5 w-1.5 rounded-full ${userData?.onboardingCompleted || selectedProducts.length >= 5 ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`} />
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${userData?.onboardingCompleted || selectedProducts.length >= 5 ? 'text-green-600' : 'text-orange-500'}`}>
                                {userData?.onboardingCompleted ? 'Ready to Add' : (selectedProducts.length >= 5 ? 'Verified' : 'Incomplete')}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => marketRef.current?.scrollIntoView({ behavior: 'smooth' })}
                        variant="ghost"
                        className="flex items-center gap-2 h-9 px-3 rounded-lg text-blue-600 font-bold hover:bg-blue-50 transition-all text-xs"
                    >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Market
                    </Button>
                    <Button
                        onClick={handleComplete}
                        disabled={(selectedProducts.length < 5 && !userData?.onboardingCompleted) || submitting}
                        className={`transition-all h-9 sm:h-12 px-4 sm:px-8 rounded-lg sm:rounded-2xl font-bold flex-1 sm:flex-none ${(selectedProducts.length >= 5 || userData?.onboardingCompleted)
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20'
                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'}`}
                    >
                        {submitting ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <span className="sm:inline hidden">{userData?.onboardingCompleted ? 'Add Products' : 'Launch My Store'}</span>
                                <span className="sm:hidden inline text-xs">{userData?.onboardingCompleted ? 'Add' : 'Build Store'}</span>
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 space-y-16">

                {/* The Bridge Flow Component */}
                <section className="relative">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">The Digital Bridge</h2>
                        <p className="text-gray-500 font-medium mt-2">How we connect global markets to your storefront</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                        {/* Connecting Lines (Desktop) */}
                        <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 dark:bg-zinc-800 -translate-y-1/2 z-0">
                            <div className="absolute top-0 left-0 h-full bg-blue-600 w-1/3 animate-flow-left" />
                            <div className="absolute top-0 left-1/3 h-full bg-blue-600 w-1/3 animate-flow-mid" />
                            <div className="absolute top-0 left-2/3 h-full bg-blue-600 w-1/3 animate-flow-right" />
                        </div>

                        {[
                            { icon: Factory, label: "Suppliers", desc: "Premium Global Sources", color: "blue" },
                            { icon: Shuffle, label: "Shoplinea.shop", desc: "The Intelligent Bridge", color: "indigo" },
                            { icon: Smartphone, label: "Resellers", desc: "Your Storefront (You)", color: "violet" },
                            { icon: Users, label: "Buyers", desc: "Global Market Demand", color: "fuchsia" }
                        ].map((step, i) => (
                            <div key={i} className="relative z-10 flex flex-col items-center">
                                <div className={`w-16 h-16 rounded-2xl bg-${step.color}-50 dark:bg-${step.color}-950/30 border border-${step.color}-100 dark:border-${step.color}-900/50 flex items-center justify-center mb-4 transition-transform hover:scale-110 duration-500 shadow-lg shadow-${step.color}-500/5`}>
                                    <step.icon className={`h-8 w-8 text-${step.color}-600`} />
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-widest">{step.label}</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <hr className="border-gray-100 dark:border-zinc-800" />

                {/* Global Sourcing Network */}
                <section>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Globe className="text-blue-500 h-5 w-5" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Inventory Origin</span>
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Our Global Sourcing Network</h2>
                            <p className="text-gray-500 font-medium text-sm mt-1">Direct access to niche, high-performance global suppliers</p>
                        </div>
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-4 border-white dark:border-zinc-950 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                                    <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20" />
                                </div>
                            ))}
                            <div className="w-10 h-10 rounded-full border-4 border-white dark:border-zinc-950 bg-blue-600 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                                +50
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {[
                            { name: "AppScenic", origin: "UK / EU / US", tag: "Premium", desc: "Focuses on high-ticket, vetted luxury and lifestyle items." },
                            { name: "DropCommerce", origin: "North America", tag: "Ethical", desc: "Curated list of independent, high-quality local brands." },
                            { name: "Wiio", origin: "Global Sourcing", tag: "Quality", desc: "Bespoke sourcing and strict quality control for top sellers." },
                            { name: "Syncee", origin: "Worldwide", tag: "Wholesale", desc: "Direct B2B integration with verified global manufacturers." },
                            { name: "GogoDrop", origin: "China / Asia", tag: "Dynamic", desc: "Transparent sourcing for trending high-demand products." }
                        ].map((supplier, i) => (
                            <div key={i} className="group p-5 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 hover:border-blue-500/30 transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-xl group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                                        <ShieldCheck className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                                        {supplier.tag}
                                    </span>
                                </div>
                                <h3 className="font-black text-gray-900 dark:text-white text-lg tracking-tight mb-1">{supplier.name}</h3>
                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3 flex items-center gap-1">
                                    <Globe className="w-3 h-3" /> {supplier.origin}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                                    {supplier.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <hr className="border-gray-100 dark:border-zinc-800" />

                {/* Filters & Search - Moved to Top */}
                <section ref={filtersRef} className="bg-white dark:bg-zinc-900 p-4 sm:p-8 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm space-y-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search the catalog..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-2xl border-none bg-gray-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium"
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="relative flex-1 sm:w-28">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">$</span>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                    className="w-full pl-7 pr-3 py-3 rounded-2xl bg-gray-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-bold border-none"
                                />
                            </div>
                            <div className="relative flex-1 sm:w-28">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">$</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    className="w-full pl-7 pr-3 py-3 rounded-2xl bg-gray-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-bold border-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Category Pills */}
                    <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400 self-center mr-2 flex items-center gap-1">
                            <Filter className="h-3 w-3" /> Categories:
                        </span>
                        <div className="flex flex-wrap gap-2 no-scrollbar">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedCategory === cat
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                        : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                <hr className="border-gray-100 dark:border-zinc-800" />

                {/* Recommended Section */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                            <Sparkles className="text-yellow-500 h-5 w-5" />
                        </div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white border-none">Trending Hot-Picks</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                        {recommendedProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                selectedData={selectedProducts.find(p => p.id === product.id)}
                                onToggle={() => toggleProduct(product)}
                                onPriceChange={(price) => updateResellPrice(product.id, price)}
                                isHighlight
                            />
                        ))}
                    </div>
                </section>


                {/* Main Grid */}
                <div ref={marketRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 pb-12">
                    {filteredProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            selectedData={selectedProducts.find(p => p.id === product.id)}
                            onToggle={() => toggleProduct(product)}
                            onPriceChange={(price) => updateResellPrice(product.id, price)}
                        />
                    ))}
                    {filteredProducts.length === 0 && (
                        <div className="col-span-full py-20 bg-white dark:bg-zinc-900 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-zinc-800 text-center text-gray-400 font-bold">
                            No products found in this category.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ProductCard({
    product,
    selectedData,
    onToggle,
    onPriceChange,
    isHighlight = false
}: {
    product: Product,
    selectedData?: any,
    onToggle: () => void,
    onPriceChange: (price: number) => void,
    isHighlight?: boolean
}) {
    const isSelected = !!selectedData;

    return (
        <div
            className={`group relative bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden transition-all duration-500 border-2 ${isSelected
                ? 'border-blue-500 shadow-2xl shadow-blue-500/20 scale-[1.02]'
                : isHighlight
                    ? 'border-yellow-400/20 hover:border-yellow-400/50 shadow-lg shadow-yellow-500/5'
                    : 'border-transparent hover:border-gray-100 dark:hover:border-zinc-800 shadow-sm'
                }`}
        >
            {/* Selection Area */}
            <div onClick={onToggle} className="cursor-pointer">
                {/* Selection Indicator */}
                <div className={`absolute top-3 right-3 z-10 h-6 w-6 rounded-full flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-blue-500 text-white scale-100' : 'bg-black/5 dark:bg-white/10 text-transparent scale-90 group-hover:bg-black/10 group-hover:scale-100'
                    }`}>
                    <Check className={`h-3.5 w-3.5 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                </div>

                {/* Product Image */}
                <div className={`aspect-[4/3] relative overflow-hidden ${isHighlight ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border-b border-yellow-100 dark:border-yellow-900/30' : 'bg-gray-100 dark:bg-zinc-800 border-b border-gray-100 dark:border-zinc-800'}`}>
                    {product.image ? (
                        <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-300 dark:text-zinc-600 transition-transform duration-500 group-hover:scale-110">
                            <ShoppingBag className="h-10 w-10 opacity-20" />
                        </div>
                    )}
                </div>

                <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 leading-snug">{product.name}</h3>
                        <span className="font-bold text-gray-900 dark:text-white text-sm whitespace-nowrap bg-gray-50 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md border border-gray-100 dark:border-zinc-700">
                            ${product.price}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 h-8 leading-tight">{product.description}</p>
                </div>
            </div>

            {/* Price Input Section (Visible only when selected) */}
            {isSelected && (
                <div className="p-5 pt-0 border-t border-gray-50 dark:border-zinc-800 mt-2 bg-blue-50/50 dark:bg-blue-900/10 transition-all animate-in slide-in-from-top-2">
                    <label className="text-[10px] uppercase font-black text-blue-600 dark:text-blue-400 mb-2 block pt-4 tracking-widest">Pricing Plan</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">$</span>
                        <input
                            type="number"
                            value={selectedData.resellPrice}
                            onChange={(e) => onPriceChange(Number(e.target.value))}
                            className="w-full pl-8 pr-4 py-3 rounded-2xl bg-white dark:bg-zinc-800 border-2 border-blue-100 dark:border-blue-900 focus:outline-none focus:border-blue-500 text-sm font-black text-gray-900 dark:text-white"
                        />
                    </div>
                    <div className="flex justify-between items-center mt-3">
                        <p className="text-[10px] font-black uppercase text-gray-400">Profit</p>
                        <div className="text-right">
                            <p className="text-sm font-black text-emerald-600">
                                +${(selectedData.resellPrice - product.price).toLocaleString()}
                            </p>
                            <p className="text-[10px] font-bold text-emerald-500/80">
                                {(((selectedData.resellPrice - product.price) / product.price) * 100).toFixed(0)}% Margin
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

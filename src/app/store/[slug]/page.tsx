"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, limit, doc, updateDoc, increment, getDoc } from "firebase/firestore";
import {
    ShoppingBag,
    ShieldCheck,
    Star,
    CheckCircle2,
    Truck,
    Clock,
    Search,
    Loader2,
    Eye,
    User,
    LogOut,
    Package,
    ArrowUpRight,
    ArrowRight,
    SearchX,
    MessageCircle,
    ShoppingSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import InquiryModal from "@/components/modals/InquiryModal";
import CheckoutModal from "@/components/modals/CheckoutModal";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function StorePage() {
    const { slug } = useParams();
    const router = useRouter();
    const [storeUser, setStoreUser] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Modal State
    const [inquiryProduct, setInquiryProduct] = useState<any>(null);
    const [checkoutProduct, setCheckoutProduct] = useState<any>(null);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (u) => setUser(u));
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        const fetchStore = async () => {
            try {
                const q = query(
                    collection(db, "users"),
                    where("storeSlug", "==", slug),
                    limit(1)
                );
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const uDoc = querySnapshot.docs[0];
                    setStoreUser({ uid: uDoc.id, ...uDoc.data() });

                    // Increment store view
                    await updateDoc(doc(db, "users", uDoc.id), {
                        "stats.views": increment(1)
                    });
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
    const filteredProducts = products.filter((p: any) =>
        p && p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#09090b] text-white selection:bg-blue-500/30">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-md border-b border-white/[0.06] py-3">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-zinc-950 border border-white/[0.08] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-xl">
                            {storeUser.storeName?.[0] || "S"}
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-white leading-none">{storeUser.storeName}</h1>
                            <div className="flex items-center gap-1.5 mt-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500/80">Verified Local Merchant</span>
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:flex flex-1 max-w-md mx-12">
                        <div className="relative w-full group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                            <input
                                type="text"
                                placeholder="Search collection..."
                                className="w-full h-10 pl-11 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm font-medium placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {user ? (
                            <div className="flex items-center gap-2">
                                <Link href="/buyer-orders">
                                    <Button variant="ghost" className="rounded-lg h-10 px-4 gap-2 text-zinc-400 hover:text-white hover:bg-white/[0.04] text-xs font-bold uppercase tracking-tight">
                                        <Package className="w-4 h-4" />
                                        <span className="hidden sm:inline">My Orders</span>
                                    </Button>
                                </Link>
                                <Button
                                    onClick={() => signOut(auth)}
                                    variant="ghost"
                                    className="rounded-lg h-10 w-10 p-0 flex items-center justify-center text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <Link href="/">
                                <Button className="rounded-lg font-bold h-10 px-6 bg-white text-zinc-950 hover:bg-zinc-200 transition-all text-xs">
                                    Sign In
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-12 max-w-7xl space-y-24">
                {/* Hero Banner */}
                <section className="relative rounded-[2rem] overflow-hidden bg-zinc-900/50 border border-white/[0.06] flex flex-col items-center justify-center text-center py-20 px-6 sm:py-32">
                    <div className="absolute inset-0 z-0 opacity-10 flex items-center justify-center">
                        <div className="w-[600px] h-[400px] bg-blue-600/30 rounded-full blur-[150px]" />
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                    </div>
                    
                    <div className="relative z-10 space-y-6 max-w-3xl flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.04] rounded-full border border-white/[0.1] text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                            Professional Experience
                        </div>
                        <h2 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.1]">
                            Carefully curated essentials <br className="hidden sm:block" />
                            <span className="text-zinc-500">for your lifestyle.</span>
                        </h2>
                        <p className="text-zinc-500 font-medium sm:text-lg max-w-xl mx-auto leading-relaxed">
                            Discover high-quality products from verified global suppliers. Professional service, guaranteed delivery.
                        </p>
                    </div>
                </section>

                {/* Products Section */}
                <div className="space-y-12">
                    <div className="flex items-end justify-between border-b border-white/[0.04] pb-6">
                        <div>
                            <h3 className="text-2xl font-bold">The Collection</h3>
                            <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mt-1">
                                {filteredProducts.length} items available
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-600 text-[10px] font-bold uppercase tracking-[0.1em]">
                            <Truck className="w-3 h-3" /> Priority Express Shipping
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                                    onInquiry={() => setInquiryProduct(product)} 
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Features Footer */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-8 py-20 border-t border-white/[0.04]">
                    {[
                        { title: "Escrow Protection", desc: "Your payment is held securely and only released once your order is successfully delivered.", icon: ShieldCheck },
                        { title: "Verified Sourcing", desc: "Every product in this store is sourced from quality-vetted global manufacturers.", icon: ShoppingSquare },
                        { title: "24/7 Assistance", desc: "Need help? Contact the merchant directly through our secure messaging system.", icon: MessageCircle }
                    ].map((f, i) => (
                        <div key={i} className="flex flex-col items-center text-center gap-4 p-8 bg-zinc-900/30 rounded-3xl border border-white/[0.04] hover:bg-zinc-900/50 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-2">
                                <f.icon className="w-6 h-6 text-blue-500" />
                            </div>
                            <h4 className="text-lg font-bold text-white tracking-tight">{f.title}</h4>
                            <p className="text-sm text-zinc-500 font-medium leading-relaxed">{f.desc}</p>
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
            />

            <footer className="border-t border-white/[0.04] p-12 text-center text-zinc-700 text-[10px] font-bold uppercase tracking-[0.3em]">
                &copy; 2026 {storeUser.storeName}. Powered by Restock.
            </footer>
        </div>
    );
}

function ProductCard({ product, onInquiry }: { product: any, onInquiry: () => void }) {
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
        <div className="group bg-zinc-900/30 border border-white/[0.06] rounded-2xl overflow-hidden hover:bg-zinc-900/60 hover:border-white/[0.12] transition-all duration-300 flex flex-col">
            <div className="relative aspect-[4/5] overflow-hidden bg-zinc-950 cursor-pointer" onClick={onInquiry}>
                {product.image ? (
                    <Image 
                        src={product.image} 
                        alt={product.name} 
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
                
                {/* Popularity Badge */}
                <div className="absolute top-4 left-4 z-10">
                    <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/[0.08] text-[9px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                        <Eye className="w-3 h-3 text-blue-500" />
                        {(product.engagementViews || 0).toLocaleString()} Views
                    </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4 translate-y-20 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out z-20">
                    <Button
                        onClick={(e) => { e.stopPropagation(); onInquiry(); }}
                        className="w-full h-12 bg-white text-zinc-950 font-bold rounded-xl shadow-2xl hover:bg-zinc-200 text-xs"
                    >
                        Secure Purchase
                    </Button>
                </div>
            </div>
            
            <div className="p-6 flex flex-col flex-1">
                <div className="flex-1 space-y-2 cursor-pointer" onClick={onInquiry}>
                   <h4 className="font-bold text-sm text-white line-clamp-2 leading-tight group-hover:text-blue-400 transition-colors">{product.name}</h4>
                   <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{product.category || 'Lifestyle'}</p>
                </div>
                
                <div className="flex justify-between items-end mt-6 pt-4 border-t border-white/[0.04]">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 leading-none mb-1">Price</p>
                        <p className="text-2xl font-bold tracking-tight text-white">${product.resellPrice?.toLocaleString() || '0'}</p>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-500 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:rotate-45">
                        <ArrowUpRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, limit, doc, updateDoc, increment } from "firebase/firestore";
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
    ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import InquiryModal from "@/components/modals/InquiryModal";
import CheckoutModal from "@/components/modals/CheckoutModal";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import Link from "next/link";
import Image from "next/image";

export default function StorePage() {
    const { slug } = useParams();
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!storeUser) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950 p-6 text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-900 rounded-3xl flex items-center justify-center mb-6">
                    <ShoppingBag className="w-10 h-10 text-gray-400" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">Store Not Found</h1>
                <p className="text-gray-500 mt-2">This storefront might have been moved or taken offline.</p>
                <Button className="mt-8 rounded-2xl bg-blue-600" onClick={() => window.location.href = "/"}>Back to Home</Button>
            </div>
        );
    }

    const products = Array.isArray(storeUser.storeProducts) ? storeUser.storeProducts : [];
    const filteredProducts = products.filter((p: any) =>
        p && p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30 font-sans">
            {/* Store Header */}
            <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/5">
                <div className="container mx-auto px-6 h-24 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-2xl flex items-center justify-center text-white font-black text-xl border border-white/10 shadow-2xl">
                            {storeUser.storeName?.[0] || "S"}
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter sm:text-3xl text-white leading-none mb-1">{storeUser.storeName}</h1>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/80">Authorized Merchant</span>
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:flex flex-1 max-w-xl mx-16">
                        <div className="relative w-full group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-blue-500 transition-colors duration-300" />
                            <input
                                type="text"
                                placeholder="Search premium collection..."
                                className="w-full pl-14 h-14 rounded-full bg-white/5 border border-white/5 text-sm font-bold placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                <Link href="/buyer-orders">
                                    <Button variant="outline" className="rounded-full font-black h-12 px-8 gap-3 bg-white/5 border-white/10 hover:bg-white/10 text-white transition-all hidden sm:flex">
                                        <Package className="w-5 h-5" />
                                        MY ORDERS
                                    </Button>
                                </Link>
                                <Button
                                    onClick={() => signOut(auth)}
                                    variant="ghost"
                                    className="rounded-full font-black h-12 w-12 p-0 flex items-center justify-center bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-500 transition-all"
                                >
                                    <LogOut className="w-5 h-5" />
                                </Button>
                            </>
                        ) : (
                            <Link href="/">
                                <Button variant="outline" className="rounded-full font-black h-12 px-8 gap-3 bg-white text-black hover:bg-zinc-200 border-none transition-all">
                                    <User className="w-5 h-5" />
                                    SIGN IN
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-12 space-y-24">
                {/* Elite Hero Banner */}
                <section className="relative rounded-[3rem] overflow-hidden bg-zinc-900 border border-white/10 flex flex-col items-center text-center py-32 px-4 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    {/* Background glow and texture */}
                    <div className="absolute inset-0 z-0">
                        <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px]" />
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-80" />
                    </div>
                    
                    <div className="relative z-10 max-w-3xl space-y-8 flex flex-col items-center">
                        <div className="inline-flex items-center gap-3 px-5 py-2 bg-zinc-950/80 backdrop-blur-md rounded-full border border-white/5 shadow-2xl">
                            <Star className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-300">Elite Curated Collection</span>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.05]">
                            Exceptional Quality.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-300 to-zinc-600">Zero Compromise.</span>
                        </h2>
                        <p className="text-zinc-400 font-medium md:text-xl max-w-xl mx-auto leading-relaxed">
                            Discover world-class essentials sourced directly from verified global suppliers. Premium tier products, expedited processing.
                        </p>
                        <div className="flex flex-wrap justify-center gap-10 pt-8 opacity-70">
                            <div className="flex items-center gap-3">
                                <Truck className="w-6 h-6 text-zinc-300" />
                                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Global Priority</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock className="w-6 h-6 text-zinc-300" />
                                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">24/7 Verified Support</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Products Grid */}
                <div className="space-y-12 pb-24">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/10 pb-6">
                        <div>
                            <h3 className="text-4xl font-black tracking-tighter text-white">The Collection</h3>
                            <p className="text-sm font-bold text-zinc-500 uppercase tracking-[0.2em] mt-2">Showing {filteredProducts.length} Items</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredProducts.length === 0 ? (
                            <div className="col-span-full py-40 text-center bg-zinc-900/50 rounded-[3rem] border border-white/5">
                                <Package className="w-20 h-20 text-zinc-800 mx-auto mb-8" />
                                <h4 className="text-2xl font-black tracking-tight text-white mb-2">Inventory Updating</h4>
                                <p className="text-zinc-500 font-medium max-w-sm mx-auto">This merchant is currently curating new products. Check back shortly.</p>
                            </div>
                        ) : (
                            filteredProducts.map((product: any) => (
                                <div key={product.id} className="group flex flex-col bg-[#0a0a0a] border border-white/5 rounded-[2rem] overflow-hidden hover:border-white/10 transition-all duration-700 hover:-translate-y-2 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                                    <div className="aspect-[4/5] bg-zinc-900 relative overflow-hidden">
                                        <div className="absolute top-5 left-5 z-20">
                                            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 shadow-2xl">
                                                <Eye className="w-4 h-4 text-zinc-300" />
                                                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                                    {(product.engagementViews || 0).toLocaleString()} Views
                                                </span>
                                            </div>
                                        </div>
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
                                        <div className="absolute bottom-6 left-6 right-6 translate-y-24 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out z-30">
                                            <Button
                                                onClick={() => setInquiryProduct(product)}
                                                className="w-full h-14 bg-white text-[#050505] font-black rounded-full shadow-2xl hover:bg-zinc-200 text-xs tracking-[0.2em] uppercase"
                                            >
                                                SECURE PURCHASE
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="p-8 flex flex-col flex-1 relative z-10 bg-[#0a0a0a]">
                                        <h4 className="font-bold text-lg text-white line-clamp-2 leading-snug mb-4">{product.name}</h4>
                                        <div className="flex justify-between items-end mt-auto pt-4 border-t border-white/5">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">Available Now</p>
                                                <p className="text-3xl font-black tracking-tighter text-white">${product.resellPrice.toLocaleString()}</p>
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
                </div>

                {/* Trust Footer */}
                <section className="relative overflow-hidden bg-zinc-900 border border-white/5 p-16 rounded-[4rem] flex flex-col lg:flex-row items-center justify-between gap-16 text-center lg:text-left">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] -mt-[300px] -mr-[300px]" />
                    
                    <div className="relative z-10 space-y-6 max-w-2xl">
                        <div className="w-20 h-20 bg-black/50 border border-white/10 rounded-[2rem] flex items-center justify-center mx-auto lg:mx-0 shadow-2xl backdrop-blur-xl">
                            <ShieldCheck className="w-10 h-10 text-emerald-400" />
                        </div>
                        <h3 className="text-4xl font-black tracking-tighter text-white">Guaranteed Integrity.</h3>
                        <p className="text-zinc-400 font-medium text-lg leading-relaxed">
                            This storefront is monitored by Shoplinea.shop's central logistics network. 
                            Your payment is held securely in escrow until successful delivery confirmation.
                        </p>
                    </div>
                    <Button className="relative z-10 h-16 px-10 rounded-full font-black text-xs uppercase tracking-[0.2em] bg-white text-black hover:bg-zinc-200 transition-all shadow-2xl shrink-0">
                        View Network Policy
                    </Button>
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

            <footer className="border-t border-white/5 py-12 text-center text-zinc-600 font-black text-[10px] uppercase tracking-[0.4em]">
                &copy; 2026 {storeUser.storeName}. Powered by the premium Shoplinea.shop network.
            </footer>
        </div>
    );
}

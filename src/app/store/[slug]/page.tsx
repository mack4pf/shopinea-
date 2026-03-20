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
    Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import InquiryModal from "@/components/modals/InquiryModal";
import CheckoutModal from "@/components/modals/CheckoutModal";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import Link from "next/link";

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
        <div className="min-h-screen bg-white dark:bg-zinc-950">
            {/* Store Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-zinc-800">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black">
                            {storeUser.storeName?.[0] || "S"}
                        </div>
                        <div>
                            <h1 className="font-black text-gray-900 dark:text-white leading-none">{storeUser.storeName}</h1>
                            <div className="flex items-center gap-1.5 mt-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Verified Vendor</span>
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:flex flex-1 max-w-md mx-12">
                        <div className="relative w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search this store..."
                                className="w-full pl-12 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 border-none text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {user ? (
                            <>
                                <Link href="/buyer-orders">
                                    <Button variant="outline" className="rounded-xl font-bold h-10 px-6 gap-2 border-gray-100 hidden sm:flex">
                                        <Package className="w-4 h-4" />
                                        My Orders
                                    </Button>
                                </Link>
                                <Button
                                    onClick={() => signOut(auth)}
                                    variant="ghost"
                                    className="rounded-xl font-bold h-10 px-4 gap-2 text-zinc-500 hover:text-red-500"
                                >
                                    <LogOut className="w-4 h-4" />
                                </Button>
                            </>
                        ) : (
                            <Link href="/">
                                <Button variant="outline" className="rounded-xl font-bold h-10 px-6 gap-2 border-gray-100">
                                    <User className="w-4 h-4" />
                                    Sign In
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-12 space-y-16">
                {/* Hero / Banner */}
                <section className="bg-zinc-950 rounded-[3rem] p-8 md:p-16 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/30 rounded-full blur-[100px] -mr-48 -mt-48" />
                    <div className="relative z-10 max-w-2xl space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/5">
                            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Top Rated Storefront</span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9]">Premium Products, <br /><span className="text-blue-500">Fast Shipping.</span></h2>
                        <p className="text-gray-400 font-medium md:text-lg">Discover curated essential items directly from the source. 100% Quality Guaranteed.</p>
                        <div className="flex flex-wrap gap-8 pt-4">
                            <div className="flex items-center gap-3">
                                <Truck className="w-5 h-5 text-blue-400" />
                                <span className="text-xs font-bold text-gray-300">Free Express Delivery</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-blue-400" />
                                <span className="text-xs font-bold text-gray-300">24/7 Support</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Products Grid */}
                <div className="space-y-8">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white">Store Catalog</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-24">
                        {filteredProducts.length === 0 ? (
                            <div className="col-span-full py-24 text-center bg-gray-50 dark:bg-zinc-900/30 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-zinc-800">
                                <Package className="w-16 h-16 text-gray-200 dark:text-zinc-800 mx-auto mb-6" />
                                <h4 className="text-xl font-black text-gray-900 dark:text-white">No Products Yet</h4>
                                <p className="text-gray-500 font-medium mt-2">Check back soon for latest arrivals.</p>
                            </div>
                        ) : (
                            filteredProducts.map((product: any) => (
                                <div key={product.id} className="group flex flex-col bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[2rem] overflow-hidden hover:shadow-2xl transition-all duration-500">
                                    <div className="aspect-[4/5] bg-gray-50 dark:bg-zinc-800 relative overflow-hidden">
                                        <div className="absolute top-4 left-4 z-20">
                                            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                                <Eye className="w-3 h-3 text-white" />
                                                <span className="text-[10px] font-black text-white">
                                                    {(product.engagementViews || 0).toLocaleString()} Views
                                                </span>
                                            </div>
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-200 opacity-20 group-hover:scale-110 transition-transform duration-700">
                                            <ShoppingBag className="w-24 h-24" />
                                        </div>
                                        <div className="absolute bottom-4 left-4 right-4 translate-y-12 group-hover:translate-y-0 transition-transform">
                                            <Button
                                                onClick={() => setInquiryProduct(product)}
                                                className="w-full h-11 bg-white dark:bg-zinc-800 dark:text-white text-black font-black rounded-xl shadow-xl hover:bg-blue-600 hover:text-white"
                                            >
                                                PURCHASE PRODUCT
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="p-6 flex flex-col flex-1">
                                        <h4 className="font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight mb-2 h-10">{product.name}</h4>
                                        <div className="flex justify-between items-end mt-auto">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Sale Price</p>
                                                <p className="text-2xl font-black text-gray-900 dark:text-white">${product.resellPrice.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Trust Footer */}
                <section className="bg-gray-50 dark:bg-zinc-900/50 p-12 rounded-[3.5rem] border border-gray-100 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="text-center md:text-left space-y-4 max-w-lg">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mx-auto md:mx-0">
                            <ShieldCheck className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-none">Safe Shopping, Shoplinea.shop Verified</h3>
                        <p className="text-gray-500 font-medium">All orders are managed via our central logistics network. 100% money-back guarantee on all verified storefront purchases.</p>
                    </div>
                    <Button className="h-14 px-8 rounded-2xl font-black bg-blue-600 text-white shadow-xl shadow-blue-500/20 shrink-0">
                        View Refund Policy
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

            <footer className="container mx-auto px-6 py-12 text-center text-gray-400 font-bold text-xs uppercase tracking-[0.3em]">
                &copy; 2026 {storeUser.storeName}. Powered by Shoplinea.shop.
            </footer>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    Package,
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    ExternalLink,
    Copy,
    Share2,
    Megaphone,
    AlertCircle,

    ArrowUpRight,
    TrendingUp,
    ShieldCheck,
    Loader2,
    ShoppingCart,
    Eye,
    Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProductsPage() {
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const getCurrencySymbol = (code: string = "USD") => {
        switch (code) {
            case "EUR": return "€";
            case "GBP": return "£";
            default: return "$";
        }
    };

    const currencySymbol = getCurrencySymbol(userData?.currency);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Add toast notification here if available
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const products = userData?.storeProducts || [];
    const filteredProducts = products.filter((p: any) =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalMargin = products.reduce((acc: number, p: any) => acc + ((p.resellPrice || 0) - (p.price || 0)), 0);
    const avgMargin = products.length ? (totalMargin / products.reduce((acc: number, p: any) => acc + (p.price || 0), 0) * 100).toFixed(0) : "0";

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <Package className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400">Inventory Control</span>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter italic leading-none">Collection Hub</h1>
                    <p className="text-zinc-500 font-extrabold text-sm uppercase tracking-widest leading-relaxed opacity-80 max-w-xl">
                        Monitor and curate your global product catalogue with real-time margin analysis.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                     <Button
                        variant="outline"
                        className="h-16 px-10 rounded-[1.5rem] border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900 text-white font-black text-[11px] tracking-widest uppercase gap-3 hover:scale-105 transition-all shadow-xl group border-b-4 border-zinc-900 active:border-b-0 italic"
                        onClick={() => window.open(`${window.location.origin}/store/${userData?.storeSlug || ''}`, '_blank')}
                    >
                        <ExternalLink className="w-5 h-5 group-hover:text-blue-500 transition-colors" />
                        LIVE ARCHIVE
                    </Button>
                    <Button
                        onClick={() => window.location.href = '/onboarding/reseller'}
                        className="h-16 px-10 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-blue-500/20 hover:scale-105 transition-all active:scale-95 italic border-b-4 border-blue-800 active:border-b-0 gap-3"
                    >
                        <Plus className="w-6 h-6" />
                        DEPLOY ASSET
                    </Button>
                </div>
            </div>

            {/* Strategic Search & Stats */}
            <div className="space-y-10">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-2 relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-700 group-focus-within:text-blue-500 transition-all duration-300" />
                        <Input
                            placeholder="SEARCH ENTIRE COLLECTION..."
                            className="pl-16 h-20 bg-zinc-900 border-zinc-800 rounded-[2rem] text-[11px] font-black tracking-widest uppercase placeholder:text-zinc-700 focus-visible:ring-2 focus-visible:ring-blue-500/20 transition-all shadow-inner"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-6 lg:col-span-2">
                        {[
                            { label: "Assets", value: products.length, color: "blue" },
                            { label: "OOS", value: "0", color: "red" },
                            { label: "Volume", value: userData?.stats?.orders || 0, color: "emerald" },
                            { label: "Margin", value: `${avgMargin}%`, color: "indigo" },
                        ].map((stat, i) => (
                            <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[2rem] flex items-center justify-between shadow-inner">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1 leading-none">{stat.label}</p>
                                    <h4 className="text-2xl font-black text-white italic tracking-tighter">{stat.value}</h4>
                                </div>
                                <div className={`w-2 h-2 rounded-full bg-${stat.color}-500 shadow-[0_0_10px_rgba(var(--${stat.color}-500),0.5)]`} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tactical Ledger */}
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-40 bg-zinc-950/50 rounded-[4rem] border-2 border-dashed border-zinc-900 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-blue-600/[0.02] pointer-events-none" />
                        <Package className="w-32 h-32 text-zinc-900 mx-auto mb-10 group-hover:scale-110 group-hover:text-zinc-800 transition-all duration-1000" />
                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">No Data Nodes Found</h2>
                        <p className="text-zinc-600 font-extrabold text-[11px] uppercase tracking-[0.3em] max-w-sm mx-auto leading-loose opacity-60">
                            Your collection repository is currently empty or filtered.
                        </p>
                        <Button
                            onClick={() => window.location.href = '/onboarding/reseller'}
                            variant="outline"
                            className="mt-10 h-14 px-10 rounded-[1.5rem] border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-white font-black italic uppercase text-[10px] tracking-widest"
                        >
                            SOURCE NEW ASSETS
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                        {filteredProducts.filter((p: any) => typeof p === 'object' && p !== null).map((product: any, idx: number) => {
                            const profit = (product.resellPrice || 0) - (product.price || 0);

                            return (
                                <div key={product.id} className="group bg-zinc-900 border border-zinc-800 rounded-[3.5rem] overflow-hidden hover:border-zinc-700 transition-all duration-700 shadow-2xl relative">
                                    <div className="absolute inset-0 bg-blue-600/[0.01] pointer-events-none" />
                                    
                                    {/* Asset Header */}
                                    <div className="aspect-[4/3] bg-zinc-950 relative overflow-hidden group-hover:bg-zinc-900 transition-colors duration-700 p-12">
                                        <div className="absolute inset-0 flex items-center justify-center opacity-10 filter grayscale group-hover:scale-110 group-hover:opacity-20 transition-all duration-1000">
                                            <Package className="w-40 h-40 text-zinc-500" />
                                        </div>
                                        
                                        <div className="relative z-10 flex flex-col justify-between h-full">
                                            <div className="flex justify-between items-start">
                                                <div className="px-5 py-2.5 bg-zinc-900/80 backdrop-blur-xl rounded-[1.2rem] border border-zinc-800 flex items-center gap-2.5 shadow-2xl">
                                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                    <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] italic">ONLINE_NODE</span>
                                                </div>
                                                <div className="flex gap-3">
                                                    <button 
                                                        onClick={() => copyToClipboard(`${window.location.origin}/store/${userData?.storeSlug}/product/${product.id}`)}
                                                        className="h-12 w-12 bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:scale-110 transition-all shadow-2xl"
                                                    >
                                                        <Copy className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                <div className="p-4 bg-blue-600/10 backdrop-blur-xl rounded-2xl border border-blue-600/20 inline-flex items-center gap-3">
                                                    <Tag className="w-5 h-5 text-blue-500" />
                                                    <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest italic">{product.category || "UNCLASSIFIED"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Asset Context */}
                                    <div className="p-10 space-y-8">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-black text-white leading-none italic tracking-tighter uppercase group-hover:text-blue-400 transition-colors duration-500">{product.name || "UNIDENTIFIED SOURCE"}</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">IDENTIFIER:</span>
                                                    <span className="text-[10px] font-black text-zinc-400 font-mono tracking-widest">{product.id?.toString().slice(-8).toUpperCase() || idx}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Financial Breakdown */}
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="bg-zinc-950/50 p-6 rounded-[2rem] border border-zinc-800/50 space-y-2 shadow-inner">
                                                <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest leading-none">ACQUISITION</p>
                                                <p className="text-2xl font-black text-white italic tracking-tighter leading-none">{currencySymbol}{product.price?.toLocaleString()}</p>
                                            </div>
                                            <div className="bg-blue-600/10 p-6 rounded-[2rem] border border-blue-600/20 space-y-2 shadow-inner group-hover:bg-blue-600/20 transition-colors">
                                                <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest leading-none">PROJECTED</p>
                                                <p className="text-2xl font-black text-blue-400 italic tracking-tighter leading-none">{currencySymbol}{product.resellPrice?.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        {/* Performance Ledger */}
                                        <div className="p-6 bg-emerald-500/5 rounded-[2.5rem] border border-emerald-500/10 flex items-center justify-between group-hover:border-emerald-500/30 transition-all shadow-inner relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full" />
                                            <div className="flex items-center gap-5 relative">
                                                <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 flex items-center justify-center text-emerald-500 shadow-2xl border border-emerald-500/20">
                                                    <TrendingUp className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black uppercase text-emerald-600 tracking-widest leading-none mb-1">PROFIT_YIELD</p>
                                                    <p className="text-2xl font-black text-emerald-500 leading-none italic tracking-tighter leading-none">{currencySymbol}{profit.toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right relative">
                                                <p className="text-[11px] font-black uppercase text-emerald-600 tracking-widest leading-none mb-1">%_CAP</p>
                                                <p className="font-black text-emerald-500 text-lg leading-none italic tracking-widest">{((profit / product.price) * 100).toFixed(0)}%</p>
                                            </div>
                                        </div>

                                        {/* Deployment Actions */}
                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800/50">
                                            <Button variant="ghost" className="h-16 rounded-[1.5rem] text-zinc-600 font-black uppercase text-[10px] tracking-widest hover:bg-zinc-800 hover:text-white transition-all gap-3 italic">
                                                <Megaphone className="w-5 h-5" /> ADS
                                            </Button>
                                            <Button
                                                className="h-16 rounded-[1.5rem] bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase text-[10px] tracking-widest transition-all gap-3 italic border-b-4 border-zinc-950 active:border-b-0"
                                                onClick={() => window.open(`/store/${userData?.storeSlug}`, '_blank')}
                                            >
                                                <Eye className="w-5 h-5" /> PREVIEW
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

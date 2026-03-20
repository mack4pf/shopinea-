"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    CreditCard,
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    ShieldCheck,
    Loader2,
    Plus,
    CircleCheck,
    AlertCircle,
    Building
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import Link from "next/link";

export default function PaymentsPage() {
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [lastPayout, setLastPayout] = useState(0);
    const [showPayModal, setShowPayModal] = useState(false);

    const getCurrencySymbol = (code: string = "USD") => {
        switch (code) {
            case "EUR": return "€";
            case "GBP": return "£";
            default: return "$";
        }
    };

    const currencySymbol = getCurrencySymbol(userData?.currency);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // Fetch User Data
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        setUserData(userDoc.data());
                    }

                    // Fetch Transactions for last payout
                    const q = query(
                        collection(db, "transactions"),
                        where("userId", "==", user.uid), // Changed from sellerId to userId to match other pages
                        where("type", "==", "withdrawal"),
                        orderBy("createdAt", "desc"),
                        limit(1)
                    );
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        setLastPayout(querySnapshot.docs[0].data().amount || 0);
                    }
                } catch (error) {
                    console.error("Error fetching payments info:", error);
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="h-[80vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    // Determine if user has a payout method linked
    const hasPayoutMethod = userData?.payoutMethod?.accountNumber;

    return (
        <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white leading-tight">Financial Hub</h1>
                    <p className="text-zinc-500 font-bold text-sm">Manage your earnings, payouts, and POD verification.</p>
                </div>
                <Link href="/dashboard/wallet">
                    <Button className="bg-blue-600 hover:bg-blue-700 h-12 px-8 rounded-2xl font-bold shadow-lg shadow-blue-500/20">
                        Go to Wallet
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Wallet Balance Card */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] -mr-40 -mt-40 group-hover:bg-blue-500/20 transition-all duration-700"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Available Payout Balance</p>
                                    <h2 className="text-6xl font-black tracking-tighter">{currencySymbol}{(userData?.payoutBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                                </div>
                                <div className="p-4 bg-zinc-800/50 backdrop-blur-2xl rounded-3xl border border-zinc-700/50">
                                    <Wallet className="w-8 h-8 text-blue-500" />
                                </div>
                            </div>

                            <div className="mt-12 flex flex-wrap gap-4">
                                <div className="px-5 py-2.5 bg-zinc-800/50 backdrop-blur-md rounded-2xl border border-zinc-700/50 flex items-center gap-3">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Payouts Active</span>
                                </div>
                                <div className="px-5 py-2.5 bg-zinc-800/50 backdrop-blur-md rounded-2xl border border-zinc-700/50 flex items-center gap-3">
                                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Escrow Protected</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 flex items-center gap-6 shadow-sm group">
                            <div className="p-4 bg-emerald-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                                <ArrowDownLeft className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Last Withdrawal</p>
                                <h3 className="text-2xl font-black text-white">{currencySymbol}{lastPayout.toLocaleString()}</h3>
                            </div>
                        </div>
                        <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 flex items-center gap-6 shadow-sm group">
                            <div className="p-4 bg-amber-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                                <Building className="w-6 h-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Status</p>
                                <h3 className="text-xl font-black text-emerald-500">Verified Seller</h3>
                            </div>
                        </div>
                    </div>

                    {/* POD Warning Section */}
                    <div className="bg-blue-600/5 p-8 rounded-[2.5rem] border border-blue-600/10">
                        <div className="flex gap-4">
                            <AlertCircle className="w-6 h-6 text-blue-500 shrink-0 mt-1" />
                            <div className="space-y-4">
                                <h3 className="text-lg font-black text-white">POD & Test Payments Guidance</h3>
                                <p className="text-sm text-blue-200/70 leading-relaxed font-bold">
                                    Our platform uses a secure <strong>Refund-Verification</strong> model for Payment on Delivery.
                                    Buyers link their cards for verification, but <strong>sellers must first purchase the product</strong> and then request an immediate refund once the buyer confirms physical receipt. This ensures all funds are tracked and protected.
                                </p>
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6 h-10 font-bold text-xs"
                                    onClick={() => setShowPayModal(true)}
                                >
                                    LEARN MORE PRO
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payout Methods Sidebar */}
                <div className="space-y-6">
                    <h3 className="text-xl font-black text-white">Payout Methods</h3>
                    <div className="space-y-4">
                        {hasPayoutMethod ? (
                            <div className="p-6 bg-zinc-900 rounded-[2rem] border-2 border-blue-600/50 shadow-xl shadow-blue-500/10 flex items-center justify-between group cursor-pointer hover:border-blue-500 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                                        <CreditCard className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="font-black text-white group-hover:text-blue-500 transition-colors uppercase text-xs tracking-wider">
                                            {userData.payoutMethod.bankName}
                                        </p>
                                        <p className="text-[10px] font-bold text-zinc-500 mt-1">
                                            •••• {userData.payoutMethod.accountNumber.slice(-4)}
                                        </p>
                                        <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 mt-2">
                                            <CircleCheck className="w-3 h-3" /> Linked & Verified
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Link href="/dashboard/settings">
                                <button className="w-full p-6 border-2 border-dashed border-zinc-800 rounded-[2rem] text-xs font-black text-zinc-500 hover:text-blue-500 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all flex items-center justify-center gap-3">
                                    <Plus className="w-5 h-5" />
                                    LINK NEW METHOD
                                </button>
                            </Link>
                        )}
                    </div>

                    <div className="p-8 bg-zinc-900 rounded-[2.5rem] border border-zinc-800 space-y-4">
                        <h4 className="font-black text-[10px] uppercase tracking-widest text-zinc-500">Escrow Security</h4>
                        <p className="text-[11px] text-zinc-400 leading-relaxed font-bold">
                            All seller funds are held in a secure Stripe-powered escrow. Payouts are automated every Friday for the previous week's confirmed deliveries.
                        </p>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={showPayModal}
                onClose={() => setShowPayModal(false)}
                title="Secure POD Process"
            >
                <div className="space-y-6 text-sm text-zinc-400">
                    <p>To ensure security for both parties in Payment on Delivery transactions:</p>
                    <ol className="list-decimal pl-5 space-y-4 font-bold">
                        <li><strong>Buyer Confirmation:</strong> Buyer links a card to authorize the POD order.</li>
                        <li><strong>Seller Activation:</strong> Seller purchases the product from the supplier to initiate shipping.</li>
                        <li><strong>Delivery:</strong> Once the product arrives, the buyer confirms receipt on the app.</li>
                        <li><strong>Immediate Refund:</strong> The seller requests a refund of their initial purchase, and the platform transfers the buyer's payment to the seller's wallet.</li>
                    </ol>
                    <Button onClick={() => setShowPayModal(false)} className="w-full h-12 rounded-xl bg-blue-600 font-black mt-4">I UNDERSTAND</Button>
                </div>
            </Modal>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    Package,
    Truck,
    CheckCircle2,
    Clock,
    ArrowLeft,
    Search,
    ShoppingBag,
    Loader2,
    History,
    ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default function BuyerOrdersPage() {
    const [user, setUser] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);

                // Fetch orders for this buyer
                const q = query(
                    collection(db, "orders"),
                    where("customerId", "==", firebaseUser.uid),
                    orderBy("createdAt", "desc")
                );

                const unsubscribeOrders = onSnapshot(q, (snapshot) => {
                    const ordersData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setOrders(ordersData);
                    setLoading(false);
                });

                return () => unsubscribeOrders();
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'shipped': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'awaiting_admin_confirmation': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'awaiting_seller_fulfillment': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
        }
    };

    const getStepStatus = (orderStatus: string) => {
        const steps = [
            { id: 1, label: 'Order Placed', active: true },
            { id: 2, label: 'Processing', active: ['paid_to_site', 'awaiting_seller_fulfillment', 'shipped', 'completed'].includes(orderStatus) },
            { id: 3, label: 'In Transit', active: ['shipped', 'completed'].includes(orderStatus) },
            { id: 4, label: 'Delivered', active: ['completed'].includes(orderStatus) }
        ];
        return steps;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950 p-6 text-center">
                <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-[2.5rem] flex items-center justify-center mb-6">
                    <Package className="w-10 h-10 text-zinc-400" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">Access Denied</h1>
                <p className="text-gray-500 mt-2">Please login as a buyer to view your order history.</p>
                <Button className="mt-8 rounded-2xl bg-blue-600 font-bold px-8 h-12" onClick={() => window.history.back()}>
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-6 md:p-12">
            <div className="container mx-auto max-w-5xl space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-3">
                        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-blue-500 font-bold text-xs uppercase tracking-widest transition-colors mb-2">
                            <ArrowLeft className="w-4 h-4" />
                            Return to Shopping
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">My Orders</h1>
                        <p className="text-zinc-500 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                            <History className="w-4 h-4" />
                            Live Transaction Tracking
                        </p>
                    </div>
                </div>

                {/* Orders List */}
                <div className="space-y-6">
                    {orders.length === 0 ? (
                        <div className="bg-white dark:bg-zinc-900 rounded-[3rem] p-16 text-center border border-gray-100 dark:border-zinc-800">
                            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                <ShoppingBag className="w-10 h-10 text-blue-500" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">No Orders Found</h2>
                            <p className="text-zinc-500 font-medium mt-2">Ready to make your first purchase? Head back to a storefront!</p>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <div key={order.id} className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-gray-100 dark:border-zinc-800 overflow-hidden shadow-xl shadow-black/5 hover:border-blue-500/30 transition-all group">
                                <div className="p-8 md:p-10 space-y-8">
                                    {/* Order Top Bar */}
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex flex-row items-center gap-4">
                                            {order.productImage ? (
                                                <div className="w-16 h-16 rounded-xl overflow-hidden relative border border-gray-100 dark:border-zinc-800 shrink-0">
                                                    <Image src={order.productImage} alt={order.productName} fill className="object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-gray-100 dark:border-zinc-800">
                                                    <ShoppingBag className="w-6 h-6 text-gray-400 dark:text-zinc-600" />
                                                </div>
                                            )}
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Order #{order.id.slice(-8).toUpperCase()}</p>
                                                <h3 className="text-xl font-black text-gray-900 dark:text-white">{order.productName}</h3>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest ${getStatusStyles(order.status)}`}>
                                            {order.status.replace(/_/g, ' ')}
                                        </div>
                                    </div>

                                    {/* Tracking Steps */}
                                    <div className="flex justify-between items-start relative pt-12">
                                        <div className="absolute top-[60px] left-0 right-0 h-1 bg-gray-100 dark:bg-zinc-800 -z-0 rounded-full" />
                                        {getStepStatus(order.status).map((step) => (
                                            <div key={step.id} className="flex flex-col items-center gap-4 relative z-10 w-1/4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${step.active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50 scale-110' : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'}`}>
                                                    {step.active ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                                                </div>
                                                <span className={`text-[10px] font-black uppercase tracking-widest text-center ${step.active ? 'text-blue-500' : 'text-zinc-500'}`}>
                                                    {step.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Order Details Footer */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 pt-8 border-t border-gray-100 dark:border-zinc-800 mt-8">
                                        <div>
                                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Paid</p>
                                            <p className="text-lg font-black text-gray-900 dark:text-white">${order.resellPrice?.toLocaleString() || '0'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Payment</p>
                                            <p className="text-xs font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-tight">{order.paymentType || 'Card'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Carrier</p>
                                            <p className="text-xs font-bold text-gray-600 dark:text-zinc-400">UPS Express</p>
                                        </div>
                                        <div className="flex justify-end items-end">
                                            <Button variant="ghost" className="rounded-xl font-black text-[10px] uppercase gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                                Track Shipment
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <footer className="container mx-auto max-w-5xl py-12 text-center">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Restock Global Supply Chain Protocol &copy; 2026</p>
            </footer>
        </div>
    );
}

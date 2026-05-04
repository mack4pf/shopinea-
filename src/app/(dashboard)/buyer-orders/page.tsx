"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    Package,
    CheckCircle2,
    ArrowLeft,
    ShoppingBag,
    Loader2,
    History,
    MapPin,
    Clock,
    Truck,
    ExternalLink
} from "lucide-react";
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
            case 'completed': return { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', label: 'Delivered' };
            case 'shipped': return { badge: 'bg-blue-500/15 text-blue-400 border-blue-500/20', label: 'In Transit' };
            case 'paid_to_site':
            case 'awaiting_admin_confirmation': return { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20', label: 'Processing' };
            case 'awaiting_seller_fulfillment': return { badge: 'bg-violet-500/15 text-violet-400 border-violet-500/20', label: 'Preparing' };
            default: return { badge: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20', label: 'Pending' };
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
            <div className="h-[80vh] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-white/[0.04] border border-white/[0.08] rounded-2xl flex items-center justify-center mb-5">
                    <Package className="w-8 h-8 text-zinc-600" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Sign In Required</h2>
                <p className="text-sm text-zinc-500 mb-6">Please log in to view your order history.</p>
                <Link href="/login" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                    Log In
                </Link>
            </div>
        );
    }

    const filteredOrders = orders.filter(o =>
        o.productName?.toLowerCase().includes(searchQuery?.toLowerCase() || '') ||
        o.id.toLowerCase().includes(searchQuery?.toLowerCase() || '')
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/marketplace" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back to Shopping
                        </Link>
                    </div>
                    <h1 className="text-2xl font-bold text-white">My Orders</h1>
                    <p className="text-sm text-zinc-500 mt-1">Track all your purchases in one place.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-center">
                        <p className="text-xs text-zinc-500">Total Orders</p>
                        <p className="text-lg font-bold text-white">{orders.length}</p>
                    </div>
                </div>
            </div>

            {/* Orders */}
            {filteredOrders.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] rounded-xl border border-dashed border-white/[0.08]">
                    <ShoppingBag className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-white mb-2">No orders yet</h2>
                    <p className="text-sm text-zinc-500 mb-6">Orders you place from any store will appear here.</p>
                    <Link href="/marketplace" className="px-5 py-2.5 text-sm font-medium rounded-lg bg-white/[0.06] border border-white/[0.08] text-zinc-300 hover:bg-white/[0.1] transition-colors">
                        Browse Marketplace
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((order) => {
                        const { badge, label } = getStatusStyles(order.status);
                        const steps = getStepStatus(order.status);
                        const activeStep = steps.filter(s => s.active).length;

                        return (
                            <div key={order.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/[0.12] transition-all">
                                {/* Top */}
                                <div className="p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b border-white/[0.05]">
                                    <div className="flex items-center gap-4">
                                        {order.productImage ? (
                                            <div className="w-14 h-14 rounded-xl overflow-hidden relative shrink-0 border border-white/[0.08]">
                                                <Image src={order.productImage} alt={order.productName || 'Product'} fill className="object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-14 h-14 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0 border border-white/[0.06]">
                                                <ShoppingBag className="w-6 h-6 text-zinc-600" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-xs text-zinc-500 mb-0.5">Order #{order.id.slice(-8).toUpperCase()}</p>
                                            <h3 className="text-sm font-semibold text-white">{order.productName || 'Product'}</h3>
                                            <p className="text-xs text-zinc-600 mt-0.5">
                                                {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-xs text-zinc-500">Total</p>
                                            <p className="text-base font-bold text-white">${order.resellPrice?.toLocaleString() || '0'}</p>
                                        </div>
                                        <span className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${badge}`}>
                                            {label}
                                        </span>
                                    </div>
                                </div>

                                {/* Progress Tracker */}
                                <div className="px-5 py-4">
                                    <div className="flex items-center justify-between relative">
                                        {/* Progress line */}
                                        <div className="absolute top-4 left-4 right-4 h-0.5 bg-white/[0.06]">
                                            <div
                                                className="h-full bg-blue-500/60 transition-all duration-500"
                                                style={{ width: `${((activeStep - 1) / (steps.length - 1)) * 100}%` }}
                                            />
                                        </div>

                                        {steps.map((step) => (
                                            <div key={step.id} className="flex flex-col items-center gap-2 relative z-10">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                                    step.active
                                                        ? 'bg-blue-600 shadow-lg shadow-blue-500/30'
                                                        : 'bg-white/[0.05] border border-white/[0.08]'
                                                }`}>
                                                    {step.active ? (
                                                        <CheckCircle2 className="w-4 h-4 text-white" />
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-zinc-600">{step.id}</span>
                                                    )}
                                                </div>
                                                <span className={`text-[10px] font-medium text-center whitespace-nowrap ${
                                                    step.active ? 'text-blue-400' : 'text-zinc-600'
                                                }`}>
                                                    {step.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Details footer */}
                                <div className="px-5 py-3 bg-white/[0.02] border-t border-white/[0.04] flex flex-wrap gap-6">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5 text-zinc-600" />
                                        <span className="text-xs text-zinc-500">Payment: <span className="text-zinc-300">{order.paymentType || 'Online'}</span></span>
                                    </div>
                                    {order.shippingAddress && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-3.5 h-3.5 text-zinc-600" />
                                            <span className="text-xs text-zinc-500 truncate max-w-[200px]">{order.shippingAddress}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Truck className="w-3.5 h-3.5 text-zinc-600" />
                                        <span className="text-xs text-zinc-500">Carrier: <span className="text-zinc-300">Standard Shipping</span></span>
                                    </div>
                                    <button className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors ml-auto">
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        Track Shipment
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

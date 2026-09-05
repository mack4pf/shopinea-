"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, query, where, orderBy, getDocs, limit, doc, getDoc, updateDoc, increment, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    ShoppingCart, Search, Clock, CheckCircle2, Loader2, User,
    CreditCard, ShieldCheck, PackageCheck, Truck, Lock, AlertCircle
} from "lucide-react";

const safeText = (value: unknown) => String(value || "");
const safeAmount = (value: unknown) => {
    const next = Number(value || 0);
    return Number.isFinite(next) ? next : 0;
};

export default function OrdersPage() {
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const getCurrencySymbol = (code: string = "USD") => {
        switch (code) {
            case "EUR": return "€";
            case "GBP": return "£";
            default: return "$";
        }
    };

    const currencySymbol = getCurrencySymbol(userData?.currency);

    const fetchOrders = async (uid: string) => {
        try {
            const ordersQuery = query(
                collection(db, "orders"),
                where("resellerId", "==", uid),
                orderBy("createdAt", "desc"),
                limit(50)
            );
            const ordersSnap = await getDocs(ordersQuery);
            setOrders(ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (err) {
            console.error("Error fetching orders:", err);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                if (userDoc.exists()) setUserData(userDoc.data());
                await fetchOrders(firebaseUser.uid);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handlePaySupplierForPod = async (order: any) => {
        const initialPrice = safeAmount(order.initialPrice);
        const resellerProfit = safeAmount(order.resellerProfit);
        const orderId = safeText(order.id);
        if (!userData || safeAmount(userData.walletBalance) < initialPrice) {
            alert(`Insufficient balance. You need at least ${currencySymbol}${initialPrice} to process this order.`);
            return;
        }

        setProcessingId(order.id);
        try {
            const userRef = doc(db, "users", user.uid);
            const orderRef = doc(db, "orders", order.id);

            await updateDoc(userRef, {
                walletBalance: increment(-initialPrice),
                pendingPayout: increment(resellerProfit)
            });

            await updateDoc(orderRef, {
                status: "shipped",
                fulfilledAt: serverTimestamp()
            });

            await addDoc(collection(db, "transactions"), {
                userId: user.uid, type: "purchase", amount: initialPrice,
                referenceId: order.id, description: `Supplier cost for Order #${orderId.slice(0, 8)}`,
                status: "completed", createdAt: serverTimestamp()
            });

            await addDoc(collection(db, "transactions"), {
                userId: user.uid, type: "earning", amount: resellerProfit,
                referenceId: order.id, description: `Profit locked for Order #${orderId.slice(0, 8)} — awaiting delivery`,
                status: "pending", createdAt: serverTimestamp()
            });

            await addDoc(collection(db, "notifications"), {
                userId: user.uid, type: "order_shipped", title: "Order Shipped",
                message: `Profit of ${currencySymbol}${resellerProfit} for order #${orderId.slice(0, 8)} is locked until delivery is confirmed.`,
                createdAt: serverTimestamp()
            });

            await fetchOrders(user.uid);
            const updatedUser = await getDoc(userRef);
            setUserData(updatedUser.data());
        } catch (err) {
            console.error(err);
        } finally {
            setProcessingId(null);
        }
    };

    const filteredOrders = orders.filter(o => {
        const matchesSearch = (o.customerName || "").toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
            (o.id || "").toString().toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' ||
            o.status === statusFilter ||
            (statusFilter === 'pending_payment' && ['pending_payment', 'payment_pending', 'awaiting_admin_confirmation'].includes(o.status));
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'delivered': return 'bg-emerald-500/10 text-emerald-400';
            case 'shipped': return 'bg-blue-500/10 text-blue-400';
            case 'paid_to_site': return 'bg-violet-500/10 text-violet-400';
            case 'pending_payment':
            case 'payment_pending':
            case 'awaiting_admin_confirmation': return 'bg-amber-500/10 text-amber-400';
            case 'payment_failed':
            case 'void_no_payment':
            case 'cancelled': return 'bg-rose-500/10 text-rose-400';
            default: return 'bg-zinc-500/10 text-zinc-400';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending_payment':
            case 'payment_pending':
            case 'awaiting_admin_confirmation': return 'Pending payment';
            case 'void_no_payment': return 'Void - no payment';
            case 'payment_failed': return 'Payment failed';
            case 'paid_to_site': return 'Processing';
            case 'awaiting_seller_fulfillment': return 'Processing';
            case 'shipped': return 'Shipped';
            case 'delivered': return 'Delivered';
            default: return (status || "pending").replace(/_/g, ' ');
        }
    };

    if (loading) return (
        <div className="h-[80vh] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
    );

    const statusTabs = [
        { key: 'all', label: 'All' },
        { key: 'pending_payment', label: 'Pending Pay' },
        { key: 'paid_to_site', label: 'Processing' },
        { key: 'shipped', label: 'Shipped' },
        { key: 'delivered', label: 'Delivered' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Orders</h1>
                    <p className="text-sm text-zinc-500 mt-1">Track and manage your sales. Profits are released on delivery.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-zinc-500">Pending</p>
                        <p className="text-lg font-semibold text-amber-400">{currencySymbol}{(userData?.pendingPayout || 0).toLocaleString()}</p>
                    </div>
                    <div className="w-px h-10 bg-white/[0.06]" />
                    <div className="text-right">
                        <p className="text-xs text-zinc-500">Released</p>
                        <p className="text-lg font-semibold text-emerald-400">{currencySymbol}{(userData?.payoutBalance || 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Info banner */}
            <div className="flex items-center gap-3 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                <Lock className="w-4 h-4 text-blue-400 shrink-0" />
                <p className="text-sm text-zinc-400">When buyers pay, your profit is held securely until delivery is confirmed.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                        placeholder="Search orders..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/40 transition-colors"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-lg p-1">
                    {statusTabs.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setStatusFilter(key)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                statusFilter === key
                                    ? 'bg-white/[0.1] text-white'
                                    : 'text-zinc-600 hover:text-zinc-300'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
                {filteredOrders.length === 0 ? (
                    <div className="py-16 text-center">
                        <ShoppingCart className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                        <p className="text-sm font-medium text-zinc-400">No orders found</p>
                        <p className="text-xs text-zinc-600 mt-1">Orders will appear here when customers purchase from your store.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/[0.06] text-xs font-medium text-zinc-500">
                                    <th className="py-3 px-5">Order</th>
                                    <th className="py-3 px-4">Total</th>
                                    <th className="py-3 px-4">Profit</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {filteredOrders.map((order, index) => {
                                    const orderId = (order.id || `order-${index}`).toString();
                                    const status = safeText(order.status || "pending");
                                    return (
                                    <tr key={orderId} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="py-4 px-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                                                    {order.isPod ? <Truck className="w-4 h-4 text-zinc-500" /> :
                                                        <CreditCard className="w-4 h-4 text-emerald-500" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">#{orderId.slice(0, 8)}</p>
                                                    <p className="text-xs text-zinc-600">{safeText(order.customerName || 'Customer')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <p className="text-sm font-medium text-white">{currencySymbol}{safeAmount(order.resellPrice).toLocaleString()}</p>
                                            <p className="text-[11px] text-zinc-600">{order.isPod ? 'Pay on delivery' : 'Paid'}</p>
                                        </td>
                                        <td className="py-4 px-4">
                                            <p className="text-sm font-medium text-emerald-400">{currencySymbol}{safeAmount(order.resellerProfit).toLocaleString()}</p>
                                            <p className="text-[11px] text-zinc-600">
                                                {status === 'delivered' ? 'Released' :
                                                    status === 'shipped' ? 'Locked' : 'Pending'}
                                            </p>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium ${getStatusBadge(status)}`}>
                                                {getStatusLabel(status)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-5 text-right">
                                            {['pending_payment', 'payment_pending', 'awaiting_admin_confirmation'].includes(status) && (
                                                <span className="text-xs text-amber-400 flex items-center justify-end gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" /> Pending payment
                                                </span>
                                            )}
                                            {order.status === 'paid_to_site' && !order.isPod && (
                                                <span className="text-xs text-blue-400 flex items-center justify-end gap-1.5">
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing
                                                </span>
                                            )}
                                            {order.status === 'paid_to_site' && order.isPod && (
                                                <button
                                                    onClick={() => handlePaySupplierForPod(order)}
                                                    disabled={processingId === order.id}
                                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    {processingId === order.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Ship Order'}
                                                </button>
                                            )}
                                            {order.status === 'shipped' && (
                                                <span className="text-xs text-blue-400 flex items-center justify-end gap-1.5">
                                                    <Lock className="w-3.5 h-3.5" /> In transit
                                                </span>
                                            )}
                                            {order.status === 'delivered' && (
                                                <span className="text-xs text-emerald-400 flex items-center justify-end gap-1.5">
                                                    <PackageCheck className="w-3.5 h-3.5" /> Complete
                                                </span>
                                            )}
                                            {['payment_failed', 'void_no_payment', 'cancelled'].includes(order.status) && (
                                                <span className="text-xs text-rose-400 flex items-center justify-end gap-1.5">
                                                    <AlertCircle className="w-3.5 h-3.5" /> Voided
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/10', title: 'Instant Payment', desc: 'Buyer pays upfront. Profit is held until delivery.' },
                    { icon: Truck, color: 'text-blue-400', bg: 'bg-blue-500/10', title: 'Pay on Delivery', desc: 'Supplier cost is paid from your wallet when you ship.' },
                    { icon: ShieldCheck, color: 'text-violet-400', bg: 'bg-violet-500/10', title: 'Secure Settlement', desc: 'Profits are released to your balance after delivery confirmation.' },
                ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                        <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center shrink-0`}>
                            <item.icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-300">{item.title}</p>
                            <p className="text-xs text-zinc-600 mt-0.5">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

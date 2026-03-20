"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, query, where, orderBy, getDocs, limit, doc, getDoc, updateDoc, increment, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    ShoppingCart,
    Search,
    Clock,
    CheckCircle2,
    Loader2,
    User,
    CreditCard,
    ShieldCheck,
    PackageCheck,
    Truck,
    Lock,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                }
                await fetchOrders(firebaseUser.uid);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    /**
     * POD (Pay on Delivery) orders: reseller needs to pay the supplier cost
     * from their wallet so the product can be shipped. Profit goes to pendingPayout (locked).
     */
    const handlePaySupplierForPod = async (order: any) => {
        if (!userData || (userData.walletBalance || 0) < order.initialPrice) {
            alert(`Insufficient wallet balance. Please deposit at least ${currencySymbol}${order.initialPrice} to continue this transaction.`);
            return;
        }

        setProcessingId(order.id);
        try {
            const userRef = doc(db, "users", user.uid);
            const orderRef = doc(db, "orders", order.id);

            // Deduct supplier cost, lock profit until buyer receives goods
            await updateDoc(userRef, {
                walletBalance: increment(-order.initialPrice),
                pendingPayout: increment(order.resellerProfit)
            });

            // Update order to shipped — admin must confirm delivery to release profit
            await updateDoc(orderRef, {
                status: "shipped",
                fulfilledAt: serverTimestamp()
            });

            // Transaction: supplier cost deducted
            await addDoc(collection(db, "transactions"), {
                userId: user.uid,
                type: "purchase",
                amount: order.initialPrice,
                referenceId: order.id,
                description: `Supplier cost for Order #${order.id.slice(0, 8)}`,
                status: "completed",
                createdAt: serverTimestamp()
            });

            // Transaction: profit is locked, pending admin release
            await addDoc(collection(db, "transactions"), {
                userId: user.uid,
                type: "earning",
                amount: order.resellerProfit,
                referenceId: order.id,
                description: `Profit locked for Order #${order.id.slice(0, 8)} — awaiting delivery confirmation`,
                status: "pending",
                createdAt: serverTimestamp()
            });

            await addDoc(collection(db, "notifications"), {
                userId: user.uid,
                type: "order_shipped",
                title: "Order Shipped — Profit Locked",
                message: `Your profit of ${currencySymbol}${order.resellerProfit} for order #${order.id.slice(0, 8)} is locked until the buyer confirms receipt.`,
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
        const matchesSearch = o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'delivered':
                return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
            case 'shipped':
                return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
            case 'paid_to_site':
                return 'bg-violet-500/10 border-violet-500/20 text-violet-400';
            case 'awaiting_admin_confirmation':
                return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
            default:
                return 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'awaiting_admin_confirmation': return 'Awaiting Payment Confirm';
            case 'paid_to_site': return 'Payment Verified';
            case 'shipped': return 'Shipped — In Transit';
            case 'delivered': return 'Delivered';
            default: return status.replace(/_/g, ' ');
        }
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-24">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <ShoppingCart className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400">Order Management</span>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter italic leading-none">Order Pipeline</h1>
                    <p className="text-zinc-500 font-extrabold text-sm uppercase tracking-widest opacity-80">
                        Track your global fulfillment. Profits are released upon delivery confirmation.
                    </p>
                </div>
                
                <div className="flex items-center gap-6 bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-600/5 blur-3xl rounded-full scale-150 group-hover:bg-blue-600/10 transition-colors" />
                    <div className="relative">
                        <p className="text-[10px] font-black uppercase text-zinc-600 mb-2 tracking-[0.2em] pl-1">Locked Funds</p>
                        <p className="text-3xl font-black text-amber-500 italic tracking-tighter">{currencySymbol}{(userData?.pendingPayout || 0).toLocaleString()}</p>
                    </div>
                    <div className="w-px h-12 bg-zinc-800 relative" />
                    <div className="relative">
                        <p className="text-[10px] font-black uppercase text-zinc-600 mb-2 tracking-[0.2em] pl-1">Settled Profits</p>
                        <p className="text-3xl font-black text-emerald-500 italic tracking-tighter">{currencySymbol}{(userData?.payoutBalance || 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Escrow Intelligence Banner */}
            <div className="flex items-start gap-6 p-8 bg-zinc-950 border border-zinc-800 rounded-[2.5rem] relative overflow-hidden group">
                <div className="absolute inset-0 bg-blue-600/0 dark:group-hover:bg-blue-600/5 transition-all duration-500" />
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0 relative">
                    <Lock className="w-7 h-7 text-blue-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="space-y-2 relative">
                    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Escrow Protocol Active</h3>
                    <p className="text-sm text-zinc-500 font-extrabold leading-relaxed uppercase tracking-wider opacity-60">
                        When a buyer pays instantly, your profit is automatically locked in escrow. Funds are released to your Available balance once admin confirms the buyer has received their physical order.
                    </p>
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-4">
                {[
                    { key: 'all', label: 'All Operations' },
                    { key: 'awaiting_admin_confirmation', label: 'Pending Verification' },
                    { key: 'paid_to_site', label: 'Verified Orders' },
                    { key: 'shipped', label: 'In Transit' },
                    { key: 'delivered', label: 'Settled' },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setStatusFilter(key)}
                        className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] transition-all border italic ${statusFilter === key
                            ? 'bg-white border-white text-zinc-950 shadow-2xl shadow-white/5'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-600 hover:text-white hover:border-zinc-700'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Orders Intelligence Grid */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-[3.5rem] overflow-hidden shadow-2xl">
                <div className="p-10 border-b border-zinc-800 bg-zinc-950/20 backdrop-blur-3xl flex items-center justify-between">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                        <Input
                            placeholder="QUERY BLOCKCHAIN RECORD..."
                            className="pl-16 bg-zinc-950/50 border-zinc-800 rounded-2xl h-16 text-[11px] font-black tracking-widest uppercase focus:border-blue-500 transition-all shadow-inner"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">{filteredOrders.length} ENTRIES FOUND</p>
                    </div>
                </div>

                {filteredOrders.length === 0 ? (
                    <div className="py-32 text-center space-y-8">
                        <div className="w-24 h-24 bg-zinc-950 rounded-[2rem] flex items-center justify-center mx-auto border border-zinc-800 shadow-2xl">
                            <ShoppingCart className="w-10 h-10 text-zinc-800" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">No Records Tracked</h3>
                            <p className="text-zinc-600 font-extrabold text-[11px] uppercase tracking-widest">Transactions from your storefront will spawn here</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-zinc-950/30 border-b border-zinc-800 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
                                    <th className="py-8 px-10">Asset / Signature</th>
                                    <th className="py-8 px-8">Transaction Value</th>
                                    <th className="py-8 px-8">Earnings Yield</th>
                                    <th className="py-8 px-8">Process Status</th>
                                    <th className="py-8 px-10 text-right">Escrow Link</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/30 font-black">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-zinc-800/30 transition-all group">
                                        {/* Order Details */}
                                        <td className="py-10 px-10">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 rounded-2xl bg-zinc-950 flex items-center justify-center border border-zinc-800 group-hover:border-blue-500 group-hover:bg-blue-600/10 transition-all shadow-xl">
                                                    {order.paymentType === 'crypto' ? <ShieldCheck className="w-7 h-7 text-blue-500" /> :
                                                        order.isPod ? <Truck className="w-7 h-7 text-zinc-500" /> :
                                                            <CreditCard className="w-7 h-7 text-emerald-500" />}
                                                </div>
                                                <div>
                                                    <p className="text-base font-black text-white italic tracking-tighter mb-1 uppercase leading-none">#{order.id.slice(0, 8)}</p>
                                                    <div className="flex items-center gap-2 text-[11px] font-black text-zinc-500 uppercase tracking-widest">
                                                        <User className="w-3.5 h-3.5" /> <span className="opacity-70 group-hover:opacity-100 transition-opacity">{order.customerName}</span>
                                                    </div>
                                                    {order.productName && (
                                                        <p className="text-[10px] text-zinc-700 mt-1 uppercase tracking-tighter truncate max-w-[200px] italic">{order.productName}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Transaction Value */}
                                        <td className="py-10 px-8">
                                            <p className="text-xl font-black text-white italic tracking-tighter">{currencySymbol}{order.resellPrice?.toLocaleString()}</p>
                                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mt-2">
                                                {order.isPod ? 'POST-DELIVERY' : 'INSTANT SETTLEMENT'}
                                            </p>
                                        </td>

                                        {/* Earnings Yield */}
                                        <td className="py-10 px-8">
                                            <p className="text-xl font-black text-emerald-400 italic tracking-tighter">{currencySymbol}{order.resellerProfit?.toLocaleString()}</p>
                                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mt-2 italic shadow-[0_0_20px_rgba(16,185,129,0.05)]">
                                                {order.status === 'delivered' ? 'RELEASED' :
                                                    order.status === 'shipped' ? '🔒 SECURED' : 'PENDING'}
                                            </p>
                                        </td>

                                        {/* Status */}
                                        <td className="py-10 px-8">
                                            <span className={`px-5 py-2.5 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] italic block w-fit shadow-xl ${getStatusBadge(order.status)}`}>
                                                {getStatusLabel(order.status)}
                                            </span>
                                        </td>

                                        {/* Action / Escrow Status */}
                                        <td className="py-10 px-10 text-right">
                                            {order.status === 'awaiting_admin_confirmation' && (
                                                <div className="flex items-center justify-end gap-3 text-amber-500 text-[11px] font-black uppercase tracking-widest italic">
                                                    <Clock className="w-5 h-5 animate-pulse" /> VERIFYING PAYMENT...
                                                </div>
                                            )}

                                            {order.status === 'paid_to_site' && !order.isPod && (
                                                <div className="flex items-center justify-end gap-3 text-blue-400 text-[11px] font-black uppercase tracking-widest italic">
                                                    <Loader2 className="w-5 h-5 animate-spin" /> DISPATCHING ASSETS
                                                </div>
                                            )}

                                            {(order.status === 'paid_to_site') && order.isPod && (
                                                <Button
                                                    onClick={() => handlePaySupplierForPod(order)}
                                                    disabled={processingId === order.id}
                                                    size="sm"
                                                    className="h-14 px-10 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-2xl shadow-emerald-600/20 hover:scale-105 transition-all active:scale-95 italic"
                                                >
                                                    {processingId === order.id
                                                        ? <Loader2 className="w-5 h-5 animate-spin" />
                                                        : 'AUTHORIZE SHIPMENT 🚀'
                                                    }
                                                </Button>
                                            )}

                                            {order.status === 'shipped' && (
                                                <div className="flex items-center justify-end gap-3 text-blue-500 text-[11px] font-black uppercase tracking-widest italic">
                                                    <Lock className="w-5 h-5" /> ESCROW SECURED
                                                </div>
                                            )}

                                            {order.status === 'delivered' && (
                                                <div className="text-[11px] font-black text-emerald-500 uppercase flex items-center justify-end gap-3 tracking-widest italic pr-2">
                                                    <PackageCheck className="w-5 h-5" /> SETTLEMENT COMPLETE
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Tactical Protocol Legend */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/10', title: 'INSTANT PAY', desc: 'Secure direct payment. Profit is immediately moved into autonomous escrow.' },
                    { icon: Truck, color: 'text-blue-400', bg: 'bg-blue-500/10', title: 'PAY ON DELIVERY', desc: 'Fulfillment requires manual authorization and supplier settlement.' },
                    { icon: ShieldCheck, color: 'text-violet-400', bg: 'bg-violet-500/10', title: 'PROTOCOL SETTLEMENT', desc: 'Profits are released to liquid balance upon delivery verification.' },
                ].map((item, i) => (
                    <div key={i} className="flex items-start gap-5 p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl hover:bg-zinc-800/50 transition-colors group">
                        <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center border border-zinc-800 shrink-0 group-hover:scale-110 transition-transform`}>
                            <item.icon className={`w-7 h-7 ${item.color}`} />
                        </div>
                        <div className="space-y-2">
                            <p className="text-[11px] font-black text-white uppercase tracking-widest">{item.title}</p>
                            <p className="text-[11px] text-zinc-600 font-extrabold uppercase tracking-widest leading-relaxed opacity-80">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

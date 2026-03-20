"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { addDoc, collection, serverTimestamp, doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { Loader2, User, Lock, Mail, CreditCard, Truck, ShieldCheck, CheckCircle2, Clock as HistoryIcon } from "lucide-react";
import Link from "next/link";

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
    storeUser: any;
}

export default function CheckoutModal({ isOpen, onClose, product, storeUser }: CheckoutModalProps) {
    const [step, setStep] = useState(1); // 0: Auth (if needed), 1: Delivery info, 2: Payment options, 3: Payment details, 4: Verifying, 5: Success
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"paypal" | "crypto" | "pod" | null>(null);
    const [user, setUser] = useState<any>(null);
    const [authMode, setAuthMode] = useState<"login" | "register">("register");
    const [authData, setAuthData] = useState({ email: "", password: "" });

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setLoading(false);
            setVerifying(false);
            setPaymentMethod(null);

            const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
                if (firebaseUser) {
                    setUser(firebaseUser);
                    setStep(1); // Go straight to delivery
                    // Auto-fill from user record if possible
                    fetchBuyerData(firebaseUser.uid);
                } else {
                    setStep(0); // Require auth
                }
            });
            return () => unsubscribe();
        }
    }, [isOpen]);

    const fetchBuyerData = async (uid: string) => {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            setFormData(prev => ({
                ...prev,
                name: data.displayName || "",
                email: data.email || "",
                phone: data.phoneNumber || "",
                address: data.address || "",
                city: data.city || "",
                zip: data.zipCode || ""
            }));
        }
    };

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        zip: "",
        city: "",
        cardNumber: "",
        expiry: "",
        cvv: ""
    });

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (authMode === "register") {
                const res = await createUserWithEmailAndPassword(auth, authData.email, authData.password);
                await setDoc(doc(db, "users", res.user.uid), {
                    email: authData.email,
                    role: "buyer",
                    createdAt: serverTimestamp()
                });
            } else {
                await signInWithEmailAndPassword(auth, authData.email, authData.password);
            }
            // State will update via listener
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => setStep(step + 1);

    const handleSubmit = async () => {
        setLoading(true);
        setVerifying(true);

        // Simulate "Sharp" payment verification
        await new Promise(r => setTimeout(r, 2500));

        try {
            const orderData = {
                productId: product.id,
                productName: product.name,
                category: product.category || "General",
                initialPrice: product.price,
                resellPrice: paymentMethod === "crypto" ? product.resellPrice * 0.95 : product.resellPrice,
                resellerProfit: product.resellPrice - product.price,
                resellerId: storeUser.uid,
                customerId: user?.uid || "guest",
                customerName: formData.name,
                customerEmail: formData.email,
                customerPhone: formData.phone,
                customerAddress: `${formData.address}, ${formData.city}, ${formData.zip}`,
                deliveryService: "UPS",
                paymentType: paymentMethod,
                isPod: paymentMethod === "pod",
                status: paymentMethod === "pod" ? "awaiting_seller_fulfillment" : "awaiting_admin_confirmation",
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, "orders"), orderData);

            // Update Analytics for Reseller
            const resellerRef = doc(db, "users", storeUser.uid);
            await updateDoc(resellerRef, {
                "stats.sales": increment(1),
                "stats.revenue": increment(orderData.resellPrice),
                pendingPayout: increment(orderData.resellerProfit) // Initially locked
            });

            // Send Notification Email (simulated via Firestore collection)
            await addDoc(collection(db, "notifications"), {
                userId: storeUser.uid,
                type: "new_order",
                title: "New Order Received!",
                message: `A customer (${formData.name}) just purchased ${product.name} for $${orderData.resellPrice.toLocaleString()}.`,
                emailType: "order_confirmation",
                recipientEmail: storeUser.email,
                createdAt: serverTimestamp()
            });

            setStep(5);
        } catch (error) {
            console.error("Error creating order:", error);
            alert("Order failed. Please try again.");
        } finally {
            setLoading(false);
            setVerifying(false);
        }
    };

    if (verifying) {
        return (
            <Modal isOpen={isOpen} onClose={() => { }} title="Securing Payment">
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
                    <div className="relative">
                        <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                        <ShieldCheck className="w-6 h-6 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-white">Verifying Transaction</h3>
                        <p className="text-sm text-zinc-500 font-bold max-w-[260px]">
                            Establishing connection to {paymentMethod === 'crypto' ? 'Blockchain' : 'Banking Gateway'} for secure release...
                        </p>
                    </div>
                </div>
            </Modal>
        );
    }

    if (step === 5) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Order Placed!">
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-[2.5rem] flex items-center justify-center text-emerald-600">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div className="space-y-2 px-4">
                        <h3 className="text-2xl font-black dark:text-white leading-tight">
                            {paymentMethod === 'pod' ? 'Order Secured' : 'Payment Pending Confirmation'}
                        </h3>
                        <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                            {paymentMethod === 'pod'
                                ? "We've captured your payment method. Reseller will fulfill your order shortly. Payment will be released upon delivery."
                                : "Your payment receipt has been linked to the order. Once verified by our auditors, your shipment will be released for dispatch."}
                        </p>
                    </div>
                    <div className="flex flex-col w-full gap-3 pt-4">
                        <Link href="/buyer-orders" className="w-full">
                            <Button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black h-12 rounded-xl flex items-center justify-center gap-2">
                                <HistoryIcon className="w-4 h-4" />
                                VIEW MY ORDERS
                            </Button>
                        </Link>
                        <Button onClick={onClose} variant="ghost" className="w-full font-bold h-10 text-zinc-500">
                            BACK TO STORE
                        </Button>
                    </div>
                </div>
            </Modal>
        );
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={step === 0 ? "Buyer Identity" : step === 1 ? "Delivery Info" : step === 2 ? "Payment Mode" : "Finalize Order"}
            description={step === 0 ? "Create or login to your account to track orders." : step === 1 ? "Tell us where to send your item via UPS Express." : step === 2 ? "Choose how you'd like to pay for your items." : "Confirm your details to finish your purchase."}
        >
            <div className="space-y-6">
                {step === 0 && (
                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-3">
                            <div className="relative">
                                <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                                <Input
                                    required
                                    type="email"
                                    placeholder="Email Address"
                                    value={authData.email}
                                    onChange={e => setAuthData({ ...authData, email: e.target.value })}
                                    className="h-14 pl-12 bg-zinc-900 border-zinc-800 rounded-2xl font-bold"
                                />
                            </div>
                            <div className="relative">
                                <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                                <Input
                                    required
                                    type="password"
                                    placeholder="Secure Password"
                                    value={authData.password}
                                    onChange={e => setAuthData({ ...authData, password: e.target.value })}
                                    className="h-14 pl-12 bg-zinc-900 border-zinc-800 rounded-2xl font-bold"
                                />
                            </div>
                        </div>
                        <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl bg-blue-600 font-black shadow-xl shadow-blue-500/20">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : authMode === "register" ? "CREATE ACCOUNT & CONTINUE" : "SECURE LOGIN"}
                        </Button>
                        <button type="button" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")} className="w-full text-center text-xs font-black text-zinc-500 uppercase tracking-widest hover:text-blue-500 transition-colors">
                            {authMode === "login" ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                        </button>
                    </form>
                )}

                {step === 1 && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <label className="text-[10px] font-black uppercase text-zinc-500 pl-1">Full Name</label>
                                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-12 bg-gray-50 dark:bg-zinc-800 border-none rounded-xl" placeholder="John Doe" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-zinc-500 pl-1">Phone</label>
                                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-12 bg-gray-50 dark:bg-zinc-800 border-none rounded-xl" placeholder="+1..." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-zinc-500 pl-1">Email</label>
                                <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-12 bg-gray-50 dark:bg-zinc-800 border-none rounded-xl" placeholder="john@example.com" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-500 pl-1">Street Address (UPS Delivery)</label>
                            <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="h-12 bg-gray-50 dark:bg-zinc-800 border-none rounded-xl" placeholder="123 Shopping St" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-zinc-500 pl-1">City</label>
                                <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="h-12 bg-gray-50 dark:bg-zinc-800 border-none rounded-xl" placeholder="New York" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-zinc-500 pl-1">Zip Code</label>
                                <Input value={formData.zip} onChange={(e) => setFormData({ ...formData, zip: e.target.value })} className="h-12 bg-gray-50 dark:bg-zinc-800 border-none rounded-xl" placeholder="10001" />
                            </div>
                        </div>
                        <Button onClick={handleNext} className="w-full h-14 rounded-2xl bg-blue-600 font-black flex items-center justify-center gap-2 mt-4 shadow-xl shadow-blue-500/20">
                            PROCEED TO PAYMENT
                            <Truck className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-3">
                        <button
                            onClick={() => { setPaymentMethod("pod"); setStep(3); }}
                            className="w-full flex items-center justify-between p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-blue-500 transition-all group text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Truck className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-black text-sm dark:text-white">Payment on Delivery</p>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Link Card, Pay when it arrives</p>
                                </div>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-zinc-300 group-hover:text-blue-500" />
                        </button>

                        <button
                            onClick={() => { setPaymentMethod("paypal"); setStep(3); }}
                            className="w-full flex items-center justify-between p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-blue-600 transition-all group text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-black text-sm dark:text-white">PayPal / Card (Pay Now)</p>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Instant Release via UPS</p>
                                </div>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-zinc-300 group-hover:text-blue-600" />
                        </button>

                        <button
                            onClick={() => { setPaymentMethod("crypto"); setStep(3); }}
                            className="w-full flex items-center justify-between p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-orange-500 transition-all group text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-black text-sm dark:text-white">Crypto Payment</p>
                                    <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest italic">5% DISCOUNT APPLIED</p>
                                </div>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-zinc-300 group-hover:text-orange-500" />
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                        {/* Summary Header */}
                        <div className="p-5 rounded-[2rem] bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 space-y-3">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                <span>Order Summary</span>
                                <span className="text-blue-500">UPS Express</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <h4 className="font-bold text-sm text-white line-clamp-1 flex-1 mr-4">{product.name}</h4>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-zinc-500 line-through">${product.resellPrice.toLocaleString()}</p>
                                    <p className="text-lg font-black text-blue-500">
                                        ${(paymentMethod === 'crypto' ? product.resellPrice * 0.95 : product.resellPrice).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                        {paymentMethod === "pod" ? (
                            <div className="space-y-4">
                                <div className="bg-blue-600/5 border border-blue-600/10 p-4 rounded-2xl mb-4">
                                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Pod Protocol</p>
                                    <p className="text-xs text-zinc-500 mt-1">Provide your card details to link. Only authorized, zero upfront cost.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-zinc-500 pl-1">Card Number</label>
                                    <Input value={formData.cardNumber} onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })} placeholder="0000 0000 0000 0000" className="h-12 bg-gray-50 dark:bg-zinc-800 border-none rounded-xl" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-zinc-500 pl-1">Expiry</label>
                                        <Input value={formData.expiry} onChange={(e) => setFormData({ ...formData, expiry: e.target.value })} placeholder="MM/YY" className="h-12 bg-gray-50 dark:bg-zinc-800 border-none rounded-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-zinc-500 pl-1">CVV</label>
                                        <Input value={formData.cvv} type="password" onChange={(e) => setFormData({ ...formData, cvv: e.target.value })} placeholder="***" className="h-12 bg-gray-50 dark:bg-zinc-800 border-none rounded-xl" />
                                    </div>
                                </div>
                            </div>
                        ) : paymentMethod === "crypto" ? (
                            <div className="space-y-4">
                                <div className="bg-orange-500/5 border border-orange-500/10 p-6 rounded-[2rem] space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Crypto Special</span>
                                        <span className="text-xs font-black text-emerald-500">-5% Discount</span>
                                    </div>
                                    <div className="h-px bg-orange-500/10" />
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase">Amount to pay</p>
                                            <p className="text-3xl font-black text-orange-500">${(product.resellPrice * 0.95).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-zinc-500 pl-1">Copy BTC Address</label>
                                    <div className="flex gap-2">
                                        <Input readOnly value="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" className="bg-zinc-100 dark:bg-zinc-900 border-none font-mono text-xs h-12 rounded-xl flex-1" />
                                        <Button size="icon" className="h-12 w-12 rounded-xl bg-orange-500 hover:bg-orange-600"><ShieldCheck className="w-5 h-5" /></Button>
                                    </div>
                                    <p className="text-[9px] text-zinc-400 font-bold uppercase text-center mt-2">Upload screenshot to chat after payment</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-blue-600/5 border border-blue-600/10 p-6 rounded-[2rem] space-y-3">
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">PayPal / Card Details</p>
                                    <p className="text-2xl font-black text-blue-700 dark:text-white">${product.resellPrice.toLocaleString()}</p>
                                    <p className="text-xs text-zinc-500">Send the exact amount to our PayPal business account to release the shipment.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-zinc-500 pl-1">PayPal Email</label>
                                    <Input readOnly value="payments@restock-global.com" className="bg-zinc-100 dark:bg-zinc-900 border-none font-bold h-12 rounded-xl" />
                                </div>
                            </div>
                        )}

                        <div className="pt-4 flex flex-col gap-3">
                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"
                            >
                                {loading ? "PROCESSING..." : (
                                    <>
                                        {paymentMethod === 'pod' ? 'AUTHORIZE & CONFIRM' : 'I HAVE MADE PAYMENT'}
                                        <CheckCircle2 className="w-4 h-4" />
                                    </>
                                )}
                            </Button>
                            <Button variant="ghost" onClick={() => setStep(2)} className="h-10 font-bold text-zinc-500">CHANGE PAYMENT</Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}

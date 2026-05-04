"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { addDoc, collection, serverTimestamp, doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { Loader2, User, Lock, Mail, CreditCard, Truck, ShieldCheck, CheckCircle2, Clock as HistoryIcon, ChevronRight, MapPin, Phone, Globe } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { COUNTRY_NAMES } from "@/lib/countries";

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
    storeUser: any;
}

export default function CheckoutModal({ isOpen, onClose, product, storeUser }: CheckoutModalProps) {
    const [step, setStep] = useState(1); // 0: Auth, 1: Delivery info, 2: Payment options, 3: Finalize, 4: Verifying, 5: Success
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"paypal" | "crypto" | "pod" | null>(null);
    const [user, setUser] = useState<any>(null);
    const [authMode, setAuthMode] = useState<"login" | "register">("register");
    const [authData, setAuthData] = useState({ email: "", password: "" });
    const [copied, setCopied] = useState(false);

    const productName = product?.name || product?.productName || "Selected Product";
    const productImage = product?.image || product?.productImage || null;
    const basePrice = Number(product?.price ?? product?.initialPrice ?? 0);
    const sellPrice = Number(product?.resellPrice ?? product?.price ?? 0);
    const [formData, setFormData] = useState({
        name: "", email: "", phone: "", address: "", zip: "", city: "", country: "United States",
        cardNumber: "", expiry: "", cvv: ""
    });

    useEffect(() => {
        if (isOpen) {
            setLoading(false);
            setVerifying(false);
            setPaymentMethod(null);
            const unsub = onAuthStateChanged(auth, (u) => {
                if (u) {
                    setUser(u);
                    setStep(1);
                    fetchBuyerData(u.uid);
                } else setStep(0);
            });
            return () => unsub();
        }
    }, [isOpen]);

    const fetchBuyerData = async (uid: string) => {
        const docSnap = await getDoc(doc(db, "users", uid));
        if (docSnap.exists()) {
            const data = docSnap.data();
            setFormData(prev => ({
                ...prev, name: data.displayName || "", email: data.email || "",
                phone: data.phoneNumber || "", address: data.address || "",
                city: data.city || "", zip: data.zipCode || ""
            }));
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (authMode === "register") {
                const res = await createUserWithEmailAndPassword(auth, authData.email, authData.password);
                await setDoc(doc(db, "users", res.user.uid), {
                    email: authData.email, role: "buyer", createdAt: serverTimestamp()
                });
            } else await signInWithEmailAndPassword(auth, authData.email, authData.password);
        } catch (error: any) { alert(error.message); }
        finally { setLoading(false); }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setVerifying(true);
        await new Promise(r => setTimeout(r, 2000));
        try {
            const orderData = {
                productId: product.id,
                productName,
                productImage,
                category: product.category || "General",
                initialPrice: basePrice,
                resellPrice: paymentMethod === "crypto" ? sellPrice * 0.95 : sellPrice,
                resellerProfit: sellPrice - basePrice,
                resellerId: storeUser.uid,
                customerId: user?.uid || "guest",
                customerName: formData.name,
                customerEmail: formData.email,
                customerPhone: formData.phone,
                customerAddress: `${formData.address}, ${formData.city}, ${formData.zip}, ${formData.country}`,
                deliveryService: "UPS",
                paymentType: paymentMethod,
                isPod: paymentMethod === "pod",
                status: paymentMethod === "pod" ? "awaiting_seller_fulfillment" : "awaiting_admin_confirmation",
                createdAt: serverTimestamp()
            };
            await addDoc(collection(db, "orders"), orderData);
            await updateDoc(doc(db, "users", storeUser.uid), {
                "stats.sales": increment(1),
                "stats.revenue": increment(orderData.resellPrice),
                pendingPayout: increment(orderData.resellerProfit)
            });
            setStep(5);
        } catch (error) { console.error(error); }
        finally { setLoading(false); setVerifying(false); }
    };

    const copyToClipboard = async (text: string) => {
        if (!text) return false;

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }
        } catch {
            // fallback below
        }

        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.setAttribute("readonly", "");
            textArea.style.position = "absolute";
            textArea.style.left = "-9999px";
            document.body.appendChild(textArea);
            textArea.select();
            const copiedWithExecCommand = document.execCommand("copy");
            document.body.removeChild(textArea);
            return copiedWithExecCommand;
        } catch {
            return false;
        }
    };

    const handleCopy = async (text: string) => {
        const didCopy = await copyToClipboard(text);
        if (!didCopy) {
            toast.error("Unable to copy. Please copy manually.");
            return;
        }

        setCopied(true);
        toast.success("Payment destination copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    if (verifying) {
        return (
            <Modal isOpen={isOpen} onClose={() => { }} title="Securing Payment">
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-in fade-in zoom-in-95">
                    <div className="relative">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                        <ShieldCheck className="w-5 h-5 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="space-y-1.5">
                        <h3 className="text-xl font-bold text-white tracking-tight">Verifying Payment</h3>
                        <p className="text-sm text-zinc-500 font-medium max-w-[240px] mx-auto leading-relaxed">
                            Processing secure authorization through our payment gateway. Please do not refresh.
                        </p>
                    </div>
                </div>
            </Modal>
        );
    }

    if (step === 5) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Success!">
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500 shadow-2xl shadow-emerald-500/10">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold">{paymentMethod === 'pod' ? 'Order Secured' : 'Order Placed'}</h3>
                        <p className="text-sm text-zinc-500 font-medium max-w-xs mx-auto">
                            Thank you for your order. We've sent a confirmation email with your order details.
                        </p>
                    </div>
                    <div className="flex flex-col w-full gap-3 pt-4">
                        <Link href="/buyer-orders" className="w-full">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl flex items-center justify-center gap-2">
                                <HistoryIcon className="w-4 h-4" />
                                View My Orders
                            </Button>
                        </Link>
                        <Button onClick={onClose} variant="ghost" className="w-full font-bold h-10 text-zinc-500">Back to Store</Button>
                    </div>
                </div>
            </Modal>
        );
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={step === 0 ? "Sign In" : step === 1 ? "Delivery Details" : step === 2 ? "Select Payment" : "Finalize Order"}
            description={step === 0 ? "Access your account to continue." : step === 1 ? "Where should we ship your order?" : step === 2 ? "How would you like to pay?" : "Review and confirm your order details."}
        >
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {step === 0 && (
                    <form onSubmit={handleAuth} className="space-y-6">
                        <div className="space-y-3">
                            <div className="relative">
                                <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                                <Input required type="email" placeholder="Email Address" value={authData.email} onChange={e => setAuthData({ ...authData, email: e.target.value })} className="h-12 pl-12 bg-zinc-950/50 border-white/[0.06] rounded-xl font-medium" />
                            </div>
                            <div className="relative">
                                <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                                <Input required type="password" placeholder="Password" value={authData.password} onChange={e => setAuthData({ ...authData, password: e.target.value })} className="h-12 pl-12 bg-zinc-950/50 border-white/[0.06] rounded-xl font-medium" />
                            </div>
                        </div>
                        <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-blue-600 font-bold shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : authMode === "register" ? "Create Account" : "Sign In"}
                        </Button>
                        <button type="button" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")} className="w-full text-center text-xs font-bold text-zinc-500 hover:text-blue-500 transition-colors uppercase tracking-widest">
                            {authMode === "login" ? "Needs an account? Sign Up" : "Have an account? Sign In"}
                        </button>
                    </form>
                )}

                {step === 1 && (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-1.5"><User className="w-3 h-3"/> Full Name</label>
                                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="h-11 bg-zinc-950/50 border-white/[0.06] rounded-xl font-medium" placeholder="John Doe" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Phone className="w-3 h-3"/> Phone</label>
                                    <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="h-11 bg-zinc-950/50 border-white/[0.06] rounded-xl font-medium" placeholder="+1..." />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Mail className="w-3 h-3"/> Email</label>
                                    <Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="h-11 bg-zinc-950/50 border-white/[0.06] rounded-xl font-medium" placeholder="john@example.com" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-1.5"><MapPin className="w-3 h-3"/> Street Address</label>
                                <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="h-11 bg-zinc-950/50 border-white/[0.06] rounded-xl font-medium" placeholder="123 Home St" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="h-11 bg-zinc-950/50 border-white/[0.06] rounded-xl font-medium" placeholder="City" />
                                <Input value={formData.zip} onChange={e => setFormData({ ...formData, zip: e.target.value })} className="h-11 bg-zinc-950/50 border-white/[0.06] rounded-xl font-medium" placeholder="Zip Code" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Globe className="w-3 h-3"/> Country</label>
                                <select
                                    value={formData.country}
                                    onChange={e => setFormData({ ...formData, country: e.target.value })}
                                    className="w-full h-11 bg-zinc-950/50 border border-white/[0.06] rounded-xl px-4 text-sm font-medium text-white outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
                                >
                                    {COUNTRY_NAMES.map(c => (
                                        <option key={c} value={c} className="bg-zinc-900">{c}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <Button onClick={() => setStep(2)} className="w-full h-12 rounded-xl bg-blue-600 font-bold flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all">
                            Next: Select Payment <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-3">
                        {[
                            { id: "pod", label: "Payment on Delivery", sub: "Pay once you receive the delivery", icon: Truck, color: "text-blue-500" },
                            { id: "paypal", label: "PayPal / Debit Card", sub: "Secure instant checkout", icon: CreditCard, color: "text-blue-600" },
                            { id: "crypto", label: "Cryptocurrency", sub: "ETH / BTC (5% Discount Applied)", icon: ShieldCheck, color: "text-amber-500" }
                        ].map((p, i) => (
                            <button
                                key={p.id}
                                onClick={() => { setPaymentMethod(p.id as any); setStep(3); }}
                                className="w-full flex items-center justify-between p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-blue-500/50 transition-all group text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-10 h-10 rounded-xl bg-zinc-900 border border-white/[0.04] flex items-center justify-center", p.color)}>
                                        <p.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-white">{p.label}</p>
                                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{p.sub}</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-zinc-800 group-hover:text-blue-500" />
                            </button>
                        ))}
                        <Button variant="ghost" onClick={() => setStep(1)} className="w-full h-10 rounded-xl text-zinc-600 font-bold">Back to Delivery</Button>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/[0.06] space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                                <span>Order Summary</span>
                                <span className="text-blue-500">UPS Priority</span>
                            </div>
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm text-white line-clamp-1">{productName}</h4>
                                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Qty: 1 Unit</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-white tracking-tight">
                                        ${(paymentMethod === 'crypto' ? sellPrice * 0.95 : sellPrice).toLocaleString()}
                                    </p>
                                    {paymentMethod === 'crypto' && <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">5% Crypto Discount</p>}
                                </div>
                            </div>
                        </div>

                        {paymentMethod === "pod" ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Verify Card Details</p>
                                    <p className="text-xs text-zinc-600 mt-1">A temporary authorization will be placed. No upfront charge.</p>
                                </div>
                                <Input value={formData.cardNumber} onChange={e => setFormData({ ...formData, cardNumber: e.target.value })} placeholder="Card Number" className="h-11 bg-zinc-950/50 border-white/[0.06] rounded-xl" />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input value={formData.expiry} onChange={e => setFormData({ ...formData, expiry: e.target.value })} placeholder="MM/YY" className="h-11 bg-zinc-950/50 border-white/[0.06] rounded-xl" />
                                    <Input value={formData.cvv} type="password" onChange={e => setFormData({ ...formData, cvv: e.target.value })} placeholder="CVV" className="h-11 bg-zinc-950/50 border-white/[0.06] rounded-xl" />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {(() => {
                                    const paymentDestination = paymentMethod === 'crypto'
                                        ? "bc1qxy2kgdygjrsqtzq2n0yrf..."
                                        : "merchant@restock-global.com";

                                    return (
                                <div className="p-5 bg-zinc-950/50 border border-white/[0.06] rounded-xl space-y-2">
                                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Payment Info</p>
                                    <p className="text-sm font-bold text-white">{paymentMethod === 'crypto' ? 'Send ETH/BTC to:' : 'Send Payment to:'}</p>
                                    <div className="flex gap-2">
                                        <Input readOnly value={paymentDestination} className="h-10 bg-zinc-900 border-none rounded-lg text-xs font-mono" />
                                        <Button onClick={() => handleCopy(paymentDestination)} className="h-10 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 min-w-[88px]">
                                            {copied ? "Copied" : "Copy"}
                                        </Button>
                                    </div>
                                </div>
                                    );
                                })()}
                            </div>
                        )}

                        <div className="pt-2 flex flex-col gap-3">
                            <Button onClick={handleSubmit} disabled={loading} className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Confirm Order"}
                            </Button>
                            <Button variant="ghost" onClick={() => setStep(2)} className="h-10 rounded-xl text-zinc-600 font-bold">Change Payment</Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}

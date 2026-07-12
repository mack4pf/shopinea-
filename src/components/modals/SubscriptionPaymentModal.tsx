"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    X, Check, ArrowRight, Copy, CheckCircle2, Loader2,
    ShieldCheck, Building2, UploadCloud, Clock, ChevronLeft
} from "lucide-react";
import { BitcoinLogo, EthereumLogo, USDTLogo, PayPalLogo } from "@/components/shared/BrandLogos";
import { toast } from "sonner";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { getCryptoAddress, getEnabledCryptoOptions } from "@/lib/payments/crypto";

interface SubscriptionPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: any;
    userId: string;
    userName: string;
}

const STEPS = ["Review", "Method", "Confirm"];

export function SubscriptionPaymentModal({ isOpen, onClose, plan, userId, userName }: SubscriptionPaymentModalProps) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [paymentConfig, setPaymentConfig] = useState<any>(null);
    const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
    const [receiptName, setReceiptName] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        getDoc(doc(db, "settings", "payments")).then(s => { if (s.exists()) setPaymentConfig(s.data()); });
        setStep(1); setSelectedMethod(null); setSelectedCrypto(null); setReceiptUrl(null); setReceiptName(null);
    }, [isOpen]);

    if (!isOpen || !plan) return null;

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
        if (!receiptUrl) { toast.error("Please upload your payment receipt first."); return; }
        setSubmitting(true);
        try {
            await addDoc(collection(db, "subscription_requests"), {
                userId, userName,
                planId: plan.id, planName: plan.name, amount: plan.price,
                billingLabel: plan.billingLabel || "/month",
                durationDays: plan.durationDays || 30,
                aiCredits: plan.aiCredits || 0,
                adCredits: plan.adCredits || 0,
                maxStores: plan.maxStores || 1,
                method: selectedMethod, asset: selectedCrypto || "N/A",
                receiptUrl, status: "pending", createdAt: serverTimestamp(),
            });
            setStep(5);
        } catch { toast.error("Failed to submit. Please try again."); }
        finally { setSubmitting(false); }
    };

    const paymentAddress = getCryptoAddress(paymentConfig, selectedCrypto);
    const cryptoOptions = getEnabledCryptoOptions(paymentConfig);

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 z-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md bg-[#0f0f13] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 animate-in zoom-in-95 duration-300 my-8 overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600/15 border border-blue-500/20 rounded-lg flex items-center justify-center">
                            <ShieldCheck className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white leading-tight">Subscribe to {plan.name}</p>
                            <p className="text-xs text-zinc-500">${plan.price.toLocaleString()}{plan.billingLabel || "/month"}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-white/[0.06] flex items-center justify-center transition-colors">
                        <X className="w-4 h-4 text-zinc-500" />
                    </button>
                </div>

                {/* Step indicator */}
                {step < 5 && (
                    <div className="px-5 pt-4 pb-0">
                        <div className="flex items-center">
                            {STEPS.map((label, i) => (
                                <React.Fragment key={i}>
                                    <div className="flex items-center gap-1.5">
                                        <div className={cn(
                                            "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all",
                                            i < labelIdx ? "bg-blue-600 text-white" :
                                            i === labelIdx ? "bg-blue-600 text-white ring-2 ring-blue-500/20" :
                                            "bg-white/[0.06] text-zinc-600"
                                        )}>
                                            {i < labelIdx ? <Check className="w-2.5 h-2.5" /> : i + 1}
                                        </div>
                                        <span className={cn("text-xs font-medium transition-colors",
                                            i === labelIdx ? "text-white" : i < labelIdx ? "text-zinc-500" : "text-zinc-700"
                                        )}>{label}</span>
                                    </div>
                                    {i < STEPS.length - 1 && (
                                        <div className={cn("flex-1 h-px mx-2 transition-colors", i < labelIdx ? "bg-blue-600/40" : "bg-white/[0.06]")} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                )}

                <div className="p-5">

                    {/* Step 1: Plan Review */}
                    {step === 1 && (
                        <div className="space-y-4 animate-in slide-in-from-right-3 duration-300">
                            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-2.5">
                                <p className="text-xs font-medium text-zinc-400 mb-3">What's included in {plan.name}</p>
                                {plan.features.map((f: string, i: number) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                                        </div>
                                        <span className="text-sm text-zinc-300">{f}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-between p-4 bg-blue-600/[0.07] border border-blue-500/20 rounded-xl">
                                <div>
                                    <p className="text-xs text-zinc-400 mb-1">Total due today</p>
                                    <p className="text-2xl font-bold text-white">${plan.price.toLocaleString()}<span className="text-sm font-normal text-zinc-500 ml-1">{plan.billingLabel || "/mo"}</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[11px] text-zinc-500">{(plan.billingLabel || "/month").includes("year") ? "Billed yearly" : "Billed monthly"}</p>
                                    <p className="text-[11px] text-zinc-600 mt-0.5">Secure manual review</p>
                                </div>
                            </div>
                            <button onClick={() => setStep(2)}
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors">
                                Continue to Payment <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Step 2: Payment method */}
                    {step === 2 && (
                        <div className="space-y-3 animate-in slide-in-from-right-3 duration-300">
                            <p className="text-sm text-zinc-400 mb-1">How would you like to pay <span className="text-white font-medium">${plan.price.toLocaleString()}</span>?</p>
                            {[
                                { id: "bank",   label: "Bank Transfer",  sub: "SWIFT / SEPA / Local wire",    icon: <Building2 className="w-5 h-5 text-blue-400" />, bg: "bg-blue-500/10 border-blue-500/20" },
                                { id: "paypal", label: "PayPal",         sub: "Pay with your PayPal account", icon: <PayPalLogo size={20} />,                         bg: "bg-white/[0.04] border-white/[0.06]" },
                                { id: "crypto", label: "Cryptocurrency", sub: "BTC · ETH · USDT",             icon: <BitcoinLogo size={20} />,                        bg: "bg-white/[0.04] border-white/[0.06]" },
                            ].map((m: any) => (
                                <button key={m.id}
                                    onClick={() => { setSelectedMethod(m.id); if (m.id === "crypto") setStep(3); else setStep(4); }}
                                    className="w-full flex items-center gap-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:border-blue-500/30 hover:bg-white/[0.05] transition-all text-left group">
                                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border", m.bg)}>{m.icon}</div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-white">{m.label}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">{m.sub}</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 transition-colors" />
                                </button>
                            ))}
                            <button onClick={() => setStep(1)} className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                                <ChevronLeft className="w-3.5 h-3.5" /> Back
                            </button>
                        </div>
                    )}

                    {/* Step 3: Crypto asset */}
                    {step === 3 && (
                        <div className="space-y-3 animate-in slide-in-from-right-3 duration-300">
                            <p className="text-sm text-zinc-400 mb-1">Select the asset you'll pay with.</p>
                            {cryptoOptions.map((coin) => ({ ...coin, Logo: coin.id === "btc" ? BitcoinLogo : coin.id === "eth" ? EthereumLogo : coin.id === "usdt" ? USDTLogo : null }))
                                .filter((coin: any) => coin.Logo)
                                .map((coin: any) => (
                                <button key={coin.id}
                                    onClick={() => { setSelectedCrypto(coin.id); setStep(4); }}
                                    className="w-full flex items-center gap-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:border-blue-500/30 hover:bg-white/[0.05] transition-all text-left group">
                                    <coin.Logo size={28} />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-white">{coin.name}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">{coin.ticker}</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 transition-colors" />
                                </button>
                            ))}
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
                                <p className="text-xs text-zinc-500">Transfer exactly <span className="text-white font-medium">${plan.price.toLocaleString()}</span> to the details below, then upload your receipt.</p>
                            </div>

                            {/* Payment destination */}
                            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3">
                                {selectedMethod === "bank" && (<>
                                    <p className="text-xs font-medium text-zinc-400">Bank Transfer Details</p>
                                    {[
                                        { label: "Bank Name",      val: paymentConfig?.bankName,    key: "bn" },
                                        { label: "Account / IBAN", val: paymentConfig?.bankAccount, key: "ba" },
                                        { label: "SWIFT / BIC",    val: paymentConfig?.bankSwift,   key: "bs" },
                                    ].map(item => (
                                        <div key={item.key} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                                            <span className="text-xs text-zinc-500">{item.label}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-white">{item.val || "—"}</span>
                                                {item.val && <button onClick={() => handleCopy(item.val, item.key)} className="text-zinc-600 hover:text-blue-400 transition-colors">
                                                    {copied === item.key ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                </button>}
                                            </div>
                                        </div>
                                    ))}
                                </>)}
                                {selectedMethod === "paypal" && (<>
                                    <p className="text-xs font-medium text-zinc-400">Send payment to</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-white">{paymentConfig?.paypalEmail || "Not configured"}</span>
                                        {paymentConfig?.paypalEmail && (
                                            <button onClick={() => handleCopy(paymentConfig.paypalEmail, "pp")} className="text-zinc-600 hover:text-blue-400 transition-colors">
                                                {copied === "pp" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-zinc-600 pt-1">Send as "Friends & Family". Reference: <span className="text-zinc-400 font-mono">{userId.slice(0, 8)}</span></p>
                                </>)}
                                {selectedMethod === "crypto" && (<>
                                    <p className="text-xs font-medium text-zinc-400">{selectedCrypto?.toUpperCase()} wallet address</p>
                                    <div className="bg-zinc-900/70 border border-white/[0.04] rounded-lg p-3 font-mono text-xs text-zinc-300 break-all leading-relaxed">
                                        {paymentAddress || "Address not configured"}
                                    </div>
                                    {paymentAddress && (
                                        <button onClick={() => handleCopy(paymentAddress, "cr")}
                                            className="w-full h-8 flex items-center justify-center gap-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-zinc-300 hover:bg-white/[0.08] transition-colors">
                                            {copied === "cr" ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy address</>}
                                        </button>
                                    )}
                                </>)}
                            </div>

                            {/* Divider */}
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-white/[0.06]" />
                                <span className="text-xs text-zinc-600">Upload your receipt</span>
                                <div className="flex-1 h-px bg-white/[0.06]" />
                            </div>

                            {/* Receipt upload */}
                            {receiptUrl ? (
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
                                        <p className="text-xs text-zinc-600 mt-0.5">Screenshot or photo of your payment confirmation · PNG, JPG, PDF</p>
                                    </div>
                                </button>
                            )}
                            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleReceiptUpload} />

                            {/* Verification ETA */}
                            <div className="flex items-start gap-3 p-3 bg-blue-500/[0.06] border border-blue-500/15 rounded-xl">
                                <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-zinc-400">Verification typically completes in <span className="text-white font-medium">1–5 minutes</span> after your receipt is submitted.</p>
                            </div>

                            <button onClick={handleSubmit} disabled={submitting || !receiptUrl}
                                className={cn("w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all",
                                    receiptUrl ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-white/[0.04] border border-white/[0.06] text-zinc-600 cursor-not-allowed")}>
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Payment"}
                            </button>
                            <button onClick={() => { setSelectedMethod(null); setSelectedCrypto(null); setStep(2); }}
                                className="w-full flex items-center justify-center gap-1.5 py-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                                <ChevronLeft className="w-3.5 h-3.5" /> Change payment method
                            </button>
                        </div>
                    )}

                    {/* Step 5: Success */}
                    {step === 5 && (
                        <div className="flex flex-col items-center text-center py-8 space-y-5 animate-in zoom-in-95 duration-300">
                            <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/25 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-white">Payment submitted</h3>
                                <p className="text-sm text-zinc-400 max-w-xs mx-auto">
                                    Your receipt is under review. We'll activate your <span className="text-white">{plan.name}</span> plan once the payment is confirmed.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/[0.08] border border-blue-500/15 rounded-xl w-full justify-center">
                                <Clock className="w-4 h-4 text-blue-400" />
                                <p className="text-sm text-zinc-300">Usually takes <span className="text-white font-semibold">1–5 minutes</span></p>
                            </div>
                            <button onClick={() => { onClose(); router.push('/dashboard'); }}
                                className="w-full h-11 bg-white/[0.06] border border-white/[0.08] text-white font-medium text-sm rounded-xl hover:bg-white/[0.10] transition-colors">
                                Back to Dashboard
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

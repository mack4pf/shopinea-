"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    X, Check, Copy, CheckCircle2, Loader2, ArrowRight,
    UploadCloud, Clock, ChevronLeft, Tag
} from "lucide-react";
import { BitcoinLogo, EthereumLogo, USDTLogo, PayPalLogo } from "@/components/shared/BrandLogos";
import { addDoc, collection, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AdDepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    requiredDebtAmount?: number;
}

const STEPS = ["Amount", "Method", "Pay"];

export default function AdDepositModal({ isOpen, onClose, userId, requiredDebtAmount }: AdDepositModalProps) {
    const router = useRouter();
    const [amount, setAmount] = useState(requiredDebtAmount ? String(requiredDebtAmount) : "");
    const [step, setStep] = useState(1);
    const [method, setMethod] = useState<string | null>(null);
    const [cryptoAsset, setCryptoAsset] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
    const [receiptName, setReceiptName] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [adminConfig, setAdminConfig] = useState<any>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getDoc(doc(db, "settings", "payments")).then(s => { if (s.exists()) setAdminConfig(s.data()); });
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        setStep(1); setMethod(null); setCryptoAsset(null); setReceiptUrl(null); setReceiptName(null);
        if (!requiredDebtAmount) setAmount("");
    }, [isOpen, requiredDebtAmount]);

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

    if (!isOpen) return null;

    const numAmount = parseFloat(amount) || 0;
    const cryptoDiscount = method === "crypto" ? numAmount * 0.05 : 0;
    const amountToPay = numAmount - cryptoDiscount;
    const bonus = !requiredDebtAmount
        ? (numAmount >= 500 ? numAmount : numAmount >= 100 ? numAmount * 0.20 : 0)
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
        if (!receiptUrl) { toast.error("Please upload your payment receipt first."); return; }
        setLoading(true);
        try {
            await addDoc(collection(db, "transactions"), {
                userId, type: "ad_deposit",
                amount: numAmount, amountPaid: amountToPay, totalCredits,
                bonus, cryptoDiscount, status: "pending",
                method, asset: cryptoAsset || "N/A",
                receiptUrl, requiredDebt: requiredDebtAmount || null,
                description: "Ad wallet deposit",
                createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
            });
            setStep(5);
        } catch { toast.error("Failed to submit. Please try again."); }
        finally { setLoading(false); }
    };

    const cryptoAddress =
        cryptoAsset === "btc"  ? adminConfig?.btcAddress :
        cryptoAsset === "eth"  ? adminConfig?.ethAddress :
        cryptoAsset === "usdt" ? adminConfig?.usdtAddress : null;

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
                                Your receipt is under review. We'll credit <span className="text-white font-medium">${totalCredits.toFixed(2)}</span> to your ad wallet once confirmed.
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
                                            ${v}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Bonus preview */}
                            {bonus > 0 && (
                                <div className="flex items-center gap-2.5 p-3 bg-emerald-500/[0.07] border border-emerald-500/20 rounded-xl">
                                    <Tag className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <p className="text-xs text-zinc-300">Deposit ${numAmount.toFixed(2)} and get <span className="text-emerald-300 font-semibold">+${bonus.toFixed(2)} bonus</span> — total credits: <span className="text-white font-semibold">${totalCredits.toFixed(2)}</span></p>
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
                            <p className="text-sm text-zinc-400">How would you like to deposit <span className="text-white font-medium">${numAmount.toFixed(2)}</span>?</p>
                            {[
                                { id: "crypto", label: "Cryptocurrency", sub: "BTC · ETH · USDT · 5% discount", icon: <BitcoinLogo size={20} />, bg: "bg-white/[0.04] border-white/[0.06]" },
                                { id: "paypal", label: "PayPal",          sub: "Pay with your PayPal account",  icon: <PayPalLogo size={20} />,  bg: "bg-white/[0.04] border-white/[0.06]" },
                            ].map((m: any) => (
                                <button key={m.id}
                                    onClick={() => { setMethod(m.id); if (m.id === "crypto") setStep(3); else setStep(4); }}
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
                            <p className="text-sm text-zinc-400">Select the asset you'll pay with.</p>
                            {[
                                { id: "btc",  name: "Bitcoin",    ticker: "BTC",               Logo: BitcoinLogo },
                                { id: "eth",  name: "Ethereum",   ticker: "ETH",               Logo: EthereumLogo },
                                { id: "usdt", name: "Tether USD", ticker: "USDT (ERC20/TRC20)", Logo: USDTLogo },
                            ].map((coin) => (
                                <button key={coin.id}
                                    onClick={() => { setCryptoAsset(coin.id); setStep(4); }}
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
                                <p className="text-xs text-zinc-500">
                                    {method === "crypto"
                                        ? <>Transfer exactly <span className="text-white font-medium">${amountToPay.toFixed(2)}</span> <span className="text-emerald-400">(5% crypto discount applied)</span></>
                                        : <>Transfer exactly <span className="text-white font-medium">${amountToPay.toFixed(2)}</span></>
                                    } to the details below, then upload your receipt.
                                </p>
                            </div>

                            {/* Payment destination */}
                            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3">
                                {method === "paypal" && (<>
                                    <p className="text-xs font-medium text-zinc-400">Send PayPal payment to</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-white">{adminConfig?.paypalEmail || "Not configured"}</span>
                                        {adminConfig?.paypalEmail && <button onClick={() => handleCopy(adminConfig.paypalEmail, "pp")} className="text-zinc-600 hover:text-blue-400 transition-colors">
                                            {copied === "pp" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>}
                                    </div>
                                    <p className="text-[11px] text-zinc-600">Send as "Friends &amp; Family". Reference: <span className="text-zinc-400 font-mono">{userId.slice(0,8)}</span></p>
                                </>)}
                                {method === "crypto" && (<>
                                    <p className="text-xs font-medium text-zinc-400">{cryptoAsset?.toUpperCase()} wallet address</p>
                                    <div className="bg-zinc-900/70 border border-white/[0.04] rounded-lg p-3 font-mono text-xs text-zinc-300 break-all leading-relaxed">
                                        {cryptoAddress || "Address not configured"}
                                    </div>
                                    {cryptoAddress && (
                                        <button onClick={() => handleCopy(cryptoAddress, "cr")}
                                            className="w-full h-8 flex items-center justify-center gap-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-zinc-300 hover:bg-white/[0.08] transition-colors">
                                            {copied === "cr" ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy address</>}
                                        </button>
                                    )}
                                </>)}
                            </div>

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
                                        <p className="text-xs text-zinc-600 mt-0.5">Screenshot or photo of your payment confirmation</p>
                                    </div>
                                </button>
                            )}
                            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleReceiptUpload} />

                            {/* Verification ETA */}
                            <div className="flex items-start gap-3 p-3 bg-blue-500/[0.06] border border-blue-500/15 rounded-xl">
                                <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-zinc-400">Verification typically completes in <span className="text-white font-medium">1–5 minutes</span> after your receipt is submitted.</p>
                            </div>

                            <button onClick={handleSubmit} disabled={loading || !receiptUrl}
                                className={cn("w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all",
                                    receiptUrl ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-white/[0.04] border border-white/[0.06] text-zinc-600 cursor-not-allowed")}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Payment"}
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

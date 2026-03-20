"use client";

import React, { useState, useEffect } from "react";
import { 
    X, 
    Zap, 
    Crown, 
    Rocket, 
    Check, 
    ArrowRight,
    Copy,
    CheckCircle2,
    Loader2,
    Bitcoin,
    ShieldCheck,
    CreditCard,
    DollarSign,
    Timer,
    QrCode,
    Building2,
    Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";

interface SubscriptionPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: any;
    userId: string;
    userName: string;
}

export function SubscriptionPaymentModal({ isOpen, onClose, plan, userId, userName }: SubscriptionPaymentModalProps) {
    const [step, setStep] = useState(1);
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [paymentConfig, setPaymentConfig] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes in seconds

    // Countdown Logic
    useEffect(() => {
        if (step === 4 && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [step, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Fetch config logic
    useEffect(() => {
        if (isOpen) {
            const fetchConfig = async () => {
                const snap = await getDoc(doc(db, "settings", "payments"));
                if (snap.exists()) setPaymentConfig(snap.data());
            };
            fetchConfig();
            setStep(1); // Reset step when opening
            setSelectedMethod(null);
            setSelectedCrypto(null);
            setTimeLeft(1800);
        }
    }, [isOpen]);

    if (!isOpen || !plan) return null;

    const handleCopy = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Details copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmitPayment = async () => {
        setSubmitting(true);
        try {
            await addDoc(collection(db, "subscription_requests"), {
                userId,
                userName,
                planId: plan.id,
                planName: plan.name,
                amount: plan.price,
                method: selectedMethod,
                asset: selectedCrypto || 'N/A',
                status: "pending",
                createdAt: serverTimestamp(),
            });

            toast.success("Payment notification sent to admin!");
            setStep(5);
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit request.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 overflow-y-auto">
            <div 
                className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500" 
                onClick={onClose} 
            />
            
            <div className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 my-8">
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-600/20">
                            <ShieldCheck className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">Global Activation</h3>
                            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mt-1">Tier: {plan.name} • ${plan.price}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 transition-colors">
                        <X className="w-5 h-5 text-zinc-500" />
                    </button>
                </div>

                <div className="p-10">
                    {/* Step 1: Inclusions */}
                    {step === 1 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <div className="space-y-4">
                                <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Review Scaling Assets</h4>
                                <p className="text-sm font-bold text-zinc-500 leading-relaxed capitalize">
                                    Your merchant account will be upgraded with the following enterprise-grade tools:
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {plan.features.map((f: string, i: number) => (
                                    <div key={i} className="flex items-center gap-3 p-4 bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-blue-500/30 transition-colors">
                                        <Check className="w-4 h-4 text-emerald-500" />
                                        <span className="text-[11px] font-bold text-zinc-400">{f}</span>
                                    </div>
                                ))}
                            </div>

                            <Button 
                                onClick={() => setStep(2)}
                                className="w-full h-14 bg-white text-black font-black italic rounded-2xl gap-3 shadow-xl shadow-white/5 hover:scale-[1.02] transition-all text-xs uppercase"
                            >
                                CONTINUE TO PAYMENT SELECTION <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {/* Step 2: Choose Method */}
                    {step === 2 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2 text-center">
                                <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase">Select Gateway</h4>
                                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Global Financial Protocols</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {[
                                    { id: 'bank', name: 'Bank Transfer', desc: 'SWIFT / SEPA / Local Wire', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                    { id: 'paypal', name: 'PayPal Checkout', desc: 'Secure Instant Processing', icon: Send, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
                                    { id: 'crypto', name: 'Cryptocurrency', desc: 'BTC / ETH / USDT Network', icon: Bitcoin, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                                ].map((method) => (
                                    <button 
                                        key={method.id}
                                        onClick={() => {
                                            setSelectedMethod(method.id);
                                            if (method.id === 'crypto') setStep(3);
                                            else setStep(4);
                                        }}
                                        className="flex items-center justify-between p-6 bg-zinc-950 border border-zinc-900 rounded-3xl hover:border-blue-500/50 hover:bg-zinc-900 transition-all group"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", method.bg)}>
                                                <method.icon className={cn("w-7 h-7", method.color)} />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-black text-white italic uppercase tracking-tight">{method.name}</p>
                                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{method.desc}</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-zinc-800 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Choose Crypto */}
                    {step === 3 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <div className="text-center">
                                <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase">Select Asset</h4>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {[
                                    { id: 'btc', name: 'Bitcoin (BTC)', icon: Bitcoin, color: 'text-orange-500' },
                                    { id: 'eth', name: 'Ethereum (ETH)', icon: Zap, color: 'text-blue-400' },
                                    { id: 'usdt', name: 'USDT (ERC20/TRC20)', icon: ShieldCheck, color: 'text-emerald-500' },
                                ].map((coin) => (
                                    <button 
                                        key={coin.id}
                                        onClick={() => {
                                            setSelectedCrypto(coin.id);
                                            setStep(4);
                                        }}
                                        className="flex items-center justify-between p-5 bg-zinc-950 border border-zinc-900 rounded-2xl hover:border-blue-500/50 hover:bg-zinc-900 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <coin.icon className={cn("w-5 h-5", coin.color)} />
                                            <span className="text-sm font-black text-white italic uppercase">{coin.name}</span>
                                        </div>
                                        <CheckCircle2 className="w-5 h-5 text-zinc-800 group-hover:text-blue-500 transition-all" />
                                    </button>
                                ))}
                            </div>
                            
                            <Button variant="ghost" onClick={() => setStep(2)} className="w-full text-zinc-500 font-black text-[10px] uppercase">
                                BACK TO GATEWAYS
                            </Button>
                        </div>
                    )}

                    {/* Step 4: Show Details + Timer */}
                    {step === 4 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <div className="flex justify-between items-center p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl">
                                <div className="flex items-center gap-3">
                                    <Timer className="w-5 h-5 text-blue-500 animate-pulse" />
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-blue-500 tracking-[0.2em]">Transaction Window</p>
                                        <p className="text-xl font-black text-white italic">{formatTime(timeLeft)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Required Amount</p>
                                    <p className="text-xl font-black text-white italic">${plan.price}</p>
                                </div>
                            </div>

                            <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2rem] space-y-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform">
                                    <QrCode className="w-20 h-20 text-white" />
                                </div>

                                {selectedMethod === 'bank' && (
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Bank Settlement Details</p>
                                        <div className="space-y-3">
                                            {[
                                                { label: 'Bank Name', val: paymentConfig?.bankName },
                                                { label: 'Account/IBAN', val: paymentConfig?.bankAccount },
                                                { label: 'SWIFT/BIC', val: paymentConfig?.bankSwift },
                                            ].map((item, i) => (
                                                <div key={i} className="flex justify-between items-end border-b border-white/5 pb-2">
                                                    <span className="text-[9px] font-black uppercase text-zinc-500">{item.label}</span>
                                                    <button onClick={() => handleCopy(item.val)} className="text-xs font-black text-white italic hover:text-blue-500 transition-colors uppercase tracking-tight">{item.val || 'PENDING...'}</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedMethod === 'paypal' && (
                                    <div className="space-y-4 text-center">
                                        <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">PayPal Recipient Address</p>
                                        <button 
                                            onClick={() => handleCopy(paymentConfig?.paypalEmail)}
                                            className="text-2xl font-black text-white italic hover:text-blue-500 transition-colors"
                                        >
                                            {paymentConfig?.paypalEmail || 'processing@shoplinea.shop'}
                                        </button>
                                        <p className="text-[9px] font-bold text-zinc-500 uppercase">Send as 'Friends & Family' for instant activation</p>
                                    </div>
                                )}

                                {selectedMethod === 'crypto' && (
                                    <div className="space-y-4 text-center">
                                        <p className="text-[10px] font-black uppercase text-orange-500 tracking-widest">
                                            Transfer to {selectedCrypto?.toUpperCase()} Address
                                        </p>
                                        <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 break-all font-mono text-[11px] font-bold text-zinc-300">
                                            {selectedCrypto === 'btc' ? paymentConfig?.btcAddress : 
                                             selectedCrypto === 'eth' ? paymentConfig?.ethAddress : 
                                             paymentConfig?.usdtAddress || 'Address Fetching...'}
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => handleCopy(selectedCrypto === 'btc' ? paymentConfig?.btcAddress : selectedCrypto === 'eth' ? paymentConfig?.ethAddress : paymentConfig?.usdtAddress)}
                                            className="h-10 rounded-xl border-zinc-800 bg-zinc-950 text-[10px] font-black uppercase gap-2"
                                        >
                                            <Copy className="w-3 h-3" /> Copy Address
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 italic">
                                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex gap-3">
                                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <p className="text-[10px] font-bold text-emerald-500/80 leading-relaxed uppercase">
                                        Your activation is protected by our global security protocol. Click below only after successful transfer.
                                    </p>
                                </div>
                                <Button 
                                    onClick={handleSubmitPayment}
                                    disabled={submitting}
                                    className="w-full h-15 bg-blue-600 hover:bg-blue-700 text-white font-black italic rounded-2xl gap-3 shadow-xl shadow-blue-500/20 text-xs uppercase"
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "PROCEED WITH VERIFICATION"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Success */}
                    {step === 5 && (
                        <div className="text-center py-10 space-y-8 animate-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-blue-600/10 border border-blue-600/20">
                                <CheckCircle2 className="w-12 h-12 text-blue-500" />
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Signal Transmitted</h4>
                                <p className="text-sm font-bold text-zinc-500 leading-relaxed capitalize max-w-sm mx-auto">
                                    Your activation is marked as **PENDING**. Our financial ops team will verify the inflow and activate your elite tier within 1-12 hours.
                                </p>
                            </div>
                            <Button 
                                onClick={onClose}
                                className="w-full h-14 bg-zinc-900 border border-zinc-800 text-white font-black italic rounded-2xl hover:bg-zinc-800 transition-all text-xs uppercase"
                            >
                                RETURN TO DASHBOARD
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

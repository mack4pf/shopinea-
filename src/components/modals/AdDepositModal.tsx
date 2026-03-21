"use client";

import React, { useState, useEffect } from "react";
import {
    X,
    Zap,
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
    Send,
    Gift,
    AlertTriangle,
    Percent
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";

interface AdDepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    requiredDebtAmount?: number;
}

export function AdDepositModal({ isOpen, onClose, userId, requiredDebtAmount }: AdDepositModalProps) {
    const [step, setStep] = useState(1);
    const [amount, setAmount] = useState(requiredDebtAmount ? requiredDebtAmount.toString() : "");
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [paymentConfig, setPaymentConfig] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(1800);
    const [userData, setUserData] = useState<any>(null);

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

    // Fetch config and user data
    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                const settingsSnap = await getDoc(doc(db, "settings", "payments"));
                if (settingsSnap.exists()) setPaymentConfig(settingsSnap.data());

                const userSnap = await getDoc(doc(db, "users", userId));
                if (userSnap.exists()) setUserData(userSnap.data());
            };
            fetchData();
            setStep(1);
            setSelectedMethod(null);
            setSelectedCrypto(null);
            setAmount(requiredDebtAmount ? requiredDebtAmount.toString() : "");
            setTimeLeft(1800);
        }
    }, [isOpen, userId, requiredDebtAmount]);

    if (!isOpen) return null;

    const getBonusAmount = (val: string) => {
        if (requiredDebtAmount) return 0;
        const num = parseFloat(val);
        if (isNaN(num)) return 0;
        if (num >= 500) return num; // 100% bonus for 500+
        if (num >= 100) return num * 0.2; // 20% bonus for 100+
        return 0;
    };

    const getCryptoDiscount = () => {
        if (selectedMethod !== 'crypto') return 0;
        const num = parseFloat(amount);
        if (isNaN(num) || num <= 0) return 0;
        return num * 0.05; // 5% off for crypto
    };

    const bonus = getBonusAmount(amount);
    const cryptoDiscount = getCryptoDiscount();
    const amountToPay = Math.max(0, (parseFloat(amount) || 0) - cryptoDiscount);
    const totalCredits = (parseFloat(amount) || 0) + bonus;

    const handleCopy = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Details copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmitPayment = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            toast.error("Please enter a valid amount.");
            return;
        }
        setSubmitting(true);
        try {
            await addDoc(collection(db, "transactions"), {
                userId,
                userName: userData?.displayName || 'Merchant',
                type: "ad_deposit",
                amount: parseFloat(amount),
                bonus: bonus,
                cryptoDiscount: cryptoDiscount,
                amountPaid: amountToPay,
                method: selectedMethod,
                asset: selectedCrypto || 'N/A',
                status: "pending",
                createdAt: serverTimestamp(),
            });

            toast.success("Deposit notification sent to admin!");
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
                            <Megaphone className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">Fund Ad Wallet</h3>
                            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mt-1">Deposit to run campaigns. Crypto gets 5% off + bonus.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 transition-colors">
                        <X className="w-5 h-5 text-zinc-500" />
                    </button>
                </div>

                <div className="p-10">
                    {/* Step 1: Offer & Amount */}
                    {step === 1 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            {/* Exclusive Offer Banner */}
                            <div className="bg-gradient-to-br from-blue-700 via-indigo-800 to-blue-900 p-10 rounded-[2.5rem] relative overflow-hidden group shadow-2xl shadow-blue-500/10">
                                <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                    <Gift className="w-24 h-24 text-white" />
                                </div>
                                <div className="relative z-10 space-y-4">
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-300">Exclusive Ad Offer</span>
                                    <h4 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Deposit $500+<br />Get 100% Ad Bonus</h4>
                                    <p className="text-[10px] font-bold text-blue-100/60 uppercase tracking-widest max-w-xs leading-relaxed">
                                        Funds in Ad Wallet are locked to marketing and cannot be withdrawn.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Target Deposit Amount (USD)</Label>
                                <div className="relative group">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-white text-xl group-focus-within:text-blue-500 transition-colors">$</span>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={amount}
                                        readOnly={!!requiredDebtAmount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className={cn(
                                            "h-20 pl-14 bg-zinc-950 border-zinc-800 rounded-[1.8rem] font-black text-3xl text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-inner transition-all italic placeholder:text-zinc-800",
                                            requiredDebtAmount && "opacity-70 cursor-not-allowed"
                                        )}
                                    />
                                </div>
                            </div>

                            {bonus > 0 && (
                                <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex justify-between items-center animate-in zoom-in-95 duration-500">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                            <Zap className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest leading-none mb-1">Total Scaling Power</p>
                                            <p className="text-xl font-black text-white italic">${totalCredits.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-emerald-500/50 uppercase">Instant Bonus</p>
                                        <p className="text-sm font-black text-emerald-500">+${bonus.toLocaleString()}</p>
                                    </div>
                                </div>
                            )}

                            <Button
                                onClick={() => {
                                    if (!amount || parseFloat(amount) <= 0) {
                                        toast.error("Set a target budget first.");
                                        return;
                                    }
                                    setStep(2);
                                }}
                                className="w-full h-16 bg-white text-black font-black italic rounded-2xl gap-3 shadow-xl shadow-white/5 hover:scale-[1.02] transition-all text-xs uppercase"
                            >
                                CHOOSE PAYMENT METHOD <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {/* Step 2: Select Gateway */}
                    {step === 2 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2 text-center">
                                <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Select Gateway</h4>
                                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mt-2 font-mono">Amount to be funded: ${parseFloat(amount).toLocaleString()}</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {/* Crypto */}
                                <button
                                    onClick={() => {
                                        setSelectedMethod('crypto');
                                        setStep(3);
                                    }}
                                    className="flex items-center justify-between p-6 bg-zinc-950 border border-zinc-900 rounded-3xl hover:border-blue-500/50 hover:bg-zinc-900 transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 px-4 py-1.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest -mr-2 mt-2 -rotate-12 group-hover:rotate-0 transition-transform">5% OFF</div>
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform border border-blue-500/20">
                                            <Bitcoin className="w-7 h-7 text-blue-500" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-black text-white italic uppercase tracking-tight">Cryptocurrency</p>
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">BTC / ETH / USDT Mainnet</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-zinc-800" />
                                </button>

                                {/* PayPal */}
                                <button
                                    onClick={() => {
                                        setSelectedMethod('paypal');
                                        setStep(4);
                                    }}
                                    className="flex items-center justify-between p-6 bg-zinc-950 border border-zinc-900 rounded-3xl hover:border-blue-500/50 hover:bg-zinc-900 transition-all group"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform border border-indigo-500/20">
                                            <Send className="w-7 h-7 text-indigo-400" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-black text-white italic uppercase tracking-tight">PayPal Checkout</p>
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Instant Direct Deposit</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-zinc-800" />
                                </button>

                                {/* Credit Card (Disabled) */}
                                <div className="flex items-center justify-between p-6 bg-zinc-900/30 border border-zinc-900 rounded-3xl opacity-50 cursor-not-allowed grayscale">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center">
                                            <CreditCard className="w-7 h-7 text-zinc-600" />
                                        </div>
                                        <div className="text-left">
                                            <div className="flex items-center gap-2">
                                                <p className="font-black text-zinc-600 italic uppercase tracking-tight leading-none">Credit Card</p>
                                                <span className="text-[8px] font-black bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full border border-zinc-700">COMING SOON</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest mt-1 font-mono">STRIPE / VISA CONNECTION</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button variant="ghost" onClick={() => setStep(1)} className="w-full text-zinc-500 font-black text-[10px] uppercase">
                                BACK TO AMOUNT
                            </Button>
                        </div>
                    )}

                    {/* Step 3: Select Asset */}
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

                    {/* Step 4: Finalize Payment */}
                    {step === 4 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            {/* Stats Summary */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Timer className="w-4 h-4 text-blue-500 animate-pulse" />
                                        <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Window</span>
                                    </div>
                                    <p className="text-xl font-black text-white italic">{formatTime(timeLeft)}</p>
                                </div>
                                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-2 text-right">
                                    <div className="flex items-center gap-2 justify-end">
                                        <DollarSign className="w-4 h-4 text-emerald-500" />
                                        <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">To Pay</span>
                                    </div>
                                    <p className="text-xl font-black text-white italic">${amountToPay.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Details Card */}
                            <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <QrCode className="w-24 h-24 text-white" />
                                </div>

                                {selectedMethod === 'crypto' && (
                                    <div className="space-y-6 text-center">
                                        <p className="text-[10px] font-black uppercase text-orange-500 tracking-widest">
                                            {selectedCrypto?.toUpperCase()} Deposit Chain
                                        </p>
                                        <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800 font-mono text-[11px] font-bold text-zinc-300 break-all leading-relaxed">
                                            {selectedCrypto === 'btc' ? paymentConfig?.btcAddress :
                                                selectedCrypto === 'eth' ? paymentConfig?.ethAddress :
                                                    paymentConfig?.usdtAddress || 'FETCHING_NETWORK_UID...'}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleCopy(selectedCrypto === 'btc' ? paymentConfig?.btcAddress : selectedCrypto === 'eth' ? paymentConfig?.ethAddress : paymentConfig?.usdtAddress)}
                                            className="h-12 rounded-xl border-zinc-800 bg-zinc-950 text-[10px] font-black uppercase gap-3 hover:bg-zinc-900 transition-all"
                                        >
                                            <Copy className="w-3.5 h-3.5" /> COPY ADDRESS
                                        </Button>
                                    </div>
                                )}

                                {selectedMethod === 'paypal' && (
                                    <div className="space-y-6 text-center">
                                        <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">PayPal Global Recipient</p>
                                        <button
                                            onClick={() => handleCopy(paymentConfig?.paypalEmail)}
                                            className="text-2xl font-black text-white italic hover:text-blue-500 transition-all tracking-tighter"
                                        >
                                            {paymentConfig?.paypalEmail || 'PAYMENTS@SHOPLINEA.NET'}
                                        </button>
                                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-2 leading-relaxed italic">
                                            Include User ID #{userId.slice(0, 8)} in payment note
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="p-5 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-4">
                                    <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                                    <p className="text-[10px] font-bold text-amber-500/80 leading-relaxed italic uppercase">
                                        Verify your transfer before proceeding. Ads wallet funds are non-refundable and strictly for campaign scaling.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleSubmitPayment}
                                    disabled={submitting}
                                    className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-black italic rounded-2xl gap-3 shadow-xl shadow-blue-500/20 text-xs uppercase"
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : `ACTIVATE FUNDING — $${amountToPay.toLocaleString()}`}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Finalized Success */}
                    {step === 5 && (
                        <div className="text-center py-10 space-y-8 animate-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto shadow-2xl border border-blue-600/20">
                                <CheckCircle2 className="w-12 h-12 text-blue-500" />
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Transmission Peak</h4>
                                <p className="text-sm font-bold text-zinc-500 leading-relaxed max-w-sm mx-auto capitalize">
                                    Your funding request has reached the verification terminal. Your ad credits + <span className="text-emerald-500">${bonus} bonus</span> will be propagated within 15 minutes.
                                </p>
                            </div>
                            <Button
                                onClick={onClose}
                                className="w-full h-14 bg-zinc-900 border border-zinc-800 text-white font-black italic rounded-2xl hover:bg-zinc-800 transition-all text-xs uppercase"
                            >
                                RETURN TO COMMAND CENTER
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const Megaphone = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8 a3 3 0 1 1-5.8-1.6" /></svg>
);

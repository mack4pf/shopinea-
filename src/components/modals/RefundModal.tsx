"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Landmark, CheckCircle2, AlertCircle, Coins } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { toast } from "sonner";

interface RefundModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    availableBalance: number;
    currencySymbol: string;
}

export default function RefundModal({ isOpen, onClose, userId, availableBalance, currencySymbol }: RefundModalProps) {
    const [amount, setAmount] = useState("");
    const [details, setDetails] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    const handleRefund = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (Number(amount) > availableBalance) {
            toast.error("Insufficient available balance");
            return;
        }

        if (!details.trim()) {
            toast.error("Please provide payment details for the refund");
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, "transactions"), {
                userId,
                type: "refund_request",
                amount: Number(amount),
                status: "pending",
                method: "manual_transfer",
                description: `Refund Request to: ${details}`,
                details: details,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            setStep(2);
        } catch (error) {
            console.error("Error creating refund request:", error);
            toast.error("Failed to submit refund request");
        } finally {
            setLoading(false);
        }
    };

    if (step === 2) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Request Received">
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-[2.5rem] flex items-center justify-center text-emerald-600">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tight leading-none mb-1">Refund Logic Applied</h3>
                        <p className="text-sm font-bold text-slate-700 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                            Your refund is being processed. It would take up to 1 to 2 business days to review and process your refund.
                        </p>
                    </div>
                    <Button onClick={() => {
                        onClose();
                        setStep(1);
                        setAmount("");
                        setDetails("");
                    }} className="w-full bg-slate-900 dark:bg-white text-white dark:text-black font-black h-14 rounded-2xl shadow-xl active:scale-95 transition-all uppercase text-xs">
                        CLOSE CONSOLE
                    </Button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Request Refund"
            description="Withdraw your deposited funds back to your original source."
        >
            <div className="space-y-6 text-slate-900 dark:text-white">
                <div className="bg-slate-50 dark:bg-zinc-950 p-8 rounded-[2rem] border border-slate-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8">
                        <Coins className="w-10 h-10 text-blue-500/10" />
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-black uppercase tracking-[0.25em] mb-2 leading-none">Net Liquid Balance</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic">{currencySymbol}{availableBalance.toLocaleString()}</p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-3">
                        <Label className="text-slate-400 dark:text-zinc-500 font-black text-[10px] uppercase tracking-widest pl-1">Target Amount for Refund</Label>
                        <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 font-black text-lg">{currencySymbol}</span>
                            <Input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-10 h-16 font-black text-2xl bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white rounded-[1.5rem] focus:ring-blue-600 shadow-sm"
                                placeholder="0.00"
                                max={availableBalance}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-slate-400 dark:text-zinc-500 font-black text-[10px] uppercase tracking-widest pl-1">Destination Credentials</Label>
                        <Textarea
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            className="min-h-[140px] font-bold bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white rounded-[1.5rem] p-5 focus:ring-blue-600 shadow-sm text-sm"
                            placeholder={"Enter Bank Details OR Crypto Wallet Address..."}
                        />
                        <div className="flex gap-4 p-5 bg-blue-500/5 border border-blue-500/10 rounded-3xl animate-in slide-in-from-bottom-2 duration-500">
                            <Landmark className="w-5 h-5 text-blue-500 flex-shrink-0" />
                            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold leading-relaxed italic">
                                Please ensure destination info is 100% correct. Manual settlements cannot be reversed once processed by the bank.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <Button variant="outline" className="flex-1 h-16 rounded-2xl text-slate-400 dark:text-zinc-500 font-black uppercase text-[10px] tracking-widest hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-zinc-800 transition-all" onClick={onClose}>ABORT</Button>
                    <Button
                        className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-black h-16 rounded-2xl shadow-2xl shadow-blue-500/20 active:scale-95 transition-all text-xs uppercase"
                        onClick={handleRefund}
                        disabled={loading || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || !details.trim() || parseFloat(amount) > availableBalance}
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "EXECUTE REFUND"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Wallet, 
    ArrowUpRight, 
    ShieldCheck, 
    Loader2,
    AlertCircle
} from "lucide-react";
import { doc, addDoc, collection, serverTimestamp, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { toast } from "sonner";

interface WithdrawFundsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    availableBalance: number;
    payoutMethods: any[];
    userEmail: string;
}

export default function WithdrawFundsModal({ 
    isOpen, 
    onClose, 
    userId, 
    availableBalance,
    payoutMethods,
    userEmail
}: WithdrawFundsModalProps) {
    const [amount, setAmount] = useState("");
    const [selectedMethodId, setSelectedMethodId] = useState("");
    const [loading, setLoading] = useState(false);

    const handleWithdraw = async () => {
        const withdrawAmount = parseFloat(amount);
        
        if (!withdrawAmount || withdrawAmount <= 0) {
            toast.error("Please enter a valid amount.");
            return;
        }

        if (withdrawAmount > availableBalance) {
            toast.error("Insufficient balance.");
            return;
        }

        if (!selectedMethodId) {
            toast.error("Please select a payout method.");
            return;
        }

        const selectedMethod = payoutMethods.find(m => m.id === selectedMethodId);

        setLoading(true);
        try {
            // 1. Create Payout Request
            const payoutRef = await addDoc(collection(db, "payouts"), {
                userId,
                amount: withdrawAmount,
                methodId: selectedMethodId,
                method: selectedMethod.label,
                methodType: selectedMethod.type,
                status: "pending",
                createdAt: serverTimestamp()
            });

            // 2. Deduct from user's payoutBalance
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                payoutBalance: increment(-withdrawAmount)
            });

            // 3. Send Email Notification
            await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'custom',
                    to: userEmail,
                    data: {
                        subject: "Withdrawal Request Received",
                        html: `
                            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
                                <h2 style="color: #2563eb;">Withdrawal Requested</h2>
                                <p>We have received your withdrawal request for <strong>$${withdrawAmount}</strong>.</p>
                                <p><strong>Method:</strong> ${selectedMethod.label} (${selectedMethod.type.toUpperCase()})</p>
                                <p><strong>Status:</strong> Pending Manual Verification</p>
                                <hr/>
                                <p style="font-size: 12px; color: #666;">Requests are typically processed within 24-48 business hours.</p>
                            </div>
                        `
                    }
                })
            });

            toast.success("Withdrawal request submitted for review!");
            onClose();
            setAmount("");
        } catch (error) {
            console.error(error);
            toast.error("Failed to process withdrawal.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Withdraw Earnings"
            description="Transfer your available profits to your linked accounts."
        >
            <div className="space-y-6">
                <div className="bg-zinc-950 p-6 rounded-[2rem] border border-zinc-800 text-center space-y-2">
                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Available for Payout</p>
                    <h3 className="text-4xl font-black text-white italic tracking-tighter">${availableBalance.toLocaleString()}</h3>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Withdrawal Amount (USD)</Label>
                        <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 font-black">$</span>
                            <Input 
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-10 h-14 bg-zinc-950 border-zinc-800 rounded-2xl font-bold text-white text-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Select Payout Method</Label>
                        {payoutMethods.length === 0 ? (
                            <div className="p-6 border-2 border-dashed border-zinc-800 rounded-2xl text-center">
                                <p className="text-[10px] font-black text-zinc-500 uppercase">No payout methods available</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {payoutMethods.map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => setSelectedMethodId(m.id)}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                            selectedMethodId === m.id 
                                            ? 'bg-blue-600/10 border-blue-500 text-blue-500' 
                                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 grayscale hover:grayscale-0'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Wallet className="w-4 h-4" />
                                            <div className="text-left">
                                                <p className="text-sm font-black text-white">{m.label}</p>
                                                <p className="text-[9px] font-bold opacity-50 uppercase tracking-widest">{m.type}</p>
                                            </div>
                                        </div>
                                        {selectedMethodId === m.id && <ShieldCheck className="w-4 h-4" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <Button 
                        onClick={handleWithdraw}
                        disabled={loading || !amount || !selectedMethodId}
                        className="w-full h-14 bg-white text-black font-black rounded-2xl flex gap-3 hover:scale-[1.02] transition-transform shadow-xl shadow-white/5 uppercase text-xs"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                <ArrowUpRight className="w-5 h-5" />
                                AUTHORIZE WITHDRAWAL
                            </>
                        )}
                    </Button>
                    
                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <p className="text-[9px] font-medium text-amber-200/60 leading-relaxed">
                            Payouts are manually verified. Requesting multiple withdrawals of small amounts may delay processing.
                        </p>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

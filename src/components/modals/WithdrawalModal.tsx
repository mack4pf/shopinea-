"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    AlertCircle, 
    Wallet, 
    CheckCircle2, 
    Loader2, 
    Coins, 
    ArrowRight, 
    ShieldCheck,
    Building2,
    Bitcoin,
    ArrowLeft,
    HandIcon
} from "lucide-react";
import { addDoc, collection, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { toast } from "sonner";
import { AdDepositModal } from "@/components/modals/AdDepositModal";

interface WithdrawalModalProps {
    isOpen: boolean;
    onClose: () => void;
    userData: any;
    currencySymbol: string;
    onSuccess: () => void;
}

export default function WithdrawalModal({ isOpen, onClose, userData, currencySymbol, onSuccess }: WithdrawalModalProps) {
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Amount & Method Selection, 2: Details, 3: Success
    const [selectedMethod, setSelectedMethod] = useState<any>(null);
    const [showAdDeposit, setShowAdDeposit] = useState(false);

    const availableBalance = userData?.payoutBalance || 0;
    const lockedBalance = userData?.pendingPayout || 0;
    const adDebt = userData?.pendingAdDebt || 0;
    const minWithdrawal = 500; // Lowered for better accessibility

    const payoutMethods = userData?.payoutMethods || [];

    const handleWithdraw = async () => {
        const numAmount = parseFloat(amount);
        const totalNeeded = numAmount + adDebt;

        if (numAmount < minWithdrawal) {
            toast.error(`Minimum withdrawal is ${currencySymbol}${minWithdrawal.toLocaleString()}`);
            return;
        }
        if (totalNeeded > availableBalance) {
            toast.error(`Insufficient balance. You have a pending ad debt of ${currencySymbol}${adDebt.toLocaleString()}.`);
            return;
        }
        if (!selectedMethod) {
            toast.error("Please select a payout method.");
            return;
        }

        setLoading(true);
        try {
            // 1. Create Payout Request
            const payoutDocRef = await addDoc(collection(db, "payouts"), {
                userId: userData.uid,
                userName: userData.displayName || userData.fullName || "Merchant",
                amount: numAmount,
                status: "pending",
                method: selectedMethod.type,
                methodLabel: selectedMethod.label,
                methodDetails: selectedMethod,
                createdAt: serverTimestamp()
            });

            // 2. Log Transaction
            await addDoc(collection(db, "transactions"), {
                payoutId: payoutDocRef.id,
                userId: userData.uid,
                type: "withdrawal",
                amount: numAmount,
                status: "pending",
                description: `Withdrawal request to ${selectedMethod.label}`,
                createdAt: serverTimestamp()
            });

            // 3. Update User Balance
            await updateDoc(doc(db, "users", userData.uid), {
                payoutBalance: increment(-totalNeeded),
                totalWithdrawn: increment(numAmount),
                pendingAdDebt: 0 
            });

            // 4. Send Confirmation Email
            if (userData?.email) {
                await fetch("/api/send-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "custom",
                        to: userData.email,
                        from: "Shoplinea Finance <billing@shoplinea.shop>",
                        data: {
                            subject: "Withdrawal Request Received",
                            html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
                                <h2 style="color: #111827; margin-bottom: 16px;">Withdrawal Request Received</h2>
                                <p style="color: #4b5563; line-height: 1.6;">Your withdrawal request for <strong>${currencySymbol}${numAmount.toLocaleString()}</strong> has been successfully received.</p>
                                <p style="color: #4b5563; line-height: 1.6;">Your funds are on their way to your selected payout destination (${selectedMethod.label}). Expected settlement is within 24-48 business hours.</p>
                            </div>`
                        }
                    })
                });
            }

            setStep(3);
            onSuccess();
        } catch (error) {
            console.error("Withdrawal error:", error);
            toast.error("Withdrawal failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (step === 3) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Request Processed">
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-8 animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center text-emerald-500 shadow-2xl shadow-emerald-500/20 border border-emerald-500/20">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Transmission Sent</h3>
                        <p className="text-[11px] font-bold text-zinc-500 max-w-[280px] mx-auto leading-relaxed uppercase tracking-widest italic">
                            Your withdrawal request has been broadcasted to our compliance nodes. Expected settlement within 24-48 business hours.
                        </p>
                    </div>
                    <Button onClick={onClose} className="w-full bg-white text-black font-black h-16 rounded-2xl shadow-2xl active:scale-95 transition-all text-[11px] uppercase tracking-widest italic border-b-4 border-zinc-300 active:border-b-0">
                        ACKNOWLEDGE & CLOSE
                    </Button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Capital Withdrawal"
        >
            <div className="space-y-8 py-4">
                {/* Balance Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10" />
                        <p className="text-[9px] font-black uppercase text-emerald-500 mb-2 leading-none tracking-[0.2em] relative z-10">Liquid Assets</p>
                        <p className="text-2xl font-black text-white tracking-tighter italic relative z-10">{currencySymbol}{availableBalance.toLocaleString()}</p>
                    </div>
                    <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-[2rem] shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-zinc-500/5 rounded-full blur-2xl -mr-10 -mt-10" />
                        <p className="text-[9px] font-black uppercase text-zinc-600 mb-2 leading-none tracking-[0.2em] relative z-10">Escrow Locked</p>
                        <p className="text-2xl font-black text-zinc-500 tracking-tighter italic relative z-10">{currencySymbol}{lockedBalance.toLocaleString()}</p>
                    </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-4">
                    <Label className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.3em] pl-1">Amount to De-route</Label>
                    <div className="relative group">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-zinc-600 text-xl group-focus-within:text-blue-500 transition-colors">{currencySymbol}</span>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="h-20 pl-14 bg-zinc-950 border-zinc-800 rounded-[1.8rem] font-black text-3xl text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-inner transition-all italic placeholder:text-zinc-800"
                        />
                    </div>
                    <div className="flex justify-between px-2">
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Min Limit: {currencySymbol}{minWithdrawal.toLocaleString()}</p>
                        {parseFloat(amount) > availableBalance && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest animate-pulse">Insufficient Liquidity</p>}
                    </div>
                </div>

                {/* Ad Debt Alert / Block */}
                {adDebt > 0 ? (
                    <div className="space-y-6 text-center py-10 animate-in slide-in-from-top-4 duration-500">
                        <AlertCircle className="w-16 h-16 text-rose-500 mx-auto" />
                        <div>
                            <h3 className="text-3xl font-black text-rose-500 tracking-tighter italic uppercase">Outstanding Ad Debt</h3>
                            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-2 max-w-xs mx-auto">
                                You currently owe {currencySymbol}{adDebt.toLocaleString()} for postpaid ad campaigns. You must clear this balance before initiating any withdrawals.
                            </p>
                        </div>
                        <Button 
                            onClick={() => setShowAdDeposit(true)} 
                            className="h-16 px-10 rounded-[1.5rem] bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-rose-500/20 active:scale-95 transition-all mt-6"
                        >
                            CLEAR AD DEBT NOW
                        </Button>
                        <AdDepositModal 
                            isOpen={showAdDeposit} 
                            onClose={() => { setShowAdDeposit(false); onClose(); }} 
                            userId={userData?.uid} 
                            requiredDebtAmount={adDebt} 
                        />
                    </div>
                ) : (
                    <>
                        {/* Method Selection */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <Label className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.3em]">Payout Destination</Label>
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            </div>
                            
                            {payoutMethods.length > 0 ? (
                                <div className="grid grid-cols-1 gap-3">
                                    {payoutMethods.map((m: any, idx: number) => (
                                        <button
                                            key={m.id || `method-${idx}`}
                                            onClick={() => setSelectedMethod(m)}
                                            className={`w-full p-6 rounded-[1.5rem] border-2 transition-all flex items-center justify-between text-left group shadow-sm ${selectedMethod?.id === m.id ? 'border-blue-600 bg-blue-600/10 shadow-2xl shadow-blue-600/10' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl ${m.type === 'crypto' ? 'bg-orange-500' : 'bg-blue-600'}`}>
                                                    {m.type === 'crypto' ? <Bitcoin className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-white leading-none mb-1.5 group-hover:translate-x-1 transition-transform uppercase italic tracking-tight">{m.label}</p>
                                                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">{m.type === 'crypto' ? m.network : m.bankName} • SECURED</p>
                                                </div>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedMethod?.id === m.id ? 'border-blue-600 bg-blue-600 text-white' : 'border-zinc-700'}`}>
                                                {selectedMethod?.id === m.id && <CheckCircle2 className="w-4 h-4" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-10 bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-[2rem] text-center space-y-4">
                                     <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                                        <HandIcon className="w-8 h-8 text-zinc-600" />
                                     </div>
                                     <div className="space-y-1">
                                        <h4 className="text-[11px] font-black text-white uppercase tracking-widest italic">No Destination Configured</h4>
                                        <p className="text-[10px] font-bold text-zinc-600 max-w-[220px] mx-auto leading-relaxed uppercase italic">Please navigate to Registry Settings to authorize a payout node.</p>
                                     </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-4">
                            <Button
                                onClick={handleWithdraw}
                                disabled={loading || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || !selectedMethod || parseFloat(amount) > availableBalance || parseFloat(amount) < minWithdrawal}
                                className="w-full h-20 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-[2rem] shadow-2xl shadow-blue-500/30 active:scale-95 transition-all text-[11px] uppercase tracking-[0.3em] italic gap-4 flex border-b-4 border-blue-800 active:border-b-0"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
                                    <>
                                        INITIALIZE TRANSFER
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </Button>
                            <p className="text-center mt-6 text-[9px] font-black text-zinc-700 uppercase tracking-widest italic flex items-center justify-center gap-2">
                                <ShieldCheck className="w-3 h-3" />
                                End-to-End Encrypted Payout Protocol
                            </p>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}

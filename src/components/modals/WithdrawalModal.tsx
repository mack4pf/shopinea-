"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Wallet, CheckCircle2, Loader2, Coins, ArrowRight, ShieldCheck } from "lucide-react";
import { addDoc, collection, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { toast } from "sonner";

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
    const [step, setStep] = useState(1);
    const [selectedMethodId, setSelectedMethodId] = useState<string>(userData?.payoutMethod?.id || "");

    const methods = userData?.payoutMethods || (userData?.payoutMethod ? [userData.payoutMethod] : []);
    const selectedMethod = methods.find((m: any) => m.id === selectedMethodId) || methods[0];

    const availableBalance = userData?.payoutBalance || 0;
    const lockedBalance = userData?.pendingPayout || 0;
    const adDebt = userData?.pendingAdDebt || 0;

    const minWithdrawal = 2000;

    const handleWithdraw = async () => {
        const numAmount = parseFloat(amount);
        const totalNeeded = numAmount + adDebt;

        if (numAmount < minWithdrawal) {
            toast.error(`Minimum withdrawal is ${minWithdrawal.toLocaleString()}`);
            return;
        }
        if (totalNeeded > availableBalance) {
            toast.error(`Insufficient balance. You have a pending ad debt of ${currencySymbol}${adDebt.toLocaleString()}.`);
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, "payouts"), {
                userId: userData.uid,
                amount: numAmount,
                status: "pending",
                method: selectedMethod?.type || "unknown",
                methodLabel: selectedMethod?.label || "Unknown",
                methodDetails: selectedMethod || {},
                createdAt: serverTimestamp()
            });

            await addDoc(collection(db, "transactions"), {
                userId: userData.uid,
                type: "withdrawal",
                amount: numAmount,
                status: "pending",
                createdAt: serverTimestamp()
            });

            await updateDoc(doc(db, "users", userData.uid), {
                payoutBalance: increment(-totalNeeded),
                totalWithdrawn: increment(numAmount),
                pendingAdDebt: 0 
            });

            setStep(2);
            onSuccess();
        } catch (error) {
            console.error("Withdrawal error:", error);
            toast.error("Withdrawal failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (step === 2) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Request Received">
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-6 animate-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-[2.5rem] flex items-center justify-center text-emerald-600 shadow-xl shadow-emerald-500/10">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tight italic leading-none mb-1">Withdrawal Initiated</h3>
                        <p className="text-sm font-bold text-slate-700 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                            Your withdraw is being processed. It would take up to 1 to 5 business days to review and process your withdrawal.
                        </p>
                    </div>
                    <Button onClick={onClose} className="w-full bg-slate-900 dark:bg-white text-white dark:text-black font-black h-14 rounded-2xl shadow-xl active:scale-95 transition-all text-xs uppercase">
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
            title="Settle Earnings"
            description="Transfer your unlocked profits to your secure payout method."
        >
            <div className="space-y-8 text-slate-900 dark:text-white">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-[2rem] shadow-sm">
                        <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-500 mb-2 leading-none tracking-widest pl-1">Available Profit</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic">{currencySymbol}{availableBalance.toLocaleString()}</p>
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-[2rem] shadow-sm">
                        <p className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-500 mb-2 leading-none tracking-widest pl-1">Locked Funds</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic">{currencySymbol}{lockedBalance.toLocaleString()}</p>
                    </div>
                </div>

                {lockedBalance > 0 && (
                    <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-3xl flex items-start gap-4 animate-in slide-in-from-top-2 duration-500">
                        <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 leading-relaxed italic">
                            Some funds are locked because of active orders. They will be available for withdrawal once customers receive their items and the escrow period clears.
                        </p>
                    </div>
                )}

                <div className="space-y-4">
                    <Label className="text-slate-400 dark:text-zinc-500 font-black text-[10px] uppercase tracking-widest pl-1">Amount to Transfer</Label>
                    <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400 dark:text-zinc-500 text-lg">{currencySymbol}</span>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="h-16 pl-12 bg-slate-50 dark:bg-zinc-950 border-slate-100 dark:border-zinc-800 rounded-2xl font-black text-2xl text-slate-900 dark:text-white focus:ring-blue-600 shadow-sm"
                        />
                    </div>
                    <div className="flex justify-between px-2">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Min Limit: {currencySymbol}{minWithdrawal.toLocaleString()}</p>
                        {parseFloat(amount) > availableBalance && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest animate-pulse">Insufficient Space</p>}
                    </div>
                </div>

                {adDebt > 0 && (
                    <div className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-3xl flex items-center justify-between shadow-sm animate-in zoom-in duration-300">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500">
                                <Coins className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-rose-500 tracking-widest leading-none mb-1">Postpaid Ad Settlement</p>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 leading-none">Auto-deduction from withdrawal amount</p>
                            </div>
                        </div>
                        <span className="text-lg font-black text-rose-500 italic">-{currencySymbol}{adDebt.toLocaleString()}</span>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <Label className="text-slate-400 dark:text-zinc-500 font-black text-[10px] uppercase tracking-widest">Select Payout Method</Label>
                        <ShieldCheck className="w-4 h-4 text-blue-500" />
                    </div>
                    {methods.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                            {methods.map((m: any) => (
                                <button
                                    key={m.id}
                                    onClick={() => setSelectedMethodId(m.id)}
                                    className={`w-full p-5 rounded-[1.5rem] border-2 transition-all flex items-center justify-between text-left group ${selectedMethodId === m.id ? 'border-blue-600 bg-blue-600/5 shadow-md' : 'border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-slate-300'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${m.type === 'card' ? 'bg-blue-600' : m.type === 'crypto' ? 'bg-orange-600' : 'bg-emerald-600'}`}>
                                            <Wallet className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800 dark:text-white leading-none mb-1 group-hover:translate-x-1 transition-transform">{m.label}</p>
                                            <p className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">{m.type} • Secured</p>
                                        </div>
                                    </div>
                                    {selectedMethodId === m.id && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 bg-rose-500/5 border border-dashed border-rose-500/20 rounded-3xl text-center space-y-2">
                             <h4 className="text-[11px] font-black text-rose-500 uppercase tracking-widest italic">Action Required: No Payout Method</h4>
                             <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-500 max-w-[200px] mx-auto leading-relaxed">Please go to Settings & Registry to link a payout method first.</p>
                        </div>
                    )}
                </div>

                <Button
                    onClick={handleWithdraw}
                    disabled={loading || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || methods.length === 0 || !selectedMethodId || parseFloat(amount) > availableBalance || parseFloat(amount) < minWithdrawal}
                    className="w-full h-18 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-[2rem] shadow-2xl shadow-blue-500/20 active:scale-95 transition-all text-xs uppercase flex gap-4 mt-4"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
                        <>
                            AUTHORIZE TRANSFER
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </Button>
            </div>
        </Modal>
    );
}

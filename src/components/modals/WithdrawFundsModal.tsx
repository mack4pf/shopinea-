"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import {
    Wallet,
    ArrowUpRight,
    ShieldCheck,
    Loader2,
    Clock,
    CheckCircle2,
    CreditCard,
    Building2,
    Banknote,
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

const METHOD_ICON: Record<string, React.ElementType> = {
    bank: Building2,
    paypal: Wallet,
    crypto: Banknote,
    card: CreditCard,
};

export default function WithdrawFundsModal({
    isOpen,
    onClose,
    userId,
    availableBalance,
    payoutMethods,
    userEmail,
}: WithdrawFundsModalProps) {
    const [amount, setAmount] = useState("");
    const [selectedMethodId, setSelectedMethodId] = useState("");
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const parsed = parseFloat(amount) || 0;
    const pct = availableBalance > 0 ? Math.min((parsed / availableBalance) * 100, 100) : 0;
    const quickPcts = [25, 50, 75, 100];

    const handleWithdraw = async () => {
        if (!parsed || parsed <= 0) { toast.error("Enter a valid amount."); return; }
        if (parsed > availableBalance) { toast.error("Amount exceeds available balance."); return; }
        if (!selectedMethodId) { toast.error("Select a payout method."); return; }

        const selectedMethod = payoutMethods.find(m => m.id === selectedMethodId);
        setLoading(true);
        try {
            await addDoc(collection(db, "payouts"), {
                userId, amount: parsed,
                methodId: selectedMethodId,
                method: selectedMethod.label,
                methodType: selectedMethod.type,
                status: "pending",
                createdAt: serverTimestamp(),
            });
            await updateDoc(doc(db, "users", userId), {
                payoutBalance: increment(-parsed),
            });
            await fetch("/api/send-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "custom",
                    to: userEmail,
                    data: {
                        subject: "Withdrawal Request Received",
                        html: `<div style="font-family:sans-serif;padding:20px;border:1px solid #eee"><h2 style="color:#2563eb">Withdrawal Requested</h2><p>We received your withdrawal request for <strong>$${parsed.toFixed(2)}</strong>.</p><p><strong>Method:</strong> ${selectedMethod.label} (${selectedMethod.type.toUpperCase()})</p><p><strong>Status:</strong> Pending Manual Verification</p><hr/><p style="font-size:12px;color:#666">Processed within 24–48 business hours.</p></div>`,
                    },
                }),
            });
            setDone(true);
        } catch (err) {
            console.error(err);
            toast.error("Failed to process withdrawal.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setDone(false);
        setAmount("");
        setSelectedMethodId("");
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="">
            {done ? (
                /* ── Success state ── */
                <div className="flex flex-col items-center justify-center py-8 gap-5 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div className="space-y-1.5">
                        <h3 className="text-lg font-bold text-white">Request Submitted</h3>
                        <p className="text-sm text-zinc-400">Your withdrawal of <span className="text-white font-semibold">${parsed.toFixed(2)}</span> is being reviewed.</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/[0.07] border border-amber-500/20 rounded-xl">
                        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        <p className="text-xs text-amber-300">Typically processed within 24–48 business hours</p>
                    </div>
                    <button onClick={handleClose} className="mt-2 w-full h-11 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-xl text-sm font-semibold text-white transition-colors">
                        Close
                    </button>
                </div>
            ) : (
                <div className="space-y-5 -mt-2">
                    {/* Header */}
                    <div>
                        <h2 className="text-lg font-bold text-white">Withdraw Funds</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">Transfer your available earnings to a linked payout method.</p>
                    </div>

                    {/* Balance card */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent border border-indigo-500/20 p-5">
                        <div className="absolute -top-6 -right-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                        <p className="text-[10px] font-semibold text-indigo-300/60 uppercase tracking-widest mb-1">Available Balance</p>
                        <p className="text-3xl font-bold text-white tracking-tight">${availableBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-[11px] text-indigo-300/40 mt-1">Ready for payout</p>
                    </div>

                    {/* Amount input */}
                    <div className="space-y-2.5">
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Amount (USD)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-zinc-500 pointer-events-none">$</span>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full h-14 pl-9 pr-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-2xl font-bold text-white placeholder:text-zinc-700 outline-none focus:border-indigo-500/50 transition-colors"
                            />
                        </div>
                        {/* Quick % buttons */}
                        <div className="grid grid-cols-4 gap-2">
                            {quickPcts.map(p => (
                                <button
                                    key={p}
                                    onClick={() => setAmount(((availableBalance * p) / 100).toFixed(2))}
                                    className="h-8 rounded-lg bg-white/[0.04] border border-white/[0.07] text-xs font-semibold text-zinc-400 hover:text-white hover:border-indigo-500/40 hover:bg-indigo-500/10 transition-colors"
                                >
                                    {p === 100 ? "Max" : `${p}%`}
                                </button>
                            ))}
                        </div>
                        {/* Progress bar */}
                        {parsed > 0 && (
                            <div className="space-y-1">
                                <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-300 ${parsed > availableBalance ? "bg-rose-500" : "bg-indigo-500"}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-zinc-600">
                                    <span>Withdrawing <span className={parsed > availableBalance ? "text-rose-400" : "text-white"}>${parsed.toFixed(2)}</span></span>
                                    <span>Remaining: <span className="text-white">${Math.max(availableBalance - parsed, 0).toFixed(2)}</span></span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Payout method */}
                    <div className="space-y-2.5">
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Payout Method</label>
                        {payoutMethods.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-8 border border-dashed border-white/[0.08] rounded-xl text-zinc-600">
                                <Wallet className="w-6 h-6" />
                                <p className="text-xs">No payout methods added yet</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {payoutMethods.map(m => {
                                    const Icon = METHOD_ICON[m.type?.toLowerCase()] || Wallet;
                                    const selected = selectedMethodId === m.id;
                                    return (
                                        <button
                                            key={m.id}
                                            onClick={() => setSelectedMethodId(m.id)}
                                            className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                                                selected
                                                    ? "bg-indigo-500/10 border-indigo-500/40"
                                                    : "bg-white/[0.02] border-white/[0.07] hover:border-white/[0.14] hover:bg-white/[0.04]"
                                            }`}
                                        >
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${selected ? "bg-indigo-500/20 border border-indigo-500/30" : "bg-white/[0.05] border border-white/[0.07]"}`}>
                                                <Icon className={`w-4 h-4 ${selected ? "text-indigo-400" : "text-zinc-500"}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-semibold truncate ${selected ? "text-white" : "text-zinc-300"}`}>{m.label}</p>
                                                <p className="text-[10px] text-zinc-600 uppercase tracking-wider mt-0.5">{m.type}</p>
                                            </div>
                                            {selected && (
                                                <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                                                    <ShieldCheck className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Summary row */}
                    {parsed > 0 && selectedMethodId && parsed <= availableBalance && (
                        <div className="flex items-center justify-between px-4 py-3 bg-emerald-500/[0.06] border border-emerald-500/20 rounded-xl">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <p className="text-xs text-emerald-300">Ready to withdraw</p>
                            </div>
                            <p className="text-sm font-bold text-white">${parsed.toFixed(2)}</p>
                        </div>
                    )}

                    {/* CTA */}
                    <button
                        onClick={handleWithdraw}
                        disabled={loading || !parsed || !selectedMethodId || parsed > availableBalance}
                        className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <ArrowUpRight className="w-4 h-4" />
                                Authorize Withdrawal
                            </>
                        )}
                    </button>

                    <div className="flex items-start gap-2.5 px-3 py-2.5 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                        <Clock className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-zinc-600 leading-relaxed">
                            Payouts are manually reviewed. Allow 24–48 business hours for processing. Avoid multiple small requests to prevent delays.
                        </p>
                    </div>
                </div>
            )}
        </Modal>
    );
}

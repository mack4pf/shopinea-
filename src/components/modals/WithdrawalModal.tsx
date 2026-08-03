"use client";

import { useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    AlertCircle,
    Wallet,
    CheckCircle2,
    Loader2,
    ArrowRight,
    ShieldCheck,
    Building2,
    Bitcoin,
    HandIcon,
    KeyRound,
    MessageCircle
} from "lucide-react";
import { addDoc, collection, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { toast } from "sonner";
import AdDepositModal from "@/components/modals/AdDepositModal";
import { useCurrency } from "@/hooks/useCurrency";

const DEFAULT_WITHDRAWAL_MIN_LIMIT = 500;
const SUPPORT_EMAIL = "support@shoplinea.shop";

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
    const [step, setStep] = useState(1); // 1: form, 3: success
    const [selectedMethod, setSelectedMethod] = useState<any>(null);
    const [showAdDeposit, setShowAdDeposit] = useState(false);
    const [withdrawalCode, setWithdrawalCode] = useState("");
    const [payingFromBalance, setPayingFromBalance] = useState(false);
    const currency = useCurrency(userData);

    const availableBalance = userData?.payoutBalance || 0;
    const lockedBalance = userData?.pendingPayout || 0;
    const adDebt = userData?.pendingAdDebt || 0;
    const withdrawalsLocked = !!(userData?.withdrawalsLocked || userData?.payoutLocked);
    const expectedWithdrawalCode = String(userData?.withdrawalCode || "").trim().toUpperCase();
    const customMinWithdrawal = Number(userData?.withdrawalMinLimit);
    const minWithdrawal = Number.isFinite(customMinWithdrawal) && customMinWithdrawal >= 0
        ? customMinWithdrawal
        : DEFAULT_WITHDRAWAL_MIN_LIMIT;

    const payoutMethods = userData?.payoutMethods || [];

    const handleWithdraw = async () => {
        const localAmount = parseFloat(amount);
        const numAmount = currency.toUsd(localAmount);
        const totalNeeded = numAmount + adDebt;

        if (withdrawalsLocked) {
            toast.error("Withdrawals are locked for this account. Please contact support.");
            return;
        }
        if (numAmount < minWithdrawal) {
            toast.error(`Minimum withdrawal is ${currency.money(minWithdrawal)}`);
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
        if (!expectedWithdrawalCode) {
            toast.error(`Contact support at ${SUPPORT_EMAIL} to get your withdrawal verification code.`);
            return;
        }
        if (withdrawalCode.trim().toUpperCase() !== expectedWithdrawalCode) {
            toast.error("Incorrect withdrawal verification code.");
            return;
        }

        setLoading(true);
        try {
            // 1. Create Payout Request
            const payoutDocRef = await addDoc(collection(db, "payouts"), {
                userId: userData.uid,
                userName: userData.displayName || userData.fullName || "Merchant",
                amount: numAmount,
                amountLocal: localAmount,
                currencyCode: currency.currencyCode,
                status: "pending",
                method: selectedMethod.type,
                methodLabel: selectedMethod.label,
                methodDetails: selectedMethod,
                withdrawalCodeVerified: true,
                withdrawalCodeLast4: expectedWithdrawalCode.slice(-4),
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
                withdrawalCodeVerified: true,
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
                                <p style="color: #4b5563; line-height: 1.6;">Your withdrawal request for <strong>${currency.currencySymbol}${localAmount.toLocaleString()} ${currency.currencyCode}</strong> has been successfully received.</p>
                                <p style="color: #4b5563; line-height: 1.6;">Your payout is pending review for the selected destination (${selectedMethod.label}). Your withdrawal verification code was accepted for this request.</p>
                                <p style="color: #4b5563; line-height: 1.6;">Expected settlement is within 24-48 business hours after review.</p>
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

    const handlePayDebtFromBalance = async () => {
        if (availableBalance < adDebt) {
            toast.error("Insufficient balance to cover this.");
            return;
        }
        setPayingFromBalance(true);
        try {
            await updateDoc(doc(db, "users", userData.uid), {
                payoutBalance: increment(-adDebt),
                pendingAdDebt: 0,
            });
            await addDoc(collection(db, "transactions"), {
                userId: userData.uid,
                type: "ad_debt_settlement",
                amount: adDebt,
                status: "completed",
                description: "Postpaid ad balance cleared from wallet balance",
                createdAt: serverTimestamp(),
            });
            toast.success("Ad balance cleared from your wallet.");
            onSuccess();
        } catch (error) {
            console.error("Ad debt settlement error:", error);
            toast.error("Could not clear balance. Please try again.");
        } finally {
            setPayingFromBalance(false);
        }
    };

    if (step === 3) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Request submitted">
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-6 animate-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-slate-950 dark:text-white">Your withdrawal is on its way</h3>
                        <p className="text-sm text-slate-500 dark:text-zinc-500 max-w-[280px] mx-auto leading-relaxed">
                            We&apos;ve received your request and it&apos;s being reviewed by our finance team. Expect it within 24–48 business hours.
                        </p>
                    </div>
                    <Button onClick={onClose} className="w-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-semibold h-12 rounded-xl">
                        Done
                    </Button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Withdraw funds"
            description="Move your available earnings to a linked payout method."
        >
            <div className="space-y-6 py-2">
                {/* Balance Cards */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl">
                        <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5 uppercase tracking-wide">Available</p>
                        <p className="text-xl font-bold text-slate-950 dark:text-white">{currency.money(availableBalance)}</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl">
                        <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-500 mb-1.5 uppercase tracking-wide">Pending</p>
                        <p className="text-xl font-bold text-slate-500 dark:text-zinc-400">{currency.money(lockedBalance)}</p>
                    </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                    <Label className="text-slate-600 dark:text-zinc-400 font-semibold text-xs">Amount</Label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 dark:text-zinc-600 text-lg">{currencySymbol}</span>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="h-14 pl-9 bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-2xl font-bold text-2xl text-slate-950 dark:text-white focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
                        />
                    </div>
                    <div className="flex justify-between px-1">
                        <p className="text-xs text-slate-500 dark:text-zinc-600">Minimum: {currency.money(minWithdrawal)}</p>
                        {currency.toUsd(parseFloat(amount) || 0) > availableBalance && <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">Insufficient balance</p>}
                    </div>
                </div>

                {withdrawalsLocked ? (
                    <div className="space-y-3 text-center py-8">
                        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                        <div>
                            <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">Withdrawals are locked</h3>
                            <p className="text-slate-500 dark:text-zinc-500 text-sm mt-1 max-w-xs mx-auto">
                                This account can&apos;t submit withdrawal requests right now. Contact support for details.
                            </p>
                        </div>
                    </div>
                ) : adDebt > 0 ? (
                    <div className="space-y-5 text-center py-8 animate-in slide-in-from-top-4 duration-500">
                        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                        <div>
                            <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">Outstanding ad balance</h3>
                            <p className="text-slate-500 dark:text-zinc-500 text-sm mt-1 max-w-xs mx-auto">
                                You owe {currency.money(adDebt)} for postpaid ad campaigns. Clear this balance before withdrawing — choose how.
                            </p>
                        </div>

                        <div className="max-w-xs mx-auto w-full space-y-3 text-left">
                            {availableBalance >= adDebt && (
                                <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-4 space-y-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-950 dark:text-white">Pay from my balance</p>
                                        <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 leading-relaxed">
                                            {currency.money(adDebt)} is deducted once from your current balance to fully settle it. That's the only deduction — we don't have standing access to take anything further from your funds after this.
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handlePayDebtFromBalance}
                                        disabled={payingFromBalance}
                                        className="w-full h-11 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-semibold"
                                    >
                                        {payingFromBalance ? <Loader2 className="w-4 h-4 animate-spin" /> : `Pay ${currency.money(adDebt)} from balance`}
                                    </Button>
                                </div>
                            )}

                            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-4 space-y-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-950 dark:text-white">Deposit to clear</p>
                                    <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 leading-relaxed">
                                        {availableBalance < adDebt
                                            ? `Your balance (${currency.money(availableBalance)}) isn't enough to cover this — deposit to clear it instead.`
                                            : "Fund it separately and keep your current balance untouched."}
                                    </p>
                                </div>
                                <Button
                                    onClick={() => setShowAdDeposit(true)}
                                    className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                                >
                                    Deposit {currency.money(adDebt)}
                                </Button>
                            </div>
                        </div>

                        <AdDepositModal
                            isOpen={showAdDeposit}
                            onClose={() => { setShowAdDeposit(false); onClose(); }}
                            userId={userData?.uid}
                            requiredDebtAmount={adDebt}
                            currencySymbol={currency.currencySymbol}
                            currencyCode={currency.currencyCode}
                            exchangeRate={currency.rates[currency.currencyCode] || 1}
                        />
                    </div>
                ) : (
                    <>
                        {/* Method Selection */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-0.5">
                                <Label className="text-slate-600 dark:text-zinc-400 font-semibold text-xs">Payout method</Label>
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            </div>

                            {payoutMethods.length > 0 ? (
                                <div className="grid grid-cols-1 gap-2">
                                    {payoutMethods.map((m: any, idx: number) => (
                                        <button
                                            key={m.id || `method-${idx}`}
                                            onClick={() => setSelectedMethod(m)}
                                            className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between text-left ${selectedMethod?.id === m.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-600/10' : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-slate-300 dark:hover:border-zinc-700'}`}
                                        >
                                            <div className="flex items-center gap-3.5">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${m.type === 'crypto' ? 'bg-orange-500' : 'bg-blue-600'}`}>
                                                    {m.type === 'crypto' ? <Bitcoin className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-950 dark:text-white leading-none mb-1">{m.label}</p>
                                                    <p className="text-xs text-slate-500 dark:text-zinc-600">{m.type === 'crypto' ? m.network : m.bankName}</p>
                                                </div>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedMethod?.id === m.id ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 dark:border-zinc-700'}`}>
                                                {selectedMethod?.id === m.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 bg-slate-50 dark:bg-zinc-950 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl text-center space-y-3">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                                        <HandIcon className="w-6 h-6 text-slate-400 dark:text-zinc-600" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-semibold text-slate-950 dark:text-white">No payout method yet</h4>
                                        <p className="text-xs text-slate-500 dark:text-zinc-600 max-w-[220px] mx-auto leading-relaxed">Add one from Settings before withdrawing.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl border border-lime-300 dark:border-lime-400/25 bg-lime-50 dark:bg-lime-400/10 p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-lime-500 text-slate-950 flex items-center justify-center shrink-0">
                                    <KeyRound className="w-4.5 h-4.5" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Withdrawal verification code</h3>
                                    <p className="text-xs text-slate-600 dark:text-zinc-500 leading-relaxed mt-1">
                                        This one-time code confirms the withdrawal request is really coming from you, so your payout can only go to your own approved destination.
                                    </p>
                                </div>
                            </div>
                            {!expectedWithdrawalCode && (
                                <div className="rounded-xl border border-sky-200 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/10 p-3 space-y-2.5">
                                    <div className="flex items-start gap-2">
                                        <MessageCircle className="w-4 h-4 text-sky-600 dark:text-sky-300 shrink-0 mt-0.5" />
                                        <p className="text-xs text-sky-800 dark:text-sky-100 leading-relaxed">
                                            You don&apos;t have a code yet. Contact support at <span className="font-semibold">{SUPPORT_EMAIL}</span> or open Support Chat to get one.
                                        </p>
                                    </div>
                                    <Link
                                        href="/dashboard/support"
                                        onClick={onClose}
                                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors"
                                    >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                        Go to Support
                                    </Link>
                                </div>
                            )}
                            <Input
                                value={withdrawalCode}
                                onChange={(e) => setWithdrawalCode(e.target.value.toUpperCase())}
                                placeholder="Enter your code"
                                className="h-12 bg-white dark:bg-white text-slate-950 dark:text-slate-950 border-lime-300 rounded-xl font-semibold tracking-widest uppercase placeholder:tracking-normal placeholder:text-slate-400 placeholder:font-normal focus-visible:ring-lime-400"
                                autoComplete="one-time-code"
                            />
                        </div>

                        <div className="pt-1">
                            <Button
                                onClick={handleWithdraw}
                                disabled={loading || withdrawalsLocked || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || !selectedMethod || !withdrawalCode.trim() || currency.toUsd(parseFloat(amount) || 0) > availableBalance || currency.toUsd(parseFloat(amount) || 0) < minWithdrawal}
                                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl gap-2 flex items-center justify-center"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        Request withdrawal
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </Button>
                            <p className="text-center mt-4 text-xs text-slate-400 dark:text-zinc-600 flex items-center justify-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Reviewed by our finance team before payout
                            </p>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}

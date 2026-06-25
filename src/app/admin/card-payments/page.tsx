"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, orderBy, query, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { toast } from "sonner";

export default function CardPaymentsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(collection(db, "transactions"), where("type", "in", ["card_purchase", "deposit", "ad_deposit"]), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setTransactions(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
      } catch (error) {
        console.error(error);
        toast.error("Unable to load card payment records.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, "transactions", id), { status, updatedAt: new Date() });
      setTransactions((prev) => prev.map((item) => item.id === id ? { ...item, status } : item));
      toast.success("Status updated.");
    } catch (error) {
      console.error(error);
      toast.error("Unable to update status.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-6">
        <h1 className="text-2xl font-semibold text-white">Card payments</h1>
        <p className="mt-2 text-sm text-zinc-400">Review pending card-based payments and update their status.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-6">
        {loading ? (
          <p className="text-sm text-zinc-400">Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-zinc-400">No card payment records found.</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{tx.description || tx.type || "Payment"}</p>
                    <p className="text-sm text-zinc-400">{tx.customerEmail || tx.userId || "Unknown user"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{tx.amount ? `$${Number(tx.amount).toFixed(2)}` : "—"}</p>
                    <p className="text-xs capitalize text-zinc-500">{tx.status || "pending"}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => updateStatus(tx.id, "completed")}
                    className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
                  >
                    Mark completed
                  </button>
                  <button
                    onClick={() => updateStatus(tx.id, "declined")}
                    className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300"
                  >
                    Mark declined
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

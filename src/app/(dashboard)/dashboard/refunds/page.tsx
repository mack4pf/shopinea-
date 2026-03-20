"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { RotateCcw, ShieldCheck, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RefundsPage() {
    const [refunds, setRefunds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Fetch Refunds (transactions of type 'refund') or orders with status 'returned'
                try {
                    // For now, let's look for orders with status 'refund_requested' or 'returned'
                    const q = query(
                        collection(db, "orders"),
                        where("resellerId", "==", firebaseUser.uid),
                        where("status", "in", ["refund_requested", "returned", "cancelled"])
                    );
                    const snap = await getDocs(q);
                    setRefunds(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                } catch (e) {
                    console.error(e);
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-12">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-white">Refund Management</h1>
                <p className="text-zinc-500 font-bold text-sm">Handle product returns and POD payment reversals.</p>
            </div>

            {refunds.length === 0 ? (
                <div className="bg-zinc-900 rounded-[2.5rem] border border-zinc-800 p-12 text-center space-y-6 shadow-sm">
                    <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <RotateCcw className="w-10 h-10 text-blue-600" />
                    </div>

                    <h2 className="text-2xl font-bold text-white">No active refund requests</h2>
                    <p className="text-zinc-500 max-w-md mx-auto font-medium">
                        Refunds for Payment on Delivery (POD) orders or customer returns will appear here.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-8">
                        <div className="p-6 bg-zinc-800/50 rounded-3xl border border-zinc-800 text-left space-y-3">
                            <div className="flex items-center gap-2 text-blue-500 font-black text-sm uppercase">
                                <ShieldCheck className="w-4 h-4" />
                                POD Refund Logic
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                For POD orders, you purchase the item first. Once the buyer confirms delivery, you can request an instant refund of your meaningful cost.
                            </p>
                        </div>
                        <div className="p-6 bg-zinc-800/50 rounded-3xl border border-zinc-800 text-left space-y-3">
                            <div className="flex items-center gap-2 text-amber-500 font-black text-sm uppercase">
                                <AlertCircle className="w-4 h-4" />
                                Standard Returns
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                If a customer returns a damaged item within 7 days, funds held in escrow will be reversed.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {refunds.map(r => (
                        <div key={r.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex justify-between items-center">
                            <div>
                                <h3 className="text-white font-bold">Order #{r.id.slice(0, 8)}</h3>
                                <p className="text-zinc-500 text-sm">Status: {r.status}</p>
                            </div>
                            <Button variant="outline" className="text-zinc-400">View Details</Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

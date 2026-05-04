"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { 
    Wallet, 
    Building2, 
    Send, 
    Bitcoin, 
    Zap, 
    ShieldCheck, 
    Loader2,
    Save,
    CreditCard,
    Lock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { onAuthStateChanged } from "firebase/auth";

export default function GatewaysPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [paymentConfig, setPaymentConfig] = useState({
        bankName: "",
        bankAccount: "",
        bankSwift: "",
        paypalEmail: "",
        btcAddress: "",
        ethAddress: "",
        usdtAddress: ""
    });

    const fetchData = async () => {
        try {
            const snap = await getDoc(doc(db, "settings", "payments"));
            if (snap.exists()) setPaymentConfig(snap.data() as any);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (u) {
                const userDoc = await getDoc(doc(db, "users", u.uid));
                if (userDoc.exists() && userDoc.data()?.isAdmin) {
                    fetchData();
                } else {
                    if (typeof window !== 'undefined') window.location.href = '/admin/login';
                }
            } else {
                if (typeof window !== 'undefined') window.location.href = '/admin/login';
            }
        });
        return () => unsub();
    }, []);

    const handleUpdatePaymentConfig = async () => {
        setSaving(true);
        try {
            await updateDoc(doc(db, "settings", "payments"), paymentConfig);
            toast.success("Global Gateway Parameters Updated!");
        } catch (err) {
            toast.error("Failed to save configuration.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-zinc-950">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
    );

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
            <div>
                <h1 className="text-2xl font-bold text-white">Payment Gateways</h1>
                <p className="text-sm text-zinc-500 mt-1">Configure payment methods and deposit addresses.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Bank / PayPal */}
                <div className="bg-white/[0.03] border border-white/[0.06] p-5 rounded-xl space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center">
                            <Building2 className="w-4.5 h-4.5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-white">Bank Transfer</h2>
                            <p className="text-xs text-zinc-500">Banking & PayPal details</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label className="text-xs text-zinc-500">Bank Name</Label>
                            <Input className="bg-white/[0.04] border-white/[0.08] h-10 text-white text-sm" value={paymentConfig.bankName} onChange={(e) => setPaymentConfig({...paymentConfig, bankName: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-zinc-500">Account Number / IBAN</Label>
                            <Input className="bg-white/[0.04] border-white/[0.08] h-10 text-white text-sm" value={paymentConfig.bankAccount} onChange={(e) => setPaymentConfig({...paymentConfig, bankAccount: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-zinc-500">SWIFT / Routing Code</Label>
                            <Input className="bg-white/[0.04] border-white/[0.08] h-10 text-white text-sm" value={paymentConfig.bankSwift} onChange={(e) => setPaymentConfig({...paymentConfig, bankSwift: e.target.value})} />
                        </div>
                        <div className="pt-3 border-t border-white/[0.06] space-y-1">
                            <Label className="text-xs text-zinc-500">PayPal Email</Label>
                            <Input className="bg-white/[0.04] border-white/[0.08] h-10 text-white text-sm" placeholder="paypal@example.com" value={paymentConfig.paypalEmail} onChange={(e) => setPaymentConfig({...paymentConfig, paypalEmail: e.target.value})} />
                        </div>
                    </div>
                </div>

                {/* Crypto */}
                <div className="bg-white/[0.03] border border-white/[0.06] p-5 rounded-xl space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-orange-500/10 rounded-lg flex items-center justify-center">
                            <Bitcoin className="w-4.5 h-4.5 text-orange-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-white">Crypto Wallets</h2>
                            <p className="text-xs text-zinc-500">Wallet addresses for deposits</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label className="text-xs text-zinc-500">Bitcoin (BTC)</Label>
                            <Input className="bg-white/[0.04] border-white/[0.08] h-10 text-white text-sm font-mono" value={paymentConfig.btcAddress} onChange={(e) => setPaymentConfig({...paymentConfig, btcAddress: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-zinc-500">Ethereum (ETH / ERC20)</Label>
                            <Input className="bg-white/[0.04] border-white/[0.08] h-10 text-white text-sm font-mono" value={paymentConfig.ethAddress} onChange={(e) => setPaymentConfig({...paymentConfig, ethAddress: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-zinc-500">USDT (ERC20 / TRC20)</Label>
                            <Input className="bg-white/[0.04] border-white/[0.08] h-10 text-white text-sm font-mono" value={paymentConfig.usdtAddress} onChange={(e) => setPaymentConfig({...paymentConfig, usdtAddress: e.target.value})} />
                        </div>
                        <div className="flex items-start gap-2 p-3 bg-orange-500/5 border border-orange-500/10 rounded-lg mt-2">
                            <Lock className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-orange-400/80">Ensure addresses are on supported networks. Cross-network deposits are non-recoverable.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleUpdatePaymentConfig}
                    disabled={saving}
                    className="h-10 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>
            </div>
        </div>
    );
}

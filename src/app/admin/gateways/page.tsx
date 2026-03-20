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
        <div className="p-8 max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
            <div className="space-y-1">
                <div className="flex items-center gap-3 mb-2">
                    <Wallet className="w-5 h-5 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 leading-none">Financial Config</span>
                </div>
                <h1 className="text-5xl font-black tracking-tight italic uppercase text-white">Global Gateways</h1>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] pl-1">Merchant Inbound Channels • Deposit Routing • Payment Endpoints</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Traditonal Banking Section */}
                <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] space-y-8 shadow-2xl relative overflow-hidden h-fit">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 rounded-full blur-[100px] -mr-40 -mt-40" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 bg-blue-500/10 rounded-[1.5rem] flex items-center justify-center">
                            <Building2 className="w-8 h-8 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white italic tracking-tight leading-none mb-1">Tier 1: Liquidity</h2>
                            <p className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em]">Bank & PayPal Interface</p>
                        </div>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Bank Institution Name</Label>
                                <Input 
                                    className="bg-zinc-950 border-zinc-800 h-14 rounded-2xl font-bold text-white shadow-xl italic" 
                                    value={paymentConfig.bankName}
                                    onChange={(e) => setPaymentConfig({...paymentConfig, bankName: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Account Number / IBAN</Label>
                                <Input 
                                    className="bg-zinc-950 border-zinc-800 h-14 rounded-2xl font-bold text-white shadow-xl" 
                                    value={paymentConfig.bankAccount}
                                    onChange={(e) => setPaymentConfig({...paymentConfig, bankAccount: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Swift / Routing Code</Label>
                                <Input 
                                    className="bg-zinc-950 border-zinc-800 h-14 rounded-2xl font-bold text-white shadow-xl" 
                                    value={paymentConfig.bankSwift}
                                    onChange={(e) => setPaymentConfig({...paymentConfig, bankSwift: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-zinc-800/50">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-indigo-500 tracking-widest pl-1">PayPal Checkout Recipient</Label>
                                <Input 
                                    className="bg-zinc-950 border-indigo-500/10 h-14 rounded-2xl font-bold text-white shadow-xl text-center placeholder:text-zinc-800 focus:border-indigo-500 transition-all" 
                                    placeholder="Enter verified PayPal email"
                                    value={paymentConfig.paypalEmail}
                                    onChange={(e) => setPaymentConfig({...paymentConfig, paypalEmail: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Crypto Assets Section */}
                <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] space-y-8 shadow-2xl relative overflow-hidden h-fit">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/5 rounded-full blur-[100px] -mr-40 -mt-40" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 bg-orange-500/10 rounded-[1.5rem] flex items-center justify-center">
                            <Bitcoin className="w-8 h-8 text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white italic tracking-tight leading-none mb-1">Tier 2: Assets</h2>
                            <p className="text-[10px] font-black uppercase text-orange-500 tracking-[0.2em]">Cold Wallet Addresses</p>
                        </div>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Bitcoin (BTC) Network</Label>
                                <Input 
                                    className="bg-zinc-950 border-zinc-800 h-14 rounded-2xl font-bold text-white shadow-xl" 
                                    value={paymentConfig.btcAddress}
                                    onChange={(e) => setPaymentConfig({...paymentConfig, btcAddress: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Ethereum (ETH / ERC20)</Label>
                                <Input 
                                    className="bg-zinc-950 border-zinc-800 h-14 rounded-2xl font-bold text-white shadow-xl" 
                                    value={paymentConfig.ethAddress}
                                    onChange={(e) => setPaymentConfig({...paymentConfig, ethAddress: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-emerald-500 tracking-widest pl-1">USDT (ERC20 / TRC20)</Label>
                                <Input 
                                    className="bg-zinc-950 border-emerald-500/10 h-14 rounded-2xl font-bold text-emerald-500 shadow-xl placeholder:text-zinc-800 focus:border-emerald-500 transition-all font-mono text-xs" 
                                    value={paymentConfig.usdtAddress}
                                    onChange={(e) => setPaymentConfig({...paymentConfig, usdtAddress: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="bg-orange-500/5 border border-orange-500/10 p-5 rounded-2xl flex gap-4 mt-6">
                            <Lock className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] font-bold text-orange-500/80 uppercase leading-relaxed italic tracking-widest">
                                Ensure all assets are on high-liquidity networks. Cross-network deposits are non-recoverable.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-8">
                <Button 
                    onClick={handleUpdatePaymentConfig}
                    disabled={saving}
                    className="h-16 bg-white text-black font-black italic rounded-3xl gap-4 px-12 shadow-2xl shadow-white/5 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    PROPAGATE GLOBAL PARAMETERS
                </Button>
            </div>
        </div>
    );
}

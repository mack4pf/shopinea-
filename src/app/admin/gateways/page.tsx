"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { 
    Wallet, 
    Building2, 
    Bitcoin, 
    Loader2,
    Save,
    CreditCard,
    Lock,
    Plus,
    Trash2,
    ImageOff
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { onAuthStateChanged } from "firebase/auth";

type PaymentMethod = {
    id: string;
    label: string;
    type: string;
    flow: "deposit" | "withdrawal" | "both";
    destination: string;
    instructions: string;
    logoUrl: string;
    enabled: boolean;
};

const defaultMethod = (label = "New Method"): PaymentMethod => ({
    id: `method-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label,
    type: "custom",
    flow: "deposit",
    destination: "",
    instructions: "",
    logoUrl: "",
    enabled: true,
});

export default function GatewaysPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [paymentConfig, setPaymentConfig] = useState({
        bankName: "",
        bankAccount: "",
        bankSwift: "",
        paypalEmail: "",
        cashappTag: "",
        btcAddress: "",
        ethAddress: "",
        usdtAddress: "",
        paymentMethods: [] as PaymentMethod[],
        extraCryptos: [] as { id: string; name: string; ticker: string; address: string; network: string; enabled: boolean }[],
    });

    const fetchData = async () => {
        try {
            const snap = await getDoc(doc(db, "settings", "payments"));
            if (snap.exists()) {
                const data = snap.data() as any;
                setPaymentConfig(prev => ({
                    ...prev,
                    ...data,
                    paymentMethods: Array.isArray(data.paymentMethods) ? data.paymentMethods : [],
                    extraCryptos: Array.isArray(data.extraCryptos) ? data.extraCryptos : [],
                }));
            }
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
            await setDoc(doc(db, "settings", "payments"), paymentConfig, { merge: true });
            toast.success("Global Gateway Parameters Updated!");
        } catch (err) {
            toast.error("Failed to save configuration.");
        } finally {
            setSaving(false);
        }
    };

    const updateMethod = (id: string, updates: Partial<PaymentMethod>) => {
        setPaymentConfig(prev => ({
            ...prev,
            paymentMethods: prev.paymentMethods.map(method => method.id === id ? { ...method, ...updates } : method),
        }));
    };

    const addMethod = () => {
        setPaymentConfig(prev => ({
            ...prev,
            paymentMethods: [...prev.paymentMethods, defaultMethod()],
        }));
    };

    const removeMethod = (id: string) => {
        setPaymentConfig(prev => ({
            ...prev,
            paymentMethods: prev.paymentMethods.filter(method => method.id !== id),
        }));
    };

    const addCrypto = () => {
        setPaymentConfig(prev => ({
            ...prev,
            extraCryptos: [...prev.extraCryptos, {
                id: `crypto-${Date.now()}`,
                name: "",
                ticker: "",
                address: "",
                network: "",
                enabled: true,
            }],
        }));
    };

    const updateCrypto = (id: string, updates: Partial<typeof paymentConfig.extraCryptos[0]>) => {
        setPaymentConfig(prev => ({
            ...prev,
            extraCryptos: prev.extraCryptos.map(c => c.id === id ? { ...c, ...updates } : c),
        }));
    };

    const removeCrypto = (id: string) => {
        setPaymentConfig(prev => ({
            ...prev,
            extraCryptos: prev.extraCryptos.filter(c => c.id !== id),
        }));
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-zinc-950">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
            <div>
                <h1 className="text-2xl font-bold text-white">Payment Gateways</h1>
                <p className="text-sm text-zinc-500 mt-1">Configure deposit instructions and withdrawal method options.</p>
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
                        <div className="space-y-1">
                            <Label className="text-xs text-zinc-500">Cash App Tag</Label>
                            <Input className="bg-white/[0.04] border-white/[0.08] h-10 text-white text-sm" placeholder="$shopinea" value={paymentConfig.cashappTag} onChange={(e) => setPaymentConfig({...paymentConfig, cashappTag: e.target.value})} />
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

                        {/* Extra crypto wallets */}
                        <div className="pt-2 border-t border-white/[0.06] space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs text-zinc-400 font-semibold">Additional Wallets</Label>
                                <button
                                    type="button"
                                    onClick={addCrypto}
                                    className="h-7 px-3 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                                >
                                    <Plus className="w-3 h-3" /> Add Coin
                                </button>
                            </div>
                            {paymentConfig.extraCryptos.length === 0 && (
                                <p className="text-[11px] text-zinc-600">Add Solana, BNB, TRON, or any custom coin.</p>
                            )}
                            {paymentConfig.extraCryptos.map(c => (
                                <div key={c.id} className="space-y-2 p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-zinc-500">Coin Name</Label>
                                            <Input className="bg-white/[0.04] border-white/[0.08] h-9 text-white text-xs" placeholder="Solana" value={c.name} onChange={e => updateCrypto(c.id, { name: e.target.value })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-zinc-500">Ticker</Label>
                                            <Input className="bg-white/[0.04] border-white/[0.08] h-9 text-white text-xs uppercase" placeholder="SOL" value={c.ticker} onChange={e => updateCrypto(c.id, { ticker: e.target.value.toUpperCase() })} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-zinc-500">Wallet Address</Label>
                                        <Input className="bg-white/[0.04] border-white/[0.08] h-9 text-white text-xs font-mono" placeholder="Wallet address..." value={c.address} onChange={e => updateCrypto(c.id, { address: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-zinc-500">Network / Note (optional)</Label>
                                        <Input className="bg-white/[0.04] border-white/[0.08] h-9 text-white text-xs" placeholder="e.g. Solana Mainnet, BEP-20" value={c.network} onChange={e => updateCrypto(c.id, { network: e.target.value })} />
                                    </div>
                                    <div className="flex items-center justify-between pt-1">
                                        <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                                            <input type="checkbox" checked={c.enabled} onChange={e => updateCrypto(c.id, { enabled: e.target.checked })} className="accent-blue-600" />
                                            Enabled
                                        </label>
                                        <button type="button" onClick={() => removeCrypto(c.id)} className="h-7 px-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/15 text-[11px] font-semibold flex items-center gap-1">
                                            <Trash2 className="w-3 h-3" /> Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-start gap-2 p-3 bg-orange-500/5 border border-orange-500/10 rounded-lg mt-2">
                            <Lock className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-orange-400/80">Ensure addresses are on supported networks. Cross-network deposits are non-recoverable.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.06] p-5 rounded-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-semibold text-white">Custom Payment Methods</h2>
                        <p className="text-xs text-zinc-500 mt-1">Add PIX, cards, PayPal, Cash App, bank, crypto, or any custom method. Deposit methods include admin payment details; withdrawal methods only ask users for their own details.</p>
                    </div>
                    <button
                        type="button"
                        onClick={addMethod}
                        className="h-9 px-4 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Method
                    </button>
                </div>

                {paymentConfig.paymentMethods.length === 0 ? (
                    <div className="py-10 border border-dashed border-white/[0.08] rounded-xl text-center">
                        <CreditCard className="w-7 h-7 text-zinc-600 mx-auto mb-2" />
                        <p className="text-sm text-zinc-500">No custom methods added yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {paymentConfig.paymentMethods.map((method) => (
                            <div key={method.id} className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center overflow-hidden shrink-0">
                                        {method.logoUrl ? (
                                            <img src={method.logoUrl} alt="" className="w-full h-full object-contain p-1.5" />
                                        ) : (
                                            <CreditCard className="w-5 h-5 text-zinc-500" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-zinc-500">Name</Label>
                                            <Input className="bg-white/[0.04] border-white/[0.08] h-10 text-white text-sm" value={method.label} onChange={(e) => updateMethod(method.id, { label: e.target.value })} placeholder="PIX, PayPal, Cash App, Visa Card" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-zinc-500">Type</Label>
                                            <select className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm px-3 outline-none" value={method.type} onChange={(e) => updateMethod(method.id, { type: e.target.value })}>
                                                {["custom", "pix", "bank", "card", "paypal", "cashapp", "crypto", "manual"].map(type => <option key={type} value={type} className="bg-zinc-900">{type}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-zinc-500">Use For</Label>
                                            <select className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm px-3 outline-none" value={method.flow} onChange={(e) => updateMethod(method.id, { flow: e.target.value as PaymentMethod["flow"] })}>
                                                <option value="deposit" className="bg-zinc-900">Deposits</option>
                                                <option value="withdrawal" className="bg-zinc-900">Withdrawals</option>
                                                <option value="both" className="bg-zinc-900">Both</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {method.flow !== "withdrawal" ? (
                                        <div className="space-y-1">
                                            <Label className="text-xs text-zinc-500">Deposit Details</Label>
                                            <Input className="bg-white/[0.04] border-white/[0.08] h-10 text-white text-sm" value={method.destination} onChange={(e) => updateMethod(method.id, { destination: e.target.value })} placeholder="Email, tag, bank info, card instruction, wallet" />
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <Label className="text-xs text-zinc-500">Withdrawal Details</Label>
                                            <div className="h-10 rounded-lg border border-emerald-500/15 bg-emerald-500/5 px-3 flex items-center text-xs text-emerald-300">
                                                User enters their own payout details.
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <Label className="text-xs text-zinc-500">Logo URL</Label>
                                        <div className="flex gap-2">
                                            <Input className="bg-white/[0.04] border-white/[0.08] h-10 text-white text-sm" value={method.logoUrl} onChange={(e) => updateMethod(method.id, { logoUrl: e.target.value })} placeholder="https://..." />
                                            <button type="button" onClick={() => updateMethod(method.id, { logoUrl: "" })} className="w-10 h-10 rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-500 hover:text-white flex items-center justify-center">
                                                <ImageOff className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <Label className="text-xs text-zinc-500">Instructions</Label>
                                        <textarea value={method.instructions} onChange={(e) => updateMethod(method.id, { instructions: e.target.value })} placeholder={method.flow === "withdrawal" ? "Tell users what payout details they should enter, e.g. PIX key, PayPal email, account name." : "Tell users what to include in notes, reference fields, or upload receipts."} className="w-full h-20 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm p-3 outline-none focus:border-blue-500/40 resize-none" />
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                                    <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                                        <input type="checkbox" checked={method.enabled} onChange={(e) => updateMethod(method.id, { enabled: e.target.checked })} className="accent-blue-600" />
                                        Enabled
                                    </label>
                                    <button type="button" onClick={() => removeMethod(method.id)} className="h-9 px-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/15 text-xs font-semibold flex items-center justify-center gap-2">
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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

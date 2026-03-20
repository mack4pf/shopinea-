"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    User,
    Store,
    Lock,
    CreditCard,
    Camera,
    Loader2,
    CheckCircle2,
    Building,
    ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [activeSection, setActiveSection] = useState("Profile");
    const [message, setMessage] = useState("");

    // Form states
    const [formData, setFormData] = useState({
        displayName: "",
        phone: "",
        storeName: "",
        storeSlug: "",
        bankName: "",
        accountNumber: "",
        accountName: ""
    });
    const [host, setHost] = useState("");

    useEffect(() => {
        setHost(window.location.host);
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                const data = userDoc.data();
                setUserData(data);
                if (data) {
                    setFormData({
                        displayName: data.displayName || "",
                        phone: data.phoneNumber || "",
                        storeName: data.storeName || "",
                        storeSlug: data.storeSlug || "",
                        bankName: data.payoutMethod?.bankName || "",
                        accountNumber: data.payoutMethod?.accountNumber || "",
                        accountName: data.payoutMethod?.accountName || ""
                    });
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        setMessage("");

        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                displayName: formData.displayName,
                phoneNumber: formData.phone,
                storeName: formData.storeName,
                storeSlug: formData.storeSlug,
                payoutMethod: {
                    bankName: formData.bankName,
                    accountNumber: formData.accountNumber,
                    accountName: formData.accountName
                }
            });
            setMessage("Settings updated successfully!");
            setTimeout(() => setMessage(""), 3000);
        } catch (error) {
            console.error("Error updating settings:", error);
            setMessage("Failed to update settings.");
        } finally {
            setUpdating(false);
        }
    };

    const sections = [
        { id: "Profile", icon: User, label: "Account Profile" },
        { id: "Store", icon: Store, label: "Storefront Setup" },
        { id: "Billing", icon: CreditCard, label: "Payout Methods" },
        { id: "KYC", icon: ShieldCheck, label: "Identity Verification" },
    ];

    const [kycData, setKycData] = useState({
        fullName: "",
        idType: "Government ID",
        idNumber: ""
    });

    const handleKYCSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                kycStatus: "pending",
                identification: kycData
            });
            setUserData({ ...userData, kycStatus: "pending" });
            setMessage("KYC submitted for review!");
            setUpdating(false);
        } catch (err) {
            console.error(err);
            setUpdating(false);
        }
    };

    if (loading) return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <Lock className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400">Merchant Protocol Setup</span>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter italic leading-none">System Settings</h1>
                    <p className="text-zinc-500 font-extrabold text-sm uppercase tracking-widest leading-relaxed opacity-80 max-w-xl">
                        Configure your operational parameters and authorize internal node transfers.
                    </p>
                </div>
                {message && (
                    <div className="flex items-center gap-3 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-500 font-black text-[10px] uppercase tracking-widest animate-in slide-in-from-right-8 italic shadow-2xl shadow-emerald-500/10">
                        <CheckCircle2 className="w-4 h-4" /> {message}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                <div className="space-y-4">
                    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-[2.5rem] space-y-2 shadow-2xl">
                        {sections.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setActiveSection(s.id)}
                                className={`w-full flex items-center gap-5 px-8 py-5 rounded-[1.8rem] text-[11px] font-black uppercase tracking-[0.25em] transition-all italic ${activeSection === s.id ? 'bg-blue-600 text-white shadow-2xl shadow-blue-500/20 scale-[1.02]' : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
                            >
                                <s.icon className={`w-5 h-5 ${activeSection === s.id ? 'text-white' : 'text-zinc-600'}`} />
                                {s.id}
                            </button>
                        ))}
                    </div>

                    <div className="p-8 bg-zinc-950/50 border border-zinc-800 rounded-[2.5rem] space-y-6 shadow-inner relative overflow-hidden group">
                        <div className="absolute inset-0 bg-blue-500/[0.01] pointer-events-none" />
                        <div className="flex items-center gap-3 relative">
                            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <ShieldCheck className="w-4 h-4 text-blue-500" />
                            </div>
                            <h4 className="text-[10px] font-black text-white uppercase tracking-widest italic leading-none">Status Perimeter</h4>
                        </div>
                        <div className="space-y-4 relative">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest leading-none">
                                <span className="text-zinc-600">Merchant Tier</span>
                                <span className="text-blue-500 italic uppercase">{userData?.planName || "FREEMIUM_MODE"}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest leading-none">
                                <span className="text-zinc-600">KYC Clearance</span>
                                <span className={cn("italic uppercase", userData?.kycStatus === 'verified' ? 'text-emerald-500' : 'text-amber-500')}>{userData?.kycStatus || "PENDING_AUTH"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3 bg-zinc-900 border border-zinc-800 rounded-[3.5rem] p-10 md:p-14 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
                    <form onSubmit={handleSave} className="space-y-12 relative z-10">
                        {activeSection === "Profile" && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
                                <div className="flex items-center gap-8 pb-10 border-b border-zinc-800/50">
                                    <div className="w-28 h-28 rounded-[2.5rem] bg-zinc-950 border-2 border-dashed border-zinc-800 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-500/30 shadow-inner group/avatar relative">
                                        <div className="absolute inset-0 bg-blue-600/[0.02] pointer-events-none" />
                                        <User className="w-12 h-12 text-zinc-700" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                                            <Camera className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Account Identity</h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 italic">Modify core merchant credentials and metadata.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            Legal Full Name
                                        </label>
                                        <Input
                                            value={formData.displayName}
                                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                            className="bg-zinc-950 border-zinc-800 h-16 rounded-[1.2rem] font-black text-xs uppercase tracking-widest px-8 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all italic shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            Transmission Node (Phone)
                                        </label>
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="bg-zinc-950 border-zinc-800 h-16 rounded-[1.2rem] font-black text-xs tracking-widest px-8 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all italic shadow-inner"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === "Store" && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
                                <div className="flex items-center gap-6 pb-10 border-b border-zinc-800/50">
                                    <div className="p-4 bg-blue-600/10 rounded-2xl border border-blue-600/20 shadow-2xl shadow-blue-500/10">
                                        <Store className="w-8 h-8 text-blue-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Storefront Node Setup</h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 italic">Configure your public commerce interface nodes.</p>
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            Merchant Designation (Store Name)
                                        </label>
                                        <Input
                                            value={formData.storeName}
                                            onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                                            className="bg-zinc-950 border-zinc-800 h-16 rounded-[1.2rem] font-black text-xs uppercase tracking-widest px-8 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all italic shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            Public URI Pointer (Store Slug)
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <div className="h-16 px-6 bg-zinc-950 border border-zinc-800 rounded-[1.2rem] flex items-center text-zinc-600 text-[9px] font-black uppercase tracking-widest max-w-[180px] truncate italic shadow-inner">
                                                {host ? `${host}/store/` : 'ALLOCATING...'}
                                            </div>
                                            <Input
                                                value={formData.storeSlug}
                                                onChange={(e) => setFormData({ ...formData, storeSlug: e.target.value })}
                                                className="bg-zinc-950 border-zinc-800 h-16 rounded-[1.2rem] font-black text-xs tracking-widest px-8 flex-1 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all italic shadow-inner"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === "Billing" && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
                                <div className="flex items-center gap-6 pb-10 border-b border-zinc-800/50">
                                    <div className="p-4 bg-emerald-600/10 rounded-2xl border border-emerald-600/20 shadow-2xl shadow-emerald-500/10">
                                        <CreditCard className="w-8 h-8 text-emerald-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Settlement Nodes</h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 italic">Configure financial exit points for profit liquidity.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            Financial Entity (Bank Name)
                                        </label>
                                        <Input
                                            value={formData.bankName}
                                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                            className="bg-zinc-950 border-zinc-800 h-16 rounded-[1.2rem] font-black text-xs uppercase tracking-widest px-8 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all italic shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            Liquidity Pipe (Account Number)
                                        </label>
                                        <Input
                                            value={formData.accountNumber}
                                            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                            className="bg-zinc-950 border-zinc-800 h-16 rounded-[1.2rem] font-black text-xs tracking-widest px-8 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all italic shadow-inner"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-3">
                                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            Node Authorizer (Account Holder)
                                        </label>
                                        <Input
                                            value={formData.accountName}
                                            onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                                            className="bg-zinc-950 border-zinc-800 h-16 rounded-[1.2rem] font-black text-xs uppercase tracking-widest px-8 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all italic shadow-inner"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === "KYC" && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
                                <div className="flex items-center gap-8 pb-10 border-b border-zinc-800/50">
                                    <div className="p-4 bg-indigo-600/10 rounded-2xl border border-indigo-600/20 shadow-2xl shadow-indigo-500/10">
                                        <ShieldCheck className="w-10 h-10 text-indigo-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Security Clearance (KYC)</h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 italic">Verify operational identity to unlock high-volume exit tiers.</p>
                                    </div>
                                </div>

                                {userData?.kycStatus === "verified" ? (
                                    <div className="p-12 bg-emerald-500/5 border border-emerald-500/20 rounded-[3.5rem] flex flex-col items-center text-center space-y-6 shadow-2xl shadow-emerald-500/5 relative overflow-hidden group/done">
                                        <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
                                        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/10 border border-emerald-500/30 scale-110 group-hover/done:scale-125 transition-transform duration-700">
                                            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Operational Authorization: ACTIVE</h4>
                                            <p className="text-[11px] font-black text-emerald-500/60 uppercase tracking-[0.3em] italic">Full merchant node privileges have been synchronized.</p>
                                        </div>
                                    </div>
                                ) : userData?.kycStatus === "pending" ? (
                                    <div className="p-12 bg-blue-500/5 border border-blue-500/20 rounded-[3.5rem] flex flex-col items-center text-center space-y-6 shadow-2xl shadow-blue-500/5 relative overflow-hidden group/wait">
                                        <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
                                        <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/10 border border-blue-500/30">
                                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Auth Stream: IN_PROGRESS</h4>
                                            <p className="text-[11px] font-black text-blue-500/60 uppercase tracking-[0.3em] italic">Our compliance nodes are validating your transmitted documents.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-12 animate-in fade-in duration-700">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                    Legal Identification Name
                                                </label>
                                                <Input
                                                    value={kycData.fullName}
                                                    onChange={(e) => setKycData({ ...kycData, fullName: e.target.value })}
                                                    placeholder="AS PER OFFICIAL DOCUMENT"
                                                    className="bg-zinc-950 border-zinc-800 h-16 rounded-[1.2rem] font-black text-xs uppercase tracking-widest px-8 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all italic shadow-inner"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                    Classification Node
                                                </label>
                                                <select
                                                    value={kycData.idType}
                                                    onChange={(e) => setKycData({ ...kycData, idType: e.target.value })}
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-[1.2rem] h-16 font-black text-[10px] uppercase tracking-[0.25em] px-8 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all italic shadow-inner appearance-none text-white overflow-hidden"
                                                >
                                                    <option>National ID Card</option>
                                                    <option>International Passport</option>
                                                    <option>Driver's License</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2 space-y-3">
                                                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                    Document Serial Pointer
                                                </label>
                                                <Input
                                                    value={kycData.idNumber}
                                                    onChange={(e) => setKycData({ ...kycData, idNumber: e.target.value })}
                                                    placeholder="ENTER SERIAL / DOCUMENT IDENTIFIER"
                                                    className="bg-zinc-950 border-zinc-800 h-16 rounded-[1.2rem] font-black text-xs tracking-widest px-8 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all italic shadow-inner"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={handleKYCSubmit}
                                            disabled={updating || !kycData.fullName || !kycData.idNumber}
                                            className="w-full h-20 bg-white text-black font-black italic rounded-[2rem] gap-4 shadow-2xl shadow-white/5 active:scale-95 transition-all text-[11px] uppercase tracking-[0.3em] border-b-4 border-zinc-300 active:border-b-0"
                                        >
                                            {updating ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                                <>
                                                    <ShieldCheck className="w-6 h-6" />
                                                    INITIATE AUTH_STREAM_01
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeSection !== "KYC" && (
                            <div className="pt-14 border-t border-zinc-800/50 flex justify-end">
                                <Button 
                                    type="submit" 
                                    disabled={updating} 
                                    className="bg-blue-600 hover:bg-blue-700 h-18 px-14 rounded-[1.5rem] font-black text-[11px] tracking-[0.3em] shadow-2xl shadow-blue-500/20 active:scale-95 transition-all italic border-b-4 border-blue-800 active:border-b-0"
                                >
                                    {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : "COMMIT NODE UPDATES"}
                                </Button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}

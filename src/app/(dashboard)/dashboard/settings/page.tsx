"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
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
    ShieldCheck,
    Plus,
    Trash2,
    Building2,
    Bitcoin,
    Globe,
    Smartphone,
    Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [activeSection, setActiveSection] = useState("Profile");
    const [message, setMessage] = useState("");

    // Multi-Payout State
    const [isAddPayoutModalOpen, setIsAddPayoutModalOpen] = useState(false);
    const [newPayout, setNewPayout] = useState({
        type: "bank",
        label: "",
        bankName: "",
        accountNumber: "",
        accountName: "",
        network: "USDT_TRC20",
        address: ""
    });

    // Form states
    const [formData, setFormData] = useState({
        displayName: "",
        phone: "",
        storeName: "",
        storeSlug: "",
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
                setUserData({ id: userDoc.id, ...data });
                if (data) {
                    setFormData({
                        displayName: data.displayName || "",
                        phone: data.phoneNumber || "",
                        storeName: data.storeName || "",
                        storeSlug: data.storeSlug || "",
                    });
                    setKycData(data.identification || {
                        fullName: "",
                        idType: "Government ID",
                        idNumber: "",
                        documentImage: ""
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
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                displayName: formData.displayName,
                phoneNumber: formData.phone,
                storeName: formData.storeName,
                storeSlug: formData.storeSlug,
            });
            toast.success("Settings updated successfully!");
        } catch (error) {
            console.error("Error updating settings:", error);
            toast.error("Failed to update settings.");
        } finally {
            setUpdating(false);
        }
    };

    const handleAddPayout = async () => {
        if (!newPayout.label) {
            toast.error("Please enter a label for this payout method.");
            return;
        }
        setUpdating(true);
        try {
            const method = {
                id: Math.random().toString(36).substr(2, 9),
                ...newPayout,
                createdAt: new Date().toISOString()
            };
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                payoutMethods: arrayUnion(method)
            });
            setUserData((prev: any) => ({
                ...prev,
                payoutMethods: [...(prev.payoutMethods || []), method]
            }));
            setIsAddPayoutModalOpen(false);
            setNewPayout({
                type: "bank",
                label: "",
                bankName: "",
                accountNumber: "",
                accountName: "",
                network: "USDT_TRC20",
                address: ""
            });
            toast.success("Payout method added!");
        } catch (err) {
            toast.error("Failed to add payout method.");
        } finally {
            setUpdating(false);
        }
    };

    const handleRemovePayout = async (method: any) => {
        setUpdating(true);
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                payoutMethods: arrayRemove(method)
            });
            setUserData((prev: any) => ({
                ...prev,
                payoutMethods: prev.payoutMethods.filter((m: any) => m.id !== method.id)
            }));
            toast.success("Payout method removed.");
        } catch (err) {
            toast.error("Failed to remove payout method.");
        } finally {
            setUpdating(false);
        }
    };

    const sections = [
        { id: "Profile", icon: User, label: "Account Profile" },
        { id: "Store", icon: Store, label: "Storefront Setup" },
        { id: "Payout", icon: CreditCard, label: "Payout Methods" },
        { id: "KYC", icon: ShieldCheck, label: "Identity Verification" },
    ];

    const [kycData, setKycData] = useState({
        fullName: "",
        idType: "Government ID",
        idNumber: "",
        documentImage: ""
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
            toast.success("KYC submitted for review!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to submit KYC.");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <Lock className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400">Node Configuration Terminal</span>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter italic leading-none uppercase">Registry</h1>
                    <p className="text-zinc-500 font-extrabold text-sm uppercase tracking-widest leading-relaxed opacity-80 max-w-xl">
                        Manage your operational credentials, storefront nodes, and payout routing matrix.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                {/* Sidebar Navigation */}
                <div className="space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-[2.5rem] space-y-2 shadow-2xl">
                        {sections.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setActiveSection(s.id)}
                                className={cn(
                                    "w-full flex items-center gap-5 px-8 py-5 rounded-[1.8rem] text-[11px] font-black uppercase tracking-[0.25em] transition-all italic",
                                    activeSection === s.id 
                                        ? "bg-blue-600 text-white shadow-2xl shadow-blue-500/20 scale-[1.02]" 
                                        : "text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/50"
                                )}
                            >
                                <s.icon className={cn("w-5 h-5", activeSection === s.id ? "text-white" : "text-zinc-600")} />
                                {s.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-8 bg-zinc-950/50 border border-zinc-800 rounded-[2.5rem] space-y-6 shadow-inner">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="w-4 h-4 text-blue-500" />
                            <h4 className="text-[9px] font-black text-white uppercase tracking-widest italic">Security Status</h4>
                        </div>
                        <div className="space-y-4 pt-2">
                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                <span className="text-zinc-600">Merchant Tier</span>
                                <span className="text-blue-500 italic">{userData?.planName || "FREEMIUM"}</span>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                <span className="text-zinc-600">KYC Status</span>
                                <span className={cn("italic", userData?.kycStatus === 'verified' ? 'text-emerald-500' : 'text-amber-500')}>
                                    {userData?.kycStatus?.toUpperCase() || "UNVERIFIED"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3 bg-zinc-900 border border-zinc-800 rounded-[3.5rem] p-10 md:p-14 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
                    
                    <form onSubmit={handleSave} className="space-y-12 relative z-10">
                        {/* PROFILE SECTION */}
                        {activeSection === "Profile" && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
                                <div className="flex items-center gap-8 pb-10 border-b border-zinc-800/20">
                                    <div className="w-28 h-28 rounded-[2.5rem] bg-zinc-950 border-2 border-dashed border-zinc-800 flex items-center justify-center overflow-hidden transition-all hover:border-blue-500/30 group/avatar relative">
                                        <User className="w-12 h-12 text-zinc-700" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                                            <Camera className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Merchant Identity</h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 italic">Configure your nodal identification parameters.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] pl-1">Full Legal Designation</Label>
                                        <Input
                                            value={formData.displayName}
                                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                            className="bg-zinc-950 border-zinc-800 h-16 rounded-[1.2rem] font-black text-white text-xs uppercase tracking-[0.1em] px-8 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all italic shadow-inner"
                                            placeholder="E.G. JOHN DOE"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] pl-1">Communication Node (Phone)</Label>
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="bg-zinc-950 border-zinc-800 h-16 rounded-[1.2rem] font-black text-white text-xs tracking-[0.1em] px-8 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all italic shadow-inner"
                                            placeholder="+1 234 567 890"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STORE SECTION */}
                        {activeSection === "Store" && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
                                <div className="flex items-center gap-6 pb-10 border-b border-zinc-800/20">
                                    <div className="p-5 bg-blue-600/10 rounded-2xl border border-blue-600/20">
                                        <Store className="w-8 h-8 text-blue-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Storefront Node</h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 italic">Configure your public-facing commerce hub.</p>
                                    </div>
                                </div>
                                <div className="space-y-10">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] pl-1">Store Front Designation</Label>
                                        <Input
                                            value={formData.storeName}
                                            onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                                            className="bg-zinc-950 border-zinc-800 h-16 rounded-[1.2rem] font-black text-white text-xs uppercase tracking-[0.1em] px-8 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all italic shadow-inner"
                                            placeholder="ELITE MERCHANT CO."
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] pl-1">Public URI Pointer (SLUG)</Label>
                                        <div className="flex items-center gap-4">
                                            <div className="h-16 px-8 bg-zinc-950 border border-zinc-800 rounded-[1.2rem] flex items-center text-zinc-700 text-[10px] font-black uppercase tracking-widest italic shadow-inner whitespace-nowrap overflow-hidden max-w-[200px]">
                                                {host ? `${host}/` : 'ALLOCATING...'}
                                            </div>
                                            <Input
                                                value={formData.storeSlug}
                                                onChange={(e) => setFormData({ ...formData, storeSlug: e.target.value })}
                                                className="bg-zinc-950 border-zinc-800 h-16 rounded-[1.2rem] font-black text-white text-xs tracking-widest px-8 flex-1 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all italic shadow-inner"
                                                placeholder="my-store-node"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PAYOUT SECTION */}
                        {activeSection === "Payout" && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700 pb-10">
                                <div className="flex items-center justify-between pb-10 border-b border-zinc-800/20">
                                    <div className="flex items-center gap-6">
                                        <div className="p-5 bg-emerald-600/10 rounded-2xl border border-emerald-600/20">
                                            <CreditCard className="w-8 h-8 text-emerald-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Payout Matrix</h3>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 italic">Manage your financial de-routing destinations.</p>
                                        </div>
                                    </div>
                                    <Button 
                                        type="button"
                                        onClick={() => setIsAddPayoutModalOpen(true)}
                                        className="h-14 bg-white text-black font-black italic rounded-[1.2rem] px-8 gap-3 hover:scale-105 active:scale-95 transition-all text-[10px] uppercase tracking-widest border-b-4 border-zinc-300 active:border-b-0"
                                    >
                                        <Plus className="w-4 h-4" />
                                        ADD NODE
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {(userData?.payoutMethods || []).length === 0 ? (
                                        <div className="md:col-span-2 p-16 bg-zinc-950/30 border border-dashed border-zinc-800 rounded-[3rem] text-center space-y-4">
                                            <p className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.3em] italic">No Settlement Nodes Configured</p>
                                        </div>
                                    ) : (
                                        userData.payoutMethods.map((m: any) => (
                                            <div key={m.id} className="p-8 bg-zinc-950 border border-zinc-800 rounded-[2.5rem] flex items-center justify-between group/payout hover:border-emerald-500/20 transition-all shadow-inner">
                                                <div className="flex items-center gap-6">
                                                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-transform group-hover/payout:scale-110", m.type === 'crypto' ? 'bg-orange-600' : 'bg-blue-600')}>
                                                        {m.type === 'crypto' ? <Bitcoin className="w-7 h-7" /> : <Building2 className="w-7 h-7" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-black text-white italic tracking-tighter uppercase leading-none mb-1.5">{m.label}</p>
                                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">{m.type === 'crypto' ? m.network : m.bankName}</p>
                                                    </div>
                                                </div>
                                                <Button 
                                                    type="button"
                                                    onClick={() => handleRemovePayout(m)}
                                                    variant="ghost" 
                                                    className="w-12 h-12 rounded-xl text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* KYC SECTION */}
                        {activeSection === "KYC" && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
                                <div className="flex items-center gap-8 pb-10 border-b border-zinc-800/20">
                                    <div className="p-5 bg-amber-600/10 rounded-2xl border border-amber-600/20">
                                        <ShieldCheck className="w-8 h-8 text-amber-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Identity Verification</h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 italic">Secure your merchant credentials to unlock high-tier limits.</p>
                                    </div>
                                </div>

                                {userData?.kycStatus === "verified" ? (
                                    <div className="p-16 bg-emerald-500/5 border border-emerald-500/20 rounded-[3.5rem] flex flex-col items-center gap-6 text-center shadow-2xl shadow-emerald-500/5">
                                        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30 scale-110">
                                            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Protocol Authorization: ACTIVE</h4>
                                            <p className="text-[11px] font-black text-emerald-500/40 uppercase tracking-[0.3em] italic">Your identity has been fully synchronized with the central ledger.</p>
                                        </div>
                                    </div>
                                ) : userData?.kycStatus === "pending" ? (
                                    <div className="p-16 bg-blue-500/5 border border-blue-500/20 rounded-[3.5rem] flex flex-col items-center gap-6 text-center shadow-2xl shadow-blue-500/5">
                                        <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                                        <div className="space-y-2">
                                            <h4 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Authentication: IN_PROGRESS</h4>
                                            <p className="text-[11px] font-black text-blue-500/40 uppercase tracking-[0.3em] italic">Our compliance nodes are currently analyzing your transmission.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-12">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] pl-1">Legal Document Name</Label>
                                                <Input
                                                    value={kycData.fullName}
                                                    onChange={(e) => setKycData({ ...kycData, fullName: e.target.value })}
                                                    className="bg-zinc-950 border-zinc-800 h-16 rounded-[1.2rem] font-black text-white text-xs uppercase tracking-[0.1em] px-8 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all italic shadow-inner"
                                                    placeholder="AS PER OFFICIAL ID"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] pl-1">Classification Terminal</Label>
                                                <select
                                                    value={kycData.idType}
                                                    onChange={(e) => setKycData({ ...kycData, idType: e.target.value })}
                                                    className="w-full h-16 bg-zinc-950 border border-zinc-800 rounded-[1.2rem] px-8 font-black text-white text-[10px] uppercase tracking-widest italic outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner appearance-none cursor-pointer"
                                                >
                                                    <option className="bg-zinc-950">National ID Card</option>
                                                    <option className="bg-zinc-950">International Passport</option>
                                                    <option className="bg-zinc-950">Driver's License</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2 space-y-3">
                                                <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] pl-1">Serial Node Pointer (Serial No.)</Label>
                                                <Input
                                                    value={kycData.idNumber}
                                                    onChange={(e) => setKycData({ ...kycData, idNumber: e.target.value })}
                                                    className="bg-zinc-950 border-zinc-800 h-16 rounded-[1.2rem] font-black text-white text-xs tracking-[0.1em] px-8 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all italic shadow-inner"
                                                    placeholder="X00 - X00 - X00"
                                                />
                                            </div>
                                            <div className="md:col-span-2 space-y-3 pt-4">
                                                <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] pl-1">Secure Scan Capture</Label>
                                                <ImageUpload
                                                    value={kycData.documentImage}
                                                    onChange={(url) => setKycData({ ...kycData, documentImage: url })}
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={handleKYCSubmit}
                                            disabled={updating || !kycData.fullName || !kycData.idNumber || !kycData.documentImage}
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

                        {activeSection !== "KYC" && activeSection !== "Payout" && (
                            <div className="pt-14 border-t border-zinc-800/50 flex justify-end">
                                <Button 
                                    type="submit" 
                                    disabled={updating} 
                                    className="bg-blue-600 hover:bg-blue-700 h-20 px-16 rounded-[2rem] font-black text-[11px] tracking-[0.3em] shadow-2xl shadow-blue-500/30 active:scale-95 transition-all italic border-b-4 border-blue-900 active:border-b-0 uppercase"
                                >
                                    {updating ? <Loader2 className="w-5 h-5 animate-spin mx-8" /> : "COMMIT GLOBAL UPDATES"}
                                </Button>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {/* ADD PAYOUT MODAL */}
            <Modal
                isOpen={isAddPayoutModalOpen}
                onClose={() => setIsAddPayoutModalOpen(false)}
                title="Settle New Route"
            >
                <div className="space-y-8 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => setNewPayout({...newPayout, type: 'bank'})}
                            className={cn("p-6 rounded-[1.8rem] border-2 flex flex-col items-center gap-3 transition-all", newPayout.type === 'bank' ? "border-blue-600 bg-blue-600/10 shadow-2xl shadow-blue-600/10" : "border-zinc-800 bg-zinc-950 hover:border-zinc-700")}
                        >
                            <Building2 className={cn("w-8 h-8", newPayout.type === 'bank' ? "text-blue-500" : "text-zinc-700")} />
                            <span className={cn("text-[9px] font-black uppercase tracking-widest", newPayout.type === 'bank' ? "text-blue-400" : "text-zinc-600")}>Bank Route</span>
                        </button>
                        <button 
                            onClick={() => setNewPayout({...newPayout, type: 'crypto'})}
                            className={cn("p-6 rounded-[1.8rem] border-2 flex flex-col items-center gap-3 transition-all", newPayout.type === 'crypto' ? "border-orange-600 bg-orange-600/10 shadow-2xl shadow-orange-600/10" : "border-zinc-800 bg-zinc-950 hover:border-zinc-700")}
                        >
                            <Bitcoin className={cn("w-8 h-8", newPayout.type === 'crypto' ? "text-orange-500" : "text-zinc-700")} />
                            <span className={cn("text-[9px] font-black uppercase tracking-widest", newPayout.type === 'crypto' ? "text-orange-400" : "text-zinc-600")}>Decentralized</span>
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Route Descriptor (Label)</Label>
                            <Input
                                value={newPayout.label}
                                onChange={e => setNewPayout({...newPayout, label: e.target.value})}
                                placeholder="E.G. MAIN SAVINGS"
                                className="h-14 bg-zinc-950 border-zinc-800 rounded-xl font-black text-white placeholder:text-zinc-700 focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {newPayout.type === 'bank' ? (
                            <div className="space-y-6 animate-in slide-in-from-bottom-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Financial Entity</Label>
                                    <Input
                                        value={newPayout.bankName}
                                        onChange={e => setNewPayout({...newPayout, bankName: e.target.value})}
                                        placeholder="E.G. CHASE BANK"
                                        className="h-14 bg-zinc-950 border-zinc-800 rounded-xl font-black text-white placeholder:text-zinc-700 focus:border-blue-500 transition-colors"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Route Pointer</Label>
                                        <Input
                                            value={newPayout.accountNumber}
                                            onChange={e => setNewPayout({...newPayout, accountNumber: e.target.value})}
                                            placeholder="ACCOUNT NUMBER"
                                            className="h-14 bg-zinc-950 border-zinc-800 rounded-xl font-black text-white placeholder:text-zinc-700 focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Node Beneficiary</Label>
                                        <Input
                                            value={newPayout.accountName}
                                            onChange={e => setNewPayout({...newPayout, accountName: e.target.value})}
                                            placeholder="FULL NAME"
                                            className="h-14 bg-zinc-950 border-zinc-800 rounded-xl font-black text-white placeholder:text-zinc-700 focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in slide-in-from-bottom-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Protocol Network</Label>
                                    <select 
                                        value={newPayout.network}
                                        onChange={e => setNewPayout({...newPayout, network: e.target.value})}
                                        className="w-full h-14 bg-zinc-950 border border-zinc-800 rounded-xl px-4 font-black text-white text-[10px] uppercase tracking-widest outline-none focus:border-orange-500 transition-colors appearance-none cursor-pointer"
                                    >
                                        <option className="bg-zinc-950" value="USDT_TRC20">USDT (TRC20) - SECURED</option>
                                        <option className="bg-zinc-950" value="BTC">BITCOIN NODE - SECURED</option>
                                        <option className="bg-zinc-950" value="ETH_ERC20">ETHEREUM (ERC20)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Wallet Destination URI</Label>
                                    <Input
                                        value={newPayout.address}
                                        onChange={e => setNewPayout({...newPayout, address: e.target.value})}
                                        placeholder="0x... / T..."
                                        className="h-14 bg-zinc-950 border-zinc-800 rounded-xl font-mono text-xs text-white placeholder:text-zinc-700 focus:border-orange-500 transition-colors"
                                    />
                                </div>
                            </div>
                        )}

                        <Button 
                            onClick={handleAddPayout}
                            disabled={updating}
                            className={cn(
                                "w-full h-18 text-white font-black italic rounded-[1.5rem] uppercase text-[10px] tracking-widest border-b-4 active:border-b-0 transition-all gap-3 shadow-2xl",
                                newPayout.type === 'crypto' ? "bg-orange-600 hover:bg-orange-700 border-orange-800 shadow-orange-500/20" : "bg-blue-600 hover:bg-blue-700 border-blue-800 shadow-blue-500/20"
                            )}
                        >
                            {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                            AUTHORIZE SETTLEMENT ROUTE
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

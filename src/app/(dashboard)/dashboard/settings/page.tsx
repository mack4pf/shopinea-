"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    User, Store, Lock, CreditCard, Camera, Loader2, CheckCircle2,
    Building, ShieldCheck, Plus, Trash2, Building2, Bitcoin, Globe,
    Smartphone, Wallet
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

    const [isAddPayoutModalOpen, setIsAddPayoutModalOpen] = useState(false);
    const [newPayout, setNewPayout] = useState({
        type: "bank", label: "", bankName: "", accountNumber: "",
        accountName: "", network: "USDT_TRC20", address: ""
    });

    const [formData, setFormData] = useState({
        displayName: "", phone: "", storeName: "", storeSlug: "",
    });
    const [host, setHost] = useState("");

    useEffect(() => { setHost(window.location.host); }, []);

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
                        fullName: "", idType: "Government ID",
                        idNumber: "", documentImage: ""
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
            toast.success("Settings saved successfully.");
        } catch (error) {
            toast.error("Failed to save settings.");
        } finally {
            setUpdating(false);
        }
    };

    const handleAddPayout = async () => {
        if (!newPayout.label) { toast.error("Please enter a label."); return; }
        setUpdating(true);
        try {
            const method = { id: Math.random().toString(36).substr(2, 9), ...newPayout, createdAt: new Date().toISOString() };
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, { payoutMethods: arrayUnion(method) });
            setUserData((prev: any) => ({ ...prev, payoutMethods: [...(prev.payoutMethods || []), method] }));
            setIsAddPayoutModalOpen(false);
            setNewPayout({ type: "bank", label: "", bankName: "", accountNumber: "", accountName: "", network: "USDT_TRC20", address: "" });
            toast.success("Payout method added.");
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
            await updateDoc(userRef, { payoutMethods: arrayRemove(method) });
            setUserData((prev: any) => ({ ...prev, payoutMethods: prev.payoutMethods.filter((m: any) => m.id !== method.id) }));
            toast.success("Payout method removed.");
        } catch (err) {
            toast.error("Failed to remove payout method.");
        } finally {
            setUpdating(false);
        }
    };

    const sections = [
        { id: "Profile", icon: User, label: "Profile" },
        { id: "Store", icon: Store, label: "Store" },
        { id: "Payout", icon: CreditCard, label: "Payout Methods" },
        { id: "KYC", icon: ShieldCheck, label: "Verification" },
    ];

    const [kycData, setKycData] = useState({
        fullName: "", idType: "Government ID", idNumber: "", documentImage: ""
    });

    const handleKYCSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, { kycStatus: "pending", identification: kycData });
            setUserData({ ...userData, kycStatus: "pending" });
            toast.success("Verification submitted for review.");
        } catch (err) {
            toast.error("Failed to submit verification.");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-sm text-zinc-500 mt-1">Manage your account, store, and payout preferences.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Tabs */}
                <div className="space-y-4">
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-2">
                        {sections.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setActiveSection(s.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                    activeSection === s.id
                                        ? "bg-blue-600 text-white"
                                        : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
                                )}
                            >
                                <s.icon className="w-4 h-4" />
                                {s.label}
                            </button>
                        ))}
                    </div>

                    {/* Status Card */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                        <h4 className="text-xs font-semibold text-zinc-400 mb-4">Account Status</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-zinc-600">Plan</span>
                                <span className="text-xs font-medium text-blue-400">{userData?.planName || "Free"}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-zinc-600">Verification</span>
                                <span className={cn("text-xs font-medium", userData?.kycStatus === 'verified' ? 'text-emerald-400' : 'text-amber-400')}>
                                    {userData?.kycStatus === 'verified' ? 'Verified' : userData?.kycStatus === 'pending' ? 'Pending' : 'Unverified'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 md:p-8">
                    <form onSubmit={handleSave} className="space-y-8">

                        {/* PROFILE */}
                        {activeSection === "Profile" && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div className="flex items-center gap-5 pb-6 border-b border-white/[0.06]">
                                    <div className="w-16 h-16 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center relative group cursor-pointer">
                                        <User className="w-7 h-7 text-zinc-600" />
                                        <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Camera className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">Profile</h3>
                                        <p className="text-sm text-zinc-500">Your personal information.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-zinc-400">Full Name</Label>
                                        <Input value={formData.displayName} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                            className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20" placeholder="John Doe" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-zinc-400">Phone Number</Label>
                                        <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20" placeholder="+1 234 567 890" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STORE */}
                        {activeSection === "Store" && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div className="flex items-center gap-4 pb-6 border-b border-white/[0.06]">
                                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                        <Store className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">Store Settings</h3>
                                        <p className="text-sm text-zinc-500">Configure your storefront.</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-zinc-400">Store Name</Label>
                                        <Input value={formData.storeName} onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                                            className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20" placeholder="My Awesome Store" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-zinc-400">Store URL</Label>
                                        <div className="flex items-center gap-2">
                                            <div className="h-11 px-4 bg-white/[0.04] border border-white/[0.08] rounded-lg flex items-center text-xs text-zinc-500 whitespace-nowrap">
                                                {host || '...'}/store/
                                            </div>
                                            <Input value={formData.storeSlug} onChange={(e) => setFormData({ ...formData, storeSlug: e.target.value })}
                                                className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 flex-1" placeholder="my-store" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PAYOUT */}
                        {activeSection === "Payout" && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div className="flex items-center justify-between pb-6 border-b border-white/[0.06]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                                            <CreditCard className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">Payout Methods</h3>
                                            <p className="text-sm text-zinc-500">Where you receive your earnings.</p>
                                        </div>
                                    </div>
                                    <Button type="button" onClick={() => setIsAddPayoutModalOpen(true)}
                                        className="h-10 bg-white text-zinc-900 font-medium rounded-lg px-4 gap-2 hover:bg-zinc-100 text-sm">
                                        <Plus className="w-4 h-4" /> Add Method
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {(userData?.payoutMethods || []).length === 0 ? (
                                        <div className="py-12 text-center border border-dashed border-white/[0.08] rounded-xl">
                                            <CreditCard className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                                            <p className="text-sm text-zinc-500">No payout methods added yet.</p>
                                        </div>
                                    ) : (
                                        userData.payoutMethods.map((m: any) => (
                                            <div key={m.id} className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", m.type === 'crypto' ? 'bg-orange-600' : 'bg-blue-600')}>
                                                        {m.type === 'crypto' ? <Bitcoin className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{m.label}</p>
                                                        <p className="text-xs text-zinc-500">{m.type === 'crypto' ? m.network : m.bankName}</p>
                                                    </div>
                                                </div>
                                                <Button type="button" variant="ghost" onClick={() => handleRemovePayout(m)}
                                                    className="w-9 h-9 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* KYC */}
                        {activeSection === "KYC" && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div className="flex items-center gap-4 pb-6 border-b border-white/[0.06]">
                                    <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                                        <ShieldCheck className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">Identity Verification</h3>
                                        <p className="text-sm text-zinc-500">Verify your identity to enable payouts.</p>
                                    </div>
                                </div>

                                {userData?.kycStatus === "verified" ? (
                                    <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex flex-col items-center gap-4 text-center">
                                        <div className="w-14 h-14 bg-emerald-500/15 rounded-full flex items-center justify-center">
                                            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-semibold text-white">Verified</h4>
                                            <p className="text-sm text-zinc-500 mt-1">Your identity has been verified. Payouts are enabled.</p>
                                        </div>
                                    </div>
                                ) : userData?.kycStatus === "pending" ? (
                                    <div className="p-8 bg-blue-500/5 border border-blue-500/20 rounded-xl flex flex-col items-center gap-4 text-center">
                                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                                        <div>
                                            <h4 className="text-lg font-semibold text-white">Under Review</h4>
                                            <p className="text-sm text-zinc-500 mt-1">We&apos;re reviewing your documents. This usually takes 24-48 hours.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-medium text-zinc-400">Full Name (as on ID)</Label>
                                                <Input value={kycData.fullName} onChange={(e) => setKycData({ ...kycData, fullName: e.target.value })}
                                                    className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50" placeholder="John Doe" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-medium text-zinc-400">ID Type</Label>
                                                <select value={kycData.idType} onChange={(e) => setKycData({ ...kycData, idType: e.target.value })}
                                                    className="w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 text-sm text-white outline-none focus:border-blue-500/50 appearance-none cursor-pointer">
                                                    <option className="bg-zinc-900">National ID Card</option>
                                                    <option className="bg-zinc-900">International Passport</option>
                                                    <option className="bg-zinc-900">Driver&apos;s License</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2 space-y-2">
                                                <Label className="text-xs font-medium text-zinc-400">ID Number</Label>
                                                <Input value={kycData.idNumber} onChange={(e) => setKycData({ ...kycData, idNumber: e.target.value })}
                                                    className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50" placeholder="Enter your ID number" />
                                            </div>
                                            <div className="md:col-span-2 space-y-2">
                                                <Label className="text-xs font-medium text-zinc-400">Document Photo</Label>
                                                <ImageUpload value={kycData.documentImage} onChange={(url) => setKycData({ ...kycData, documentImage: url })} />
                                            </div>
                                        </div>
                                        <Button type="button" onClick={handleKYCSubmit}
                                            disabled={updating || !kycData.fullName || !kycData.idNumber || !kycData.documentImage}
                                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm gap-2">
                                            {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShieldCheck className="w-4 h-4" /> Submit for Verification</>}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeSection !== "KYC" && activeSection !== "Payout" && (
                            <div className="pt-6 border-t border-white/[0.06] flex justify-end">
                                <Button type="submit" disabled={updating}
                                    className="h-11 px-8 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium">
                                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                                </Button>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {/* Payout Modal */}
            <Modal isOpen={isAddPayoutModalOpen} onClose={() => setIsAddPayoutModalOpen(false)} title="Add Payout Method">
                <div className="space-y-6 py-2">
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setNewPayout({...newPayout, type: 'bank'})}
                            className={cn("p-4 rounded-xl border flex flex-col items-center gap-2 transition-colors",
                                newPayout.type === 'bank' ? "border-blue-500 bg-blue-500/10" : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15]")}>
                            <Building2 className={cn("w-6 h-6", newPayout.type === 'bank' ? "text-blue-400" : "text-zinc-600")} />
                            <span className={cn("text-xs font-medium", newPayout.type === 'bank' ? "text-blue-400" : "text-zinc-500")}>Bank Transfer</span>
                        </button>
                        <button onClick={() => setNewPayout({...newPayout, type: 'crypto'})}
                            className={cn("p-4 rounded-xl border flex flex-col items-center gap-2 transition-colors",
                                newPayout.type === 'crypto' ? "border-orange-500 bg-orange-500/10" : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15]")}>
                            <Bitcoin className={cn("w-6 h-6", newPayout.type === 'crypto' ? "text-orange-400" : "text-zinc-600")} />
                            <span className={cn("text-xs font-medium", newPayout.type === 'crypto' ? "text-orange-400" : "text-zinc-500")}>Crypto</span>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-zinc-400">Label</Label>
                            <Input value={newPayout.label} onChange={e => setNewPayout({...newPayout, label: e.target.value})} placeholder="e.g. Main Savings"
                                className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50" />
                        </div>

                        {newPayout.type === 'bank' ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-zinc-400">Bank Name</Label>
                                    <Input value={newPayout.bankName} onChange={e => setNewPayout({...newPayout, bankName: e.target.value})} placeholder="e.g. Chase Bank"
                                        className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-zinc-400">Account Number</Label>
                                        <Input value={newPayout.accountNumber} onChange={e => setNewPayout({...newPayout, accountNumber: e.target.value})} placeholder="1234567890"
                                            className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-zinc-400">Account Name</Label>
                                        <Input value={newPayout.accountName} onChange={e => setNewPayout({...newPayout, accountName: e.target.value})} placeholder="Full Name"
                                            className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-zinc-400">Network</Label>
                                    <select value={newPayout.network} onChange={e => setNewPayout({...newPayout, network: e.target.value})}
                                        className="w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 text-sm text-white outline-none focus:border-orange-500/50 appearance-none cursor-pointer">
                                        <option className="bg-zinc-900" value="USDT_TRC20">USDT (TRC20)</option>
                                        <option className="bg-zinc-900" value="BTC">Bitcoin</option>
                                        <option className="bg-zinc-900" value="ETH_ERC20">Ethereum (ERC20)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-zinc-400">Wallet Address</Label>
                                    <Input value={newPayout.address} onChange={e => setNewPayout({...newPayout, address: e.target.value})} placeholder="0x... or T..."
                                        className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm font-mono text-white placeholder:text-zinc-700 focus:border-orange-500/50" />
                                </div>
                            </div>
                        )}

                        <Button onClick={handleAddPayout} disabled={updating}
                            className={cn("w-full h-11 font-medium rounded-lg text-sm gap-2",
                                newPayout.type === 'crypto' ? "bg-orange-600 hover:bg-orange-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white")}>
                            {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Payout Method"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

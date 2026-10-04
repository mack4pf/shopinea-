"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    User, Store, Lock, CreditCard, Camera, Loader2, CheckCircle2,
    Building, ShieldCheck, Plus, Trash2, Building2, Bitcoin, Globe,
    Smartphone, Wallet, FileCheck2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { Modal } from "@/components/ui/modal";
import { CountrySelect } from "@/components/ui/country-select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SITE_DOMAIN } from "@/lib/site";

const safeText = (value: unknown, fallback = "") => {
    const text = typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
    return text || fallback;
};

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
        displayName: "", phone: "", country: "United States", countryCode: "US", currency: "USD", currencySymbol: "$",
        storeName: "", storeSlug: "", storeTagline: "", themeColor: "#10b981", storeTemplate: "classic", storeLayout: "grid",
        storeLogo: "", storeHeroImage: "", storeHeroTitle: "", storeHeroSubtitle: "", storeAnnouncement: "",
        storePromoText: "", storePrimaryCta: "Shop Now", storeShippingText: "Priority Express Shipping",
        storeReturnText: "Easy returns", storeSupportText: "Buyer support available", storeDeliveryEstimate: "3-7 business days",
        storeFooterNote: "", storeEmail: "", storePhone: "", storeAddress: "", storeInstagram: "", storeTiktok: "",
        storeWhatsapp: "", showSearch: true, showTopSellers: true, showViews: true, showSales: true,
        showStock: true, showHeroProducts: true, showTrustBadges: true, showCategoryPills: true, showPoweredBy: true
    });
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
                        country: data.country || "United States",
                        countryCode: data.countryCode || "US",
                        currency: data.currency || "USD",
                        currencySymbol: data.currencySymbol || "$",
                        storeName: data.storeName || "",
                        storeSlug: data.storeSlug || "",
                        storeTagline: data.storeTagline || "",
                        themeColor: data.themeColor || "#10b981",
                        storeTemplate: data.storeTemplate || "classic",
                        storeLayout: data.storeLayout || "grid",
                        storeLogo: data.storeLogo || "",
                        storeHeroImage: data.storeHeroImage || "",
                        storeHeroTitle: data.storeHeroTitle || "",
                        storeHeroSubtitle: data.storeHeroSubtitle || "",
                        storeAnnouncement: data.storeAnnouncement || "",
                        storePromoText: data.storePromoText || "",
                        storePrimaryCta: data.storePrimaryCta || "Shop Now",
                        storeShippingText: data.storeShippingText || "Priority Express Shipping",
                        storeReturnText: data.storeReturnText || "Easy returns",
                        storeSupportText: data.storeSupportText || "Buyer support available",
                        storeDeliveryEstimate: data.storeDeliveryEstimate || "3-7 business days",
                        storeFooterNote: data.storeFooterNote || "",
                        storeEmail: data.storeEmail || "",
                        storePhone: data.storePhone || "",
                        storeAddress: data.storeAddress || "",
                        storeInstagram: data.storeInstagram || "",
                        storeTiktok: data.storeTiktok || "",
                        storeWhatsapp: data.storeWhatsapp || "",
                        showSearch: data.showSearch !== false,
                        showTopSellers: data.showTopSellers !== false,
                        showViews: data.showViews !== false,
                        showSales: data.showSales !== false,
                        showStock: data.showStock !== false,
                        showHeroProducts: data.showHeroProducts !== false,
                        showTrustBadges: data.showTrustBadges !== false,
                        showCategoryPills: data.showCategoryPills !== false,
                        showPoweredBy: data.showPoweredBy !== false
                    });
                    setKycData(data.identification || {
                        fullName: "", idType: "Government ID",
                        idNumber: "", documentImage: ""
                    });
                    setLicenseData({
                        hasLicense: data.salesLicenseRequest?.hasLicense || "no",
                        legalName: data.salesLicenseRequest?.legalName || data.displayName || "",
                        businessName: data.salesLicenseRequest?.businessName || data.storeName || "",
                        businessType: data.salesLicenseRequest?.businessType || "",
                        country: data.salesLicenseRequest?.country || data.country || "United States",
                        state: data.salesLicenseRequest?.state || "",
                        city: data.salesLicenseRequest?.city || "",
                        address: data.salesLicenseRequest?.address || "",
                        postalCode: data.salesLicenseRequest?.postalCode || "",
                        taxId: data.salesLicenseRequest?.taxId || "",
                        productCategories: data.salesLicenseRequest?.productCategories || "",
                        contactEmail: data.salesLicenseRequest?.contactEmail || firebaseUser.email || "",
                        contactPhone: data.salesLicenseRequest?.contactPhone || data.phoneNumber || "",
                        existingLicenseNumber: data.salesLicenseRequest?.existingLicenseNumber || "",
                        notes: data.salesLicenseRequest?.notes || "",
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
                country: formData.country,
                countryCode: formData.countryCode,
                currency: formData.currency,
                currencySymbol: formData.currencySymbol,
                storeName: formData.storeName,
                storeSlug: formData.storeSlug,
                storeTagline: formData.storeTagline,
                themeColor: formData.themeColor,
                storeTemplate: formData.storeTemplate,
                storeLayout: formData.storeLayout,
                storeLogo: formData.storeLogo,
                storeHeroImage: formData.storeHeroImage,
                storeHeroTitle: formData.storeHeroTitle,
                storeHeroSubtitle: formData.storeHeroSubtitle,
                storeAnnouncement: formData.storeAnnouncement,
                storePromoText: formData.storePromoText,
                storePrimaryCta: formData.storePrimaryCta,
                storeShippingText: formData.storeShippingText,
                storeReturnText: formData.storeReturnText,
                storeSupportText: formData.storeSupportText,
                storeDeliveryEstimate: formData.storeDeliveryEstimate,
                storeFooterNote: formData.storeFooterNote,
                storeEmail: formData.storeEmail,
                storePhone: formData.storePhone,
                storeAddress: formData.storeAddress,
                storeInstagram: formData.storeInstagram,
                storeTiktok: formData.storeTiktok,
                storeWhatsapp: formData.storeWhatsapp,
                showSearch: formData.showSearch,
                showTopSellers: formData.showTopSellers,
                showViews: formData.showViews,
                showSales: formData.showSales,
                showStock: formData.showStock,
                showHeroProducts: formData.showHeroProducts,
                showTrustBadges: formData.showTrustBadges,
                showCategoryPills: formData.showCategoryPills,
                showPoweredBy: formData.showPoweredBy,
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
    const [licenseData, setLicenseData] = useState({
        hasLicense: "no",
        legalName: "",
        businessName: "",
        businessType: "",
        country: "",
        state: "",
        city: "",
        address: "",
        postalCode: "",
        taxId: "",
        productCategories: "",
        contactEmail: "",
        contactPhone: "",
        existingLicenseNumber: "",
        notes: "",
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

    const handleSalesLicenseSubmit = async () => {
        if (!licenseData.legalName || !licenseData.country || !licenseData.contactEmail || !licenseData.productCategories) {
            toast.error("Please complete the required sales license fields.");
            return;
        }

        setUpdating(true);
        try {
            const userRef = doc(db, "users", user.uid);
            const payload = {
                ...licenseData,
                status: "pending",
                submittedAt: new Date().toISOString(),
            };
            await updateDoc(userRef, {
                salesLicenseStatus: "pending",
                salesLicenseRequest: payload,
                salesLicenseSubmittedAt: serverTimestamp(),
            });
            setUserData({ ...userData, salesLicenseStatus: "pending", salesLicenseRequest: payload });
            toast.success("Sales license request submitted. Support will review the country requirements and contact you.");
        } catch (err) {
            toast.error("Failed to submit sales license request.");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

    const payoutMethods = Array.isArray(userData?.payoutMethods) ? userData.payoutMethods : [];

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
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-zinc-400">Country</Label>
                                        <CountrySelect
                                            value={formData.country}
                                            onChange={(countryName, country) => setFormData({
                                                ...formData,
                                                country: countryName,
                                                countryCode: country?.code || formData.countryCode,
                                                currency: country?.currencyCode || formData.currency,
                                                currencySymbol: country?.currencySymbol || formData.currencySymbol,
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-zinc-400">Currency</Label>
                                        <div className="h-11 px-4 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-between">
                                            <span className="text-sm text-white">{formData.currencySymbol} {formData.currency}</span>
                                            <span className="text-[10px] text-zinc-500">Auto-matched to country</span>
                                        </div>
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium text-zinc-400">Store Tagline</Label>
                                            <Input value={formData.storeTagline} onChange={(e) => setFormData({ ...formData, storeTagline: e.target.value })}
                                                className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20" placeholder="Premium sourced products, fast shipping" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium text-zinc-400">Accent Color</Label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    value={formData.themeColor}
                                                    onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                                                    className="w-14 h-11 rounded-lg border border-white/[0.08] bg-white/[0.04] p-0"
                                                />
                                                <Input value={formData.themeColor} onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                                                    className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 flex-1" placeholder="#10b981" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-xs font-medium text-zinc-400">Store Template</Label>
                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                            {[
                                                { id: "classic", name: "Classic", swatchFrom: "#f4f7fb", swatchTo: "#064e3b" },
                                                { id: "spotlight", name: "Spotlight", swatchFrom: "#0f172a", swatchTo: "#1e293b" },
                                                { id: "minimal", name: "Minimal", swatchFrom: "#ffffff", swatchTo: "#f1f5f9" },
                                                { id: "boutique", name: "Boutique", swatchFrom: "#fff1f2", swatchTo: "#3f1d2e" },
                                                { id: "bold", name: "Bold", swatchFrom: "#09090b", swatchTo: "#7c2d12" },
                                                { id: "luxury", name: "Luxury", swatchFrom: "#f7f3ea", swatchTo: "#451a03" },
                                                { id: "noir", name: "Noir", swatchFrom: "#000000", swatchTo: "#262626" },
                                                { id: "pastel", name: "Pastel", swatchFrom: "#ede9fe", swatchTo: "#fce7f3" },
                                                { id: "monochrome", name: "Monochrome", swatchFrom: "#ffffff", swatchTo: "#000000" },
                                                { id: "tech", name: "Tech", swatchFrom: "#060c1a", swatchTo: "#083344" },
                                            ].map((t) => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, storeTemplate: t.id })}
                                                    className={cn(
                                                        "rounded-xl border p-2 text-left transition-all",
                                                        formData.storeTemplate === t.id
                                                            ? "border-blue-500 ring-2 ring-blue-500/30"
                                                            : "border-white/[0.08] hover:border-white/[0.16]"
                                                    )}
                                                >
                                                    <div
                                                        className="h-12 w-full rounded-lg mb-2 border border-white/[0.06]"
                                                        style={{ background: `linear-gradient(135deg, ${t.swatchFrom}, ${t.swatchTo})` }}
                                                    />
                                                    <span className="text-xs font-medium text-zinc-300">{t.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-xs font-medium text-zinc-400">Product Layout</Label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {[
                                                { id: "grid", name: "Grid", desc: "Balanced grid" },
                                                { id: "featured", name: "Featured", desc: "Larger cards" },
                                                { id: "compact", name: "Compact", desc: "More per row" },
                                                { id: "editorial", name: "Editorial", desc: "Two columns" },
                                            ].map((l) => (
                                                <button
                                                    key={l.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, storeLayout: l.id })}
                                                    className={cn(
                                                        "rounded-xl border p-3 text-left transition-all",
                                                        formData.storeLayout === l.id
                                                            ? "border-blue-500 ring-2 ring-blue-500/30 bg-blue-500/5"
                                                            : "border-white/[0.08] hover:border-white/[0.16]"
                                                    )}
                                                >
                                                    <span className="text-xs font-semibold text-white block">{l.name}</span>
                                                    <span className="text-[11px] text-zinc-500">{l.desc}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-zinc-400">Store URL</Label>
                                        <div className="flex items-center gap-2">
                                            <div className="h-11 px-4 bg-white/[0.04] border border-white/[0.08] rounded-lg flex items-center text-xs text-zinc-500 whitespace-nowrap">
                                                https://
                                            </div>
                                            <Input value={formData.storeSlug} onChange={(e) => setFormData({ ...formData, storeSlug: e.target.value })}
                                                className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 flex-1" placeholder="my-store" />
                                            <div className="h-11 px-4 bg-white/[0.04] border border-white/[0.08] rounded-lg flex items-center text-xs text-zinc-500 whitespace-nowrap">
                                                .{SITE_DOMAIN}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium text-zinc-400">Store Logo</Label>
                                            <ImageUpload value={formData.storeLogo} onChange={(url) => setFormData({ ...formData, storeLogo: url })} folder="/shoplinea/stores" compact label="Upload logo" helperText="Shown in the storefront header." />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium text-zinc-400">Hero Image</Label>
                                            <ImageUpload value={formData.storeHeroImage} onChange={(url) => setFormData({ ...formData, storeHeroImage: url })} folder="/shoplinea/stores" compact label="Upload hero image" helperText="Optional storefront banner image." />
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
                                        <div>
                                            <h4 className="text-sm font-semibold text-white">Storefront Content</h4>
                                            <p className="text-xs text-zinc-500 mt-1">Control the buyer-facing copy across your store.</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input value={formData.storeHeroTitle} onChange={(e) => setFormData({ ...formData, storeHeroTitle: e.target.value })} placeholder="Hero headline" className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700" />
                                            <Input value={formData.storePrimaryCta} onChange={(e) => setFormData({ ...formData, storePrimaryCta: e.target.value })} placeholder="Primary button text" className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700" />
                                            <Input value={formData.storeHeroSubtitle} onChange={(e) => setFormData({ ...formData, storeHeroSubtitle: e.target.value })} placeholder="Hero supporting text" className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700 md:col-span-2" />
                                            <Input value={formData.storeAnnouncement} onChange={(e) => setFormData({ ...formData, storeAnnouncement: e.target.value })} placeholder="Top announcement bar" className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700" />
                                            <Input value={formData.storePromoText} onChange={(e) => setFormData({ ...formData, storePromoText: e.target.value })} placeholder="Promo banner text" className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700" />
                                            <Input value={formData.storeShippingText} onChange={(e) => setFormData({ ...formData, storeShippingText: e.target.value })} placeholder="Shipping badge text" className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700" />
                                            <Input value={formData.storeReturnText} onChange={(e) => setFormData({ ...formData, storeReturnText: e.target.value })} placeholder="Buyer protection / returns text" className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700" />
                                            <Input value={formData.storeSupportText} onChange={(e) => setFormData({ ...formData, storeSupportText: e.target.value })} placeholder="Support badge text" className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700" />
                                            <Input value={formData.storeDeliveryEstimate} onChange={(e) => setFormData({ ...formData, storeDeliveryEstimate: e.target.value })} placeholder="Delivery estimate" className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700" />
                                            <Input value={formData.storeFooterNote} onChange={(e) => setFormData({ ...formData, storeFooterNote: e.target.value })} placeholder="Footer note" className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700 md:col-span-2" />
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
                                        <div>
                                            <h4 className="text-sm font-semibold text-white">Contact & Social</h4>
                                            <p className="text-xs text-zinc-500 mt-1">Optional public links shown in the store footer.</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input value={formData.storeEmail} onChange={(e) => setFormData({ ...formData, storeEmail: e.target.value })} placeholder="Support email" className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700" />
                                            <Input value={formData.storePhone} onChange={(e) => setFormData({ ...formData, storePhone: e.target.value })} placeholder="Support phone" className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700" />
                                            <Input value={formData.storeAddress} onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })} placeholder="Business address" className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700 md:col-span-2" />
                                            <Input value={formData.storeInstagram} onChange={(e) => setFormData({ ...formData, storeInstagram: e.target.value })} placeholder="Instagram URL" className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700" />
                                            <Input value={formData.storeTiktok} onChange={(e) => setFormData({ ...formData, storeTiktok: e.target.value })} placeholder="TikTok URL" className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700" />
                                            <Input value={formData.storeWhatsapp} onChange={(e) => setFormData({ ...formData, storeWhatsapp: e.target.value })} placeholder="WhatsApp URL" className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700 md:col-span-2" />
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
                                        <div>
                                            <h4 className="text-sm font-semibold text-white">Store Display</h4>
                                            <p className="text-xs text-zinc-500 mt-1">Choose which ecommerce signals appear publicly.</p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {[
                                                ["showSearch", "Search bar"],
                                                ["showTopSellers", "Top sellers"],
                                                ["showViews", "Product views"],
                                                ["showSales", "Sales count"],
                                                ["showStock", "Stock badge"],
                                                ["showHeroProducts", "Hero products"],
                                                ["showTrustBadges", "Trust badges"],
                                                ["showCategoryPills", "Category pills"],
                                                ["showPoweredBy", "Powered by text"],
                                            ].map(([key, label]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, [key]: !formData[key as keyof typeof formData] })}
                                                    className={cn(
                                                        "flex items-center justify-between rounded-xl border p-3 text-left transition-all",
                                                        formData[key as keyof typeof formData] ? "border-blue-500/40 bg-blue-500/10" : "border-white/[0.08] bg-white/[0.02]"
                                                    )}
                                                >
                                                    <span className="text-xs font-semibold text-white">{label}</span>
                                                    <span className={cn("h-5 w-9 rounded-full p-0.5 transition-colors", formData[key as keyof typeof formData] ? "bg-blue-500" : "bg-zinc-700")}>
                                                        <span className={cn("block h-4 w-4 rounded-full bg-white transition-transform", formData[key as keyof typeof formData] ? "translate-x-4" : "translate-x-0")} />
                                                    </span>
                                                </button>
                                            ))}
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
                                    {payoutMethods.length === 0 ? (
                                        <div className="py-12 text-center border border-dashed border-white/[0.08] rounded-xl">
                                            <CreditCard className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                                            <p className="text-sm text-zinc-500">No payout methods added yet.</p>
                                        </div>
                                    ) : (
                                        payoutMethods.map((m: any, index: number) => {
                                            const methodType = safeText(m.type);
                                            return (
                                            <div key={safeText(m.id, `payout-${index}`)} className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", methodType === 'crypto' ? 'bg-orange-600' : 'bg-blue-600')}>
                                                        {methodType === 'crypto' ? <Bitcoin className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{safeText(m.label, "Payout method")}</p>
                                                        <p className="text-xs text-zinc-500">{methodType === 'crypto' ? safeText(m.network) : safeText(m.bankName)}</p>
                                                    </div>
                                                </div>
                                                <Button type="button" variant="ghost" onClick={() => handleRemovePayout(m)}
                                                    className="w-9 h-9 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )})
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

                                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 space-y-5">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                            <FileCheck2 className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-semibold text-white">Sales License & Operating Compliance</h4>
                                            <p className="text-sm text-zinc-500 mt-1 leading-6">
                                                Some countries require resellers to hold a sales license, reseller permit, business registration, tax ID, or similar authorization before operating online. If you do not have the required license for your country, your account access or selling ability may be restricted until the requirement is reviewed.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100 leading-6">
                                        If you do not have a sales license, contact Shoplinea support/legal review from this form. License registration is not free and the cost depends on your country, business type, and the required local filing process. Approved documents or instructions will be sent to your email when ready.
                                    </div>

                                    {userData?.salesLicenseStatus === "pending" && (
                                        <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4 text-sm font-medium text-blue-200">
                                            Your sales license request is pending review.
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium text-zinc-400">Do you already have a sales license?</Label>
                                            <select
                                                value={licenseData.hasLicense}
                                                onChange={(e) => setLicenseData({ ...licenseData, hasLicense: e.target.value })}
                                                className="w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 text-sm text-white outline-none focus:border-blue-500/50"
                                            >
                                                <option className="bg-zinc-900" value="no">No, I need support</option>
                                                <option className="bg-zinc-900" value="yes">Yes, I already have one</option>
                                                <option className="bg-zinc-900" value="not_sure">Not sure</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium text-zinc-400">Existing License Number (if any)</Label>
                                            <Input value={licenseData.existingLicenseNumber} onChange={(e) => setLicenseData({ ...licenseData, existingLicenseNumber: e.target.value })}
                                                className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50" placeholder="Optional" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium text-zinc-400">Legal Full Name *</Label>
                                            <Input value={licenseData.legalName} onChange={(e) => setLicenseData({ ...licenseData, legalName: e.target.value })}
                                                className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50" placeholder="Name used for registration" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium text-zinc-400">Business / Store Name</Label>
                                            <Input value={licenseData.businessName} onChange={(e) => setLicenseData({ ...licenseData, businessName: e.target.value })}
                                                className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50" placeholder="Your store or business name" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium text-zinc-400">Business Type</Label>
                                            <Input value={licenseData.businessType} onChange={(e) => setLicenseData({ ...licenseData, businessType: e.target.value })}
                                                className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50" placeholder="Individual, LLC, sole trader, company..." />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium text-zinc-400">Country *</Label>
                                            <CountrySelect
                                                value={licenseData.country}
                                                onChange={(country) => setLicenseData({ ...licenseData, country })}
                                                className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium text-zinc-400">State / Region</Label>
                                            <Input value={licenseData.state} onChange={(e) => setLicenseData({ ...licenseData, state: e.target.value })}
                                                className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50" placeholder="State, province, or region" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium text-zinc-400">City</Label>
                                            <Input value={licenseData.city} onChange={(e) => setLicenseData({ ...licenseData, city: e.target.value })}
                                                className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50" placeholder="City" />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <Label className="text-xs font-medium text-zinc-400">Business Address</Label>
                                            <Input value={licenseData.address} onChange={(e) => setLicenseData({ ...licenseData, address: e.target.value })}
                                                className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50" placeholder="Street address" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium text-zinc-400">Postal Code</Label>
                                            <Input value={licenseData.postalCode} onChange={(e) => setLicenseData({ ...licenseData, postalCode: e.target.value })}
                                                className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50" placeholder="Postal code" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium text-zinc-400">Tax ID / VAT / EIN</Label>
                                            <Input value={licenseData.taxId} onChange={(e) => setLicenseData({ ...licenseData, taxId: e.target.value })}
                                                className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50" placeholder="Optional if not available" />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <Label className="text-xs font-medium text-zinc-400">Product Categories You Plan To Sell *</Label>
                                            <Input value={licenseData.productCategories} onChange={(e) => setLicenseData({ ...licenseData, productCategories: e.target.value })}
                                                className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50" placeholder="Jewelry, wellness, electronics, beauty..." />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium text-zinc-400">Contact Email *</Label>
                                            <Input value={licenseData.contactEmail} onChange={(e) => setLicenseData({ ...licenseData, contactEmail: e.target.value })}
                                                className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50" placeholder="email@example.com" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium text-zinc-400">Contact Phone</Label>
                                            <Input value={licenseData.contactPhone} onChange={(e) => setLicenseData({ ...licenseData, contactPhone: e.target.value })}
                                                className="h-11 bg-white/[0.04] border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50" placeholder="+1..." />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <Label className="text-xs font-medium text-zinc-400">Additional Notes</Label>
                                            <textarea
                                                value={licenseData.notes}
                                                onChange={(e) => setLicenseData({ ...licenseData, notes: e.target.value })}
                                                rows={4}
                                                className="w-full resize-none bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-blue-500/50"
                                                placeholder="Tell support anything important about your country, business type, or license needs."
                                            />
                                        </div>
                                    </div>

                                    <Button type="button" onClick={handleSalesLicenseSubmit}
                                        disabled={updating || !licenseData.legalName || !licenseData.country || !licenseData.contactEmail || !licenseData.productCategories}
                                        className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-sm gap-2">
                                        {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><FileCheck2 className="w-4 h-4" /> Submit Sales License Request</>}
                                    </Button>
                                </div>
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

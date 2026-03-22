"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Truck, ClipboardList, Megaphone, Loader2, Mail, Building2, Globe, Phone, Info, Check, ShieldCheck } from "lucide-react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SupplierOnboarding() {
    const [step, setStep] = useState(1); // 1: Form, 2: Success
    const [user, setUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        companyName: "",
        businessType: "Manufacturer",
        phoneNumber: "",
        website: "",
        categories: "",
        experience: "",
        runAds: false,
    });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            setUser(u);
            if (u) {
                const docSnap = await getDoc(doc(db, "users", u.uid));
                if (docSnap.exists() && docSnap.data().onboardingCompleted) {
                    router.push("/dashboard");
                }
            }
            setInitialLoading(false);
        });
        return () => unsub();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (user) {
                await updateDoc(doc(db, "users", user.uid), {
                    companyName: formData.companyName,
                    businessType: formData.businessType,
                    phoneNumber: formData.phoneNumber,
                    website: formData.website,
                    categories: formData.categories,
                    experience: formData.experience,
                    runAds: formData.runAds,
                    onboardingCompleted: true,
                    status: "pending_review",
                    updatedAt: new Date().toISOString()
                });
                setStep(2);
                toast.success("Application submitted successfully!");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;

    if (step === 2) {
        return (
            <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-white selection:bg-blue-500/30">
                <div className="w-full max-w-lg space-y-8 text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="mx-auto h-20 w-20 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center shadow-2xl">
                        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold tracking-tight">Application Submitted</h2>
                        <p className="text-zinc-500 font-medium">
                            Your supplier credentials are now being reviewed by our vetting team for global compliance.
                        </p>
                    </div>

                    <div className="bg-zinc-900/50 p-8 rounded-2xl border border-white/[0.06] text-left space-y-6">
                        <h4 className="text-xs font-bold text-blue-500 uppercase tracking-widest">Next Steps</h4>
                        <div className="space-y-4">
                            {[
                                { title: "Background Verification", desc: "Our analysts will verify your business details and category expertise." },
                                { title: "Approval Notice", desc: "You will receive an email once your dashboard access is granted (24-48h)." },
                                { title: "Direct Support", desc: "For urgent concerns, contact our merchant support via WhatsApp or Email." }
                            ].map((s, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{s.title}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button
                        onClick={() => router.push("/")}
                        className="w-full h-12 bg-white hover:bg-zinc-200 text-zinc-950 rounded-xl font-bold shadow-xl transition-all active:scale-[0.98]"
                    >
                        Return to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-white selection:bg-blue-500/30">
            <div className="w-full max-w-2xl bg-zinc-900/50 rounded-2xl border border-white/[0.06] shadow-2xl overflow-hidden backdrop-blur-sm">
                <div className="relative p-10 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Truck className="h-32 w-32" />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <div className="h-12 w-12 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/20 shadow-xl">
                            <Truck className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Supplier Registration</h1>
                            <p className="text-blue-100/80 mt-1 font-medium text-sm">Join the network of professional global product suppliers.</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                <Building2 className="w-3 h-3" /> Company Name
                            </label>
                            <input
                                required
                                className="w-full h-11 px-4 rounded-xl border border-white/[0.08] bg-zinc-950/50 text-white placeholder:text-zinc-700 focus:outline-none focus:border-blue-500/50 transition-all font-medium text-sm"
                                placeholder="Formal Business Name"
                                value={formData.companyName}
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                <Info className="w-3 h-3" /> Business Type
                            </label>
                            <select
                                required
                                className="w-full h-11 px-4 rounded-xl border border-white/[0.08] bg-zinc-950/50 text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium text-sm appearance-none cursor-pointer"
                                value={formData.businessType}
                                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                            >
                                <option value="Manufacturer">Manufacturer</option>
                                <option value="Wholesaler">Wholesaler</option>
                                <option value="Distributor">Official Distributor</option>
                                <option value="Dropshipper">Dropshipping Agent</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                <Phone className="w-3 h-3" /> Contact Phone
                            </label>
                            <input
                                required
                                className="w-full h-11 px-4 rounded-xl border border-white/[0.08] bg-zinc-950/50 text-white placeholder:text-zinc-700 focus:outline-none focus:border-blue-500/50 transition-all font-medium text-sm"
                                placeholder="+1 (555) 000-0000"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                <Globe className="w-3 h-3" /> Website (Optional)
                            </label>
                            <input
                                className="w-full h-11 px-4 rounded-xl border border-white/[0.08] bg-zinc-950/50 text-white placeholder:text-zinc-700 focus:outline-none focus:border-blue-500/50 transition-all font-medium text-sm"
                                placeholder="https://yourcompany.com"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                            <ClipboardList className="w-3 h-3" /> Product Categories
                        </label>
                        <textarea
                            required
                            className="w-full h-28 p-4 rounded-xl border border-white/[0.08] bg-zinc-950/50 text-white placeholder:text-zinc-700 focus:outline-none focus:border-blue-500/50 transition-all font-medium text-sm resize-none"
                            placeholder="Detail the types of products you supply for the global market..."
                            value={formData.categories}
                            onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                            <ShieldCheck className="w-3 h-3" /> Logistics Experience
                        </label>
                        <textarea
                            required
                            className="w-full h-28 p-4 rounded-xl border border-white/[0.08] bg-zinc-950/50 text-white placeholder:text-zinc-700 focus:outline-none focus:border-blue-500/50 transition-all font-medium text-sm resize-none"
                            placeholder="Briefly describe your experience with order fulfillment and speed..."
                            value={formData.experience}
                            onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        />
                    </div>

                    <div className="p-6 bg-zinc-950/50 rounded-2xl border border-white/[0.06] group">
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-105">
                                <Megaphone className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-white tracking-tight">Expand Your Reach?</h3>
                                <p className="text-xs text-zinc-500 font-medium mt-1 leading-relaxed">
                                    Would you like us to run paid AI-powered advertising for your inventory? (Commission based, no upfront cost)
                                </p>
                                <label className="flex items-center gap-3 mt-4 cursor-pointer select-none">
                                    <div className={cn(
                                        "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                                        formData.runAds ? "bg-blue-600 border-blue-600" : "bg-zinc-800 border-white/10"
                                    )}>
                                        {formData.runAds && <Check className="w-3.5 h-3.5 text-white" />}
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={formData.runAds}
                                            onChange={(e) => setFormData({ ...formData, runAds: e.target.checked })}
                                        />
                                    </div>
                                    <span className="font-bold text-zinc-300 text-xs tracking-tight">Promote my inventory via Restock Ads.</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-white hover:bg-zinc-200 text-zinc-950 rounded-xl font-bold shadow-xl transition-all active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="h-5 h-5 animate-spin" /> : "Submit Application"}
                    </Button>
                </form>
            </div>
        </div>
    );
}

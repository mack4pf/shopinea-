"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Truck, ClipboardList, Megaphone, Loader2 } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";

export default function SupplierOnboarding() {
    const [step, setStep] = useState(1); // 1: Form, 2: Success
    const [formData, setFormData] = useState({
        companyName: "",
        businessType: "",
        phoneNumber: "",
        website: "",
        categories: "",
        experience: "",
        runAds: false,
    });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const user = auth.currentUser;
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
            }
        } catch (error) {
            console.error("Error updating profile:", error);
        } finally {
            setLoading(false);
        }
    };

    if (step === 2) {
        return (
            <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px]" />
                    <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px]" />
                </div>

                <div className="bg-white dark:bg-zinc-900 p-10 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-2xl shadow-gray-200/50 dark:shadow-none max-w-lg w-full text-center space-y-8 relative z-10">
                    <div className="mx-auto h-24 w-24 bg-blue-50 dark:bg-blue-900/20 rounded-[2rem] flex items-center justify-center animate-bounce">
                        <CheckCircle2 className="h-12 w-12 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Application Submitted</h2>
                        <p className="mt-3 text-gray-500 font-medium">
                            Your supplier application is now being reviewed by our vetting team.
                        </p>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100/30 dark:border-blue-900/20 space-y-4 text-left">
                        <p className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Next Steps</p>
                        <div className="space-y-3">
                            <div className="flex gap-3">
                                <div className="p-1.5 h-6 w-6 bg-blue-100 dark:bg-blue-800/30 rounded-lg flex items-center justify-center shrink-0">
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                </div>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300"><span className="text-blue-600">Check your email:</span> We will notify you once your application is approved.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="p-1.5 h-6 w-6 bg-blue-100 dark:bg-blue-800/30 rounded-lg flex items-center justify-center shrink-0">
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                </div>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Approval usually takes <span className="text-blue-600">24-48 hours</span>.</p>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={() => router.push("/")}
                        className="w-full h-14 bg-blue-600 hover:bg-blue-700 rounded-2xl text-white font-black shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        RETURN TO HOME
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px]" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-2xl shadow-gray-200/50 dark:shadow-none overflow-hidden relative z-10">
                <div className="bg-blue-600 p-10 text-white relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Truck className="h-32 w-32" />
                    </div>
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="h-14 w-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-6">
                            <Truck className="h-7 w-7 text-white" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight">Supplier Registration</h1>
                        <p className="text-blue-100 mt-2 font-medium opacity-90 text-sm">Join our global network of premium product suppliers.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Company Name</label>
                            <input
                                required
                                className="w-full h-12 px-4 rounded-2xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                                placeholder="e.g. Acme Logistics"
                                value={formData.companyName}
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Business Type</label>
                            <input
                                required
                                className="w-full h-12 px-4 rounded-2xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                                placeholder="e.g. Manufacturer, Wholesaler"
                                value={formData.businessType}
                                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Contact Phone</label>
                            <input
                                required
                                className="w-full h-12 px-4 rounded-2xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                                placeholder="+1 (555) 000-0000"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Website (Optional)</label>
                            <input
                                className="w-full h-12 px-4 rounded-2xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                                placeholder="https://yourcompany.com"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Product Categories</label>
                        <textarea
                            required
                            className="w-full h-32 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold resize-none"
                            placeholder="Describe the types of products you supply..."
                            value={formData.categories}
                            onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Dropshipping Experience</label>
                        <textarea
                            required
                            className="w-full h-32 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold resize-none"
                            placeholder="Tell us about your experience with fulfillment and dropshipping..."
                            value={formData.experience}
                            onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        />
                    </div>

                    <div className="bg-gray-50 dark:bg-zinc-950 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 group">
                        <div className="flex items-start gap-4">
                            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-110">
                                <Megaphone className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-tight">Boost Visibility?</h3>
                                <p className="text-xs text-gray-500 font-medium mt-1 mb-4 leading-relaxed">
                                    Would you like us to run paid advertising campaigns for your products? (Commission based, no upfront cost)
                                </p>
                                <label className="flex items-center space-x-3 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        className="h-5 w-5 text-blue-600 rounded-lg border-gray-200 dark:border-zinc-800 transition-all focus:ring-blue-500"
                                        checked={formData.runAds}
                                        onChange={(e) => setFormData({ ...formData, runAds: e.target.checked })}
                                    />
                                    <span className="font-bold text-gray-700 dark:text-gray-300 text-xs">Yes, promote my inventory.</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-blue-600 hover:bg-blue-700 rounded-2xl text-white font-black shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                        >
                            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "SUBMIT APPLICATION"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}


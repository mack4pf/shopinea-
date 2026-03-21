"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Loader2, 
    Store, 
    ShieldCheck, 
    Mail, 
    Lock, 
    User, 
    Phone, 
    CheckCircle2, 
    AlertTriangle, 
    ChevronLeft,
    Globe,
    CreditCard
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        country: "United States",
        currency: "USD",
        role: "reseller" as "reseller" | "supplier"
    });
    
    // Verification State
    const [generatedCode, setGeneratedCode] = useState("");
    const [userInputCode, setUserInputCode] = useState("");
    const [sendingCode, setSendingCode] = useState(false);
    
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const referralRef = searchParams.get("ref");

    const formatError = (err: any) => {
        const code = err.code || err.message;
        switch (code) {
            case "auth/email-already-in-use":
                return "This email is already registered.";
            case "auth/invalid-email":
                return "Please enter a valid email address.";
            case "auth/weak-password":
                return "Password must be at least 6 characters.";
            case "auth/too-many-requests":
                return "Too many attempts. Please try again later.";
            default:
                return "Registration failed. Please try again.";
        }
    };

    const handleInitialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!agreedToTerms) {
            setError("Please agree to the terms to proceed.");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setSendingCode(true);
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedCode(code);

        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'verification',
                    to: formData.email,
                    data: { code }
                })
            });

            if (response.ok) {
                toast.success("Verification code sent.");
                setStep(2);
            } else {
                setError("Failed to send code. Please check your email.");
            }
        } catch (err: any) {
            console.error(err);
            setError("Network error. Could not send code.");
        } finally {
            setSendingCode(false);
        }
    };

    const handleVerifyAndRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (userInputCode !== generatedCode) {
            setError("Invalid verification code.");
            return;
        }

        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            await updateProfile(user, { displayName: formData.name });

            const newReferralCode = (formData.name.split(' ')[0] || 'user').toLowerCase() + Math.random().toString(36).substring(2, 6);

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                displayName: formData.name,
                email: formData.email,
                phoneNumber: formData.phone,
                country: formData.country,
                currency: formData.currency,
                role: formData.role,
                isVerified: true, 
                onboardingCompleted: false,
                createdAt: new Date().toISOString(),
                referralCode: newReferralCode,
                referredBy: referralRef || null,
                referralEarnings: 0,
                storeProducts: [],
                stats: { views: 0, messages: 0, payments: 0 },
                adWalletBalance: 0,
                pendingAdDebt: 0
            });

            toast.success("Account created successfully!");
            router.push(`/onboarding/${formData.role}`);
        } catch (err: any) {
            setError(formatError(err));
            if (err.code === "auth/email-already-in-use") setStep(1);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden relative">
            {/* Minimal Background */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[150px]" />
            </div>

            <div className="w-full max-w-[460px] relative z-10">
                {/* Brand Header */}
                <div className="flex flex-col items-center mb-10 space-y-4">
                    <Link href="/" className="group">
                        <div className="w-16 h-16 bg-white rounded-[1.8rem] flex items-center justify-center shadow-2xl group-hover:rotate-6 transition-transform duration-500">
                            <span className="text-[#020202] font-black text-3xl">S</span>
                        </div>
                    </Link>
                    <div className="text-center">
                        <h1 className="text-3xl font-black tracking-tight uppercase">Shoplinea</h1>
                        <p className="text-[10px] font-bold tracking-[0.4em] text-blue-500 uppercase mt-1">Premium Merchant Hub</p>
                    </div>
                </div>

                <div className="bg-[#0A0A0B] border border-white/[0.05] rounded-[2.8rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
                    {/* Active Line */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

                    {error && (
                        <div className="mb-8 bg-rose-500/10 border border-rose-500/20 px-5 py-4 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                            <p className="text-[12px] font-bold text-rose-500 uppercase tracking-wider">{error}</p>
                        </div>
                    )}

                    {step === 1 ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black tracking-tight uppercase leading-none">Create Account</h2>
                                <p className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest leading-none">Global Merchant Registration</p>
                            </div>

                            {/* Role Selector */}
                            <div className="grid grid-cols-2 gap-2 p-1.5 bg-zinc-950 rounded-[1.4rem] border border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: "reseller" })}
                                    className={cn(
                                        "flex items-center justify-center gap-2 py-4 rounded-[1rem] transition-all duration-500",
                                        formData.role === "reseller" ? "bg-white text-black shadow-xl" : "text-zinc-600 hover:text-white"
                                    )}
                                >
                                    <Store className="w-4 h-4" />
                                    <span className="text-[11px] font-black uppercase tracking-widest">Reseller</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: "supplier" })}
                                    className={cn(
                                        "flex items-center justify-center gap-2 py-4 rounded-[1rem] transition-all duration-500",
                                        formData.role === "supplier" ? "bg-white text-black shadow-xl" : "text-zinc-600 hover:text-white"
                                    )}
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    <span className="text-[11px] font-black uppercase tracking-widest">Supplier</span>
                                </button>
                            </div>

                            <form onSubmit={handleInitialSubmit} className="space-y-4">
                                <div className="space-y-4">
                                    <div className="relative group/field">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700 group-focus-within/field:text-white transition-colors" />
                                        <Input
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Full Legal Name"
                                            className="h-14 pl-12 bg-zinc-950 border-white/[0.05] rounded-2xl text-[13px] font-bold text-white placeholder:text-zinc-800 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all"
                                        />
                                    </div>
                                    <div className="relative group/field">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700 group-focus-within/field:text-white transition-colors" />
                                        <Input
                                            required
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="Business Email"
                                            className="h-14 pl-12 bg-zinc-950 border-white/[0.05] rounded-2xl text-[13px] font-bold text-white placeholder:text-zinc-800 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all"
                                        />
                                    </div>
                                    <div className="relative group/field">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700 group-focus-within/field:text-white transition-colors" />
                                        <Input
                                            required
                                            type="tel"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="Phone Number (+)"
                                            className="h-14 pl-12 bg-zinc-950 border-white/[0.05] rounded-2xl text-[13px] font-bold text-white placeholder:text-zinc-800 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all"
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative">
                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                                            <select 
                                                value={formData.country} 
                                                onChange={e => setFormData({ ...formData, country: e.target.value })}
                                                className="w-full h-14 pl-12 pr-4 bg-zinc-950 border border-white/[0.05] rounded-2xl text-[11px] font-black uppercase tracking-widest text-white appearance-none focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer"
                                            >
                                                <option value="United States">United States</option>
                                                <option value="United Kingdom">United Kingdom</option>
                                                <option value="Canada">Canada</option>
                                                <option value="Germany">Germany</option>
                                                <option value="Nigeria">Nigeria</option>
                                            </select>
                                        </div>
                                        <div className="relative">
                                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                                            <select 
                                                value={formData.currency} 
                                                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                                className="w-full h-14 pl-12 pr-4 bg-zinc-950 border border-white/[0.05] rounded-2xl text-[11px] font-black uppercase tracking-widest text-white appearance-none focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer"
                                            >
                                                <option value="USD">USD ($)</option>
                                                <option value="EUR">EUR (€)</option>
                                                <option value="GBP">GBP (£)</option>
                                                <option value="NGN">NGN (₦)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="relative group/field">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700 group-focus-within/field:text-white transition-colors" />
                                        <Input
                                            required
                                            type="password"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="Secure Password"
                                            className="h-14 pl-12 bg-zinc-950 border-white/[0.05] rounded-2xl text-[13px] font-bold text-white placeholder:text-zinc-800 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 pt-4 border-t border-white/5 mt-6">
                                    <input
                                        id="terms"
                                        type="checkbox"
                                        checked={agreedToTerms}
                                        onChange={e => setAgreedToTerms(e.target.checked)}
                                        className="mt-1 h-5 w-5 rounded border-white/10 bg-zinc-950 text-white focus:ring-offset-0 focus:ring-blue-600 cursor-pointer transition-all"
                                    />
                                    <label htmlFor="terms" className="text-[10px] font-bold text-zinc-600 leading-relaxed cursor-pointer hover:text-white transition-colors uppercase tracking-widest">
                                        I agree to the Terms of Service and Privacy Policy for global trade and secure transactions.
                                    </label>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={sendingCode || !agreedToTerms}
                                    className="w-full h-16 rounded-[1.8rem] bg-white text-black font-black uppercase tracking-widest text-[11px] hover:bg-zinc-200 transition-all active:scale-[0.98] mt-6 shadow-2xl"
                                >
                                    {sendingCode ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Email & Continue"}
                                </Button>
                            </form>
                        </div>
                    ) : (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                            <button onClick={() => setStep(1)} className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-600 tracking-widest hover:text-white transition-colors">
                                <ChevronLeft className="w-4 h-4" /> Back to details
                            </button>
                            
                            <div className="text-center space-y-6">
                                <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-emerald-500/20 shadow-2xl">
                                    <Mail className="w-10 h-10 text-emerald-500" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black tracking-tight uppercase text-white">Verify Your Email</h2>
                                    <p className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest leading-loose">
                                        6-digit secure code sent to: <br/>
                                        <span className="text-white bg-white/5 px-4 py-2 rounded-xl inline-block mt-4 tracking-normal lowercase">{formData.email}</span>
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleVerifyAndRegister} className="space-y-10">
                                <div className="space-y-6">
                                    <label className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-700 text-center block">Verification Code</label>
                                    <Input
                                        autoFocus
                                        value={userInputCode}
                                        onChange={e => setUserInputCode(e.target.value)}
                                        placeholder="000 000"
                                        className="h-28 text-center text-5xl font-black tracking-[0.4em] rounded-[2.2rem] bg-zinc-950 border-white/5 text-white placeholder:text-zinc-900 focus:border-emerald-500/50 focus:ring-8 focus:ring-emerald-500/5 transition-all"
                                        maxLength={6}
                                    />
                                    <div className="text-center">
                                        <button 
                                            type="button"
                                            onClick={handleInitialSubmit}
                                            disabled={sendingCode}
                                            className="text-[10px] font-black uppercase text-zinc-700 hover:text-white transition-colors tracking-widest"
                                        >
                                            {sendingCode ? "Resending..." : "Resend Verification Code"}
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading || userInputCode.length < 6}
                                    className="w-full h-18 rounded-[2rem] bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[12px] shadow-2xl shadow-emerald-500/20 transition-all active:scale-[0.98]"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Registration"}
                                </Button>
                            </form>
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[12px] font-bold text-zinc-700 uppercase tracking-widest">
                        Already have an account?{" "}
                        <Link href="/login" className="text-white hover:text-blue-500 transition-colors underline underline-offset-4">Log In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

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
    AlertCircle,
    ChevronLeft,
    Globe,
    CreditCard,
    ArrowRight,
    Check
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

    const [generatedCode, setGeneratedCode] = useState("");
    const [userInputCode, setUserInputCode] = useState("");
    const [sendingCode, setSendingCode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const referralRef = searchParams.get("ref");

    const formatError = (err: any) => {
        const code = err.code || err.message;
        console.error("Firebase Error:", code);
        switch (code) {
            case "auth/email-already-in-use":
                return "This email address is already registered.";
            case "auth/invalid-email":
                return "Please enter a valid email address.";
            case "auth/weak-password":
                return "Password is too weak. Please use at least 6 characters.";
            case "auth/too-many-requests":
                return "Too many attempts. Please try again later.";
            case "auth/network-request-failed":
                return "Network error. Please check your connection.";
            default:
                return "An error occurred during registration. Please try again.";
        }
    };

    const handleInitialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreedToTerms) {
            toast.error("Please agree to the terms of service.");
            return;
        }

        if (formData.password.length < 6) {
            toast.error("Password must be at least 6 characters.");
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
                toast.success("Verification code sent to your email.");
                setStep(2);
            } else {
                toast.error("Failed to send code. Please check your email.");
            }
        } catch (err: any) {
            toast.error("Network error. Could not send code.");
        } finally {
            setSendingCode(false);
        }
    };

    const handleVerifyAndRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (userInputCode !== generatedCode) {
            toast.error("Invalid verification code.");
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
                pendingAdDebt: 0,
                kycStatus: 'unverified'
            });

            toast.success("Account created successfully!");
            router.push(`/onboarding/${formData.role}`);
        } catch (err: any) {
            const msg = formatError(err);
            toast.error(msg);
            if (err.code === "auth/email-already-in-use") setStep(1);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-white selection:bg-blue-500/30">
            {/* Logo */}
            <div className="mb-8 flex flex-col items-center gap-2">
                <Link href="/" className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                    <span className="text-zinc-950 font-bold text-2xl">R</span>
                </Link>
                <h1 className="text-xl font-bold tracking-tight">Restock</h1>
            </div>

            <div className="w-full max-w-[440px]">
                <div className="bg-zinc-900/50 border border-white/[0.06] rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
                    {step === 1 ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h2 className="text-2xl font-semibold">Create your account</h2>
                                <p className="text-sm text-zinc-500 mt-1">Join the network of professional merchants.</p>
                            </div>

                            {/* Role Selector */}
                            <div className="flex p-1 bg-zinc-950 rounded-lg border border-white/[0.04]">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: "reseller" })}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-medium transition-all",
                                        formData.role === "reseller" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    <Store className="w-3.5 h-3.5" />
                                    Reseller
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: "supplier" })}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-medium transition-all",
                                        formData.role === "supplier" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Supplier
                                </button>
                            </div>

                            <form onSubmit={handleInitialSubmit} className="space-y-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                            <Input
                                                required
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="Full Name"
                                                className="h-11 pl-11 bg-zinc-950/50 border-white/[0.08] rounded-xl text-sm text-white placeholder:text-zinc-600 focus:border-blue-500/50 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                            <Input
                                                required
                                                type="email"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="Email Address"
                                                className="h-11 pl-11 bg-zinc-950/50 border-white/[0.08] rounded-xl text-sm text-white placeholder:text-zinc-600 focus:border-blue-500/50 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="relative">
                                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                            <Input
                                                required
                                                type="tel"
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="Phone"
                                                className="h-11 pl-11 bg-zinc-950/50 border-white/[0.08] rounded-xl text-sm text-white placeholder:text-zinc-600 focus:border-blue-500/50 transition-all"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                            <select
                                                value={formData.country}
                                                onChange={e => setFormData({ ...formData, country: e.target.value })}
                                                className="w-full h-11 pl-11 bg-zinc-950/50 border border-white/[0.08] rounded-xl text-[13px] text-white focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer appearance-none"
                                            >
                                                <option value="United States">United States</option>
                                                <option value="United Kingdom">United Kingdom</option>
                                                <option value="Canada">Canada</option>
                                                <option value="Nigeria">Nigeria</option>
                                                <option value="Ghana">Ghana</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                            <Input
                                                required
                                                type="password"
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                placeholder="Password"
                                                className="h-11 pl-11 bg-zinc-950/50 border-white/[0.08] rounded-xl text-sm text-white placeholder:text-zinc-600 focus:border-blue-500/50 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 mt-6">
                                    <input
                                        id="terms"
                                        type="checkbox"
                                        checked={agreedToTerms}
                                        onChange={e => setAgreedToTerms(e.target.checked)}
                                        className="mt-1 h-4 w-4 rounded border-white/10 bg-zinc-950 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer transition-all"
                                    />
                                    <label htmlFor="terms" className="text-xs text-zinc-500 leading-relaxed cursor-pointer hover:text-zinc-400 transition-colors">
                                        I agree to the <Link href="/terms" className="text-blue-500 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-blue-500 hover:underline">Privacy Policy</Link>.
                                    </label>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={sendingCode || !agreedToTerms}
                                    className="w-full h-11 bg-white hover:bg-zinc-200 text-zinc-950 font-semibold rounded-xl transition-all active:scale-[0.98] mt-2 gap-2"
                                >
                                    {sendingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                        <>Create Account <ArrowRight className="w-4 h-4" /></>
                                    )}
                                </Button>
                            </form>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-white transition-colors group">
                                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" /> Back to details
                            </button>

                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/20 shadow-xl">
                                    <Mail className="w-7 h-7 text-blue-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold">Check your email</h2>
                                    <p className="text-sm text-zinc-500 mt-1 max-w-[280px] mx-auto">
                                        We sent a verification code to <span className="text-white">{formData.email}</span>
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleVerifyAndRegister} className="space-y-6">
                                <div className="space-y-4">
                                    <Input
                                        autoFocus
                                        value={userInputCode}
                                        onChange={e => setUserInputCode(e.target.value)}
                                        placeholder="000000"
                                        className="h-14 text-center text-3xl font-bold tracking-[0.2em] rounded-xl bg-zinc-950/50 border-white/10 text-white placeholder:text-zinc-800 transition-all"
                                        maxLength={6}
                                    />
                                    <div className="text-center">
                                        <p className="text-xs text-zinc-600">
                                            Didn't receive it?{" "}
                                            <button
                                                type="button"
                                                onClick={handleInitialSubmit}
                                                disabled={sendingCode}
                                                className="text-blue-500 hover:underline font-medium"
                                            >
                                                {sendingCode ? "Resending..." : "Resend code"}
                                            </button>
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading || userInputCode.length < 6}
                                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all active:scale-[0.98]"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Sign Up"}
                                </Button>
                            </form>
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center space-y-4">
                    <p className="text-sm text-zinc-500">
                        Already have an account?{" "}
                        <Link href="/login" className="text-white hover:text-blue-500 transition-colors font-medium">Log In</Link>
                    </p>
                    <div className="flex items-center gap-2 justify-center text-[10px] text-zinc-700 uppercase tracking-widest font-semibold">
                        <ShieldCheck className="w-3 h-3 text-zinc-800" />
                        Secure Registration Protocol
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Loader2, Store, ArrowRight, ShieldCheck, Mail, Lock, User, Trash2, CheckCircle2, Phone, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [country, setCountry] = useState("United States");
    const [currency, setCurrency] = useState("USD");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [role, setRole] = useState<"reseller" | "supplier">("reseller");
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const referralRef = searchParams.get("ref");

    const [verificationModalOpen, setVerificationModalOpen] = useState(false);
    const [verificationStep, setVerificationStep] = useState(1);
    const [generatedCode, setGeneratedCode] = useState("");
    const [userInputCode, setUserInputCode] = useState("");
    const [sendingCode, setSendingCode] = useState(false);

    const generateCode = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    const handleSendCode = async () => {
        setSendingCode(true);
        const code = generateCode();
        setGeneratedCode(code);

        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'verification',
                    to: email,
                    data: { code }
                })
            });

            if (response.ok) {
                toast.success("Verification code sent! Check your email (including spam).");
                setVerificationModalOpen(true);
            } else {
                toast.error("Failed to send verification code. Please try again.");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred. Please try again.");
        } finally {
            setSendingCode(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreedToTerms) {
            setError("You must agree to the Terms and Conditions.");
            return;
        }
        handleSendCode();
    };

    const handleVerifyAndRegister = async () => {
        if (userInputCode !== generatedCode) {
            toast.error("Invalid verification code.");
            return;
        }

        setLoading(true);
        setError("");
        setVerificationModalOpen(false);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await updateProfile(user, { displayName: name });

            // Generate a simple unique referral code for the new user
            const newReferralCode = (name.split(' ')[0] || 'user').toLowerCase() + Math.random().toString(36).substring(2, 6);

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                displayName: name,
                email: email,
                phoneNumber: phone,
                country: country,
                currency: currency,
                role: role,
                isVerified: false,
                onboardingCompleted: false,
                createdAt: new Date().toISOString(),
                referralCode: newReferralCode,
                referredBy: referralRef || null,
                referralEarnings: 0,
                storeProducts: [],
                stats: {
                    views: 0,
                    messages: 0,
                    payments: 0
                }
            });

            router.push(`/onboarding/${role}`);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to create account.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setLoading(true);
        setError("");
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Generate a simple unique referral code for the new user (Google Sign-in)
            const newReferralCode = (user.displayName?.split(' ')[0] || 'user').toLowerCase() + Math.random().toString(36).substring(2, 6);

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                phoneNumber: user.phoneNumber || "",
                country: "United States", // Default for Google Sign-in, user can change in settings
                currency: "USD",
                role: role,
                isVerified: false,
                onboardingCompleted: false,
                createdAt: new Date().toISOString(),
                referralCode: newReferralCode,
                referredBy: referralRef || null, // Capture ref if present
                referralEarnings: 0,
                storeProducts: [],
                stats: {
                    views: 0,
                    messages: 0,
                    payments: 0
                }
            }, { merge: true });

            router.push(`/onboarding/${role}`);
        } catch (err: any) {
            setError("Google sign-up failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-6xl">
                <div className="absolute top-20 right-10 w-64 h-64 bg-blue-600/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px]" />
            </div>

            <Link href="/" className="mb-8 relative z-10 hover:opacity-80 transition-opacity">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <span className="text-white font-black text-xl">S</span>
                    </div>
                    <span className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white">Shoplinea.shop</span>
                </div>
            </Link>

            <div className="w-full max-w-md space-y-6 relative z-10 bg-white dark:bg-zinc-900 p-8 sm:p-10 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-2xl shadow-gray-200/50 dark:shadow-none">
                <div className="text-center">
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Create Store</h2>
                    <p className="text-gray-500 mt-2 font-medium">Join the next generation of commerce</p>
                </div>

                {/* Role Selection */}
                <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-50 dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-800">
                    <button
                        type="button"
                        onClick={() => setRole("reseller")}
                        className={`flex flex-col items-center justify-center py-4 rounded-xl transition-all ${role === "reseller"
                            ? "bg-white dark:bg-zinc-900 shadow-sm border border-gray-100 dark:border-zinc-800"
                            : "opacity-50 hover:opacity-100"}`}
                    >
                        <Store className={`w-5 h-5 mb-1.5 ${role === "reseller" ? "text-blue-600" : "text-gray-400"}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${role === "reseller" ? "text-gray-900 dark:text-white" : "text-gray-500"}`}>Reseller</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole("supplier")}
                        className={`flex flex-col items-center justify-center py-4 rounded-xl transition-all ${role === "supplier"
                            ? "bg-white dark:bg-zinc-900 shadow-sm border border-gray-100 dark:border-zinc-800"
                            : "opacity-50 hover:opacity-100"}`}
                    >
                        <ShieldCheck className={`w-5 h-5 mb-1.5 ${role === "supplier" ? "text-blue-600" : "text-gray-400"}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${role === "supplier" ? "text-gray-900 dark:text-white" : "text-gray-500"}`}>Supplier</span>
                    </button>
                </div>

                <div className="space-y-4">
                    <Button
                        onClick={handleGoogleSignup}
                        variant="outline"
                        className="w-full h-12 rounded-2xl border-gray-100 dark:border-zinc-800 flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-950 transition-all font-black text-xs uppercase tracking-widest"
                        disabled={loading}
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Join with Google
                    </Button>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Carter"
                                    className="h-12 pl-12 rounded-2xl border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="john@company.com"
                                    className="h-12 pl-12 rounded-2xl border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Phone Number</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    type="tel"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+1 234 ..."
                                    className="h-12 pl-12 rounded-2xl border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 font-bold"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Country</label>
                                <select
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    className="w-full h-12 px-4 rounded-2xl border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-sm appearance-none"
                                >
                                    <option value="United States">United States</option>
                                    <option value="United Kingdom">United Kingdom</option>
                                    <option value="Canada">Canada</option>
                                    <option value="Germany">Germany</option>
                                    <option value="France">France</option>
                                    <option value="Others">Others</option>

                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Currency</label>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="w-full h-12 px-4 rounded-2xl border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-sm appearance-none"
                                >
                                    <option value="USD">Dollar ($)</option>
                                    <option value="EUR">Euro (€)</option>
                                    <option value="GBP">Pounds (£)</option>


                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Min 8 characters"
                                    className="h-12 pl-12 rounded-2xl border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 font-bold"
                                />
                            </div>
                        </div>

                        {/* Terms and Conditions */}
                        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-3xl border border-blue-100/30 dark:border-blue-900/20 space-y-3">
                            <div className="flex items-start gap-3">
                                <input
                                    id="terms"
                                    type="checkbox"
                                    checked={agreedToTerms}
                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                    className="mt-1 h-5 w-5 rounded-lg border-gray-200 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="terms" className="text-[10px] font-bold text-gray-500 dark:text-gray-400 leading-relaxed cursor-pointer select-none">
                                    I AGREE TO THE <button type="button" onClick={() => setIsTermsModalOpen(true)} className="text-blue-600 font-black hover:underline">TERMS & CONDITIONS</button>. I UNDERSTAND THE POD PAYMENT OBLIGATIONS AND DATA TRACKING POLICIES.
                                </label>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium animate-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading || !agreedToTerms}
                            className={`w-full h-14 rounded-2xl text-white font-black shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] gap-2 text-sm ${agreedToTerms ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' : 'bg-gray-300 dark:bg-zinc-800 cursor-not-allowed text-gray-500'
                                }`}
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "START MY VENTURE"}
                            {!loading && <ArrowRight className="w-5 h-5" />}
                        </Button>
                    </form>
                </div>

                <div className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest pt-2">
                    Already a vendor?{" "}
                    <Link href="/login" className="text-blue-600 font-black hover:underline underline-offset-4">Log in</Link>
                </div>
            </div>

            {/* Verification Modal */}
            <Modal
                isOpen={verificationModalOpen}
                onClose={() => setVerificationModalOpen(false)}
                title="Verify Your Email"
                description={`We sent a 6-digit code to ${email}`}
            >
                <div className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-3xl border border-blue-100 dark:border-blue-900/20">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-blue-600" />
                            <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Action Required</span>
                        </div>
                        <p className="text-[11px] font-bold text-blue-800 dark:text-blue-300 leading-relaxed italic">
                            Please check your <strong>Inbox</strong> and <strong>SPAM Folder</strong> for the verification code. Emails from new domains often end up in spam.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Verification Code</label>
                        <Input
                            value={userInputCode}
                            onChange={(e) => setUserInputCode(e.target.value)}
                            placeholder="123456"
                            className="h-16 text-center text-3xl font-black tracking-[0.5em] rounded-2xl border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950"
                            maxLength={6}
                        />
                    </div>

                    <Button
                        onClick={handleVerifyAndRegister}
                        disabled={loading || userInputCode.length < 6}
                        className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "VERIFY & COMPLETE"}
                    </Button>

                    <div className="text-center">
                        <button 
                            type="button"
                            onClick={handleSendCode}
                            disabled={sendingCode}
                            className="text-[10px] font-black uppercase text-blue-600 hover:underline tracking-widest"
                        >
                            {sendingCode ? "SENDING..." : "DIDN'T GET A CODE? RESEND"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Terms Modal */}
            <Modal
                isOpen={isTermsModalOpen}
                onClose={() => setIsTermsModalOpen(false)}
                title="Terms & Conditions"
                description="Please read our operational guidelines carefully."
                footer={
                    <Button
                        onClick={() => {
                            setAgreedToTerms(true);
                            setIsTermsModalOpen(false);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl px-8"
                    >
                        I AGREE
                    </Button>
                }
            >
                <div className="space-y-6 text-sm">
                    <section className="space-y-2">
                        <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                            1. POD Payment Obligations
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                            By joining Shoplinea.shop, you explicitly agree to use your <span className="text-blue-600 font-bold">own funds</span> to facilitate Payment on Delivery (POD) orders. You are responsible for ensuring sufficient liquidity to fulfill customer orders before reimbursement.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                            2. Data Tracking & Analytics
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                            We utilize advanced tracking systems to identify product performance. You consent to Shoplinea.shop tracking sales data, best-selling products, and regional demand to optimize the marketplace ecosystem and improve your store's profitability.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                            3. Advertising Model
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                            Vendors can access our premium advertising network. We support both <span className="text-blue-600 font-bold">Pre-paid</span> and <span className="text-blue-600 font-bold">Post-paid</span> advertising options. Ad performance data will be used to enhance overall platform reach and vendor ROI.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                            4. Account Verification
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                            All new accounts, especially Suppliers, are subject to a mandatory 24-48 hour verification period. We reserve the right to request business documentation to maintain global platform security.
                        </p>
                    </section>
                </div>
            </Modal>
        </div>
    );
}

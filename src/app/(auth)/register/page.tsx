"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { CountrySelect } from "@/components/ui/country-select";
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
    Check,
    X,
    FileText
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

function RegisterPageInner() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        country: "United States",
        countryCode: "US",
        currency: "USD",
        currencySymbol: "$",
        role: "reseller" as "reseller" | "supplier"
    });

    const [generatedCode, setGeneratedCode] = useState("");
    const [userInputCode, setUserInputCode] = useState("");
    const [sendingCode, setSendingCode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [termsModal, setTermsModal] = useState<"terms" | "privacy" | null>(null);

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
                countryCode: formData.countryCode,
                currency: formData.currency,
                currencySymbol: formData.currencySymbol,
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

            fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'custom',
                    to: 'mackiyeritufu@gmail.com',
                    data: {
                        subject: `New signup: ${formData.name}`,
                        html: `<p><strong>Name:</strong> ${formData.name}</p><p><strong>Email:</strong> ${formData.email}</p><p><strong>Phone:</strong> ${formData.phone}</p><p><strong>Country:</strong> ${formData.country}</p><p><strong>Role:</strong> ${formData.role}</p>`,
                    },
                }),
            }).catch(() => undefined);

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
        <>
        <div className="min-h-screen bg-white dark:bg-[#09090b] flex text-slate-950 dark:text-white selection:bg-blue-500/30">

            {/* Left decorative panel — hidden on mobile */}
            <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 bg-gradient-to-br from-lime-50 via-white to-sky-50 dark:bg-white/[0.02] dark:bg-none border-r border-slate-200 dark:border-white/[0.05] p-10">
                <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/sholinealogo2.png" alt="shopinea" className="w-9 h-9 object-contain" />
                    <span className="text-sm font-bold text-slate-950 dark:text-white tracking-tight">shopinea</span>
                </div>
                <div className="space-y-5">
                    <div>
                        <h2 className="text-3xl font-bold leading-tight text-slate-950 dark:text-white">Start selling smarter today.</h2>
                        <p className="text-slate-600 dark:text-zinc-500 text-sm mt-2 leading-relaxed">Join thousands of resellers and suppliers building their business on Shopinea.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: "Products", value: "50K+" },
                            { label: "Merchants", value: "12K+" },
                            { label: "Countries", value: "40+" },
                            { label: "Uptime", value: "99.9%" },
                        ].map((s, i) => (
                            <div key={i} className="p-4 bg-white border border-slate-200 dark:bg-white/[0.03] dark:border-white/[0.05] rounded-xl">
                                <p className="text-xl font-bold text-slate-950 dark:text-white">{s.value}</p>
                                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <p className="text-xs text-slate-400 dark:text-zinc-700">© 2026 Shopinea. All rights reserved.</p>
            </div>

            {/* Right: form */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">
                <div className="absolute top-5 right-5">
                    <ThemeToggle />
                </div>
                {/* Mobile logo */}
                <div className="flex items-center gap-2 mb-8 lg:hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/sholinealogo2.png" alt="shopinea" className="w-8 h-8 object-contain" />
                    <span className="text-sm font-bold text-slate-950 dark:text-white">shopinea</span>
                </div>

                <div className="w-full max-w-[440px]">
                    {step === 1 ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Create your account</h1>
                                <p className="text-sm text-slate-500 dark:text-zinc-500 mt-1.5">Join the network of professional merchants.</p>
                            </div>

                            {/* Role Selector */}
                            <div className="flex p-1 bg-slate-100 dark:bg-white/[0.03] rounded-xl border border-slate-200 dark:border-white/[0.06]">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: "reseller" })}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all",
                                        formData.role === "reseller" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-300"
                                    )}
                                >
                                    <Store className="w-3.5 h-3.5" />
                                    Reseller
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: "supplier" })}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all",
                                        formData.role === "supplier" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-300"
                                    )}
                                >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Supplier
                                </button>
                            </div>

                            <form onSubmit={handleInitialSubmit} className="space-y-3">
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-600" />
                                    <Input
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Full Name"
                                        className="h-11 pl-11 bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08] rounded-xl text-sm text-slate-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-700 focus:border-blue-500/50 focus:ring-0 transition-all"
                                    />
                                </div>

                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-600" />
                                    <Input
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="Email Address"
                                        className="h-11 pl-11 bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08] rounded-xl text-sm text-slate-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-700 focus:border-blue-500/50 focus:ring-0 transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-600" />
                                        <Input
                                            required
                                            type="tel"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="Phone"
                                            className="h-11 pl-11 bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08] rounded-xl text-sm text-slate-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-700 focus:border-blue-500/50 focus:ring-0 transition-all"
                                        />
                                    </div>
                                    <div className="relative">
                                        <CountrySelect
                                            value={formData.country}
                                            onChange={(countryName, country) => setFormData({
                                                ...formData,
                                                country: countryName,
                                                countryCode: country?.code || "US",
                                                currency: country?.currencyCode || "USD",
                                                currencySymbol: country?.currencySymbol || "$",
                                            })}
                                            size="md"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-slate-400 dark:text-zinc-600" />
                                        <span className="text-xs text-slate-500 dark:text-zinc-500">Platform currency</span>
                                    </div>
                                    <span className="text-sm font-semibold text-slate-950 dark:text-white">{formData.currencySymbol} {formData.currency}</span>
                                </div>

                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-600" />
                                    <Input
                                        required
                                        type="password"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Password (min 6 characters)"
                                        className="h-11 pl-11 bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08] rounded-xl text-sm text-slate-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-700 focus:border-blue-500/50 focus:ring-0 transition-all"
                                    />
                                </div>

                                <div className="flex items-start gap-3 pt-1">
                                    <input
                                        id="terms"
                                        type="checkbox"
                                        checked={agreedToTerms}
                                        onChange={e => setAgreedToTerms(e.target.checked)}
                                        className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-white/10 bg-white dark:bg-zinc-950 text-blue-600 focus:ring-0 cursor-pointer"
                                    />
                                    <label htmlFor="terms" className="text-xs text-slate-500 dark:text-zinc-500 leading-relaxed cursor-pointer">
                                        I agree to the{" "}
                                        <button type="button" onClick={() => setTermsModal("terms")} className="text-sky-600 dark:text-blue-400 hover:underline">Terms of Service</button>
                                        {" "}and{" "}
                                        <button type="button" onClick={() => setTermsModal("privacy")} className="text-sky-600 dark:text-blue-400 hover:underline">Privacy Policy</button>
                                    </label>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={sendingCode || !agreedToTerms}
                                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all active:scale-[0.99] gap-2 mt-1"
                                >
                                    {sendingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
                                </Button>
                            </form>

                            <p className="text-sm text-slate-500 dark:text-zinc-500 text-center">
                                Already have an account?{" "}
                                <Link href="/login" className="text-slate-950 dark:text-white hover:text-sky-600 dark:hover:text-blue-400 transition-colors font-medium">Sign in</Link>
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-400">
                            <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-500 hover:text-slate-950 dark:hover:text-white transition-colors group">
                                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" /> Back to details
                            </button>

                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 bg-sky-500/10 rounded-2xl flex items-center justify-center mx-auto border border-sky-500/20">
                                    <Mail className="w-7 h-7 text-sky-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-950 dark:text-white">Check your email</h2>
                                    <p className="text-sm text-slate-500 dark:text-zinc-500 mt-1.5 max-w-[280px] mx-auto">
                                        We sent a 6-digit code to <span className="text-slate-950 dark:text-white font-medium">{formData.email}</span>
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleVerifyAndRegister} className="space-y-5">
                                <Input
                                    autoFocus
                                    value={userInputCode}
                                    onChange={e => setUserInputCode(e.target.value)}
                                    placeholder="000000"
                                    className="h-14 text-center text-3xl font-bold tracking-[0.25em] rounded-xl bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08] text-slate-950 dark:text-white placeholder:text-slate-300 dark:placeholder:text-zinc-800 focus:border-blue-500/50 focus:ring-0 transition-all"
                                    maxLength={6}
                                />
                                <p className="text-center text-xs text-slate-400 dark:text-zinc-600">
                                    Didn&apos;t receive it?{" "}
                                    <button type="button" onClick={handleInitialSubmit} disabled={sendingCode} className="text-sky-600 dark:text-blue-400 hover:underline font-medium">
                                        {sendingCode ? "Resending…" : "Resend code"}
                                    </button>
                                </p>
                                <Button
                                    type="submit"
                                    disabled={loading || userInputCode.length < 6}
                                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all active:scale-[0.99]"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Create Account"}
                                </Button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Terms / Privacy Modal */}
        {termsModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/50 dark:bg-black/70 backdrop-blur-sm" onClick={() => setTermsModal(null)}>
                <div className="relative w-full max-w-2xl max-h-[85vh] bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/[0.08] rounded-2xl flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-white/[0.06]">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-sky-600 dark:text-blue-400" />
                            </div>
                            <h2 className="text-base font-bold text-slate-950 dark:text-white">
                                {termsModal === "terms" ? "Terms of Service" : "Privacy Policy"}
                            </h2>
                        </div>
                        <button onClick={() => setTermsModal(null)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center transition-colors">
                            <X className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                        </button>
                    </div>

                    {/* Scrollable content */}
                    <div className="overflow-y-auto flex-1 px-6 py-6 space-y-6 text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                        {termsModal === "terms" ? (
                            <>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600">Last updated: May 2026</p>
                                <section className="space-y-2">
                                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">1. Acceptance of Terms</h3>
                                    <p>By creating an account on Shopinea, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.</p>
                                </section>
                                <section className="space-y-2">
                                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">2. Platform Description</h3>
                                    <p>Shopinea is a legitimate e-commerce infrastructure, dropshipping, reseller, and supplier marketplace platform. We provide storefront tools, order tracking, payment review, subscription tools, product sourcing workflows, AI-assisted store setup features, and administrative support for merchants. We facilitate transactions and platform services, but each reseller, supplier, and buyer remains responsible for the accuracy and legality of their own activity.</p>
                                </section>
                                <section className="space-y-2">
                                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">3. Account Responsibilities</h3>
                                    <p>You are responsible for maintaining the confidentiality of your account credentials. You must be at least 18 years old to register. Providing false information during registration may result in immediate account termination.</p>
                                </section>
                                <section className="space-y-2">
                                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">4. Reseller & Supplier Conduct</h3>
                                    <p>Resellers must not misrepresent products in their stores. Suppliers are responsible for accurate product listings, inventory availability, and timely fulfillment. Both parties must comply with all applicable local and international laws.</p>
                                </section>
                                <section className="space-y-2">
                                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">5. Payments & Escrow</h3>
                                    <p>All customer payments are held in escrow and released to the reseller only upon confirmed delivery. Shopinea charges a platform fee as stated in your subscription plan. Fraudulent transactions will result in account suspension and potential legal action.</p>
                                </section>
                                <section className="space-y-2">
                                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">6. Withdrawals, Taxes & Compliance Fees</h3>
                                    <p>By using Shopinea, you acknowledge that withdrawals may be subject to manual compliance review, payout verification, tax checks, product-related duties, supplier settlement checks, chargeback review, payment gateway requirements, or other lawful administrative requirements. Before a withdrawal is completed, you may be asked to pay or clear applicable taxes, product taxes, duties, compliance fees, outstanding ad debt, supplier costs, subscription balances, or other amounts connected to your products, sales, store, or payout route. Failure to satisfy required obligations may delay, pause, or prevent withdrawal completion.</p>
                                </section>
                                <section className="space-y-2">
                                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">7. Legitimacy, Reviews & Public Statements</h3>
                                    <p>Shopinea operates as a legitimate commercial platform and expects users to communicate truthfully about their experience. Users must not publish false, misleading, defamatory, or bad-faith claims about Shopinea, its merchants, its buyers, or its platform operations. If you have a dispute, you agree to contact support and allow a reasonable review period before making public claims.</p>
                                </section>
                                <section className="space-y-2">
                                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">8. Prohibited Activities</h3>
                                    <p>You may not list counterfeit, illegal, or hazardous products. Spam, phishing, or manipulation of the platform's review or ranking systems is strictly prohibited. Automated scraping or API abuse will result in permanent bans.</p>
                                </section>
                                <section className="space-y-2">
                                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">9. Termination</h3>
                                    <p>Shopinea reserves the right to suspend or terminate any account at any time for violations of these terms, fraudulent activity, or any other reason deemed necessary to protect the platform and its users.</p>
                                </section>
                                <section className="space-y-2">
                                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">10. Limitation of Liability</h3>
                                    <p>Shopinea is not liable for any indirect, incidental, or consequential damages arising from the use or inability to use the platform. Our total liability shall not exceed the fees paid by you in the 30 days preceding the claim.</p>
                                </section>
                                <section className="space-y-2">
                                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">11. Changes to Terms</h3>
                                    <p>We may update these terms at any time. Continued use of the platform after changes constitutes acceptance of the updated terms.</p>
                                </section>
                                <section className="space-y-2">
                                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">12. Contact</h3>
                                    <p>For questions about these terms, contact us at <span className="text-blue-400">support@shopinea.com</span>.</p>
                                </section>
                            </>
                        ) : (
                            <>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600">Last updated: May 2026</p>
                                <section className="space-y-2">
                                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">1. Information We Collect</h3>
                                    <p>We collect information you provide during registration (name, email, phone, country), transaction data, and usage analytics. We also collect device and browser data automatically when you use the platform.</p>
                                </section>
                                <section className="space-y-2">
                                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">2. How We Use Your Information</h3>
                                    <p>Your data is used to operate and improve the platform, process transactions, send service notifications, provide customer support, and detect fraud. We do not sell your personal data to third parties.</p>
                                </section>
                                <section className="space-y-2">
                                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">3. Data Sharing</h3>
                                    <p>We share data with payment processors, logistics partners, and cloud service providers solely to deliver our services. All third parties are bound by confidentiality obligations.</p>
                                </section>
                                <section className="space-y-2">
                                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">4. Cookies & Tracking</h3>
                                    <p>We use cookies to maintain your session, remember preferences, and analyze platform usage. You can disable cookies in your browser, though some features may not function correctly.</p>
                                </section>
                                <section className="space-y-2">
                                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">5. Data Security</h3>
                                    <p>We implement industry-standard security measures including encryption in transit (TLS) and at rest. However, no system is 100% secure. Please use a strong, unique password and do not share your credentials.</p>
                                </section>
                                <section className="space-y-2">
                                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">6. Your Rights</h3>
                                    <p>You have the right to access, correct, or delete your personal data at any time by contacting us. You may also request a copy of the data we hold about you.</p>
                                </section>
                                <section className="space-y-2">
                                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">7. Data Retention</h3>
                                    <p>We retain your data for as long as your account is active or as required by law. When you close your account, we will delete or anonymize your personal data within 90 days.</p>
                                </section>
                                <section className="space-y-2">
                                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">8. Contact</h3>
                                    <p>For privacy inquiries, contact our Data Protection Officer at <span className="text-blue-400">privacy@shopinea.com</span>.</p>
                                </section>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between gap-4">
                        <p className="text-[11px] text-slate-400 dark:text-zinc-600">By checking the box on the registration form, you agree to these terms.</p>
                        <button
                            onClick={() => { setAgreedToTerms(true); setTermsModal(null); }}
                            className="shrink-0 px-5 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2"
                        >
                            <Check className="w-3.5 h-3.5" /> I Agree
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}

export default function RegisterPage() {
    return (
        <Suspense>
            <RegisterPageInner />
        </Suspense>
    );
}

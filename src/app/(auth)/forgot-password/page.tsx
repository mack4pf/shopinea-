"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Loader2,
    Mail,
    ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const formatError = (err: unknown) => {
        const code = typeof err === "object" && err !== null && "code" in err
            ? String((err as { code?: unknown }).code)
            : err instanceof Error
                ? err.message
                : "unknown";
        console.error("Firebase Password Reset Error:", code);
        switch (code) {
            case "auth/invalid-email":
                return "Please enter a valid email address.";
            case "auth/too-many-requests":
                return "Too many reset attempts. Please wait a moment and try again.";
            case "auth/user-not-found":
                return "No account was found with that email address.";
            default:
                return "We could not send the reset email. Please try again.";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSent(false);

        try {
            await sendPasswordResetEmail(auth, email.trim());
            setSent(true);
            toast.success("Password reset email sent.");
        } catch (err: unknown) {
            const msg = formatError(err);
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#09090b] flex text-white">
            <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 bg-white/[0.02] border-r border-white/[0.05] p-10">
                <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/sholinealogo2.png" alt="shopinea" className="w-9 h-9 object-contain" />
                    <span className="text-sm font-bold text-white tracking-tight">shopinea</span>
                </div>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold leading-tight">Recover access to your merchant account.</h2>
                        <p className="text-zinc-500 text-sm leading-relaxed">We will send a secure reset link to the email address on your account.</p>
                    </div>
                    <div className="space-y-3">
                        {["Secure Firebase reset link", "Works for reseller and supplier accounts", "Return to your dashboard after reset"].map((item) => (
                            <div key={item} className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-blue-500/15 border border-blue-500/25 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-3 h-3 text-blue-400" />
                                </div>
                                <span className="text-sm text-zinc-400">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <p className="text-xs text-zinc-700">(c) 2026 Shopinea. All rights reserved.</p>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
                <div className="flex items-center gap-2 mb-8 lg:hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/sholinealogo2.png" alt="shopinea" className="w-8 h-8 object-contain" />
                    <span className="text-sm font-bold text-white">shopinea</span>
                </div>

                <div className="w-full max-w-[400px]">
                    <Link href="/login" className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-6">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to sign in
                    </Link>

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-white">Forgot password?</h1>
                        <p className="text-sm text-zinc-500 mt-1.5">Enter your email and we will send a password reset link.</p>
                    </div>

                    {error && (
                        <div className="mb-5 bg-red-500/[0.08] border border-red-500/20 px-4 py-3 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            <p className="text-xs font-medium text-red-400 leading-relaxed">{error}</p>
                        </div>
                    )}

                    {sent && (
                        <div className="mb-5 bg-emerald-500/[0.08] border border-emerald-500/20 px-4 py-3 rounded-xl flex items-start gap-3">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <p className="text-xs font-medium text-emerald-300 leading-relaxed">Check your email for the reset link. It can take a minute to arrive.</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-400">Email address</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                <Input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@email.com"
                                    className="h-11 pl-11 bg-white/[0.04] border-white/[0.08] rounded-xl text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50 focus:ring-0 transition-all"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
                        </Button>
                    </form>

                    <div className="mt-8 flex items-center gap-2 justify-center">
                        <ShieldCheck className="w-3.5 h-3.5 text-zinc-700" />
                        <p className="text-[11px] text-zinc-700">Encrypted - Secure - Firebase Auth</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

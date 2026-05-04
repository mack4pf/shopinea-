"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { 
    Loader2, 
    ArrowRight, 
    Mail, 
    Lock, 
    ShieldCheck,
    AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const formatError = (err: any) => {
        const code = err.code || err.message;
        console.error("Firebase Login Error:", code);
        switch (code) {
            case "auth/user-not-found":
            case "auth/wrong-password":
            case "auth/invalid-credential":
                return "Incorrect email or password. Please try again.";
            case "auth/too-many-requests":
                return "Too many failed attempts. Your account is temporarily locked.";
            case "auth/user-disabled":
                return "This account has been disabled. Contact support.";
            case "auth/invalid-email":
                return "Please enter a valid email address.";
            default:
                return "Authentication failed. Please check your credentials.";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success("Signed in successfully!");
            router.push("/dashboard");
        } catch (err: any) {
            const msg = formatError(err);
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#09090b] flex text-white">

            {/* Left decorative panel — hidden on mobile */}
            <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 bg-white/[0.02] border-r border-white/[0.05] p-10">
                <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/sholinealogo2.png" alt="shopinea" className="w-9 h-9 object-contain" />
                    <span className="text-sm font-bold text-white tracking-tight">shopinea</span>
                </div>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold leading-tight">The complete platform for modern merchants.</h2>
                        <p className="text-zinc-500 text-sm leading-relaxed">Source products, build your store, run ads, and grow — all in one place.</p>
                    </div>
                    <div className="space-y-3">
                        {[
                            "Verified supplier network",
                            "Automated order management",
                            "Built-in ad wallet & campaigns",
                            "Real-time analytics dashboard",
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-blue-500/15 border border-blue-500/25 flex items-center justify-center shrink-0">
                                    <svg className="w-2.5 h-2.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <span className="text-sm text-zinc-400">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <p className="text-xs text-zinc-700">© 2026 Shopinea. All rights reserved.</p>
            </div>

            {/* Right: form */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
                {/* Mobile logo */}
                <div className="flex items-center gap-2 mb-8 lg:hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/sholinealogo2.png" alt="shopinea" className="w-8 h-8 object-contain" />
                    <span className="text-sm font-bold text-white">shopinea</span>
                </div>

                <div className="w-full max-w-[400px]">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-white">Welcome back</h1>
                        <p className="text-sm text-zinc-500 mt-1.5">Sign in to your merchant account to continue.</p>
                    </div>

                    {error && (
                        <div className="mb-5 bg-red-500/[0.08] border border-red-500/20 px-4 py-3 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            <p className="text-xs font-medium text-red-400 leading-relaxed">{error}</p>
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

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-zinc-400">Password</label>
                                <Link href="/forgot-password" className="text-[11px] text-blue-500 hover:text-blue-400 transition-colors">Forgot password?</Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                <Input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="h-11 pl-11 bg-white/[0.04] border-white/[0.08] rounded-xl text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50 focus:ring-0 transition-all"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
                        </Button>
                    </form>

                    <div className="mt-6 flex items-center gap-3">
                        <div className="flex-1 h-px bg-white/[0.06]" />
                        <span className="text-[11px] text-zinc-600">or</span>
                        <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>

                    <p className="mt-6 text-sm text-zinc-500 text-center">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="text-white hover:text-blue-400 transition-colors font-medium">Create one free</Link>
                    </p>

                    <div className="mt-8 flex items-center gap-2 justify-center">
                        <ShieldCheck className="w-3.5 h-3.5 text-zinc-700" />
                        <p className="text-[11px] text-zinc-700">Encrypted · Secure · OWASP compliant</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
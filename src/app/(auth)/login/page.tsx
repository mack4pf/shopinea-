"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { Loader2, Store, ArrowRight, ShieldCheck, Mail, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/dashboard");
        } catch (err: any) {
            setError("Invalid email or password.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError("");
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            router.push("/dashboard");
        } catch (err: any) {
            setError("Google sign-in failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-6xl">
                <div className="absolute top-20 left-10 w-64 h-64 bg-blue-600/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px]" />
            </div>

            <Link href="/" className="mb-12 relative z-10 hover:opacity-80 transition-opacity">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <span className="text-white font-black text-xl">S</span>
                    </div>
                    <span className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white">Shoplinea.shop</span>
                </div>
            </Link>

            <div className="w-full max-w-md space-y-8 relative z-10 bg-white dark:bg-zinc-900 p-8 sm:p-10 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-2xl shadow-gray-200/50 dark:shadow-none">
                <div className="text-center">
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Welcome Back</h2>
                    <p className="text-gray-500 mt-2 font-medium">Continue your journey with Shoplinea.shop</p>
                </div>

                <div className="space-y-4">
                    <Button
                        onClick={handleGoogleLogin}
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
                        Continue with Google
                    </Button>

                    <div className="relative py-4 flex items-center">
                        <div className="flex-grow border-t border-gray-100 dark:border-zinc-800"></div>
                        <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Social Link</span>
                        <div className="flex-grow border-t border-gray-100 dark:border-zinc-800"></div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@company.com"
                                    className="h-12 pl-12 rounded-2xl border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Password</label>
                                <Link href="/forgot-password" title="Forgot Password" className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 tracking-widest">Reset</Link>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="h-12 pl-12 rounded-2xl border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 font-bold"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium animate-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-2xl text-white font-black shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] gap-2 text-sm"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "ACCESS DASHBOARD"}
                            {!loading && <ArrowRight className="w-5 h-5" />}
                        </Button>
                    </form>
                </div>

                <div className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest pt-4">
                    New vendor?{" "}
                    <Link href="/register" className="text-blue-600 font-black hover:underline underline-offset-4">Join now</Link>
                </div>
            </div>
        </div>
    );
}
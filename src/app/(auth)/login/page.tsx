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
        <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-white selection:bg-blue-500/30">
            {/* Logo */}
            <div className="mb-8 flex flex-col items-center gap-2">
                <Link href="/" className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                    <span className="text-zinc-950 font-bold text-2xl">R</span>
                </Link>
                <h1 className="text-xl font-bold tracking-tight">Restock</h1>
            </div>

            <div className="w-full max-w-[420px]">
                <div className="bg-zinc-900/50 border border-white/[0.06] rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold">Sign in</h2>
                        <p className="text-sm text-zinc-500 mt-1">Welcome back to your merchant dashboard.</p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <p className="text-xs font-medium text-rose-500 leading-normal">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-zinc-400 ml-1">Email address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-white transition-colors" />
                                    <Input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@email.com"
                                        className="h-11 pl-11 bg-zinc-950/50 border-white/[0.08] rounded-xl text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-xs font-medium text-zinc-400">Password</label>
                                    <Link 
                                        href="/forgot-password" 
                                        className="text-[11px] font-medium text-blue-500 hover:text-blue-400 transition-colors"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-white transition-colors" />
                                    <Input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="h-11 pl-11 bg-zinc-950/50 border-white/[0.08] rounded-xl text-sm text-white placeholder:text-zinc-700 focus:border-blue-500/50 transition-all font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 bg-white hover:bg-zinc-200 text-zinc-950 rounded-xl font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>Sign In <ArrowRight className="w-4 h-4" /></>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-white/[0.03] flex items-start gap-3">
                        <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20 shrink-0">
                            <ShieldCheck className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-[10px] text-zinc-500 leading-relaxed uppercase tracking-wider font-semibold">
                            Secure encrypted session. Real-time threat detection active for all transactions.
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-sm text-zinc-500">
                        Don't have an account?{" "}
                        <Link href="/register" className="text-white hover:text-blue-500 transition-colors font-medium">Create one now</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
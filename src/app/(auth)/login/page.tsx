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
    AlertTriangle,
    ShieldCheck
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
            console.error("Login Error:", err);
            setError("Authentication failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden relative">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[150px]" />
            </div>

            <div className="w-full max-w-[420px] relative z-10">
                {/* Brand Header */}
                <div className="flex flex-col items-center mb-10 space-y-4">
                    <Link href="/" className="group">
                        <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center shadow-2xl group-hover:rotate-6 transition-transform duration-500">
                            <span className="text-[#020202] font-black text-3xl italic">S</span>
                        </div>
                    </Link>
                    <div className="text-center">
                        <h1 className="text-3xl font-black tracking-tighter italic uppercase">Shoplinea</h1>
                        <p className="text-[10px] font-black tracking-[0.4em] text-blue-500 uppercase mt-1">Access Protocol</p>
                    </div>
                </div>

                <div className="bg-[#0A0A0B] border border-white/[0.05] rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden group">
                    {/* Active Line */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

                    <div className="mb-8 space-y-1">
                        <h2 className="text-xl font-black tracking-tight uppercase italic">Authenticate</h2>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Enter secure credentials</p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                            <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative group/field">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700 group-focus-within/field:text-white transition-colors" />
                                <Input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Registered Email"
                                    className="h-14 pl-12 bg-zinc-950 border-white/[0.05] rounded-2xl text-[12px] font-black uppercase tracking-widest placeholder:text-zinc-800 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all italic"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="relative group/field">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700 group-focus-within/field:text-white transition-colors" />
                                    <Input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Secure Key (Pass)"
                                        className="h-14 pl-12 bg-zinc-950 border-white/[0.05] rounded-2xl text-[12px] font-black uppercase tracking-widest placeholder:text-zinc-800 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all italic"
                                    />
                                </div>
                                <div className="text-right px-2">
                                    <Link 
                                        href="/forgot-password" 
                                        className="text-[9px] font-black uppercase text-zinc-600 hover:text-white tracking-widest transition-colors italic"
                                    >
                                        Recover Key?
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-white hover:bg-zinc-200 text-black rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-white/5 transition-all active:scale-[0.98] gap-2 italic"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Initiate Access"}
                            {!loading && <ArrowRight className="w-4 h-4" />}
                        </Button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-white/[0.03] flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                            <ShieldCheck className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-[9px] font-black text-zinc-700 leading-tight uppercase tracking-widest italic">
                            Secure end-to-end encrypted session. Automated threat detection active.
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[11px] font-black text-zinc-700 uppercase tracking-[0.2em]">
                        Unregistered Node?{" "}
                        <Link href="/register" className="text-white hover:text-blue-500 transition-colors italic">Initiate Signup</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
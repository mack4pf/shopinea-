"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Shield, Loader2, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Check if user is admin
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data()?.isAdmin) {
                toast.success("Welcome back, Commander.");
                router.push("/admin");
            } else {
                toast.error("Access denied. Admin privileges required.");
                await auth.signOut();
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Invalid credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-2">
                    <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-blue-600/20 mb-6">
                        <Shield className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight italic">TERMINAL ACCESS</h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px]">Restricted Personnel Only</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl -mr-16 -mt-16" />
                    
                    <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Admin Email</Label>
                            <Input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-14 bg-zinc-950 border-zinc-800 rounded-2xl font-bold text-white focus:ring-blue-600"
                                placeholder="name@company.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Security Key</Label>
                            <Input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-14 bg-zinc-950 border-zinc-800 rounded-2xl font-bold text-white focus:ring-blue-600"
                                placeholder="••••••••"
                            />
                        </div>

                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="w-full h-14 bg-white text-black font-black rounded-2xl flex gap-3 hover:scale-[1.02] transition-transform shadow-xl shadow-white/5"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    AUTHORIZE ACCESS
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </Button>
                    </form>
                </div>

                <div className="text-center flex items-center justify-center gap-2 text-zinc-600">
                    <Lock className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Encrypted Session</span>
                </div>
            </div>
        </div>
    );
}

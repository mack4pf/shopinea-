"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Smartphone, Mail, Send, CheckCircle2, ShieldCheck, MessageSquare, Truck, Lock, Loader2, User, ChevronRight } from "lucide-react";
import { addDoc, collection, serverTimestamp, doc, getDoc, updateDoc, setDoc, increment } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface InquiryModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
    storeUser: any;
    onProceedToCheckout: () => void;
}

export default function InquiryModal({ isOpen, onClose, product, storeUser, onProceedToCheckout }: InquiryModalProps) {
    const productName = product?.name || product?.productName || "this product";
    const productPrice = Number(product?.resellPrice ?? product?.price ?? 0);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState(`Hi, I'm interested in purchasing ${productName}. Is it currently in stock?`);
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [authMode, setAuthMode] = useState<"login" | "register" | "form">("form");
    const [authData, setAuthData] = useState({ email: "", password: "" });
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            setSent(false);
            setLoading(false);
            if (auth.currentUser) {
                setAuthMode("form");
                // Pre-fill name/email if possible
                const u = auth.currentUser;
                setName(u.displayName || "");
                setEmail(u.email || "");
            }

            setMessage(`Hi, I'm interested in purchasing ${productName}. Is it currently in stock?`);
        }
    }, [isOpen, productName]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let currentUser = auth.currentUser;

            if (!currentUser) {
                if (authMode === "form") {
                    setAuthMode("register");
                    setLoading(false);
                    return;
                }

                try {
                    if (authMode === "register") {
                        const res = await createUserWithEmailAndPassword(auth, authData.email, authData.password);
                        await setDoc(doc(db, "users", res.user.uid), {
                            displayName: name,
                            email: authData.email,
                            role: "buyer",
                            createdAt: serverTimestamp()
                        });
                        currentUser = res.user;
                    } else {
                        const res = await signInWithEmailAndPassword(auth, authData.email, authData.password);
                        currentUser = res.user;
                    }
                } catch (authErr: any) {
                    console.error(authErr);
                    setLoading(false);
                    return;
                }
            }

            if (!currentUser) throw new Error("Authentication failed");
            
            const chatId = [currentUser.uid, storeUser.uid].sort().join("_");
            const chatRef = doc(db, "chats", chatId);
            const chatSnap = await getDoc(chatRef);

            const chatData = {
                lastMessage: message,
                updatedAt: serverTimestamp(),
                participants: [currentUser.uid, storeUser.uid],
                participantsNames: [name || "Buyer", storeUser.displayName || storeUser.storeName || "Reseller"],
                unread: true,
                pendingOrderId: product.id,
                productName,
                productPrice
            };

            if (chatSnap.exists()) {
                await updateDoc(chatRef, chatData);
            } else {
                await setDoc(chatRef, chatData);
            }

            await addDoc(collection(db, "chats", chatId, "messages"), {
                text: message,
                senderId: currentUser.uid,
                createdAt: serverTimestamp()
            });

            await updateDoc(doc(db, "users", storeUser.uid), {
                "stats.inquiries": increment(1)
            });

            await addDoc(collection(db, "notifications"), {
                userId: storeUser.uid,
                type: "new_inquiry",
                title: "New Product Inquiry!",
                message: `${name} is interested in ${productName}.`,
                emailType: "pending_customer",
                recipientEmail: storeUser.email,
                createdAt: serverTimestamp()
            });

            setSent(true);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    if (sent) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Success!">
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500 shadow-2xl shadow-emerald-500/10">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold">Inquiry Sent</h3>
                        <p className="text-sm text-zinc-500 font-medium max-w-xs mx-auto">The merchant has been notified. You can continue the conversation in your dashboard.</p>
                    </div>
                    <div className="w-full flex flex-col gap-3 pt-4">
                        <Button
                            onClick={() => { onClose(); router.push("/dashboard/messages"); }}
                            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xl shadow-blue-500/20"
                        >
                            Open Messenger
                        </Button>
                        <Button
                            onClick={onClose}
                            variant="ghost"
                            className="w-full h-10 rounded-xl text-zinc-500 font-bold"
                        >
                            Back to Store
                        </Button>
                    </div>
                </div>
            </Modal>
        );
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Product Inquiry"
            description="Contact the merchant directly regarding this item."
        >
            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {!auth.currentUser && authMode !== "form" ? (
                    <div className="space-y-6">
                        <div className="bg-blue-600/5 border border-blue-600/10 p-5 rounded-2xl flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white">Guest Checkout</h4>
                                <p className="text-xs text-zinc-500 font-medium">Create a profile to track your orders and chat with the merchant.</p>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <Input
                                required
                                type="email"
                                placeholder="Email Address"
                                value={authData.email}
                                onChange={e => setAuthData({ ...authData, email: e.target.value })}
                                className="h-12 bg-zinc-950/50 border-white/[0.06] rounded-xl font-medium text-sm"
                            />
                            <Input
                                required
                                type="password"
                                placeholder="Secure Password"
                                value={authData.password}
                                onChange={e => setAuthData({ ...authData, password: e.target.value })}
                                className="h-12 bg-zinc-950/50 border-white/[0.06] rounded-xl font-medium text-sm"
                            />
                        </div>

                        <button 
                            type="button" 
                            onClick={() => setAuthMode(authMode === "login" ? "register" : "login")} 
                            className="w-full text-center text-xs font-bold text-zinc-500 hover:text-blue-500 transition-colors"
                        >
                            {authMode === "login" ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Your Name</label>
                                <Input
                                    required
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="h-11 rounded-xl bg-zinc-950/50 border-white/[0.06] text-sm font-medium"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Email Address</label>
                                <Input
                                    required
                                    type="email"
                                    placeholder="john@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-11 rounded-xl bg-zinc-950/50 border-white/[0.06] text-sm font-medium"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Message</label>
                            <textarea
                                required
                                rows={4}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full p-4 text-sm font-medium rounded-xl bg-zinc-950/50 border border-white/[0.06] focus:border-blue-500/50 focus:outline-none transition-all resize-none text-white placeholder:text-zinc-700"
                            />
                        </div>
                    </div>
                )}

                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <p className="text-[10px] font-bold text-emerald-500/80 leading-tight">Your communication is secure and protected under Restock Integrity.</p>
                </div>

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            {authMode === "register" ? "Create Account & Send" : authMode === "login" ? "Sign In & Send" : "Send Inquiry"}
                            <Send className="w-4 h-4" />
                        </>
                    )}
                </Button>
            </form>
        </Modal>
    );
}

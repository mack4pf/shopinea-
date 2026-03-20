"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Smartphone, Mail, Send, CheckCircle2, ShieldCheck, MessageSquare, Truck, Lock, Loader2 } from "lucide-react";
import { addDoc, collection, serverTimestamp, doc, getDoc, updateDoc, setDoc, increment } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

interface InquiryModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
    storeUser: any;
    onProceedToCheckout: () => void;
}

export default function InquiryModal({ isOpen, onClose, product, storeUser, onProceedToCheckout }: InquiryModalProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState(`Hi, I'm interested in purchasing the ${product?.name}. Is it ready for same-day UPS dispatch?`);
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [authMode, setAuthMode] = useState<"login" | "register" | "form">("form");
    const [authData, setAuthData] = useState({ email: "", password: "" });
    const router = useRouter();

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSent(false);
            setLoading(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let currentUser = auth.currentUser;

            // 0. Handle Authentication for guests
            if (!currentUser) {
                if (authMode === "form") {
                    setAuthMode("register"); // Transition to auth details
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
                    alert(authErr.message);
                    setLoading(false);
                    return;
                }
            }

            if (!currentUser) throw new Error("Authentication failed");
            // 1. Create a chat record
            const chatId = [auth.currentUser?.uid, storeUser.uid].sort().join("_");
            const chatRef = doc(db, "chats", chatId);
            const chatSnap = await getDoc(chatRef);

            const chatData = {
                lastMessage: message,
                updatedAt: serverTimestamp(),
                participants: [currentUser.uid, storeUser.uid],
                participantsNames: [name || "Buyer", storeUser.displayName || storeUser.storeName || "Reseller"],
                unread: true,
                pendingOrderId: product.id, // Reference the product they are interested in
                productName: product.name,
                productPrice: product.resellPrice
            };

            if (chatSnap.exists()) {
                await updateDoc(chatRef, chatData);
            } else {
                await setDoc(chatRef, chatData);
            }

            // 2. Add the actual message to a sub-collection
            await addDoc(collection(db, "chats", chatId, "messages"), {
                text: message,
                senderId: currentUser.uid,
                createdAt: serverTimestamp()
            });

            // 3. Update Seller Stats
            await updateDoc(doc(db, "users", storeUser.uid), {
                "stats.inquiries": increment(1)
            });

            // 4. Send Pending Customer Email
            await addDoc(collection(db, "notifications"), {
                userId: storeUser.uid,
                type: "new_inquiry",
                title: "Potential Customer Alert!",
                message: `User ${name} has sent you a message regarding ${product.name}. Check your messages at ${window.location.host}/dashboard/messages`,
                emailType: "pending_customer",
                recipientEmail: storeUser.email,
                createdAt: serverTimestamp()
            });

            setSent(true);
        } catch (error) {
            console.error("Error sending inquiry:", error);
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Message Active!">
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center text-emerald-500 animate-bounce">
                        <MessageSquare className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black dark:text-white">Message Linked</h3>
                        <p className="text-sm text-zinc-500 font-medium max-w-[280px]">Your inquiry is now active. You can now proceed to select your delivery and payment method.</p>
                    </div>
                    <Button
                        onClick={() => {
                            onClose();
                            router.push("/dashboard/messages");
                        }}
                        className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-xl shadow-blue-500/20"
                    >
                        GO TO MESSENGER & PAY
                    </Button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Purchase Inquiry"
            description="Start a secure discussion with the reseller regarding this product."
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {!auth.currentUser && authMode !== "form" ? (
                    <div className="space-y-4 animate-in fade-in zoom-in-95">
                        <div className="bg-blue-600/5 border border-blue-600/10 p-5 rounded-3xl mb-4">
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none mb-2">Buyer Account Required</p>
                            <p className="text-xs text-zinc-500 font-medium">Create a secure profile to track your orders and chat with the reseller.</p>
                        </div>
                        <div className="space-y-3">
                            <div className="relative">
                                <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                                <Input
                                    required
                                    type="email"
                                    placeholder="Email Address"
                                    value={authData.email}
                                    onChange={e => setAuthData({ ...authData, email: e.target.value })}
                                    className="h-14 pl-12 bg-gray-50 dark:bg-zinc-800 border-none rounded-2xl font-bold"
                                />
                            </div>
                            <div className="relative">
                                <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                                <Input
                                    required
                                    type="password"
                                    placeholder="Secure Password"
                                    value={authData.password}
                                    onChange={e => setAuthData({ ...authData, password: e.target.value })}
                                    className="h-14 pl-12 bg-gray-50 dark:bg-zinc-800 border-none rounded-2xl font-bold"
                                />
                            </div>
                        </div>
                        <button type="button" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")} className="w-full text-center text-xs font-black text-zinc-500 uppercase tracking-widest hover:text-blue-500 transition-colors">
                            {authMode === "login" ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Name</label>
                                <Input
                                    required
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="h-12 rounded-xl bg-gray-50 dark:bg-zinc-800 border-none px-4 font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Email</label>
                                <Input
                                    required
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-12 rounded-xl bg-gray-50 dark:bg-zinc-800 border-none px-4 font-bold"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Message to Reseller</label>
                            <textarea
                                required
                                rows={4}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full p-6 text-sm font-medium rounded-3xl bg-gray-50 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                )}

                <div className="p-4 bg-blue-600/5 rounded-2xl border border-blue-600/10 flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                    <p className="text-[10px] font-bold text-blue-400 leading-tight">Your communication is end-to-end encrypted and monitored for buyer protection.</p>
                </div>

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            {authMode === "register" ? "REGISTER & SEND MESSAGE" : authMode === "login" ? "LOGIN & SEND MESSAGE" : "START SECURE PURCHASE"}
                            <Send className="w-4 h-4" />
                        </>
                    )}
                </Button>
            </form>
        </Modal>
    );
}

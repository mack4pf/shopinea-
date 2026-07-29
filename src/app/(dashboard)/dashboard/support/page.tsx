"use client";

import { useState, useEffect, useRef } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { MessageSquare, Book, FileText, Mail, Zap, ChevronRight, Loader2, Send, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

function TargetIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
        </svg>
    );
}

export default function SupportPage() {
    const [user, setUser] = useState<any>(null);
    const [isChatActive, setIsChatActive] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) setUser(firebaseUser);
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!user || !isChatActive) return;
        const q = query(collection(db, "support_chats", user.uid, "messages"), orderBy("createdAt", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });
        return () => unsubscribe();
    }, [user, isChatActive]);

    const sendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || !user) return;
        setLoading(true);
        try {
            await setDoc(doc(db, "support_chats", user.uid), {
                userId: user.uid, userEmail: user.email, lastMessage: newMessage,
                lastMessageAt: serverTimestamp(), status: "active", unreadByAdmin: true
            }, { merge: true });
            await addDoc(collection(db, "support_chats", user.uid, "messages"), {
                text: newMessage, sender: "user", createdAt: serverTimestamp()
            });
            setNewMessage("");
        } catch (error) {
            console.error(error);
            toast.error("Failed to send message");
        } finally { setLoading(false); }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 flex flex-col h-[calc(100vh-100px)]">
            {/* Header */}
            <div className="flex justify-between items-start shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-white">Support</h1>
                    <p className="text-sm text-zinc-500 mt-1">Chat with our team for payout, account, and order help.</p>
                </div>
                <button onClick={() => setIsChatActive(!isChatActive)}
                    className={`px-4 py-2.5 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${isChatActive ? 'bg-white/[0.06] border border-white/[0.08] text-zinc-300' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                    <MessageSquare className="w-4 h-4" />
                    {isChatActive ? "Resources" : "Live Chat"}
                </button>
            </div>

            {isChatActive ? (
                <div className="flex-1 flex flex-col min-h-0 bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
                    {/* Chat header */}
                    <div className="p-4 border-b border-white/[0.06] flex items-center gap-3 shrink-0">
                        <div className="w-9 h-9 rounded-full bg-lime-400 flex items-center justify-center text-slate-950 text-sm font-black">S</div>
                        <div>
                            <h3 className="text-sm font-semibold text-white">Shopinea Support</h3>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <p className="text-[10px] text-emerald-500 font-medium">Online</p>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center">
                                <MessageSquare className="w-8 h-8 text-zinc-700 mb-2" />
                                <p className="text-xs text-zinc-500">Send a message to start the chat.</p>
                            </div>
                        ) : (
                            messages.map((m) => (
                                <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] md:max-w-[60%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${m.sender === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-md'
                                        : 'bg-white/[0.06] border border-white/[0.08] text-zinc-200 rounded-bl-md'}`}>
                                        {m.text}
                                        <p className={`text-[10px] mt-1.5 opacity-50 ${m.sender === 'user' ? 'text-right' : ''}`}>
                                            {m.createdAt?.toDate ? m.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={scrollRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={sendMessage} className="p-3 border-t border-white/[0.06] shrink-0">
                        <div className="flex items-center gap-2">
                            <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/40 transition-colors" />
                            <button type="submit" disabled={loading || !newMessage.trim()}
                                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center text-white shrink-0 transition-colors disabled:opacity-40">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto space-y-6">
                    {/* Help categories */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { title: "Getting Started", icon: Zap, desc: "Learn the basics of your store.", articles: 12 },
                            { title: "Products", icon: Book, desc: "Curate and price your collection.", articles: 8 },
                            { title: "Payments", icon: FileText, desc: "Earnings and withdrawal guide.", articles: 15 },
                            { title: "Marketing", icon: TargetIcon, desc: "Drive more sales to your store.", articles: 20 },
                        ].map((cat, i) => (
                            <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.05] transition-colors cursor-pointer group">
                                <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center text-blue-400 mb-3 group-hover:bg-blue-500/10 transition-colors">
                                    <cat.icon className="w-4 h-4" />
                                </div>
                                <h3 className="text-sm font-semibold text-white mb-1">{cat.title}</h3>
                                <p className="text-xs text-zinc-500 mb-3">{cat.desc}</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-zinc-600">{cat.articles} articles</span>
                                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-blue-400 transition-colors" />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <button
                            onClick={() => setIsChatActive(true)}
                            className="bg-lime-400 text-slate-950 rounded-xl p-5 space-y-3 text-left hover:bg-lime-300 transition-colors shadow-lg shadow-lime-500/10"
                        >
                            <div className="flex items-center gap-2">
                                <KeyRound className="w-5 h-5" />
                                <h3 className="text-sm font-black">Withdrawal Code</h3>
                            </div>
                            <p className="text-xs font-semibold leading-relaxed">
                                Need a withdrawal verification code? Start a support chat and our team will review your payout destination.
                            </p>
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Security review
                            </span>
                        </button>

                        {/* Contact */}
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 space-y-3">
                            <h3 className="text-sm font-semibold text-zinc-300">Contact Us</h3>
                            <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-lg">
                                <Mail className="w-4 h-4 text-blue-400" />
                                <div>
                                    <p className="text-xs text-zinc-500">Email</p>
                                    <p className="text-sm text-white">support@shoplinea.shop</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-lg">
                                <Send className="w-4 h-4 text-emerald-400" />
                                <div>
                                    <p className="text-xs text-zinc-500">Telegram</p>
                                    <p className="text-sm text-white">@shoplinea</p>
                                </div>
                            </div>
                        </div>

                        {/* System status */}
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 space-y-3">
                            <h3 className="text-sm font-semibold text-zinc-300">System Status</h3>
                            {['Storefronts', 'Payments', 'Inventory'].map((s, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-white/[0.03] rounded-lg">
                                    <span className="text-xs text-zinc-400">{s}</span>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                        <span className="text-[10px] text-emerald-400 font-medium">Healthy</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

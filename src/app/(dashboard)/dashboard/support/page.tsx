"use client";

import { useState, useEffect, useRef } from "react";
import { auth, db } from "@/lib/firebase/config";
import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    setDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    HelpCircle,
    MessageSquare,
    Book,
    FileText,
    Mail,
    Phone,
    Zap,
    ExternalLink,
    PlayCircle,
    ChevronRight,
    Search,
    User,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SupportPage() {
    const [user, setUser] = useState<any>(null);
    const [isChatActive, setIsChatActive] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!user || !isChatActive) return;

        const q = query(
            collection(db, "support_chats", user.uid, "messages"),
            orderBy("createdAt", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        });

        return () => unsubscribe();
    }, [user, isChatActive]);

    const sendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || !user) return;

        setLoading(true);
        try {
            const chatRef = doc(db, "support_chats", user.uid);
            await setDoc(chatRef, {
                userId: user.uid,
                userEmail: user.email,
                lastMessage: newMessage,
                lastMessageAt: serverTimestamp(),
                status: "active",
                unreadByAdmin: true
            }, { merge: true });

            await addDoc(collection(db, "support_chats", user.uid, "messages"), {
                text: newMessage,
                sender: "user",
                createdAt: serverTimestamp(),
            });

            setNewMessage("");
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Failed to send message");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12 h-[calc(100vh-140px)] flex flex-col overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 flex-shrink-0">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-white tracking-tight">Support Registry</h1>
                    <p className="text-zinc-500 font-bold text-sm">Direct encrypted line to Restock Global Admin.</p>
                </div>
                <Button
                    onClick={() => setIsChatActive(!isChatActive)}
                    className={`${isChatActive ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-blue-600 hover:bg-blue-700'} h-12 px-8 rounded-2xl font-black shadow-xl transition-all gap-3`}
                >
                    <MessageSquare className="w-5 h-5" />
                    {isChatActive ? "RESOURCES" : "START LIVE CHAT"}
                </Button>
            </div>

            {isChatActive ? (
                <div className="flex-1 flex flex-col min-h-0 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                    {/* Chat Header */}
                    <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/20">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-600/20">
                                    A
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-zinc-900" />
                            </div>
                            <div>
                                <h3 className="font-black text-white text-lg leading-none mb-1">Restock Administrator</h3>
                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Operational • Encrypted
                                </p>
                            </div>
                        </div>
                        <div className="hidden md:flex flex-col items-end">
                            <div className="flex -space-x-2 mb-1">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-lg border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center">
                                        <User className="w-4 h-4 text-zinc-500" />
                                    </div>
                                ))}
                            </div>
                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em]">ADMIN_POOL_ACTIVE</span>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)]">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40 py-20">
                                <div className="w-20 h-20 rounded-[2rem] bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-4">
                                    <MessageSquare className="w-10 h-10 text-zinc-600" />
                                </div>
                                <div className="max-w-xs">
                                    <p className="text-zinc-400 font-bold uppercase text-xs tracking-widest">No Active Messages</p>
                                    <p className="text-[10px] text-zinc-500 mt-2">Send a message to securely connect with our technical operations team.</p>
                                </div>
                            </div>
                        ) : (
                            messages.map((m, i) => (
                                <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                    <div className={`max-w-[80%] md:max-w-[60%] space-y-2`}>
                                        <div className={`p-4 rounded-[1.5rem] text-sm font-medium leading-relaxed ${m.sender === 'user'
                                                ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-600/10'
                                                : 'bg-zinc-800 text-zinc-200 rounded-tl-none border border-zinc-700'
                                            }`}>
                                            {m.text}
                                        </div>
                                        <p className={`text-[9px] font-black text-zinc-600 uppercase tracking-tighter ${m.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                            {m.createdAt?.toDate ? m.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Syncing...'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={scrollRef} />
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={sendMessage} className="p-6 bg-zinc-950/80 border-t border-zinc-800 backdrop-blur-md">
                        <div className="relative group">
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Message admin team..."
                                className="h-14 pl-6 pr-32 bg-zinc-900/50 border-zinc-800 rounded-2xl text-white font-bold focus:ring-blue-600 focus:border-blue-600 group-hover:border-zinc-700 transition-all placeholder:text-zinc-600"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <Button
                                    type="submit"
                                    disabled={loading || !newMessage.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-10 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "SEND"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
                    {/* Help Search */}
                    <div className="relative max-w-2xl mx-auto">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-500" />
                        <Input
                            placeholder="Help Center: Search documentation..."
                            className="h-16 pl-16 pr-8 bg-zinc-900 border-zinc-800 rounded-[2rem] text-lg font-bold text-white focus:ring-blue-600 focus:border-blue-600 shadow-2xl"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { title: "Getting Started", icon: Zap, desc: "Learn the basics of setting up your store.", articles: 12 },
                                    { title: "Managing Products", icon: Book, desc: "How to curate and price your collection.", articles: 8 },
                                    { title: "Financials & Payouts", icon: FileText, desc: "Everything about earnings and withdrawals.", articles: 15 },
                                    { title: "Marketing Guide", icon: Target, desc: "Strategies for high conversion rates.", articles: 20 },
                                ].map((cat, i) => (
                                    <div key={i} className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] hover:border-zinc-700 transition-all group cursor-pointer">
                                        <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-blue-500 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg">
                                            <cat.icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-black text-white mb-2">{cat.title}</h3>
                                        <p className="text-sm font-medium text-zinc-500 leading-relaxed mb-6">{cat.desc}</p>
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-zinc-600">{cat.articles} Articles</span>
                                            <span className="text-blue-500 flex items-center gap-1 group-hover:translate-x-1 transition-transform">Browse <ChevronRight className="w-3 h-3" /></span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden relative group cursor-pointer">
                                <div className="aspect-video bg-zinc-950 flex items-center justify-center">
                                    <PlayCircle className="w-20 h-20 text-white/20 group-hover:text-blue-600 transition-all group-hover:scale-110" />
                                </div>
                                <div className="p-8">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Masterclass</span>
                                        <span className="text-[10px] font-bold text-zinc-500">• 12:45 MINS</span>
                                    </div>
                                    <h3 className="text-xl font-black text-white">The Master Seller Masterclass: 0 to ₦1M in 30 days</h3>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] space-y-6">
                                <h3 className="text-xl font-black text-white">Direct Channels</h3>
                                <div className="space-y-4">
                                    <div className="p-5 bg-zinc-800/50 rounded-2xl border border-zinc-700/50 flex items-center gap-4 hover:border-blue-500/50 transition-colors cursor-pointer">
                                        <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-zinc-500 uppercase">Support Email</p>
                                            <p className="text-sm font-bold text-white">ops@restock.global</p>
                                        </div>
                                    </div>
                                    <div className="p-5 bg-zinc-800/50 rounded-2xl border border-zinc-700/50 flex items-center gap-4 hover:border-emerald-500/50 transition-colors cursor-pointer">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-zinc-500 uppercase">WhatsApp Help</p>
                                            <p className="text-sm font-bold text-white">+1(543) 901 884 0638</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-zinc-800 to-zinc-950 p-8 rounded-[2.5rem] border border-zinc-700 space-y-6">
                                <h3 className="text-xl font-black text-white">System Status</h3>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Storefronts', status: 'Healthy' },
                                        { label: 'Payments', status: 'Healthy' },
                                        { label: 'Inventory', status: 'Healthy' },
                                    ].map((s, i) => (
                                        <div key={i} className="flex justify-between items-center bg-black/20 p-4 rounded-2xl">
                                            <span className="text-xs font-bold text-zinc-400">{s.label}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">{s.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Target(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    )
}

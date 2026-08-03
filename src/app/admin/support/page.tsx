"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { cn } from "@/lib/utils";
import { CheckCircle2, Inbox, Loader2, Mail, MessageSquare, Search, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function AdminSupportPage() {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [threads, setThreads] = useState<any[]>([]);
    const [selectedId, setSelectedId] = useState("");
    const [messages, setMessages] = useState<any[]>([]);
    const [reply, setReply] = useState("");
    const [search, setSearch] = useState("");
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                window.location.href = "/admin/login";
                return;
            }

            const userDoc = await getDoc(doc(db, "users", user.uid));
            const allowed = !!userDoc.data()?.isAdmin;
            setIsAdmin(allowed);
            if (!allowed) window.location.href = "/admin/login";
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (!isAdmin) return;
        const q = query(collection(db, "support_chats"), orderBy("lastMessageAt", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            const nextThreads = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
            setThreads(nextThreads);
            setSelectedId((current) => current || nextThreads[0]?.id || "");
        });
        return () => unsub();
    }, [isAdmin]);

    useEffect(() => {
        if (!selectedId) {
            setMessages([]);
            return;
        }

        const q = query(collection(db, "support_chats", selectedId, "messages"), orderBy("createdAt", "asc"));
        const unsub = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
        });
        updateDoc(doc(db, "support_chats", selectedId), { unreadByAdmin: false }).catch(() => undefined);
        return () => unsub();
    }, [selectedId]);

    const filteredThreads = useMemo(() => {
        const needle = search.trim().toLowerCase();
        if (!needle) return threads;
        return threads.filter((thread) =>
            String(thread.userEmail || "").toLowerCase().includes(needle) ||
            String(thread.lastMessage || "").toLowerCase().includes(needle) ||
            String(thread.userId || "").toLowerCase().includes(needle)
        );
    }, [threads, search]);

    const selectedThread = threads.find((thread) => thread.id === selectedId);

    const sendReply = async (event?: React.FormEvent) => {
        event?.preventDefault();
        const cleanReply = reply.trim();
        if (!selectedId || !cleanReply) return;

        setSending(true);
        try {
            await addDoc(collection(db, "support_chats", selectedId, "messages"), {
                text: cleanReply,
                sender: "admin",
                createdAt: serverTimestamp(),
            });
            await updateDoc(doc(db, "support_chats", selectedId), {
                lastMessage: cleanReply,
                lastMessageAt: serverTimestamp(),
                unreadByUser: true,
                status: "active",
            });
            setReply("");
        } catch (error) {
            console.error(error);
            toast.error("Could not send support reply.");
        } finally {
            setSending(false);
        }
    };

    if (isAdmin === null) {
        return (
            <div className="h-[70vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] min-h-[620px] flex flex-col gap-5">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-lime-300 bg-lime-100 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-slate-800 mb-3">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified Support Desk
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-950">Support Chat</h1>
                    <p className="text-sm text-slate-500 mt-1">Reply to user payout, account, order, and verification questions from one clean inbox.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Open Threads</p>
                        <p className="text-2xl font-black text-slate-950">{threads.length}</p>
                    </div>
                    <div className="rounded-xl border border-lime-300 bg-lime-100 px-4 py-3 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Unread</p>
                        <p className="text-2xl font-black text-slate-950">{threads.filter((thread) => thread.unreadByAdmin).length}</p>
                    </div>
                </div>
            </div>

            <div className="grid flex-1 min-h-0 grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
                <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col min-h-0">
                    <div className="p-4 border-b border-slate-200">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search email or message"
                                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-semibold text-slate-950 outline-none focus:border-sky-400 focus:bg-white"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {filteredThreads.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <Inbox className="w-10 h-10 text-slate-300 mb-3" />
                                <p className="text-sm font-bold text-slate-700">No support threads</p>
                                <p className="text-xs text-slate-400 mt-1">New user chats will appear here.</p>
                            </div>
                        ) : filteredThreads.map((thread) => (
                            <button
                                key={thread.id}
                                onClick={() => setSelectedId(thread.id)}
                                className={cn(
                                    "w-full rounded-xl border p-3 text-left transition-all",
                                    selectedId === thread.id
                                        ? "border-sky-300 bg-sky-50 shadow-sm"
                                        : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                        thread.unreadByAdmin ? "bg-lime-400 text-slate-950" : "bg-slate-100 text-slate-500"
                                    )}>
                                        <MessageSquare className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-black text-slate-950 truncate">{thread.userEmail || thread.userId || "User"}</p>
                                        <p className="text-xs text-slate-500 truncate mt-0.5">{thread.lastMessage || "No message yet"}</p>
                                    </div>
                                    {thread.unreadByAdmin && <span className="w-2.5 h-2.5 rounded-full bg-lime-500 shrink-0" />}
                                </div>
                            </button>
                        ))}
                    </div>
                </aside>

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col min-h-0">
                    {selectedThread ? (
                        <>
                            <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-sky-50 via-white to-lime-50 flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl bg-sky-600 text-white flex items-center justify-center">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-sm font-black text-slate-950 truncate">{selectedThread.userEmail || "Support User"}</h2>
                                    <p className="text-xs text-slate-500 truncate">{selectedThread.userId}</p>
                                </div>
                                <div className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-lime-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-700">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Active
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 bg-slate-50">
                                {messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center">
                                        <MessageSquare className="w-10 h-10 text-slate-300 mb-3" />
                                        <p className="text-sm font-bold text-slate-700">No messages yet</p>
                                    </div>
                                ) : messages.map((message) => {
                                    const fromAdmin = message.sender === "admin";
                                    return (
                                        <div key={message.id} className={cn("flex", fromAdmin ? "justify-end" : "justify-start")}>
                                            <div className={cn(
                                                "max-w-[84%] md:max-w-[68%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                                                fromAdmin
                                                    ? "bg-sky-600 text-white rounded-br-md"
                                                    : "bg-white border border-slate-200 text-slate-800 rounded-bl-md"
                                            )}>
                                                <p>{message.text}</p>
                                                <p className={cn("text-[10px] mt-1.5 opacity-60", fromAdmin && "text-right")}>
                                                    {message.createdAt?.toDate ? `${message.createdAt.toDate().toLocaleDateString([], { month: "short", day: "numeric" })} · ${message.createdAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "..."}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={scrollRef} />
                            </div>

                            <form onSubmit={sendReply} className="p-4 border-t border-slate-200 bg-white">
                                <div className="flex items-center gap-2">
                                    <input
                                        value={reply}
                                        onChange={(event) => setReply(event.target.value)}
                                        placeholder="Write a support reply..."
                                        className="flex-1 h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-950 outline-none focus:border-sky-400 focus:bg-white"
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending || !reply.trim()}
                                        className="h-12 w-12 rounded-xl bg-lime-400 text-slate-950 hover:bg-lime-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                                    >
                                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                            <Inbox className="w-12 h-12 text-slate-300 mb-3" />
                            <p className="text-sm font-bold text-slate-700">Select a support thread</p>
                            <p className="text-xs text-slate-400 mt-1">User messages from the dashboard support page appear here.</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

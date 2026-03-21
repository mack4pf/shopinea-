"use client";

import { useState, useEffect, useRef } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, addDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { MessageSquare, Search, Loader2, Send, MoreVertical, ShieldCheck, ChevronLeft, User, Phone, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CheckoutModal from "@/components/modals/CheckoutModal";
import { cn } from "@/lib/utils";

interface Chat {
    id: string;
    lastMessage: string;
    updatedAt: any;
    participants: string[];
    otherPlayerName: string;
    unread?: boolean;
    pendingOrderId?: string;
    productName?: string;
    productPrice?: number;
}

export default function MessagesPage() {
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeChat, setActiveChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [userData, setUserData] = useState<any>(null);
    const [showCheckout, setShowCheckout] = useState(false);
    
    // View state for mobile
    const [view, setView] = useState<"list" | "detail">("list");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userSnap = await getDoc(doc(db, "users", user.uid));
                if (userSnap.exists()) setUserData(userSnap.data());

                const chatsQuery = query(
                    collection(db, "chats"),
                    where("participants", "array-contains", user.uid),
                    orderBy("updatedAt", "desc")
                );

                const unsubscribeChats = onSnapshot(chatsQuery, (snapshot) => {
                    const chatList = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        otherPlayerName: doc.data().participantsNames?.find((n: string) => n !== user.displayName) || "Partner"
                    })) as Chat[];
                    setChats(chatList);
                    setLoading(false);
                });

                return () => unsubscribeChats();
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (activeChat) {
            const msgsQuery = query(
                collection(db, "chats", activeChat.id, "messages"),
                orderBy("createdAt", "asc")
            );
            const unsubscribeMsgs = onSnapshot(msgsQuery, (snapshot) => {
                setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            });
            return () => unsubscribeMsgs();
        } else {
            setMessages([]);
        }
    }, [activeChat]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat || !auth.currentUser) return;

        const text = newMessage;
        setNewMessage("");

        try {
            await addDoc(collection(db, "chats", activeChat.id, "messages"), {
                text,
                senderId: auth.currentUser.uid,
                createdAt: serverTimestamp()
            });

            await updateDoc(doc(db, "chats", activeChat.id), {
                lastMessage: text,
                updatedAt: serverTimestamp(),
                unread: true
            });

            // Send Message Notification
            const otherPlayerId = activeChat.participants.find(p => p !== auth.currentUser?.uid);
            if (otherPlayerId) {
                await addDoc(collection(db, "notifications"), {
                    userId: otherPlayerId,
                    type: "new_message",
                    title: "New Message Received",
                    message: `You have a new message from ${auth.currentUser?.displayName || "a Partner"}.`,
                    senderName: auth.currentUser?.displayName || "System",
                    createdAt: serverTimestamp()
                });
            }
        } catch (err) {
            console.error("Error sending message:", err);
        }
    };

    const selectChat = (chat: Chat) => {
        setActiveChat(chat);
        setView("detail");
    };

    const filteredChats = chats.filter(c =>
        c.otherPlayerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center text-blue-600">
                <Loader2 className="w-10 h-10 animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-100px)] md:h-[calc(100vh-120px)] flex flex-col animate-in fade-in duration-500">
            {/* Page Header (Desktop) */}
            <div className="hidden md:flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-600/20">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Messages</h1>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Direct Business Communications</p>
                    </div>
                </div>
            </div>

            {/* Main Messenger Container */}
            <div className="flex-1 bg-zinc-900/50 border border-white/5 md:rounded-[2.5rem] overflow-hidden flex shadow-2xl relative">
                
                {/* Conversations List */}
                <div className={cn(
                    "w-full md:w-[400px] border-r border-white/5 flex flex-col bg-zinc-950/40 backdrop-blur-xl transition-all duration-300",
                    view === "detail" && "hidden md:flex"
                )}>
                    <div className="p-4 md:p-6 pb-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                placeholder="Search conversations..."
                                className="pl-12 h-14 rounded-2xl bg-zinc-950/50 border-white/5 text-xs font-bold text-white placeholder:text-zinc-700 focus-visible:ring-blue-600/20"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                        {filteredChats.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-20 italic">
                                <MessageSquare className="w-12 h-12 text-zinc-500 mb-4" />
                                <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest leading-loose text-center px-10">No messages found. Start a conversation from the marketplace.</p>
                            </div>
                        ) : (
                            filteredChats.map((chat) => (
                                <button
                                    key={chat.id}
                                    onClick={() => selectChat(chat)}
                                    className={cn(
                                        "w-full p-4 flex items-center gap-4 rounded-[1.8rem] transition-all duration-300 group relative border",
                                        activeChat?.id === chat.id
                                            ? "bg-white border-white text-zinc-950"
                                            : "bg-[#050505]/40 border-white/5 hover:border-white/10"
                                    )}
                                >
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 transition-transform group-hover:scale-105",
                                        activeChat?.id === chat.id ? "bg-zinc-950 text-white" : "bg-zinc-900 text-blue-500 border border-white/5"
                                    )}>
                                        {chat.otherPlayerName[0]}
                                        {chat.unread && (
                                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-600 rounded-full border-4 border-zinc-950 animate-pulse" />
                                        )}
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className={cn(
                                                "font-black text-[13px] uppercase tracking-tight truncate",
                                                activeChat?.id === chat.id ? "text-zinc-950" : "text-white"
                                            )}>
                                                {chat.otherPlayerName}
                                            </p>
                                            <span className={cn(
                                                "text-[9px] font-bold opacity-40 capitalize",
                                                activeChat?.id === chat.id ? "text-zinc-900" : "text-zinc-500"
                                            )}>
                                                {chat.updatedAt?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className={cn(
                                            "text-[11px] truncate font-medium opacity-60",
                                            activeChat?.id === chat.id ? "text-zinc-800" : "text-zinc-500"
                                        )}>
                                            {chat.lastMessage || "No messages yet"}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Panel */}
                <div className={cn(
                    "flex-1 flex flex-col bg-zinc-950/40 backdrop-blur-3xl relative h-full transition-all duration-300",
                    view === "list" && "hidden md:flex"
                )}>
                    {activeChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-20 px-4 md:px-8 border-b border-white/5 flex items-center justify-between bg-zinc-950/60 sticky top-0 z-10">
                                 <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setView("list")}
                                        className="md:hidden p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm md:text-xl shadow-lg shrink-0">
                                        {activeChat.otherPlayerName[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-black text-sm md:text-lg text-white leading-none truncate">{activeChat.otherPlayerName}</h3>
                                        <div className="flex items-center gap-1.5 mt-1.5 leading-none">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Active Chat</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {userData?.role === "buyer" && activeChat.pendingOrderId && (
                                        <Button
                                            onClick={() => setShowCheckout(true)}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest h-10 md:h-12 px-5 md:px-8 rounded-2xl shadow-xl shadow-emerald-500/10"
                                        >
                                            PAY AND SECURE
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5">
                                        <Info className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Messages Stream */}
                             <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 flex flex-col custom-scrollbar" ref={scrollRef}>
                                {messages.map((msg) => {
                                    const isMe = msg.senderId === auth.currentUser?.uid;
                                    return (
                                        <div key={msg.id} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2 duration-500", isMe ? "justify-end" : "justify-start")}>
                                            <div className={cn(
                                                "max-w-[85%] md:max-w-[65%] p-5 md:p-6 rounded-[2.2rem] text-[13px] font-medium leading-relaxed shadow-2xl relative",
                                                isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-white/[0.04] border border-white/[0.08] text-zinc-100 rounded-bl-none"
                                            )}>
                                                {msg.text}
                                                <div className={cn(
                                                    "flex items-center gap-2 text-[9px] mt-2.5 font-bold uppercase tracking-widest opacity-40",
                                                    isMe ? "text-white" : "text-zinc-500"
                                                )}>
                                                    {msg.createdAt?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {isMe && <ShieldCheck className="w-3.5 h-3.5" />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {messages.length === 0 && (
                                    <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-20 grayscale">
                                        <MessageSquare className="w-12 h-12 text-zinc-500 mb-4" />
                                        <p className="font-bold text-xs uppercase tracking-[0.3em] text-zinc-500">Wait for response...</p>
                                    </div>
                                )}
                            </div>

                            {/* Input Panel */}
                             <div className="p-4 md:p-8 bg-zinc-950/40 backdrop-blur-3xl border-t border-white/5 sticky bottom-0">
                                <form onSubmit={handleSendMessage} className="bg-zinc-950 border border-white/10 p-2 rounded-[2.2rem] flex items-center gap-2 group focus-within:border-blue-500/50 transition-all">
                                    <Input
                                        placeholder="Type your message..."
                                        className="border-none focus-visible:ring-0 bg-transparent flex-1 pl-6 font-bold text-sm text-white placeholder:text-zinc-800 h-10 md:h-12"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                    />
                                    <Button type="submit" disabled={!newMessage.trim()} className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-white text-black hover:bg-zinc-200 p-0 shrink-0 transition-all active:scale-95 disabled:opacity-50">
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#020202]">
                            <div className="w-20 h-20 md:w-28 md:h-28 bg-white/5 rounded-3xl flex items-center justify-center mb-8 border border-white/5 relative group">
                                <div className="absolute inset-0 bg-blue-600/10 rounded-3xl blur-2xl group-hover:bg-blue-600/20 transition-all" />
                                <MessageSquare className="w-8 h-8 md:w-12 md:h-12 text-blue-600 relative z-10" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter uppercase mb-3">Your Messages</h2>
                            <p className="text-zinc-600 font-bold text-xs md:text-sm uppercase tracking-widest max-w-sm mx-auto leading-relaxed italic opacity-40">
                                Connect with buyers and sellers in your network.
                            </p>
                        </div>
                    )}
                 </div>
            </div>

            {showCheckout && activeChat && (
                <CheckoutModal
                    isOpen={showCheckout}
                    onClose={() => setShowCheckout(false)}
                    product={{
                        id: activeChat.pendingOrderId,
                        name: activeChat.productName,
                        resellPrice: activeChat.productPrice
                    }}
                    storeUser={{ uid: activeChat.participants.find(p => p !== auth.currentUser?.uid) }}
                />
            )}
        </div>
    );
}

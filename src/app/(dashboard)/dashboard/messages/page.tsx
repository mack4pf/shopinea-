"use client";

import { useState, useEffect, useRef } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, addDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { MessageSquare, Search, Loader2, Send, ChevronLeft, Info } from "lucide-react";
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
    const [view, setView] = useState<"list" | "detail">("list");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
                        otherPlayerName: doc.data().participantsNames?.find((n: string) => n !== user.displayName) || "User"
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
            const msgsQuery = query(collection(db, "chats", activeChat.id, "messages"), orderBy("createdAt", "asc"));
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
                text, senderId: auth.currentUser.uid, createdAt: serverTimestamp()
            });
            await updateDoc(doc(db, "chats", activeChat.id), {
                lastMessage: text, updatedAt: serverTimestamp(), unread: true
            });
            const otherPlayerId = activeChat.participants.find(p => p !== auth.currentUser?.uid);
            if (otherPlayerId) {
                await addDoc(collection(db, "notifications"), {
                    userId: otherPlayerId, type: "new_message", title: "New Message",
                    message: `You have a new message from ${auth.currentUser?.displayName || "someone"}.`,
                    senderName: auth.currentUser?.displayName || "System", createdAt: serverTimestamp()
                });
            }
        } catch (err) { console.error("Error sending message:", err); }
    };

    const selectChat = (chat: Chat) => { setActiveChat(chat); setView("detail"); };

    const filteredChats = chats.filter(c =>
        c.otherPlayerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <div className="h-[80vh] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
    );

    return (
        <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] flex flex-col animate-in fade-in duration-500">
            {/* Header — desktop only */}
            <div className="hidden md:block mb-4">
                <h1 className="text-2xl font-bold text-white">Messages</h1>
                <p className="text-sm text-zinc-500 mt-1">Chat with buyers and sellers.</p>
            </div>

            {/* Main container */}
            <div className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden flex min-h-0">
                {/* Chat list */}
                <div className={cn(
                    "w-full md:w-[340px] lg:w-[380px] border-r border-white/[0.06] flex flex-col bg-white/[0.01]",
                    view === "detail" && "hidden md:flex"
                )}>
                    {/* Search */}
                    <div className="p-3 border-b border-white/[0.04]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                            <input
                                placeholder="Search conversations..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/40 transition-colors"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Chat list items */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredChats.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 px-6">
                                <MessageSquare className="w-8 h-8 text-zinc-700 mb-3" />
                                <p className="text-sm text-zinc-500 text-center">No conversations yet.</p>
                                <p className="text-xs text-zinc-600 text-center mt-1">Messages from the marketplace will appear here.</p>
                            </div>
                        ) : (
                            filteredChats.map((chat) => (
                                <button
                                    key={chat.id}
                                    onClick={() => selectChat(chat)}
                                    className={cn(
                                        "w-full p-4 flex items-center gap-3 border-b border-white/[0.03] transition-colors text-left",
                                        activeChat?.id === chat.id ? "bg-blue-500/10" : "hover:bg-white/[0.03]"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0",
                                        activeChat?.id === chat.id ? "bg-blue-600 text-white" : "bg-white/[0.06] text-blue-400"
                                    )}>
                                        {chat.otherPlayerName[0]}
                                        {chat.unread && (
                                            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <p className="text-sm font-medium text-white truncate">{chat.otherPlayerName}</p>
                                            <span className="text-[10px] text-zinc-600 shrink-0">
                                                {chat.updatedAt?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-500 truncate">{chat.lastMessage || "No messages yet"}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat panel */}
                <div className={cn(
                    "flex-1 flex flex-col min-h-0",
                    view === "list" && "hidden md:flex"
                )}>
                    {activeChat ? (
                        <>
                            {/* Chat header */}
                            <div className="h-16 px-4 border-b border-white/[0.06] flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setView("list")} className="md:hidden p-2 rounded-lg hover:bg-white/[0.06] text-zinc-400">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                                        {activeChat.otherPlayerName[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">{activeChat.otherPlayerName}</h3>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <p className="text-[10px] text-emerald-500 font-medium">Online</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {userData?.role === "buyer" && activeChat.pendingOrderId && (
                                        <button onClick={() => setShowCheckout(true)}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors">
                                            Complete Purchase
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col" ref={scrollRef}>
                                {messages.map((msg) => {
                                    const isMe = msg.senderId === auth.currentUser?.uid;
                                    return (
                                        <div key={msg.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                                            <div className={cn(
                                                "max-w-[80%] md:max-w-[65%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                                                isMe
                                                    ? "bg-blue-600 text-white rounded-br-md"
                                                    : "bg-white/[0.06] border border-white/[0.08] text-zinc-200 rounded-bl-md"
                                            )}>
                                                {msg.text}
                                                <p className={cn("text-[10px] mt-1.5 opacity-50", isMe ? "text-right" : "")}>
                                                    {msg.createdAt?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                {messages.length === 0 && (
                                    <div className="flex-1 flex flex-col items-center justify-center">
                                        <MessageSquare className="w-8 h-8 text-zinc-700 mb-2" />
                                        <p className="text-xs text-zinc-500">Start the conversation.</p>
                                    </div>
                                )}
                            </div>

                            {/* Input */}
                            <div className="p-3 border-t border-white/[0.06] shrink-0">
                                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                    <input
                                        placeholder="Type a message..."
                                        className="flex-1 px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/40 transition-colors"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                    />
                                    <button type="submit" disabled={!newMessage.trim()}
                                        className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center text-white shrink-0 transition-colors disabled:opacity-40">
                                        <Send className="w-4 h-4" />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-16 h-16 bg-white/[0.04] rounded-2xl flex items-center justify-center mb-4">
                                <MessageSquare className="w-8 h-8 text-zinc-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-white mb-1">Your Messages</h2>
                            <p className="text-sm text-zinc-500 max-w-xs">Select a conversation to start chatting with buyers and sellers.</p>
                        </div>
                    )}
                </div>
            </div>

            {showCheckout && activeChat && (
                <CheckoutModal
                    isOpen={showCheckout}
                    onClose={() => setShowCheckout(false)}
                    product={{ id: activeChat.pendingOrderId, name: activeChat.productName, resellPrice: activeChat.productPrice }}
                    storeUser={{ uid: activeChat.participants.find(p => p !== auth.currentUser?.uid) }}
                />
            )}
        </div>
    );
}

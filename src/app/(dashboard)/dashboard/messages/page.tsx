"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy, onSnapshot, doc, getDoc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { MessageSquare, User as UserIcon, Search, Loader2, Send, MoreVertical, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CheckoutModal from "@/components/modals/CheckoutModal";

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
                    title: "Incoming Secure Message",
                    message: `You have received a new message from ${auth.currentUser?.displayName || "a Partner"}.`,
                    senderName: auth.currentUser?.displayName || "System",
                    createdAt: serverTimestamp()
                });
            }
        } catch (err) {
            console.error("Error sending message:", err);
        }
    };

    const filteredChats = chats.filter(c =>
        c.otherPlayerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="h-[80vh] flex items-center justify-center text-blue-600">
                <Loader2 className="w-10 h-10 animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                            <MessageSquare className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-400">Secure Comms</span>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter italic leading-none">Intelligence Hub</h1>
                    <p className="text-zinc-500 font-extrabold text-sm uppercase tracking-widest leading-relaxed opacity-80 max-w-xl">
                        End-to-end encrypted direct dialogue with verified buyers and fulfillment partners.
                    </p>
                </div>
                <div className="flex items-center gap-4 px-8 py-5 bg-zinc-900 rounded-[2rem] border border-zinc-800 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-600/5 blur-3xl rounded-full scale-150 group-hover:bg-blue-600/10 transition-colors" />
                    <ShieldCheck className="w-6 h-6 text-blue-500 relative" />
                    <div className="relative">
                        <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.2em] mb-0.5">Network Status</p>
                        <p className="text-sm font-black text-white tracking-widest uppercase italic">Protocols Encrypted</p>
                    </div>
                </div>
            </div>

            {/* Main Terminal Container */}
            <div className="flex-1 bg-zinc-900 rounded-[3.5rem] border border-zinc-800 overflow-hidden flex shadow-2xl">
                {/* Conversations Sidebar */}
                <div className="w-96 border-r border-zinc-800 flex flex-col bg-zinc-950/20 backdrop-blur-xl">
                    <div className="p-10 pb-6">
                        <div className="relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-700 group-focus-within:text-blue-500 transition-all duration-300" />
                            <Input
                                placeholder="QUERY CHANNELS..."
                                className="pl-16 h-16 rounded-[1.5rem] bg-zinc-950/50 border-zinc-800 text-[11px] font-black tracking-widest uppercase focus-visible:ring-2 focus-visible:ring-blue-500/20 transition-all shadow-inner"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pt-0">
                        {filteredChats.length === 0 ? (
                            <div className="p-20 text-center opacity-20 grayscale">
                                <MessageSquare className="w-16 h-16 text-zinc-500 mx-auto mb-6" />
                                <p className="text-zinc-500 font-black text-[11px] uppercase tracking-widest italic">No Data Nodes</p>
                            </div>
                        ) : (
                            <div className="space-y-3 pb-10">
                                {filteredChats.map((chat) => (
                                    <button
                                        key={chat.id}
                                        onClick={() => setActiveChat(chat)}
                                        className={`w-full p-6 flex items-center gap-5 rounded-[2.5rem] transition-all duration-500 group relative overflow-hidden
                                            ${activeChat?.id === chat.id
                                                ? "bg-white border-white text-zinc-950 shadow-2xl"
                                                : "bg-zinc-900 border border-zinc-950 hover:bg-zinc-800/80 hover:border-zinc-800"}`}
                                    >
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl italic relative shadow-inner
                                            ${activeChat?.id === chat.id ? "bg-zinc-950 text-white" : "bg-zinc-950 border border-zinc-800 text-blue-500 group-hover:scale-110 transition-transform"}`}>
                                            {chat.otherPlayerName[0]}
                                            {chat.unread && (
                                                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 rounded-full border-4 border-zinc-900 shadow-lg animate-pulse" />
                                            )}
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className={`font-black text-sm uppercase tracking-tighter transition-colors leading-none italic ${activeChat?.id === chat.id ? "text-zinc-950" : "text-white group-hover:text-blue-400"}`}>
                                                    {chat.otherPlayerName}
                                                </p>
                                                <span className={`text-[9px] font-black uppercase opacity-40 ${activeChat?.id === chat.id ? "text-zinc-950" : "text-zinc-500"}`}>
                                                    {chat.updatedAt?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className={`text-[10px] truncate font-black tracking-widest uppercase transition-all ${activeChat?.id === chat.id ? "text-zinc-950/60" : "text-zinc-600 group-hover:text-zinc-500"}`}>
                                                {chat.lastMessage || "Transmission IDLE"}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Secure Communication Area */}
                <div className="flex-1 flex flex-col bg-zinc-950/20 backdrop-blur-3xl relative">
                    {activeChat ? (
                        <>
                            {/* Terminal Header */}
                            <div className="h-24 px-10 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50 backdrop-blur-2xl px-12">
                                 <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-[1.5rem] bg-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-blue-900/40 italic">
                                        {activeChat.otherPlayerName[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-2xl text-white italic tracking-tighter leading-none mb-2">{activeChat.otherPlayerName}</h3>
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] flex items-center gap-2 italic">
                                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> BIOMETRIC LINK ACTIVE
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5">
                                    {userData?.role === "buyer" && activeChat.pendingOrderId && (
                                        <Button
                                            onClick={() => setShowCheckout(true)}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] uppercase tracking-[0.1em] h-14 px-8 rounded-[1.5rem] shadow-2xl shadow-emerald-500/20 gap-3 hover:scale-105 transition-all italic border-b-4 border-emerald-800 active:border-b-0"
                                        >
                                            <ShieldCheck className="w-5 h-5" />
                                            PAY FOR {activeChat.productName?.toUpperCase() || "ASSET"} — 5% REBATE
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all">
                                        <MoreVertical className="w-6 h-6" />
                                    </Button>
                                </div>
                            </div>

                            {/* Signal Feed */}
                             <div className="flex-1 overflow-y-auto p-12 space-y-8 flex flex-col custom-scrollbar">
                                {messages.map((msg) => {
                                    const isMe = msg.senderId === auth.currentUser?.uid;
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-${isMe ? 'right' : 'left'}-4 duration-500`}>
                                            <div className={`max-w-[75%] p-6 rounded-[2.5rem] text-sm font-black italic tracking-tight leading-relaxed shadow-2xl ${isMe ? "bg-blue-600 text-white rounded-tr-none shadow-blue-900/20" : "bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-none"}`}>
                                                {msg.text}
                                                <div className={`flex items-center gap-2 text-[9px] mt-4 font-black uppercase tracking-widest opacity-40 ${isMe ? "text-white" : "text-zinc-600"}`}>
                                                    {msg.createdAt?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {isMe && <ShieldCheck className="w-3 h-3" />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {messages.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full opacity-10 filter grayscale py-40">
                                        <div className="relative mb-8">
                                            <MessageSquare className="w-32 h-32 text-zinc-500" />
                                            <div className="absolute inset-0 bg-blue-600/20 blur-3xl rounded-full" />
                                        </div>
                                        <p className="font-black text-xl uppercase tracking-[0.5em] italic">Awaiting Signal...</p>
                                    </div>
                                )}
                            </div>

                            {/* Transmission Input Area */}
                             <div className="p-10 px-12">
                                <form onSubmit={handleSendMessage} className="bg-zinc-900 p-3 rounded-[2.5rem] shadow-2xl border border-zinc-850 flex items-center gap-4 group focus-within:border-blue-500/50 transition-all duration-500 shadow-inner">
                                    <Input
                                        placeholder="ENCODE MESSAGE..."
                                        className="border-none focus-visible:ring-0 bg-transparent flex-1 pl-8 font-black text-[11px] uppercase tracking-widest text-white placeholder:text-zinc-700 h-16"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                    />
                                    <Button type="submit" className="h-16 w-16 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-600/30 p-0 text-white shrink-0 hover:scale-110 active:scale-95 transition-all">
                                        <Send className="w-7 h-7 italic" />
                                    </Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-20 text-center relative overflow-hidden">
                            {/* Neural Background Pattern */}
                            <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] border-[1px] border-blue-500 rounded-full animate-pulse" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border-[1px] border-emerald-500/30 rounded-full animate-pulse duration-[3000ms]" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border-[1px] border-zinc-500/10 rounded-full" />
                            </div>
                            
                            <div className="relative group mb-12">
                                <div className="w-40 h-40 bg-zinc-900 rounded-[3rem] shadow-2xl border border-zinc-800 flex items-center justify-center relative z-10 transition-all duration-700 group-hover:rotate-12 group-hover:scale-110">
                                    <MessageSquare className="w-16 h-16 text-blue-500" />
                                </div>
                                <div className="absolute inset-0 bg-blue-500/20 blur-[50px] rounded-full group-hover:bg-blue-500/40 transition-all duration-700" />
                            </div>
                            
                            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase relative z-10 leading-none mb-6">Select Communications Stream</h2>
                            <p className="text-zinc-600 font-extrabold text-[11px] uppercase tracking-[0.3em] max-w-sm mx-auto relative z-10 leading-loose opacity-60">
                                Connect with your verified network nodes to authorize shipments and settle inquiries.
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

"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy, limit, writeBatch, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    Bell,
    ShoppingCart,
    ArrowUpRight,
    ShieldAlert,
    Zap,
    Circle,
    CheckCircle2,
    Trash2,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotificationsPage() {
    const [user, setUser] = useState<any>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                await fetchNotifications(firebaseUser.uid);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const fetchNotifications = async (uid: string) => {
        try {
            const q = query(
                collection(db, "notifications"),
                where("userId", "==", uid),
                orderBy("createdAt", "desc"),
                limit(50)
            );
            const snap = await getDocs(q);
            setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkAsRead = async () => {
        if (!user || notifications.length === 0) return;
        try {
            const batch = writeBatch(db);
            notifications.forEach(n => {
                if (!n.read) {
                    const ref = doc(db, "notifications", n.id);
                    batch.update(ref, { read: true });
                }
            });
            await batch.commit();
            await fetchNotifications(user.uid);
        } catch (err) {
            console.error("Error marking as read", err);
        }
    };

    // Fallback if no real notifications exist yet
    const displayNotifications = notifications.length > 0 ? notifications : [];

    const filteredNotifications = displayNotifications.filter(n => {
        if (filter === 'all') return true;
        return n.type === filter; // Assumes types: 'sale', 'payout', 'system'
    });

    if (loading) {
        return (
            <div className="h-[80vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-white tracking-tight">Notifications</h1>
                    <p className="text-zinc-500 font-bold text-sm">Stay updated with your latest sales and account activities.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleMarkAsRead} variant="outline" className="h-10 rounded-xl border-zinc-800 text-zinc-400 font-bold text-xs gap-2">
                        Mark all as read
                    </Button>
                </div>
            </div>

            <div className="flex gap-4 border-b border-zinc-800 pb-1">
                {['all', 'sale', 'payout', 'system'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all relative ${filter === tab ? 'text-blue-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="space-y-4 max-w-4xl">
                {filteredNotifications.length === 0 ? (
                    <div className="text-center py-20">
                        <Bell className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                        <p className="text-zinc-500 font-bold">No notifications found.</p>
                    </div>
                ) : (
                    filteredNotifications.map((n) => (
                        <div key={n.id} className={`p-6 rounded-[2rem] border transition-all flex gap-6 group cursor-pointer ${n.read ? 'bg-zinc-900/40 border-zinc-800/50' : 'bg-zinc-900 border-zinc-700 ring-1 ring-blue-500/20 shadow-xl shadow-blue-500/5'}`}>
                            <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center shrink-0 ${n.type === 'sale' ? 'bg-emerald-500/10 text-emerald-500' :
                                n.type === 'payout' ? 'bg-blue-500/10 text-blue-500' :
                                    n.type === 'security' ? 'bg-red-500/10 text-red-500' :
                                        'bg-amber-500/10 text-amber-500'
                                }`}>
                                {n.type === 'sale' && <ShoppingCart className="w-6 h-6" />}
                                {n.type === 'payout' && <ArrowUpRight className="w-6 h-6" />}
                                {n.type === 'security' && <ShieldAlert className="w-6 h-6" />}
                                {n.type === 'system' && <Zap className="w-6 h-6" />}
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-start">
                                    <h3 className={`font-black text-white ${n.read ? 'opacity-70' : ''}`}>{n.title}</h3>
                                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                                        {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-zinc-400 leading-relaxed max-w-2xl">{n.description || n.message}</p>
                                {!n.read && (
                                    <div className="pt-2 flex items-center gap-1 text-[10px] font-black text-blue-500 uppercase tracking-widest">
                                        <Circle className="w-2 h-2 fill-blue-500" /> New Activity
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

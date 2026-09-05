"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy, limit, writeBatch, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Bell, ShoppingCart, ArrowUpRight, ShieldAlert, Zap, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const safeText = (value: unknown, fallback = "") => {
    const text = typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
    return text || fallback;
};
const toValidDate = (value: any): Date | null => {
    const date = value?.toDate ? value.toDate() : (value ? new Date(value) : null);
    return date && !Number.isNaN(date.getTime()) ? date : null;
};

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
            const q = query(collection(db, "notifications"), where("userId", "==", uid), orderBy("createdAt", "desc"), limit(50));
            const snap = await getDocs(q);
            setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (err) { console.error(err); }
    };

    const handleMarkAsRead = async () => {
        if (!user || notifications.length === 0) return;
        try {
            const batch = writeBatch(db);
            notifications.forEach(n => { if (!n.read) batch.update(doc(db, "notifications", n.id), { read: true }); });
            await batch.commit();
            await fetchNotifications(user.uid);
        } catch (err) { console.error("Error marking as read", err); }
    };

    const filteredNotifications = notifications.filter(n => filter === 'all' || n.type === filter);

    const getIcon = (type: string) => {
        switch (type) {
            case 'sale': return <ShoppingCart className="w-4 h-4" />;
            case 'payout': return <ArrowUpRight className="w-4 h-4" />;
            case 'security': return <ShieldAlert className="w-4 h-4" />;
            default: return <Zap className="w-4 h-4" />;
        }
    };

    const getIconStyle = (type: string) => {
        switch (type) {
            case 'sale': return 'bg-emerald-500/10 text-emerald-500';
            case 'payout': return 'bg-blue-500/10 text-blue-500';
            case 'security': return 'bg-red-500/10 text-red-500';
            default: return 'bg-amber-500/10 text-amber-500';
        }
    };

    if (loading) return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Notifications</h1>
                    <p className="text-sm text-zinc-500 mt-1">Stay updated with your latest activities.</p>
                </div>
                <button onClick={handleMarkAsRead}
                    className="px-4 py-2 text-sm font-medium text-zinc-400 bg-white/[0.04] border border-white/[0.08] rounded-lg hover:bg-white/[0.08] transition-colors">
                    Mark all as read
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-lg p-1 w-fit">
                {['all', 'sale', 'payout', 'system'].map(tab => (
                    <button key={tab} onClick={() => setFilter(tab)}
                        className={cn("px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors",
                            filter === tab ? "bg-white/[0.1] text-white" : "text-zinc-600 hover:text-zinc-300")}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* Notifications */}
            <div className="space-y-2 max-w-3xl">
                {filteredNotifications.length === 0 ? (
                    <div className="text-center py-16">
                        <Bell className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                        <p className="text-sm text-zinc-500">No notifications found.</p>
                    </div>
                ) : (
                    filteredNotifications.map((n, index) => {
                        const notificationId = safeText(n.id, `notification-${index}`);
                        const type = safeText(n.type, "system");
                        const createdAt = toValidDate(n.createdAt);
                        return (
                        <div key={notificationId} className={cn(
                            "p-4 rounded-xl border flex gap-4 transition-colors",
                            n.read ? "bg-white/[0.02] border-white/[0.04]" : "bg-white/[0.04] border-white/[0.08]"
                        )}>
                            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", getIconStyle(type))}>
                                {getIcon(type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                    <h3 className={cn("text-sm font-medium text-white", n.read && "opacity-60")}>{safeText(n.title, "Notification")}</h3>
                                    <span className="text-[10px] text-zinc-600 shrink-0">
                                        {createdAt ? createdAt.toLocaleDateString() : 'Now'}
                                    </span>
                                </div>
                                <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{safeText(n.description || n.message)}</p>
                                {!n.read && (
                                    <div className="flex items-center gap-1 mt-1.5">
                                        <Circle className="w-1.5 h-1.5 fill-blue-500 text-blue-500" />
                                        <span className="text-[10px] text-blue-400 font-medium">New</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )})
                )}
            </div>
        </div>
    );
}

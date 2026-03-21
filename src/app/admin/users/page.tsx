"use client";

import {
    Users,
    Search,
    Filter,
    MoreVertical,
    Mail,
    Crown,
    ShieldCheck,
    Loader2,
    DollarSign,
    TrendingUp,
    Shield,
    Trash2,
    Edit,
    Megaphone,
    Wallet,
    Eye,
    Zap,
    Clock,
    ShieldAlert,
    Box,
    CheckCircle2,
    XCircle,
    ArrowUpRight,
    Play
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button, cn } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { onAuthStateChanged } from "firebase/auth";
import { Modal } from "@/components/ui/modal";
import { where, addDoc, serverTimestamp, getDoc, collection, doc, getDocs, increment, orderBy, query, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { useState, useEffect } from "react";

export default function UserMatrixPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

    // Individual User Management
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [userOrders, setUserOrders] = useState<any[]>([]);
    const [userTransactions, setUserTransactions] = useState<any[]>([]);
    const [userProducts, setUserProducts] = useState<any[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [boostingSales, setBoostingSales] = useState(false);
    const [boostCount, setBoostCount] = useState("10");
    const [simCountry, setSimCountry] = useState("USA");

    // Email Module
    const [adminTemplate, setAdminTemplate] = useState("custom");
    const [adminSubject, setAdminSubject] = useState("");
    const [adminBody, setAdminBody] = useState("");
    const [adminSending, setAdminSending] = useState(false);

    const fetchUsers = async () => {
        try {
            const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
            const snap = await getDocs(q);
            setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch user database.");
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDetails = async (user: any) => {
        setLoadingDetails(true);
        setSelectedUser(user);
        try {
            // Fetch Pending Transactions
            const transSnap = await getDocs(query(
                collection(db, "transactions"),
                where("userId", "==", user.id),
                where("status", "==", "pending")
            ));
            setUserTransactions(transSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            // Fetch User Orders (Products in store/history)
            const ordersSnap = await getDocs(query(
                collection(db, "orders"),
                where("resellerId", "==", user.id),
                orderBy("createdAt", "desc")
            ));
            setUserOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            // Extract unique products from orders for "View Products"
            const products = ordersSnap.docs.map(d => ({ id: d.data().productId, name: d.data().productName }));
            const uniqueProducts = Array.from(new Set(products.map(p => p.id)))
                .map(id => products.find(p => p.id === id));
            setUserProducts(uniqueProducts);

        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch merchant details.");
        } finally {
            setLoadingDetails(false);
        }
    };

    const FAKE_BUYERS = [
        { name: "Liam Smith", country: "USA" }, 
        { name: "Emma Wilson", country: "United Kingdom" }, 
        { name: "Oliver Brown", country: "Australia" },
        { name: "Sophia Muller", country: "Germany" }, 
        { name: "Noah Johnson", country: "USA" }, 
        { name: "Mia Davies", country: "Australia" },
        { name: "Lucas Dubois", country: "France" }, 
        { name: "Isabella Rossi", country: "Italy" }, 
        { name: "Ethan White", country: "Canada" },
        { name: "Charlotte Taylor", country: "USA" }, 
        { name: "Max Schmidt", country: "Germany" }, 
        { name: "Ava Thompson", country: "Australia" },
    ];

    const handleBoostSales = async () => {
        if (!selectedUser || userProducts.length === 0) {
            toast.error("Merchant must have at least one product history to boost.");
            return;
        }
        setBoostingSales(true);
        try {
            const count = Number(boostCount) || 10;
            for (let i = 0; i < count; i++) {
                const buyer = FAKE_BUYERS[Math.floor(Math.random() * FAKE_BUYERS.length)];
                const product = userProducts[Math.floor(Math.random() * userProducts.length)];

                // Fetch actual product details for profit calc
                const pDoc = await getDoc(doc(db, "products", product.id));
                const pData = pDoc.exists() ? pDoc.data() : { price: 200, cost: 150 };
                const profit = (pData.resellPrice || pData.price) - (pData.initialPrice || pData.cost || pData.price * 0.7);

                const createdAt = new Date(Date.now() - (Math.floor(Math.random() * 5) * 86400000));

                await addDoc(collection(db, "orders"), {
                    resellerId: selectedUser.id,
                    customerName: buyer.name,
                    customerCountry: simCountry || buyer.country,
                    productId: product.id,
                    productName: product.name,
                    resellPrice: pData.resellPrice || pData.price,
                    resellerProfit: profit,
                    status: 'shipped',
                    isSimulated: true,
                    createdAt
                });

                await updateDoc(doc(db, "users", selectedUser.id), {
                    pendingPayout: increment(profit)
                });
            }
            toast.success(`Succesfully injected ${count} sales into merchant terminal!`);
            fetchUserDetails(selectedUser);
        } catch (err) {
            console.error(err);
            toast.error("Market injection failed.");
        } finally {
            setBoostingSales(false);
        }
    };

    const handleSendCustomEmail = async () => {
        if (!selectedUser || !selectedUser.email) {
            toast.error("User does not have a valid email.");
            return;
        }
        if (!adminSubject || !adminBody) {
            toast.error("Please fill in both subject and body.");
            return;
        }
        setAdminSending(true);
        try {
            const res = await fetch("/api/send-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "custom",
                    to: selectedUser.email,
                    from: "Shoplinea Support <support@shoplinea.shop>",
                    data: {
                        subject: adminSubject,
                        html: adminBody
                    }
                })
            });
            if (res.ok) {
                toast.success("Official Notification dispatched successfully.");
                setAdminSubject("");
                setAdminBody("");
            } else {
                toast.error("Failed to route mail to user.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Mail network failure.");
        } finally {
            setAdminSending(false);
        }
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (u) {
                const { getDoc, doc } = await import("firebase/firestore");
                const userDoc = await getDoc(doc(db, "users", u.uid));
                if (userDoc.exists() && userDoc.data()?.isAdmin) {
                    setIsAdmin(true);
                    fetchUsers();
                } else {
                    setIsAdmin(false);
                    if (typeof window !== 'undefined') window.location.href = '/admin/login';
                }
            } else {
                if (typeof window !== 'undefined') window.location.href = '/admin/login';
            }
        });
        return () => unsub();
    }, []);

    const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
        if (!confirm(`Are you sure you want to ${currentStatus ? 'REVOKE' : 'GRANT'} Admin access?`)) return;
        try {
            await updateDoc(doc(db, "users", userId), { isAdmin: !currentStatus });
            toast.success("Privileges updated successfully.");
            fetchUsers();
        } catch (err) {
            toast.error("Failed to update user privileges.");
        }
    };

    const deleteUserRecord = async (userId: string) => {
        if (!confirm("CRITICAL ACTION: Permanently delete this user record and all associated assets? This cannot be undone.")) return;
        toast.error("Feature restricted. Please contact central ops for database deletions.");
    };

    const filtered = users.filter(u =>
        u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-zinc-950">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="w-5 h-5 text-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 leading-none">Personnel Matrix</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tight italic uppercase text-white">Merchant Registry</h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] pl-1">Global User Oversight • Privilege Management • Account Auditing</p>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                        placeholder="Search by Identity or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 bg-zinc-900 border-zinc-800 h-14 rounded-2xl font-bold text-white shadow-xl italic text-xs"
                    />
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-950/50 border-b border-zinc-800">
                            <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                <th className="p-10">Identity</th>
                                <th className="p-6">Status/Role</th>
                                <th className="p-6">Capital Assets</th>
                                <th className="p-6">Network Tier</th>
                                <th className="p-10 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/30">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                        <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest italic">No matching identity records found in personnel matrix</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((u) => (
                                    <tr key={u.id} className="hover:bg-zinc-800/20 transition-all group">
                                        <td className="p-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 group-hover:bg-blue-600/10 group-hover:border-blue-600/30 transition-all overflow-hidden relative">
                                                    {u.photoURL ? (
                                                        <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-black text-zinc-500 group-hover:text-blue-500 uppercase">{u.displayName?.slice(0, 2) || u.email?.slice(0, 2) || '??'}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black italic text-white leading-none mb-1 uppercase tracking-tight">{u.displayName || 'Anonymous Merchant'}</p>
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="w-3 h-3 text-zinc-600" />
                                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{u.email}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col gap-1.5">
                                                {u.isAdmin && (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest rounded-full w-fit shadow-lg shadow-blue-600/20">
                                                        <Shield className="w-2.5 h-2.5" /> SUPERUSER
                                                    </span>
                                                )}
                                                <span className={cn(
                                                    "inline-flex items-center gap-1.5 px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-full w-fit border",
                                                    u.kycStatus === 'verified'
                                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10'
                                                        : u.kycStatus === 'pending'
                                                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/10'
                                                            : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/10'
                                                )}>
                                                    <ShieldCheck className="w-2.5 h-2.5" /> {u.kycStatus || 'UNVERIFIED'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Wallet className="w-3 h-3 text-zinc-600" />
                                                    <p className="text-xs font-black text-white italic tracking-tighter">${(u.walletBalance || 0).toLocaleString()}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Megaphone className="w-3 h-3 text-zinc-600" />
                                                    <p className="text-xs font-black text-blue-500 italic tracking-tighter">${(u.adWalletBalance || 0).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl w-fit group-hover:border-blue-500/30 transition-all">
                                                <Crown className={cn("w-4 h-4", u.plan ? 'text-amber-500' : 'text-zinc-600')} />
                                                <span className="text-[10px] font-black italic uppercase text-white">{u.planName || 'BASIC_ID'}</span>
                                            </div>
                                        </td>
                                        <td className="p-10 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                <Button
                                                    onClick={() => fetchUserDetails(u)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-10 px-6 rounded-xl bg-white text-black font-black uppercase hover:bg-blue-600 hover:text-white transition-all text-[9px] shadow-xl"
                                                >
                                                    Audit
                                                </Button>
                                                <Button
                                                    onClick={() => toggleAdminStatus(u.id, !!u.isAdmin)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-10 w-10 p-0 rounded-xl bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                >
                                                    <Shield className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    onClick={() => deleteUserRecord(u.id)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-10 w-10 p-0 rounded-xl bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-10 bg-blue-600/5 border border-blue-600/10 rounded-[3rem] shadow-2xl space-y-4">
                    <TrendingUp className="w-10 h-10 text-blue-500" />
                    <div>
                        <h4 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none mb-1">Total Network Strength</h4>
                        <p className="text-4xl font-black text-white italic tracking-tighter">{(users.length * 1.8).toFixed(1)}K+</p>
                        <p className="text-zinc-600 font-bold text-[9px] uppercase tracking-widest mt-2">Active connections across Global Subnets</p>
                    </div>
                </div>
                <div className="p-10 bg-emerald-500/5 border border-emerald-500/10 rounded-[3rem] shadow-2xl space-y-4">
                    <DollarSign className="w-10 h-10 text-emerald-500" />
                    <div>
                        <h4 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none mb-1">Combined Equity</h4>
                        <p className="text-4xl font-black text-white italic tracking-tighter">${users.reduce((acc, curr) => acc + (curr.walletBalance || 0), 0).toLocaleString()}</p>
                        <p className="text-zinc-600 font-bold text-[9px] uppercase tracking-widest mt-2">Total merchant liquid capital on-platform</p>
                    </div>
                </div>
                <div className="p-10 bg-indigo-500/5 border border-indigo-500/10 rounded-[3rem] shadow-2xl space-y-4">
                    <Megaphone className="w-10 h-10 text-indigo-500" />
                    <div>
                        <h4 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none mb-1">Ad Network Liquidity</h4>
                        <p className="text-4xl font-black text-white italic tracking-tighter">${users.reduce((acc, curr) => acc + (curr.adWalletBalance || 0), 0).toLocaleString()}</p>
                        <p className="text-zinc-600 font-bold text-[9px] uppercase tracking-widest mt-2">Reserved capital for global market scaling</p>
                    </div>
                </div>
            </div>

            {/* Merchant Management Modal */}
            <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="Merchant Control Terminal">
                {selectedUser && (
                    <div className="space-y-10 py-6 animate-in fade-in zoom-in duration-500">
                        {/* Header Section */}
                        <div className="flex items-start gap-6 bg-slate-50 border border-slate-200 p-8 rounded-[2.5rem] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/5 rounded-full blur-[50px] -mr-20 -mt-20" />
                            <div className="w-20 h-20 rounded-[1.8rem] bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm group-hover:scale-105 transition-all">
                                {selectedUser.photoURL ? (
                                    <img src={selectedUser.photoURL} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <Users className="w-10 h-10 text-slate-400" />
                                )}
                            </div>
                            <div className="space-y-1 py-1 relative z-10">
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] leading-none mb-2">Authenticated Official</p>
                                <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">{selectedUser.displayName || 'Merchant'}</h2>
                                <div className="flex items-center gap-3">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{selectedUser.email}</p>
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">ID: {selectedUser.id.slice(0, 10)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Pending Capital Hub */}
                            <div className="bg-slate-50 border border-slate-200 p-8 rounded-[2rem] space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                        <Clock className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight italic">Pending Capital</h3>
                                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Awaiting clearing protocol</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {loadingDetails ? (
                                        <div className="h-20 flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                                        </div>
                                    ) : userTransactions.length === 0 ? (
                                        <div className="p-6 bg-white border border-slate-200 border-dashed rounded-xl text-center">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">No pending transactions</p>
                                        </div>
                                    ) : (
                                        userTransactions.map(t => (
                                            <div key={t.id} className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between group hover:border-amber-500/30 transition-all shadow-sm">
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-black text-slate-900 uppercase italic tracking-tight">{t.type?.replace('_', ' ')}</p>
                                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString() : 'Recent'}</p>
                                                </div>
                                                <p className="text-xs font-black text-amber-600 tracking-tighter">${t.amount?.toLocaleString()}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Store Analytics Hub */}
                            <div className="bg-slate-50 border border-slate-200 p-8 rounded-[2rem] space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                        <Box className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight italic">Inventory Core</h3>
                                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Active SKU rotations</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {loadingDetails ? (
                                        <div className="h-20 flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                                        </div>
                                    ) : userProducts.length === 0 ? (
                                        <div className="p-6 bg-white border border-slate-200 border-dashed rounded-xl text-center">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">No active inventory records</p>
                                        </div>
                                    ) : (
                                        userProducts.map(p => (
                                            <div key={p.id} className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between group hover:border-blue-500/30 transition-all shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
                                                        <Eye className="w-4 h-4 text-slate-500" />
                                                    </div>
                                                    <p className="text-[10px] font-black text-slate-900 uppercase italic tracking-tight">{p.name || 'Global SKU'}</p>
                                                </div>
                                                <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 transition-all" />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Market Injection Engine */}
                        <div className="bg-slate-50 border border-slate-200 p-10 rounded-[2.5rem] space-y-8 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50 rounded-full blur-[100px] -mr-40 -mt-40 opacity-0 group-hover:opacity-100 transition-all duration-1000" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-14 h-14 bg-blue-600 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-blue-600/20">
                                    <Zap className="w-8 h-8 text-white animate-pulse" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 italic tracking-tight leading-none mb-1">Market Injection</h2>
                                    <p className="text-[10px] font-black uppercase text-blue-600 tracking-[0.2em]">Artificial Demand Acceleration</p>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-6 items-end relative z-10">
                                <div className="flex-1 space-y-2 w-full">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Injection Origin (Country)</Label>
                                    <Input
                                        value={simCountry}
                                        onChange={e => setSimCountry(e.target.value)}
                                        className="h-14 bg-white border-slate-200 rounded-2xl font-black text-slate-900 text-xl italic"
                                        placeholder="USA"
                                    />
                                </div>
                                <div className="flex-1 space-y-2 w-full">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Injection Volume</Label>
                                    <Input
                                        type="number"
                                        value={boostCount}
                                        onChange={e => setBoostCount(e.target.value)}
                                        className="h-14 bg-white border-slate-200 rounded-2xl font-black text-slate-900 text-xl italic"
                                        placeholder="10"
                                    />
                                </div>
                                <Button
                                    onClick={handleBoostSales}
                                    disabled={boostingSales || userProducts.length === 0}
                                    className="h-14 bg-blue-600 hover:bg-blue-700 text-white font-black italic rounded-2xl px-10 gap-3 shadow-xl shadow-blue-600/20 transition-all duration-500 uppercase text-[10px]"
                                >
                                    {boostingSales ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                                    EXECUTE PROTOCOL
                                </Button>
                            </div>
                            {userProducts.length === 0 && (
                                <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest text-center italic animate-pulse">
                                    Critical: No merchant product history detected. Manual injection restricted.
                                </p>
                            )}
                        </div>

                        {/* Admin Communications Hub */}
                        <div className="bg-slate-50 border border-slate-200 p-8 rounded-[2rem] space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                    <Mail className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight italic">Direct Transmission</h3>
                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Send specialized billing or store emails to this merchant</p>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Template Selection</Label>
                                    <select 
                                        className="w-full h-12 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-sm px-4 outline-none focus:border-purple-500/50"
                                        value={adminTemplate}
                                        onChange={(e) => {
                                            setAdminTemplate(e.target.value);
                                            if (e.target.value === 'billing') {
                                                setAdminSubject('Action Required: Account Setup Fee / Subscription Phase');
                                                setAdminBody('Dear Merchant,\n\nTo release your pending funds and activate your payout route, you are required to pay a one-time network clearance fee / subscription. Please contact our support team or use the designated payment portal to complete this transaction.\n\nThank you,\nShoplinea Network Infrastructure');
                                            } else {
                                                setAdminSubject('');
                                                setAdminBody('');
                                            }
                                        }}
                                    >
                                        <option value="custom">Freeform Custom Transmission</option>
                                        <option value="billing">Billing/Fee/Subscription Request</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Transmission Subject</Label>
                                    <Input
                                        value={adminSubject}
                                        onChange={e => setAdminSubject(e.target.value)}
                                        className="h-12 bg-white border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:border-purple-500/50"
                                        placeholder="E.g. Action Required: Billing Issue"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Secure Message Body</Label>
                                    <textarea
                                        value={adminBody}
                                        onChange={e => setAdminBody(e.target.value)}
                                        className="w-full h-32 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 text-sm p-4 outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all resize-none shadow-sm"
                                        placeholder="Write your professional message here..."
                                    />
                                </div>
                                <Button
                                    onClick={handleSendCustomEmail}
                                    disabled={adminSending}
                                    className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl gap-2 transition-all shadow-lg shadow-purple-600/20"
                                >
                                    {adminSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                    DISPATCH TRANSMISSION
                                </Button>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-200 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-slate-400" />
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Authorized Operations Only • All Injections are Logged</p>
                            </div>
                            <Button onClick={() => setSelectedUser(null)} variant="ghost" className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 hover:bg-slate-100 transition-all">Close Terminal</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

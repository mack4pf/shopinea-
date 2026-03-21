"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, query, getDocs, orderBy, doc, updateDoc, increment, getDoc, where, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { 
    LayoutDashboard, 
    ShoppingCart, 
    Wallet, 
    Users, 
    CheckCircle2, 
    XCircle, 
    Loader2, 
    Search, 
    Filter,
    ArrowUpRight,
    Clock,
    DollarSign,
    Box,
    Shield,
    Zap,
    Lock,
    UserCheck,
    Eye,
    ShieldAlert,
    Mail,
    Crown,
    History,
    TrendingUp,
    Megaphone,
    Target,
    BarChart3,
    UserCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";

export default function AdminDashboard() {
    const [user, setUser] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [kycRequests, setKycRequests] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [adCampaigns, setAdCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Store Views Booster
    const [viewsTargetUserId, setViewsTargetUserId] = useState("");
    const [viewsAmount, setViewsAmount] = useState("");
    const [visitsAmount, setVisitsAmount] = useState("");
    const [boostingViews, setBoostingViews] = useState(false);

    // Sales Simulator
    const [simTargetUserId, setSimTargetUserId] = useState("");
    const [simProductId, setSimProductId] = useState("");
    const [simCount, setSimCount] = useState("20");
    const [simPaymentSplit, setSimPaymentSplit] = useState("60");
    const [simCountry, setSimCountry] = useState("USA");
    const [runningSim, setRunningSim] = useState(false);

    const [selectedKyc, setSelectedKyc] = useState<any>(null);

    const fetchData = async () => {
        try {
            const ordersSnap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc")));
            setOrders(ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            const kycSnap = await getDocs(query(collection(db, "users"), where("kycStatus", "==", "pending")));
            setKycRequests(kycSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            const usersSnap = await getDocs(collection(db, "users"));
            setAllUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            const productsSnap = await getDocs(collection(db, "products"));
            setAllProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            const campaignsSnap = await getDocs(query(collection(db, "campaigns"), orderBy("createdAt", "desc")));
            setAdCampaigns(campaignsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (u) {
                setUser(u);
                const userDoc = await getDoc(doc(db, "users", u.uid));
                if (userDoc.exists() && userDoc.data()?.isAdmin) {
                    setIsAdmin(true);
                    fetchData();
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

    const handleApproveKyc = async (userId: string) => {
        setProcessingId(userId);
        try {
            await updateDoc(doc(db, "users", userId), { 
                kycStatus: "verified",
                kycVerifiedAt: serverTimestamp()
            });
            toast.success("Merchant Verified Successfully!");
            setSelectedKyc(null);
            fetchData();
        } catch (err) {
            toast.error("Verification failed.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectKyc = async (userId: string, reason: string) => {
        setProcessingId(userId);
        try {
            await updateDoc(doc(db, "users", userId), { 
                kycStatus: "rejected",
                kycRejectionReason: reason
            });
            toast.success("Identity record rejected.");
            setSelectedKyc(null);
            fetchData();
        } catch (err) {
            toast.error("Rejection protocol failed.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleBoostViews = async () => {
        if (!viewsTargetUserId || (!viewsAmount && !visitsAmount)) {
            toast.error("Config parameters required.");
            return;
        }
        setBoostingViews(true);
        try {
            const userRef = doc(db, "users", viewsTargetUserId);
            const updates: any = {};
            if (viewsAmount)  updates["stats.views"]   = increment(Number(viewsAmount));
            if (visitsAmount) updates["stats.visits"] = increment(Number(visitsAmount));
            await updateDoc(userRef, updates);
            toast.success("Network traffic injected!");
            setViewsAmount(""); setVisitsAmount("");
        } catch (err) {
            toast.error("Injection failed.");
        } finally {
            setBoostingViews(false);
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

    const handleRunSimulator = async () => {
        if (!simTargetUserId || !simProductId) {
            toast.error("Reseller & Product selection required.");
            return;
        }
        setRunningSim(true);
        try {
            const product = allProducts.find(p => p.id === simProductId);
            const count = Number(simCount) || 20;
            const paidPct = Number(simPaymentSplit) || 60;

            for (let i = 0; i < count; i++) {
                const buyer = FAKE_BUYERS[i % FAKE_BUYERS.length];
                const isPaidNow = Math.random() * 100 < paidPct;
                const profit = (product.resellPrice || product.price) - (product.initialPrice || product.cost);
                
                const dayOffset = Math.floor(Math.random() * 30);
                const createdAt = new Date(Date.now() - (dayOffset * 86400000));

                const orderRef = await addDoc(collection(db, "orders"), {
                    resellerId: simTargetUserId,
                    customerName: buyer.name,
                    customerCountry: simCountry || buyer.country,
                    productId: simProductId,
                    productName: product.name || product.productName,
                    resellPrice: product.resellPrice || product.price,
                    initialPrice: product.initialPrice || product.cost,
                    resellerProfit: profit,
                    status: isPaidNow ? 'delivered' : 'shipped',
                    isSimulated: true,
                    createdAt,
                    releasedAt: isPaidNow ? createdAt : null,
                });

                if (isPaidNow) {
                    await updateDoc(doc(db, "users", simTargetUserId), { payoutBalance: increment(profit) });
                } else {
                    await updateDoc(doc(db, "users", simTargetUserId), { pendingPayout: increment(profit) });
                }
            }
            toast.success(`✅ Generated ${count} realistic demand units!`);
            fetchData();
        } catch (err) {
            toast.error("Simulation failed.");
        } finally {
            setRunningSim(false);
        }
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-zinc-950">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
            {/* Elite Summary Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-5 h-5 text-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 leading-none">Global Control Terminal</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tight italic uppercase text-white">Ops Registry</h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] pl-1">Network Analytics • Identity Compliance • Market Injection</p>
                </div>

                <div className="flex gap-10">
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest leading-none mb-1">Total Network Revenue</p>
                        <p className="text-3xl font-black italic tracking-tighter text-white">${orders.reduce((acc, o) => acc + (o.resellPrice || 0), 0).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest leading-none mb-1">Merchant Cap (Liquid)</p>
                        <p className="text-3xl font-black italic tracking-tighter text-emerald-500">${allUsers.reduce((acc, u) => acc + (u.walletBalance || 0), 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Global Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Pending KYC", value: kycRequests.length, icon: UserCheck, color: "rose" },
                    { label: "Ad Load", value: adCampaigns.filter(c => c.status === 'scheduled').length, icon: Zap, color: "indigo" },
                    { label: "Active Nodes", value: allUsers.length, icon: Users, color: "blue" },
                    { label: "Fleet Items", value: allProducts.length, icon: Box, color: "emerald" },
                ].map((s, i) => (
                    <div key={i} className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] space-y-3 shadow-2xl group hover:border-blue-500/30 transition-all">
                        <div className={`w-12 h-12 rounded-2xl bg-${s.color}-500/10 border border-${s.color}-500/20 flex items-center justify-center group-hover:bg-${s.color}-500/20 transition-all`}>
                            <s.icon className={`w-6 h-6 text-${s.color}-500`} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest leading-none mb-2">{s.label}</p>
                            <h3 className="text-3xl font-black italic tracking-tighter text-white">{s.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Identity Compliance Terminal */}
                <div className="bg-rose-500/5 border border-rose-500/20 p-10 rounded-[3rem] space-y-8 shadow-2xl relative overflow-hidden h-fit">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full blur-[100px] -mr-40 -mt-40" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 bg-rose-500/10 rounded-[1.5rem] flex items-center justify-center">
                            <ShieldAlert className="w-8 h-8 text-rose-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white italic tracking-tight leading-none mb-1">Identity Compliance</h2>
                            <p className="text-[10px] font-black uppercase text-rose-500 tracking-[0.2em]">Pending Identity Checks ({kycRequests.length})</p>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        {kycRequests.length === 0 ? (
                            <div className="py-10 text-center bg-zinc-950/50 rounded-[2rem] border border-zinc-800 border-dashed">
                                <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest italic">Compliance Matrix Clear</p>
                            </div>
                        ) : (
                            kycRequests.map((k) => (
                                <div key={k.id} className="bg-zinc-950 border border-zinc-800 p-6 rounded-[2rem] group hover:border-rose-500/50 transition-all">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
                                                <UserCircle className="w-5 h-5 text-zinc-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black italic text-white uppercase tracking-tight leading-none mb-1">{k.displayName || k.email?.split('@')[0]}</p>
                                                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">{k.email}</p>
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={() => setSelectedKyc(k)}
                                            className="h-9 rounded-xl bg-white text-black font-black text-[9px] uppercase px-4 hover:scale-[1.02] transition-transform shadow-xl"
                                        >
                                            REVIEW ID
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Market Simulation & Traffic Terminal */}
                <div className="space-y-10">
                    <div className="bg-indigo-600/5 border border-indigo-600/10 p-10 rounded-[3rem] space-y-8 shadow-2xl relative overflow-hidden">
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-14 h-14 bg-indigo-500/10 rounded-[1.5rem] flex items-center justify-center">
                                <Zap className="w-8 h-8 text-indigo-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white italic tracking-tight leading-none mb-1">Market Injection</h2>
                                <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em]">Sales Simulation & Traffic Burst</p>
                            </div>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest pl-1">Target Reseller</Label>
                                    <select 
                                        className="w-full bg-zinc-950 border border-zinc-800 h-12 rounded-xl text-[10px] font-black uppercase text-white px-4 outline-none focus:border-indigo-500 transition-all"
                                        value={simTargetUserId}
                                        onChange={(e) => setSimTargetUserId(e.target.value)}
                                    >
                                        <option value="">— SELECT ID —</option>
                                        {allUsers.map(u => <option key={u.id} value={u.id}>{u.displayName || u.email}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest pl-1">Target Product</Label>
                                    <select 
                                        className="w-full bg-zinc-950 border border-zinc-800 h-12 rounded-xl text-[10px] font-black uppercase text-white px-4 outline-none focus:border-indigo-500 transition-all"
                                        value={simProductId}
                                        onChange={(e) => setSimProductId(e.target.value)}
                                    >
                                        <option value="">— SELECT SKU —</option>
                                        {allProducts.map(p => <option key={p.id} value={p.id}>{p.name || p.productName}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest pl-1">Injection Origin (Country)</Label>
                                    <Input 
                                        className="w-full bg-zinc-950 border border-zinc-800 h-12 rounded-xl text-[10px] font-black uppercase text-white px-4"
                                        placeholder="USA"
                                        value={simCountry}
                                        onChange={(e) => setSimCountry(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest pl-1">Volume Count</Label>
                                    <Input 
                                        className="w-full bg-zinc-950 border border-zinc-800 h-12 rounded-xl text-[10px] font-black uppercase text-white px-4"
                                        placeholder="20"
                                        type="number"
                                        value={simCount}
                                        onChange={(e) => setSimCount(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button 
                                onClick={handleRunSimulator}
                                disabled={runningSim}
                                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black italic rounded-2xl gap-3 shadow-xl shadow-indigo-500/20 text-[10px] uppercase tracking-widest"
                            >
                                {runningSim ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
                                EXECUTE SALES SIMULATION
                            </Button>
                        </div>
                    </div>

                    <div className="bg-blue-600/5 border border-blue-600/10 p-10 rounded-[3rem] space-y-8 shadow-2xl relative overflow-hidden">
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-14 h-14 bg-blue-500/10 rounded-[1.5rem] flex items-center justify-center">
                                <Eye className="w-8 h-8 text-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white italic tracking-tight leading-none mb-1">Store Booster</h2>
                                <p className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em]">Views & Visits Injection</p>
                            </div>
                        </div>
                        <div className="space-y-4 relative z-10">
                             <select 
                                className="w-full bg-zinc-950 border border-zinc-800 h-12 rounded-xl text-[10px] font-black uppercase text-white px-4 outline-none focus:border-blue-500 transition-all"
                                value={viewsTargetUserId}
                                onChange={(e) => setViewsTargetUserId(e.target.value)}
                            >
                                <option value="">— SELECT TARGET —</option>
                                {allUsers.map(u => <option key={u.id} value={u.id}>{u.displayName || u.email}</option>)}
                            </select>
                            <div className="flex gap-4">
                                <Input 
                                    placeholder="VIEWS (e.g. 5000)" 
                                    type="number"
                                    className="bg-zinc-950 border-zinc-800 h-12 rounded-xl text-[10px] font-black uppercase text-white" 
                                    value={viewsAmount}
                                    onChange={(e) => setViewsAmount(e.target.value)}
                                />
                                <Input 
                                    placeholder="VISITS (e.g. 1500)" 
                                    type="number"
                                    className="bg-zinc-950 border-zinc-800 h-12 rounded-xl text-[10px] font-black uppercase text-white" 
                                    value={visitsAmount}
                                    onChange={(e) => setVisitsAmount(e.target.value)}
                                />
                            </div>
                            <Button 
                                onClick={handleBoostViews}
                                disabled={boostingViews}
                                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black italic rounded-2xl gap-3 shadow-xl shadow-blue-500/20 text-[10px] uppercase tracking-widest"
                            >
                                {boostingViews ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                                INJECT TRAFFIC FLUX
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* KYC Review Modal */}
            <Modal isOpen={!!selectedKyc} onClose={() => setSelectedKyc(null)} title="Identity Verification Protocol">
                {selectedKyc && (
                    <div className="space-y-8 py-6">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-500">Identity Name</Label>
                                <p className="text-xl font-black italic text-slate-900 uppercase">{selectedKyc.identification?.fullName || selectedKyc.displayName || 'Unnamed Merchant'}</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-500">Global ID</Label>
                                <p className="text-xl font-black italic text-slate-900 uppercase font-mono">{selectedKyc.identification?.idNumber || selectedKyc.id.slice(0,12)}</p>
                            </div>
                        </div>

                        <div className="aspect-[16/9] bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden relative group">
                            {selectedKyc.identification?.documentImage || selectedKyc.kycDocUrl ? (
                                <img src={selectedKyc.identification?.documentImage || selectedKyc.kycDocUrl} alt="KYC Document" className="w-full h-full object-contain" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">No document attachment found</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button 
                                variant="outline" 
                                onClick={() => handleRejectKyc(selectedKyc.id, "Documents do not meet resolution requirements.")}
                                className="h-14 border-rose-500/30 text-rose-500 font-black italic rounded-2xl hover:bg-rose-500 hover:text-white transition-all uppercase text-[10px]"
                            >
                                REJECT ENTRY
                            </Button>
                            <Button 
                                onClick={() => handleApproveKyc(selectedKyc.id)}
                                className="h-14 bg-emerald-600 text-white font-black italic rounded-2xl hover:bg-emerald-700 transition-all uppercase text-[10px] shadow-xl shadow-emerald-600/20"
                            >
                                VERIFY IDENTITY
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

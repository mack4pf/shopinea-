"use client";

import { useState, useEffect, useRef } from "react";
import { auth, db } from "@/lib/firebase/config";
import {
    collection, query, getDocs, orderBy, doc, updateDoc, increment,
    getDoc, where, addDoc, serverTimestamp
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    Users, ShieldCheck, Package, Zap, Eye, TrendingUp, Loader2,
    CheckCircle2, XCircle, UserCircle, RefreshCw, AlertTriangle,
    DollarSign, ShoppingBag, ChevronRight, Search, MapPin, Plus, X
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getDefaultStock } from "@/lib/catalog";

// ─── City API helper ──────────────────────────────────────────────────────────
const cityCache: Record<string, string[]> = {};
async function fetchCitiesForCountry(country: string): Promise<string[]> {
    const key = country.trim().toLowerCase();
    if (cityCache[key]) return cityCache[key];
    try {
        const res = await fetch("https://countriesnow.space/api/v0.1/countries/cities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ country: country.trim() }),
        });
        const json = await res.json();
        if (!json.error && Array.isArray(json.data) && json.data.length > 0) {
            cityCache[key] = json.data;
            return json.data;
        }
    } catch { /* fall through */ }
    return [];
}

// ─── Searchable Select (for users/products) ──────────────────────────────────
function SearchableSelect({ value, onChange, options, placeholder, className = "" }: {
    value: string; onChange: (v: string) => void;
    options: { label: string; value: string }[];
    placeholder?: string; className?: string;
}) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const ref = useRef<HTMLDivElement>(null);
    const filtered = q ? options.filter(o => o.label.toLowerCase().includes(q.toLowerCase())) : options;
    const selected = options.find(o => o.value === value);

    useEffect(() => {
        function out(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQ(""); } }
        document.addEventListener("mousedown", out);
        return () => document.removeEventListener("mousedown", out);
    }, []);

    return (
        <div ref={ref} className={cn("relative", className)}>
            <button type="button" onClick={() => setOpen(!open)}
                className={cn("w-full h-10 flex items-center gap-2 px-3 bg-white/[0.03] border rounded-xl text-sm text-left transition-all",
                    open ? "border-blue-500/50" : "border-white/[0.08] hover:border-white/[0.14]")}>
                <span className={cn("flex-1 truncate", selected ? "text-white" : "text-zinc-600")}>
                    {selected?.label || placeholder || "Select…"}
                </span>
                <svg className={cn("w-4 h-4 text-zinc-500 shrink-0 transition-transform", open && "rotate-180")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="6 9 12 15 18 9" /></svg>
            </button>
            {open && (
                <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-[#0f0f14] border border-white/[0.1] rounded-xl shadow-2xl shadow-black/60 overflow-hidden">
                    <div className="p-2 border-b border-white/[0.06]">
                        <div className="flex items-center gap-2 px-3 h-8 bg-white/[0.04] border border-white/[0.06] rounded-lg">
                            <Search className="w-3 h-3 text-zinc-500" />
                            <input autoFocus type="text" value={q} onChange={e => setQ(e.target.value)}
                                placeholder="Search…" className="flex-1 bg-transparent text-xs text-white placeholder:text-zinc-600 outline-none" />
                        </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto py-1">
                        {filtered.length === 0 ? <p className="px-4 py-3 text-xs text-zinc-600 text-center">No results</p>
                            : filtered.map(o => (
                                <button key={o.value} type="button"
                                    onClick={() => { onChange(o.value); setOpen(false); setQ(""); }}
                                    className={cn("w-full text-left px-3.5 py-2 text-[13px] transition-colors",
                                        value === o.value ? "text-blue-300 bg-blue-500/10" : "text-zinc-300 hover:bg-white/[0.05] hover:text-white")}>
                                    {o.label}
                                </button>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        shipped: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        paid_to_site: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        pending_payment: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        payment_pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        awaiting_seller_fulfillment: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        awaiting_admin_confirmation: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        void_no_payment: "bg-red-500/10 text-red-400 border-red-500/20",
        payment_failed: "bg-red-500/10 text-red-400 border-red-500/20",
        cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
    };
    const labels: Record<string, string> = {
        pending_payment: "Pending payment",
        payment_pending: "Pending payment",
        awaiting_admin_confirmation: "Pending payment",
        paid_to_site: "Processing",
        awaiting_seller_fulfillment: "Processing",
        void_no_payment: "Void - no payment",
        payment_failed: "Payment failed",
    };
    return (
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-medium capitalize", map[status] || "bg-zinc-800 text-zinc-400 border-zinc-700")}>
            {labels[status] || status?.replace(/_/g, " ") || "unknown"}
        </span>
    );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, accent, badge }: {
    label: string; value: string | number; sub: string;
    icon: React.ElementType; accent: string; badge?: string;
}) {
    const accents: Record<string, { bg: string; border: string; icon: string }> = {
        blue:    { bg: "bg-blue-500/10",    border: "border-blue-500/20",    icon: "text-blue-400" },
        emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: "text-emerald-400" },
        amber:   { bg: "bg-amber-500/10",   border: "border-amber-500/20",   icon: "text-amber-400" },
        purple:  { bg: "bg-purple-500/10",  border: "border-purple-500/20",  icon: "text-purple-400" },
    };
    const a = accents[accent] || accents.blue;
    return (
        <div className="relative bg-[#0d0d11] border border-white/[0.07] rounded-2xl p-5 overflow-hidden hover:border-white/[0.12] transition-all">
            <div className="flex items-start justify-between mb-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", a.bg, a.border)}>
                    <Icon className={cn("w-5 h-5", a.icon)} />
                </div>
                {badge && <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold border", a.bg, a.border, a.icon)}>{badge}</span>}
            </div>
            <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
            <p className="text-sm text-white/60 mt-0.5 font-medium">{label}</p>
            <p className="text-[11px] text-zinc-600 mt-1">{sub}</p>
            <div className={cn("absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-2xl opacity-10", a.bg)} />
        </div>
    );
}

export default function AdminDashboard() {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<any[]>([]);
    const [kycRequests, setKycRequests] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [tab, setTab] = useState<"overview" | "kyc" | "orders" | "tools">("overview");
    const [orderSearch, setOrderSearch] = useState("");
    const [selectedKyc, setSelectedKyc] = useState<any>(null);
    const [simUserId, setSimUserId] = useState("");
    const [simSelectedProducts, setSimSelectedProducts] = useState<string[]>([]);
    const [simLocations, setSimLocations] = useState<{ country: string; count: string }[]>([{ country: "United States", count: "20" }]);
    const [simOrderDate, setSimOrderDate] = useState<"today" | "yesterday">("today");
    const [runningSim, setRunningSim] = useState(false);
    const [boostUserId, setBoostUserId] = useState("");
    const [boostViews, setBoostViews] = useState("");
    const [boostVisits, setBoostVisits] = useState("");
    const [boosting, setBoosting] = useState(false);

    const addSimLocation = () => setSimLocations(prev => [...prev, { country: "", count: "5" }]);
    const removeSimLocation = (i: number) => setSimLocations(prev => prev.filter((_, idx) => idx !== i));
    const updateSimLocation = (i: number, field: 'country' | 'count', val: string) =>
        setSimLocations(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l));

    const SIM_FIRST = ["Liam","Emma","Noah","Olivia","James","Sophia","Oliver","Ava","Ethan","Isabella","Lucas","Mia","Mason","Charlotte","Logan","Amelia","Aiden","Harper","Jack","Evelyn","Carter","Abigail","Sebastian","Emily","Owen","Ella","Caleb","Elizabeth","Ryan","Camila","Nathan","Luna","Wyatt","Sofia","Luke","Avery","Isaiah","Mila","Gabriel","Aria","Benjamin","Scarlett","Elijah","Penelope","Julian","Layla","Adrian","Chloe","Levi","Victoria","Aaron","Madison","Charles","Eleanor","Thomas","Grace","Jaxon","Nora","Kai","Riley","Hunter","Zoey","Dominic","Hannah","Jordan","Lily","Ian","Aubrey","Carson","Lillian","Axel","Addison","Adam","Ellie","Miles","Stella","Asher","Natalie","Xavier","Zoe","Mateo","Leah","Nolan","Hazel","Ezra","Violet","Leo","Aurora","Micah","Savannah","Max","Audrey","Finn","Brooklyn","Tobias","Bella","Remi","Claire","Zach","Skylar"];
    const SIM_LAST  = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Wilson","Taylor","Anderson","Thomas","Jackson","White","Harris","Martin","Thompson","Moore","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores","Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell","Carter","Roberts","Gomez","Phillips","Evans","Turner","Diaz","Parker","Cruz","Edwards","Collins","Reyes","Stewart","Morris","Morales","Murphy","Cook","Rogers","Gutierrez","Ortiz","Morgan","Cooper","Peterson","Bailey","Reed","Kelly","Howard","Ramos","Kim","Cox","Ward","Richardson","Watson","Brooks","Chavez","Wood","James","Bennett","Gray","Mendoza","Ruiz","Hughes","Price","Alvarez","Castillo","Sanders","Patel","Myers","Long","Ross","Foster","Jimenez","Powell","Jenkins","Perry","Russell","Sullivan","Bell","Coleman","Butler","Henderson","Barnes","Gonzalez","Fisher","Simmons"];

    const fetchData = async (quiet = false) => {
        if (!quiet) setLoading(true); else setRefreshing(true);
        try {
            const [ordersSnap, kycSnap, usersSnap, productsSnap] = await Promise.all([
                getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc"))),
                getDocs(query(collection(db, "users"), where("kycStatus", "==", "pending"))),
                getDocs(collection(db, "users")),
                getDocs(collection(db, "products")),
            ]);
            setOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setKycRequests(kycSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setAllUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setAllProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch { toast.error("Failed to load data."); }
        finally { setLoading(false); setRefreshing(false); }
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (u) {
                const userDoc = await getDoc(doc(db, "users", u.uid));
                if (userDoc.exists() && userDoc.data()?.isAdmin) {
                    setIsAdmin(true); fetchData();
                } else {
                    setIsAdmin(false);
                    if (typeof window !== "undefined") window.location.href = "/admin/login";
                }
            } else {
                if (typeof window !== "undefined") window.location.href = "/admin/login";
            }
        });
        return () => unsub();
    }, []);

    const handleApproveKyc = async (userId: string) => {
        setProcessingId(userId);
        try {
            await updateDoc(doc(db, "users", userId), { kycStatus: "verified", kycVerifiedAt: serverTimestamp() });
            toast.success("KYC approved."); setSelectedKyc(null); fetchData(true);
        } catch { toast.error("Failed to approve KYC."); }
        finally { setProcessingId(null); }
    };

    const handleRejectKyc = async (userId: string) => {
        setProcessingId(userId);
        try {
            await updateDoc(doc(db, "users", userId), { kycStatus: "rejected", kycRejectionReason: "Documents do not meet requirements." });
            toast.success("KYC rejected."); setSelectedKyc(null); fetchData(true);
        } catch { toast.error("Failed to reject KYC."); }
        finally { setProcessingId(null); }
    };

    const handleApproveOrderPayment = async (order: any) => {
        if (!confirm(`Approve payment and move order #${order.id.slice(0, 8)} to processing?`)) return;
        setProcessingId(order.id);
        try {
            await updateDoc(doc(db, "orders", order.id), {
                status: "paid_to_site",
                paymentStatus: "paid",
                paidAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            toast.success("Order payment approved. Buyer now sees Processing.");
            fetchData(true);
        } catch {
            toast.error("Failed to approve this order.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleCancelOrderPayment = async (order: any) => {
        const reason = prompt("Why is this order being voided?", "Void - no payment received.");
        if (reason === null) return;
        const finalReason = reason.trim() || "Void - no payment received.";
        setProcessingId(order.id);
        try {
            await updateDoc(doc(db, "orders", order.id), {
                status: "void_no_payment",
                paymentStatus: "void",
                cancelledAt: serverTimestamp(),
                cancellationReason: finalReason,
                updatedAt: serverTimestamp(),
            });
            if (order.customerEmail) {
                await fetch("/api/send-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "custom",
                        to: order.customerEmail,
                        data: {
                            subject: "Order voided - no payment received",
                            html: `<p>Hello ${order.customerName || "there"},</p>
                                <p>Your order for <strong>${order.productName || "your item"}</strong> has been voided because no payment was received or the payment could not be confirmed.</p>
                                <p><strong>Order:</strong> #${order.id.slice(0, 8)}</p>
                                <p><strong>Status:</strong> Void - no payment received</p>
                                <p><strong>Reason:</strong> ${finalReason}</p>
                                <p>No shipment will be processed for this order. If you believe this is a mistake, please contact support or place the order again with a confirmed payment.</p>`
                        }
                    }),
                });
            }
            toast.success("Order voided and customer notified when email is available.");
            fetchData(true);
        } catch {
            toast.error("Failed to void this order.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleRunSimulator = async () => {
        const simUser = allUsers.find(u => u.id === simUserId);
        const storeProds = (simUser?.storeProducts || [])
            .filter((p: any) => simSelectedProducts.includes(p.id))
            .map((p: any) => ({ ...p, stock: Number(p.stock ?? getDefaultStock(p.id || p.name)) }));
        const validLocs = simLocations.filter(l => l.country.trim() && Number(l.count) > 0);
        if (!simUserId) { toast.error("Select a reseller account first."); return; }
        if (storeProds.length === 0) { toast.error("Select at least one product."); return; }
        if (validLocs.length === 0) { toast.error("Add at least one location."); return; }
        setRunningSim(true);
        try {
            // Pre-fetch cities for all locations
            const locCities: Record<string, string[]> = {};
            await Promise.all(validLocs.map(async loc => {
                locCities[loc.country] = await fetchCitiesForCountry(loc.country);
            }));

            const usedNames = new Set<string>();
            const getUniqueName = () => {
                for (let t = 0; t < 500; t++) {
                    const n = `${SIM_FIRST[Math.floor(Math.random()*SIM_FIRST.length)]} ${SIM_LAST[Math.floor(Math.random()*SIM_LAST.length)]}`;
                    if (!usedNames.has(n)) { usedNames.add(n); return n; }
                }
                const fb = `${SIM_FIRST[Math.floor(Math.random()*SIM_FIRST.length)]} ${SIM_LAST[Math.floor(Math.random()*SIM_LAST.length)]} ${Math.floor(Math.random()*99)}`;
                usedNames.add(fb); return fb;
            };
            const getOrderDate = () => {
                const start = new Date();
                if (simOrderDate === "yesterday") start.setDate(start.getDate() - 1);
                start.setHours(0, 0, 0, 0);
                const end = simOrderDate === "today" ? new Date() : new Date(start.getTime() + 86399000);
                const span = Math.max(1, end.getTime() - start.getTime());
                return new Date(start.getTime() + Math.floor(Math.random() * span));
            };
            const makeBuyer = (orderNumber: number) => {
                const name = getUniqueName();
                const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "");
                return {
                    id: `sim-${simUserId}-${Date.now()}-${orderNumber}`,
                    name,
                    email: `${slug}.${orderNumber}@buyer.shoplinea.local`,
                };
            };
            let total = 0;
            for (const loc of validLocs) {
                const count = Math.min(Number(loc.count) || 0, 2000);
                const cities = locCities[loc.country] || [];
                for (let i = 0; i < count; i++) {
                    const availableProducts = storeProds.filter((p: any) => p.stock > 0);
                    if (availableProducts.length === 0) break;
                    const product = availableProducts[Math.floor(Math.random() * availableProducts.length)];
                    product.stock = Math.max(0, product.stock - 1);
                    const profit = (product.resellPrice || 0) - (product.price || 0);
                    const resellerProfit = profit > 0 ? profit : (product.price || 0) * 0.3;
                    const buyer = makeBuyer(total + 1);
                    const createdAt = getOrderDate();
                    const randomCity = cities.length > 0 ? cities[Math.floor(Math.random() * cities.length)] : null;
                    await addDoc(collection(db, "orders"), {
                        resellerId: simUserId,
                        resellerName: simUser.displayName || simUser.storeName || "Merchant",
                        storeName: simUser.storeName || "Store",
                        customerId: buyer.id,
                        customerName: buyer.name,
                        customerEmail: buyer.email,
                        customerCountry: loc.country,
                        ...(randomCity ? { customerCity: randomCity } : {}),
                        productId: product.id,
                        productName: product.name,
                        resellPrice: product.resellPrice || product.price || 0,
                        resellerProfit,
                        status: 'shipped',
                        createdAt,
                    });
                    await updateDoc(doc(db, "users", simUserId), {
                        pendingPayout: increment(resellerProfit),
                        "stats.orders": increment(1),
                        "stats.sales": increment(1),
                        storeProducts: (simUser.storeProducts || []).map((p: any) => {
                            const changed = storeProds.find((sp: any) => sp.id === p.id);
                            return changed ? { ...p, stock: changed.stock } : p;
                        })
                    });
                    // 5% referral commission — credit the person who referred this seller
                    if (simUser.referredBy) {
                        const commission = (product.resellPrice || product.price || 0) * 0.05;
                        if (commission > 0) {
                            await updateDoc(doc(db, "users", simUser.referredBy), {
                                walletBalance: increment(commission),
                                referralEarnings: increment(commission)
                            });
                        }
                    }
                    total++;
                }
            }
            toast.success(`Injected ${total} orders across ${validLocs.length} location(s)!`);
            fetchData(true);
        } catch (e) { console.error(e); toast.error("Simulation failed."); }
        finally { setRunningSim(false); }
    };

    const handleBoostViews = async () => {
        if (!boostUserId || (!boostViews && !boostVisits)) { toast.error("Select a user and enter amounts."); return; }
        setBoosting(true);
        try {
            const vNum = Number(boostViews) || 0;
            const visNum = Number(boostVisits) || 0;
            const updates: Record<string, any> = {};
            if (vNum)   updates["storeViews"]  = increment(vNum);
            if (visNum) updates["storeVisits"] = increment(visNum);
            // Distribute views across store products
            const boostUser = allUsers.find(u => u.id === boostUserId);
            const prods: any[] = boostUser?.storeProducts || [];
            if (prods.length > 0 && vNum > 0) {
                const weights = prods.map(() => Math.random());
                const wSum = weights.reduce((s, w) => s + w, 0);
                let dist = 0;
                prods.forEach((p: any, i: number) => {
                    if (!p?.id) return;
                    const share = i === prods.length - 1 ? vNum - dist : Math.round((weights[i] / wSum) * vNum);
                    updates[`productViews.${p.id}`] = increment(share);
                    dist += share;
                });
            }
            await updateDoc(doc(db, "users", boostUserId), updates);
            toast.success(`Injected ${vNum ? vNum.toLocaleString() + " views" : ""}${vNum && visNum ? " + " : ""}${visNum ? visNum.toLocaleString() + " visits" : ""} across ${prods.length} product(s)!`);
            setBoostViews(""); setBoostVisits("");
        } catch { toast.error("Update failed."); }
        finally { setBoosting(false); }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-10 h-10 border-2 border-white/[0.06] border-t-blue-500 rounded-full animate-spin" />
            <p className="text-sm text-zinc-500">Loading dashboard…</p>
        </div>
    );

    const totalRevenue   = orders.reduce((acc, o) => acc + (o.resellPrice || 0), 0);
    const totalWallets   = allUsers.reduce((acc, u) => acc + (u.walletBalance || 0), 0);
    const pendingOrders  = orders.filter(o => ["pending", "pending_payment", "payment_pending", "awaiting_seller_fulfillment", "awaiting_admin_confirmation"].includes(o.status)).length;
    const deliveredOrders = orders.filter(o => o.status === "delivered").length;
    const filteredOrders = orderSearch
        ? orders.filter(o =>
            (o.productName || "").toLowerCase().includes(orderSearch.toLowerCase()) ||
            (o.customerName || "").toLowerCase().includes(orderSearch.toLowerCase()) ||
            (o.status || "").toLowerCase().includes(orderSearch.toLowerCase())
          )
        : orders;
    const userOptions    = allUsers.map(u => ({ label: u.displayName || u.email || u.id, value: u.id }));
    const productOptions = allProducts.map(p => ({ label: p.name || p.productName || p.id, value: p.id }));

    const TABS = [
        { id: "overview", label: "Overview" },
        { id: "kyc",      label: "KYC Reviews", badge: kycRequests.length > 0 ? String(kycRequests.length) : undefined },
        { id: "orders",   label: "Orders" },
        { id: "tools",    label: "Admin Tools" },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-300">

            {/* ── Page header ── */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">Admin Dashboard</h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                    </p>
                </div>
                <button onClick={() => fetchData(true)} disabled={refreshing}
                    className="flex items-center gap-2 h-9 px-4 text-xs font-semibold text-zinc-400 hover:text-white bg-white/[0.04] border border-white/[0.07] rounded-xl hover:bg-white/[0.07] transition-all disabled:opacity-50">
                    <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
                    Refresh
                </button>
            </div>

            {/* ── KPI strip ── */}
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
                <KpiCard label="Total Users"    value={allUsers.length}                         icon={Users}       accent="blue"    sub="Registered accounts" />
                <KpiCard label="Total Revenue"  value={`$${totalRevenue.toLocaleString()}`}     icon={DollarSign}  accent="emerald" sub="All-time order volume" />
                <KpiCard label="Pending Orders" value={pendingOrders}                           icon={ShoppingBag} accent="amber"   sub="Need action" badge={pendingOrders > 0 ? "Action" : undefined} />
                <KpiCard label="KYC Queue"      value={kycRequests.length}                      icon={ShieldCheck} accent={kycRequests.length > 0 ? "amber" : "purple"} sub="Awaiting review" />
                <KpiCard label="Products"       value={allProducts.length}                      icon={Package}     accent="purple"  sub="In catalogue" />
            </div>

            {/* ── Tabs ── */}
            <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/[0.07] rounded-xl w-fit">
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
                        className={cn("relative flex items-center gap-2 px-4 h-8 text-sm font-medium rounded-lg transition-all",
                            tab === t.id ? "bg-white/[0.08] text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300")}>
                        {t.label}
                        {t.badge && (
                            <span className="flex items-center justify-center w-4 h-4 bg-amber-500 text-black text-[10px] font-bold rounded-full">{t.badge}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* ══ OVERVIEW ══ */}
            {tab === "overview" && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                    {/* Recent orders table */}
                    <div className="xl:col-span-2 bg-[#0d0d11] border border-white/[0.07] rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-white">Recent Orders</p>
                                <p className="text-xs text-zinc-500 mt-0.5">{orders.length} total</p>
                            </div>
                            <button onClick={() => setTab("orders")} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                                View all <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/[0.04]">
                                        {["Customer", "Product", "Amount", "Status"].map(h => (
                                            <th key={h} className="px-6 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.03]">
                                    {orders.slice(0, 7).length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-10 text-center text-xs text-zinc-600">No orders yet</td></tr>
                                    ) : orders.slice(0, 7).map(o => (
                                        <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.06] flex items-center justify-center shrink-0">
                                                        <UserCircle className="w-4 h-4 text-zinc-500" />
                                                    </div>
                                                    <span className="text-[13px] text-white font-medium">{o.customerName || "—"}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className="text-[13px] text-zinc-300 truncate max-w-[160px] block">{o.productName || "—"}</span>
                                            </td>
                                            <td className="px-6 py-3.5 whitespace-nowrap">
                                                <span className="text-[13px] font-semibold text-white">${(o.resellPrice || 0).toFixed(2)}</span>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <StatusBadge status={o.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right: health + wallets + kyc alert */}
                    <div className="space-y-4">
                        <div className="bg-[#0d0d11] border border-white/[0.07] rounded-2xl p-5 space-y-4">
                            <p className="text-sm font-bold text-white">Platform Health</p>
                            {[
                                { label: "Delivered", value: deliveredOrders, total: orders.length, color: "bg-emerald-500" },
                                { label: "In-Transit", value: pendingOrders, total: orders.length, color: "bg-amber-500" },
                                { label: "Resellers", value: allUsers.filter(u => u.role === "reseller").length, total: allUsers.length, color: "bg-blue-500" },
                            ].map((item, i) => {
                                const pct = item.total > 0 ? Math.round((item.value / item.total) * 100) : 0;
                                return (
                                    <div key={i} className="space-y-1.5">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-zinc-400 font-medium">{item.label}</span>
                                            <span className="text-white font-semibold">{item.value}<span className="text-zinc-600">/{item.total}</span></span>
                                        </div>
                                        <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                                            <div className={cn("h-full rounded-full transition-all", item.color)} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="bg-[#0d0d11] border border-white/[0.07] rounded-2xl p-5 space-y-1">
                            <p className="text-sm font-bold text-white mb-3">Wallet Summary</p>
                            {[
                                { label: "User Balances",    value: `$${totalWallets.toLocaleString()}`,                                                           color: "text-emerald-400" },
                                { label: "Pending Payouts",  value: `$${allUsers.reduce((a,u)=>a+(u.pendingPayout||0),0).toLocaleString()}`,                        color: "text-amber-400" },
                                { label: "Released Payouts", value: `$${allUsers.reduce((a,u)=>a+(u.payoutBalance||0),0).toLocaleString()}`,                        color: "text-blue-400" },
                            ].map((row, i) => (
                                <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                                    <span className="text-xs text-zinc-500">{row.label}</span>
                                    <span className={cn("text-sm font-bold", row.color)}>{row.value}</span>
                                </div>
                            ))}
                        </div>

                        {kycRequests.length > 0 && (
                            <button onClick={() => setTab("kyc")} className="w-full bg-amber-500/[0.07] border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3 hover:bg-amber-500/[0.12] transition-colors text-left">
                                <div className="w-9 h-9 bg-amber-500/15 border border-amber-500/25 rounded-xl flex items-center justify-center shrink-0">
                                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-amber-300">{kycRequests.length} KYC Pending</p>
                                    <p className="text-xs text-amber-600 mt-0.5">Click to review verifications</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-amber-500 shrink-0" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ══ KYC ══ */}
            {tab === "kyc" && (
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
                    <div className="xl:col-span-2 bg-[#0d0d11] border border-white/[0.07] rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/[0.06]">
                            <p className="text-sm font-bold text-white">Pending Verifications</p>
                            <p className="text-xs text-zinc-500 mt-0.5">{kycRequests.length} in queue</p>
                        </div>
                        <div className="divide-y divide-white/[0.04] max-h-[520px] overflow-y-auto">
                            {kycRequests.length === 0 ? (
                                <div className="py-16 flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <p className="text-sm font-medium text-zinc-300">All caught up</p>
                                    <p className="text-xs text-zinc-600">No pending KYC requests</p>
                                </div>
                            ) : kycRequests.map(k => (
                                <button key={k.id} onClick={() => setSelectedKyc(selectedKyc?.id === k.id ? null : k)}
                                    className={cn("w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors",
                                        selectedKyc?.id === k.id ? "bg-blue-500/[0.07] border-l-2 border-l-blue-500" : "hover:bg-white/[0.03] border-l-2 border-l-transparent")}>
                                    <div className="w-9 h-9 bg-white/[0.05] border border-white/[0.07] rounded-xl flex items-center justify-center shrink-0">
                                        <UserCircle className="w-5 h-5 text-zinc-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{k.displayName || k.email?.split("@")[0] || "Unknown"}</p>
                                        <p className="text-xs text-zinc-500 truncate">{k.email}</p>
                                    </div>
                                    <span className="shrink-0 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md text-[10px] font-semibold text-amber-400">Pending</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="xl:col-span-3">
                        {!selectedKyc ? (
                            <div className="h-full bg-[#0d0d11] border border-white/[0.07] rounded-2xl flex flex-col items-center justify-center gap-3 py-20">
                                <div className="w-12 h-12 bg-white/[0.04] border border-white/[0.07] rounded-2xl flex items-center justify-center">
                                    <ShieldCheck className="w-6 h-6 text-zinc-600" />
                                </div>
                                <p className="text-sm font-medium text-zinc-400">Select a request to review</p>
                                <p className="text-xs text-zinc-600">Click any item from the list</p>
                            </div>
                        ) : (
                            <div className="bg-[#0d0d11] border border-white/[0.07] rounded-2xl overflow-hidden">
                                <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-white">{selectedKyc.displayName || selectedKyc.email}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">{selectedKyc.email}</p>
                                    </div>
                                    <button onClick={() => setSelectedKyc(null)} className="text-xs text-zinc-500 hover:text-zinc-300 px-3 py-1.5 bg-white/[0.04] border border-white/[0.07] rounded-lg transition-colors">Close</button>
                                </div>
                                <div className="p-6 space-y-5">
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: "Full Name",  value: selectedKyc.identification?.fullName || selectedKyc.displayName || "—" },
                                            { label: "ID Number",  value: selectedKyc.identification?.idNumber || selectedKyc.id.slice(0, 12), mono: true },
                                            { label: "ID Type",    value: selectedKyc.identification?.idType || "—" },
                                            { label: "User Role",  value: selectedKyc.role || "—" },
                                        ].map((field, i) => (
                                            <div key={i} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-4">
                                                <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-1.5">{field.label}</p>
                                                <p className={cn("text-sm font-semibold text-white", field.mono && "font-mono text-xs")}>{field.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {(selectedKyc.identification?.documentImage || selectedKyc.kycDocUrl) ? (
                                        <div className="rounded-xl overflow-hidden border border-white/[0.07] aspect-video bg-zinc-950">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={selectedKyc.identification?.documentImage || selectedKyc.kycDocUrl} alt="KYC Document" className="w-full h-full object-contain" />
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-dashed border-white/[0.08] py-10 flex flex-col items-center gap-2">
                                            <ShieldCheck className="w-8 h-8 text-zinc-700" />
                                            <p className="text-xs text-zinc-600">No document attached</p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => handleRejectKyc(selectedKyc.id)} disabled={!!processingId}
                                            className="h-11 rounded-xl border border-red-500/25 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                                            {processingId === selectedKyc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                            Reject
                                        </button>
                                        <button onClick={() => handleApproveKyc(selectedKyc.id)} disabled={!!processingId}
                                            className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                                            {processingId === selectedKyc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                            Approve
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══ ORDERS ══ */}
            {tab === "orders" && (
                <div className="bg-[#0d0d11] border border-white/[0.07] rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-bold text-white">All Orders</p>
                            <p className="text-xs text-zinc-500 mt-0.5">{orders.length} total</p>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                            <input type="text" value={orderSearch} onChange={e => setOrderSearch(e.target.value)}
                                placeholder="Search orders…"
                                className="w-full h-9 pl-9 pr-3 bg-white/[0.04] border border-white/[0.07] rounded-xl text-[13px] text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/50 transition-all" />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/[0.04]">
                                    {["Order ID", "Customer", "Product", "Amount", "Profit", "Status", "Action"].map(h => (
                                        <th key={h} className="px-6 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {filteredOrders.length === 0 ? (
                                    <tr><td colSpan={7} className="px-6 py-12 text-center text-xs text-zinc-600">No orders found</td></tr>
                                ) : filteredOrders.map(o => (
                                    <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-3.5"><span className="text-[11px] text-zinc-600 font-mono">{o.id.slice(0, 8)}…</span></td>
                                        <td className="px-6 py-3.5 whitespace-nowrap">
                                            <p className="text-[13px] text-white font-medium">{o.customerName || "—"}</p>
                                            {o.customerCountry && <p className="text-[11px] text-zinc-600">{o.customerCountry}</p>}
                                        </td>
                                        <td className="px-6 py-3.5 max-w-[180px]">
                                            <span className="text-[13px] text-zinc-300 truncate block">{o.productName || "—"}</span>
                                        </td>
                                        <td className="px-6 py-3.5 whitespace-nowrap">
                                            <span className="text-[13px] font-semibold text-white">${(o.resellPrice || 0).toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-3.5 whitespace-nowrap">
                                            <span className="text-[13px] font-semibold text-emerald-400">+${(o.resellerProfit || 0).toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-3.5"><StatusBadge status={o.status} /></td>
                                        <td className="px-6 py-3.5 whitespace-nowrap">
                                            {["pending_payment", "payment_pending", "awaiting_admin_confirmation", "pending"].includes(o.status) ? (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleApproveOrderPayment(o)}
                                                        disabled={processingId === o.id}
                                                        className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-colors"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancelOrderPayment(o)}
                                                        disabled={processingId === o.id}
                                                        className="h-8 px-3 rounded-lg border border-red-500/25 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 text-red-300 text-xs font-bold transition-colors"
                                                    >
                                                        Void
                                                    </button>
                                                </div>
                                            ) : ["payment_failed", "void_no_payment"].includes(o.status) ? (
                                                <span className="text-xs text-red-400">Voided</span>
                                            ) : (
                                                <button
                                                    onClick={() => handleCancelOrderPayment(o)}
                                                    disabled={processingId === o.id || ["delivered", "cancelled", "void_no_payment"].includes(o.status)}
                                                    className="h-8 px-3 rounded-lg border border-white/[0.08] bg-white/[0.04] hover:border-red-500/25 hover:text-red-300 disabled:opacity-40 text-zinc-400 text-xs font-bold transition-colors"
                                                >
                                                    Void
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ══ TOOLS ══ */}
            {tab === "tools" && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

                    {/* Sales Simulator */}
                    <div className="bg-[#0d0d11] border border-white/[0.07] rounded-2xl overflow-hidden">
                        <div className="px-6 py-5 border-b border-white/[0.06]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Sales Simulator</p>
                                    <p className="text-xs text-zinc-500 mt-0.5">Inject simulated orders for a reseller account</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* User selector */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Reseller Account</label>
                                <SearchableSelect
                                    value={simUserId}
                                    onChange={v => {
                                        setSimUserId(v);
                                        const u = allUsers.find(u => u.id === v);
                                        setSimSelectedProducts((u?.storeProducts || []).map((p: any) => p.id));
                                    }}
                                    options={userOptions}
                                    placeholder="Search and select reseller…"
                                />
                                {simUserId && (() => { const u = allUsers.find(x => x.id === simUserId); return u ? (
                                    <p className="text-[11px] text-zinc-500 font-mono">{u.email}</p>
                                ) : null; })()}
                            </div>

                            {/* Product checkboxes */}
                            {simUserId && (() => {
                                const u = allUsers.find(x => x.id === simUserId);
                                const prods: any[] = u?.storeProducts || [];
                                return (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Select Products</label>
                                            <button type="button"
                                                onClick={() => setSimSelectedProducts(simSelectedProducts.length === prods.length ? [] : prods.map((p: any) => p.id))}
                                                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold transition-colors">
                                                {simSelectedProducts.length === prods.length ? "Deselect All" : "Select All"}
                                            </button>
                                        </div>
                                        {prods.length === 0 ? (
                                            <p className="text-xs text-zinc-600 py-3 text-center border border-dashed border-white/[0.06] rounded-xl">This reseller has no store products yet</p>
                                        ) : (
                                            <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                                                {prods.map((p: any, pi: number) => (
                                                    <label key={p.id ?? `prod-${pi}`} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.1] cursor-pointer transition-colors">
                                                        <input type="checkbox"
                                                            checked={simSelectedProducts.includes(p.id)}
                                                            onChange={e => {
                                                                if (e.target.checked) setSimSelectedProducts(prev => [...prev, p.id]);
                                                                else setSimSelectedProducts(prev => prev.filter(id => id !== p.id));
                                                            }}
                                                            className="accent-amber-500 shrink-0"
                                                        />
                                                        {p.image && <img src={p.image} alt="" className="w-8 h-8 rounded-md object-cover shrink-0" />}
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-medium text-white truncate">{p.name}</p>
                                                            <p className="text-[10px] text-zinc-500">${(p.resellPrice || p.price || 0).toLocaleString()} · cost ${(p.price || 0).toLocaleString()}</p>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Order Date</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { value: "today", label: "Today" },
                                        { value: "yesterday", label: "Yesterday" },
                                    ].map(option => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setSimOrderDate(option.value as "today" | "yesterday")}
                                            className={cn(
                                                "h-9 rounded-lg border text-xs font-bold transition-colors",
                                                simOrderDate === option.value
                                                    ? "border-amber-500 bg-amber-500 text-black"
                                                    : "border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-white"
                                            )}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Location rows */}
                            <div className="space-y-2.5">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Order Locations</label>
                                <div className="space-y-2">
                                    {simLocations.map((loc, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="flex-1 relative">
                                                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none" />
                                                <input value={loc.country} onChange={e => updateSimLocation(i, 'country', e.target.value)}
                                                    placeholder="Country (e.g. United States)"
                                                    className="w-full h-9 pl-7 pr-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white placeholder:text-zinc-600 outline-none focus:border-amber-500/40 transition-colors" />
                                            </div>
                                            <input type="number" value={loc.count} onChange={e => updateSimLocation(i, 'count', e.target.value)}
                                                placeholder="#"
                                                className="w-20 h-9 px-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white text-center placeholder:text-zinc-600 outline-none focus:border-amber-500/40 transition-colors" />
                                            {simLocations.length > 1 && (
                                                <button onClick={() => removeSimLocation(i)}
                                                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-rose-500/30 hover:text-rose-400 text-zinc-600 transition-colors shrink-0">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button onClick={addSimLocation} className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-white font-medium transition-colors">
                                    <Plus className="w-3.5 h-3.5" /> Add Location
                                </button>
                                <p className="text-[10px] text-zinc-600">
                                    Total: <span className="text-white font-semibold">{simLocations.reduce((s, l) => s + (Number(l.count) || 0), 0).toLocaleString()}</span> orders across <span className="text-white font-semibold">{simLocations.filter(l => l.country.trim()).length}</span> location(s) — each from a unique buyer
                                </p>
                            </div>

                            <button onClick={handleRunSimulator} disabled={runningSim}
                                className="w-full h-11 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-black text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                                {runningSim ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                                {runningSim ? "Simulating orders…" : "Run Simulation"}
                            </button>
                        </div>
                    </div>

                    {/* Store Booster */}
                    <div className="bg-[#0d0d11] border border-white/[0.07] rounded-2xl overflow-hidden">
                        <div className="px-6 py-5 border-b border-white/[0.06]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Store Booster</p>
                                    <p className="text-xs text-zinc-500 mt-0.5">Inject views and visits into a reseller&apos;s analytics</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Target Reseller</label>
                                <SearchableSelect value={boostUserId} onChange={setBoostUserId} options={userOptions} placeholder="Search and select user…" />
                                {boostUserId && (() => { const u = allUsers.find(x => x.id === boostUserId); return u ? (
                                    <p className="text-[11px] text-zinc-500 font-mono">{u.email}</p>
                                ) : null; })()}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Add Views</label>
                                    <input type="number" placeholder="e.g. 5,000" value={boostViews} onChange={e => setBoostViews(e.target.value)}
                                        className="w-full h-10 px-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-zinc-700 outline-none focus:border-blue-500/50 transition-all" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Add Visits</label>
                                    <input type="number" placeholder="e.g. 1,500" value={boostVisits} onChange={e => setBoostVisits(e.target.value)}
                                        className="w-full h-10 px-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-zinc-700 outline-none focus:border-blue-500/50 transition-all" />
                                </div>
                            </div>
                            {boostUserId && (boostViews || boostVisits) && (
                                <div className="flex items-center gap-3 px-4 py-3 bg-blue-500/[0.07] border border-blue-500/20 rounded-xl">
                                    <Eye className="w-4 h-4 text-blue-400 shrink-0" />
                                    <p className="text-xs text-blue-300">
                                        Will add {boostViews ? <strong>{Number(boostViews).toLocaleString()} views</strong> : null}
                                        {boostViews && boostVisits ? " and " : null}
                                        {boostVisits ? <strong>{Number(boostVisits).toLocaleString()} visits</strong> : null} to the selected store.
                                    </p>
                                </div>
                            )}
                            <button onClick={handleBoostViews} disabled={boosting}
                                className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-40 shadow-lg shadow-blue-500/20">
                                {boosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                {boosting ? "Applying…" : "Apply Boost"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

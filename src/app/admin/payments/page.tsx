"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import {
    ArrowDownLeft,
    ArrowUpRight,
    Clock3,
    CreditCard,
    ExternalLink,
    PackageCheck,
    RefreshCw,
    Search,
    Wallet,
} from "lucide-react";
import { db } from "@/lib/firebase/config";

type PaymentKind = "deposit" | "withdrawal" | "subscription" | "sale";
type PaymentRow = {
    id: string;
    kind: PaymentKind;
    title: string;
    email: string;
    name: string;
    amount: number;
    currency: string;
    method: string;
    status: string;
    createdAt: unknown;
    manageHref: string;
};

type FirestoreRecord = Record<string, unknown> & { id: string };

const pendingStatuses = new Set([
    "pending",
    "pending_payment",
    "payment_pending",
    "auth_in_progress",
    "submitted",
    "awaiting_seller_fulfillment",
    "shipped",
]);

function asText(value: unknown, fallback = "") {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asNumber(value: unknown) {
    const parsed = Number(value || 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

function timestampMs(value: unknown) {
    if (value && typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") {
        return value.toMillis();
    }
    const parsed = Date.parse(String(value || ""));
    return Number.isFinite(parsed) ? parsed : 0;
}

function displayTime(value: unknown) {
    const time = timestampMs(value);
    return time ? new Date(time).toLocaleString() : "Just now";
}

function money(amount: number, currency: string) {
    try {
        return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
    } catch {
        return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    }
}

const kindMeta = {
    deposit: { label: "Deposit", icon: ArrowDownLeft, color: "bg-emerald-50 text-emerald-700" },
    withdrawal: { label: "Withdrawal", icon: ArrowUpRight, color: "bg-amber-50 text-amber-700" },
    subscription: { label: "Plan payment", icon: CreditCard, color: "bg-sky-50 text-sky-700" },
    sale: { label: "Sale", icon: PackageCheck, color: "bg-violet-50 text-violet-700" },
};

export default function AdminPaymentsPage() {
    const [transactions, setTransactions] = useState<FirestoreRecord[]>([]);
    const [payouts, setPayouts] = useState<FirestoreRecord[]>([]);
    const [subscriptions, setSubscriptions] = useState<FirestoreRecord[]>([]);
    const [orders, setOrders] = useState<FirestoreRecord[]>([]);
    const [users, setUsers] = useState<Record<string, FirestoreRecord>>({});
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | PaymentKind>("all");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribers = [
            onSnapshot(query(collection(db, "transactions"), orderBy("createdAt", "desc"), limit(250)), snapshot => {
                setTransactions(snapshot.docs.map(item => ({ id: item.id, ...item.data() })));
                setLoading(false);
            }),
            onSnapshot(query(collection(db, "payouts"), orderBy("createdAt", "desc"), limit(150)), snapshot => {
                setPayouts(snapshot.docs.map(item => ({ id: item.id, ...item.data() })));
            }),
            onSnapshot(query(collection(db, "subscription_requests"), orderBy("createdAt", "desc"), limit(150)), snapshot => {
                setSubscriptions(snapshot.docs.map(item => ({ id: item.id, ...item.data() })));
            }),
            onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(250)), snapshot => {
                setOrders(snapshot.docs.map(item => ({ id: item.id, ...item.data() })));
            }),
            onSnapshot(collection(db, "users"), snapshot => {
                setUsers(Object.fromEntries(snapshot.docs.map(item => [item.id, { id: item.id, ...item.data() }])));
            }),
        ];
        return () => unsubscribers.forEach(unsubscribe => unsubscribe());
    }, []);

    const rows = useMemo<PaymentRow[]>(() => {
        const depositRows = transactions
            .filter(item => ["deposit", "ad_deposit", "card_purchase"].includes(asText(item.type)) && pendingStatuses.has(asText(item.status).toLowerCase()))
            .map(item => {
                const user = users[asText(item.userId)] || {};
                return {
                    id: `transaction-${item.id}`,
                    kind: "deposit" as const,
                    title: asText(item.type) === "ad_deposit" ? "Ad wallet deposit" : asText(item.type) === "card_purchase" ? "Card payment" : "Wallet deposit",
                    email: asText(item.customerEmail || item.userEmail || user.email, "No email"),
                    name: asText(item.customerName || user.displayName || user.fullName, "User"),
                    amount: asNumber(item.amount),
                    currency: asText(item.currencyCode, "USD"),
                    method: asText(item.methodLabel || item.method || item.asset, "Payment"),
                    status: asText(item.status, "pending"),
                    createdAt: item.createdAt,
                    manageHref: asText(item.type) === "card_purchase" ? "/admin/card-payments" : "/admin/users",
                };
            });

        const withdrawalRows = payouts
            .filter(item => pendingStatuses.has(asText(item.status).toLowerCase()))
            .map(item => {
                const user = users[asText(item.userId)] || {};
                return {
                    id: `payout-${item.id}`,
                    kind: "withdrawal" as const,
                    title: "Withdrawal request",
                    email: asText(item.userEmail || user.email, "No email"),
                    name: asText(item.userName || user.displayName || user.fullName, "Merchant"),
                    amount: asNumber(item.amountLocal || item.amount),
                    currency: asText(item.currencyCode, "USD"),
                    method: asText(item.methodLabel || item.method, "Payout"),
                    status: asText(item.status, "pending"),
                    createdAt: item.createdAt,
                    manageHref: "/admin/escrow",
                };
            });

        const subscriptionRows = subscriptions
            .filter(item => pendingStatuses.has(asText(item.status).toLowerCase()))
            .map(item => {
                const user = users[asText(item.userId)] || {};
                return {
                    id: `subscription-${item.id}`,
                    kind: "subscription" as const,
                    title: asText(item.planName, "Subscription payment"),
                    email: asText(item.userEmail || user.email, "No email"),
                    name: asText(item.userName || user.displayName || user.fullName, "Merchant"),
                    amount: asNumber(item.amount),
                    currency: asText(item.currencyCode, "USD"),
                    method: asText(item.asset || item.method, "Payment"),
                    status: asText(item.status, "pending"),
                    createdAt: item.createdAt,
                    manageHref: "/admin/escrow",
                };
            });

        const saleRows = orders
            .filter(item => pendingStatuses.has(asText(item.paymentStatus || item.status).toLowerCase()))
            .map(item => ({
                id: `order-${item.id}`,
                kind: "sale" as const,
                title: asText(item.productName, "Customer order"),
                email: asText(item.customerEmail, "No email"),
                name: asText(item.customerName, "Customer"),
                amount: asNumber(item.resellPrice || item.totalAmount || item.amount),
                currency: asText(item.currencyCode, "USD"),
                method: asText(item.paymentType, "Order payment"),
                status: asText(item.paymentStatus || item.status, "pending"),
                createdAt: item.createdAt,
                manageHref: "/admin/escrow",
            }));

        return [...depositRows, ...withdrawalRows, ...subscriptionRows, ...saleRows]
            .sort((a, b) => timestampMs(b.createdAt) - timestampMs(a.createdAt));
    }, [orders, payouts, subscriptions, transactions, users]);

    const visibleRows = useMemo(() => {
        const needle = search.trim().toLowerCase();
        return rows.filter(row => {
            if (filter !== "all" && row.kind !== filter) return false;
            if (!needle) return true;
            return [row.email, row.name, row.title, row.method, row.status]
                .some(value => value.toLowerCase().includes(needle));
        });
    }, [filter, rows, search]);

    const totals = useMemo(() => Object.fromEntries(
        (["deposit", "withdrawal", "subscription", "sale"] as PaymentKind[]).map(kind => [
            kind,
            rows.filter(row => row.kind === kind),
        ])
    ) as Record<PaymentKind, PaymentRow[]>, [rows]);

    return (
        <div className="mx-auto max-w-7xl space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sky-700"><Wallet className="h-4 w-4" /><span className="text-xs font-bold uppercase">Finance queue</span></div>
                    <h1 className="mt-1 text-2xl font-bold text-slate-950">Payments</h1>
                    <p className="mt-1 text-sm text-slate-500">Pending deposits, withdrawals, plan payments, and sales in one live view.</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><RefreshCw className="h-3.5 w-3.5 text-lime-600" />Updates automatically</div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {(["deposit", "withdrawal", "subscription", "sale"] as PaymentKind[]).map(kind => {
                    const meta = kindMeta[kind];
                    const Icon = meta.icon;
                    const items = totals[kind];
                    return (
                        <button key={kind} onClick={() => setFilter(filter === kind ? "all" : kind)} className={`rounded-md border p-4 text-left transition-colors ${filter === kind ? "border-sky-400 bg-sky-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                            <div className="flex items-center justify-between"><span className={`flex h-8 w-8 items-center justify-center rounded-md ${meta.color}`}><Icon className="h-4 w-4" /></span><span className="text-2xl font-bold text-slate-950">{items.length}</span></div>
                            <p className="mt-3 text-sm font-bold text-slate-800">{meta.label}s</p>
                            <p className="mt-0.5 text-xs text-slate-500">{money(items.reduce((sum, item) => sum + item.amount, 0), "USD")} pending</p>
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white px-3"><Search className="h-4 w-4 text-slate-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search email, user, method, or status" className="h-10 w-full bg-transparent text-sm outline-none" /></label>
                <select value={filter} onChange={event => setFilter(event.target.value as "all" | PaymentKind)} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none">
                    <option value="all">All pending payments</option><option value="deposit">Deposits</option><option value="withdrawal">Withdrawals</option><option value="subscription">Plan payments</option><option value="sale">Sales</option>
                </select>
            </div>

            <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
                <div className="hidden grid-cols-[1.35fr_1fr_0.8fr_0.8fr_0.8fr_auto] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase text-slate-500 md:grid"><span>Account</span><span>Payment</span><span>Amount</span><span>Method</span><span>Received</span><span>Action</span></div>
                {loading ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-sm font-semibold text-slate-500"><RefreshCw className="h-4 w-4 animate-spin" />Loading payments</div>
                ) : visibleRows.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-slate-400"><Clock3 className="mb-3 h-7 w-7" /><p className="text-sm font-semibold">No matching pending payments</p></div>
                ) : visibleRows.map(row => {
                    const meta = kindMeta[row.kind];
                    const Icon = meta.icon;
                    return (
                        <div key={row.id} className="grid gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 md:grid-cols-[1.35fr_1fr_0.8fr_0.8fr_0.8fr_auto] md:items-center">
                            <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{row.email}</p><p className="truncate text-xs text-slate-500">{row.name}</p></div>
                            <div className="flex min-w-0 items-center gap-2"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${meta.color}`}><Icon className="h-3.5 w-3.5" /></span><div className="min-w-0"><p className="truncate text-xs font-bold text-slate-800">{row.title}</p><p className="capitalize text-[11px] text-slate-500">{row.status.replaceAll("_", " ")}</p></div></div>
                            <p className="text-sm font-bold text-slate-950">{money(row.amount, row.currency)}</p>
                            <p className="truncate text-xs font-semibold text-slate-600">{row.method}</p>
                            <time className="text-xs text-slate-500">{displayTime(row.createdAt)}</time>
                            <Link href={row.manageHref} className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-slate-950 px-3 text-xs font-bold text-white hover:bg-sky-700">Manage <ExternalLink className="h-3 w-3" /></Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

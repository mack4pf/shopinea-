"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard, Wallet, Package, ShoppingCart, BarChart3,
    Users, Megaphone, UserCircle, CreditCard, Bell, Settings,
    HelpCircle, LogOut, Menu, X, User as UserIcon, Search,
    ChevronRight, History, MessageSquare, Zap, Crown, AlertTriangle, Home, Heart, Headphones
} from "lucide-react";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getCurrencySymbol } from "@/lib/currency";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const getNavItems = (role?: string) => {
    if (role === "buyer") {
        return [
            { name: "Marketplace", href: "/marketplace", icon: LayoutDashboard },
            { name: "My Orders", href: "/buyer-orders", icon: ShoppingCart },
            { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
            { name: "Support", href: "/dashboard/support", icon: HelpCircle },
        ];
    }
    return [
        { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
        { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
        { name: "Products", href: "/dashboard/products", icon: Package },
        { name: "Customers", href: "/dashboard/customers", icon: UserCircle },
        { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
        { name: "History", href: "/dashboard/history", icon: History },
        { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
        { name: "Plans", href: "/dashboard/subscription", icon: Crown },
        { name: "Ads", href: "/dashboard/ads", icon: Megaphone },
        { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
        { name: "Referrals", href: "/dashboard/referrals", icon: Users },
        { name: "Support", href: "/dashboard/support", icon: HelpCircle },
        { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ];
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    setUser(firebaseUser);
                    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setUserData(data);

                        if (firebaseUser.email === "mackiyeritufu@gmail.com" && !data.isAdmin) {
                            const { updateDoc, doc } = await import("firebase/firestore");
                            await updateDoc(doc(db, "users", firebaseUser.uid), { isAdmin: true });
                            setUserData({ ...data, isAdmin: true });
                        }
                    }
                } catch (error) {
                    console.error("Dashboard user load failed:", error);
                    setUserData({});
                }
            } else {
                setUser(null);
                setUserData(null);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (userData?.role !== "buyer") return;
        const buyerAllowedPaths = ["/buyer-orders", "/dashboard/messages", "/dashboard/support"];
        const isAllowed = buyerAllowedPaths.some(path => pathname === path || pathname.startsWith(`${path}/`));
        if (pathname === "/dashboard" || (pathname.startsWith("/dashboard") && !isAllowed)) {
            router.replace("/buyer-orders");
        }
    }, [pathname, router, userData?.role]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const currencySymbol = getCurrencySymbol(userData?.currency);

    if (userData?.role === "buyer" || pathname === "/buyer-orders") {
        return (
            <div className="dashboard-shell min-h-screen bg-slate-50 text-slate-950">
                <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                        <Link href="/marketplace" className="flex items-center gap-2.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/images/sholinealogo2.png" alt="shopinea" className="h-9 w-9 object-contain" />
                            <span className="text-base font-black tracking-tight text-slate-950">shopinea</span>
                        </Link>

                        <div className="hidden flex-1 items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 md:flex max-w-xl">
                            <Search className="h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search products, stores, or orders"
                                className="ml-2 w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") router.push("/marketplace");
                                }}
                            />
                        </div>

                        <nav className="hidden items-center gap-1 md:flex">
                            {[
                                { label: "Shop", href: "/marketplace", icon: Home },
                                { label: "Orders", href: "/buyer-orders", icon: ShoppingCart },
                                { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
                                { label: "Support", href: "/dashboard/support", icon: Headphones },
                            ].map(item => {
                                const active = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold transition-colors",
                                            active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                                        )}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="flex items-center gap-2">
                            <ThemeToggle showLabel />
                            <button className="hidden rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 sm:block">
                                <Heart className="h-4 w-4" />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="rounded-full border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
                            >
                                Sign out
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
                        {[
                            { label: "Shop", href: "/marketplace" },
                            { label: "Orders", href: "/buyer-orders" },
                            { label: "Messages", href: "/dashboard/messages" },
                            { label: "Support", href: "/dashboard/support" },
                        ].map(item => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-black",
                                    pathname === item.href ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </header>
                <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <div className="dashboard-shell min-h-screen bg-slate-50 text-slate-950 dark:bg-[#0b0f1a] dark:text-white flex">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col shadow-xl shadow-slate-900/5 dark:bg-[#0f172a] dark:border-slate-800/80 dark:shadow-none",
                    "transform transition-transform duration-300 lg:translate-x-0",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Logo */}
                <div className="h-16 flex items-center px-5 border-b border-slate-200 bg-gradient-to-r from-lime-50 to-sky-50 dark:border-slate-800/80 dark:bg-none">
                    <Link href="/" className="flex items-center gap-3.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/sholinealogo2.png" alt="shopinea" className="w-9 h-9 object-contain" />
                        <span className="text-[16px] font-extrabold text-slate-950 tracking-tight dark:text-white">shopinea</span>
                    </Link>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 no-scrollbar">
                    <p className="px-3 py-2 text-[10px] tracking-[0.2em] font-bold text-slate-500 uppercase dark:text-slate-400">Workspace</p>
                    <div className="space-y-1">
                        {getNavItems(userData?.role).map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => { if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors",
                                        isActive
                                            ? "bg-sky-600 text-white shadow-lg shadow-sky-600/15 dark:bg-emerald-500/15 dark:text-emerald-200 dark:shadow-none"
                                            : "text-slate-600 hover:text-slate-950 hover:bg-lime-100/70 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/70"
                                    )}
                                >
                                    <item.icon className={cn("w-[18px] h-[18px]", isActive ? "text-white dark:text-emerald-300" : "text-slate-500")} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-800/80">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors dark:text-slate-400 dark:hover:text-rose-200 dark:hover:bg-rose-500/20"
                    >
                        <LogOut className="w-[18px] h-[18px]" />
                        Log out
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col lg:ml-72">
                {/* Top Bar */}
                <header className="h-16 bg-white/90 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 dark:bg-[#0b0f1a]/95 dark:border-white/[0.06]">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors dark:text-white dark:hover:bg-white/[0.06]"
                        >
                            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>

                        <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 w-80 group focus-within:border-sky-400 transition-colors dark:bg-white/[0.04] dark:border-white/[0.08] dark:focus-within:border-blue-500/40">
                            <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search orders, products, customers..."
                                className="bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400 w-full dark:text-zinc-200 dark:placeholder:text-zinc-600"
                            />
                        </div>

                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/sholinealogo2.png" alt="shopinea" className="md:hidden w-7 h-7 object-contain" />
                        <span className="md:hidden text-sm font-extrabold text-slate-950 dark:text-white">shopinea</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <ThemeToggle showLabel />
                        {/* Balance chip - desktop only */}
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-200 shadow-sm dark:bg-white/[0.04] dark:border-white/[0.08] dark:shadow-none">
                            <Wallet className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-semibold text-slate-950 dark:text-white">{currencySymbol}{userData?.walletBalance?.toLocaleString() || "0"}</span>
                        </div>

                        <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors dark:hover:bg-white/[0.06]">
                            <Bell className="w-5 h-5 dark:text-zinc-400" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
                        </button>

                        <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-white/[0.08]">
                            <div className="hidden xl:block text-right">
                                <p className="text-sm font-semibold text-slate-950 leading-none dark:text-white">{userData?.displayName || "User"}</p>
                                <p className="text-xs text-slate-500 mt-0.5 dark:text-zinc-500">{userData?.storeName || "My Store"}</p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-sky-600 border border-sky-500 flex items-center justify-center text-sm font-semibold text-white dark:bg-white/[0.1] dark:border-white/[0.12]">
                                {userData?.displayName?.[0] || <UserIcon className="w-4 h-4" />}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto no-scrollbar">
                    <div className="dashboard-content p-4 md:p-8 max-w-[1400px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

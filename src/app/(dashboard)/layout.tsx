"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard, Wallet, Package, ShoppingCart, BarChart3,
    Users, Megaphone, UserCircle, CreditCard, Bell, Settings,
    HelpCircle, LogOut, Menu, X, User as UserIcon, Search,
    ChevronRight, History, MessageSquare, Zap, Crown, AlertTriangle, Home, Heart, Headphones
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { UpgradeModal } from "@/components/modals/UpgradeModal";
import { cn } from "@/lib/utils";

const getNavItems = (role?: string) => {
    if (role === "buyer") {
        return [
            { name: "Marketplace", href: "/", icon: LayoutDashboard },
            { name: "My Orders", href: "/buyer-orders", icon: ShoppingCart },
            { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
            { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
            { name: "Support", href: "/dashboard/support", icon: HelpCircle },
            { name: "Settings", href: "/dashboard/settings", icon: Settings },
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
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const router = useRouter();
    const pathnameRef = useRef(pathname);
    useEffect(() => { pathnameRef.current = pathname; }, [pathname]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setUserData(data);

                    const sessionDismissed = sessionStorage.getItem("upgrade_modal_viewed");
                    if (!data.plan && !sessionDismissed && pathname === "/dashboard") {
                        const timer = setTimeout(() => {
                            // Only show if user is still on /dashboard when timer fires
                            if (pathnameRef.current === "/dashboard") {
                                setShowUpgradeModal(true);
                                sessionStorage.setItem("upgrade_modal_viewed", "true");
                            }
                        }, 2000);
                        return () => clearTimeout(timer);
                    }

                    if (firebaseUser.email === "mackiyeritufu@gmail.com" && !data.isAdmin) {
                        const { updateDoc, doc } = await import("firebase/firestore");
                        await updateDoc(doc(db, "users", firebaseUser.uid), { isAdmin: true });
                        setUserData({ ...data, isAdmin: true });
                    }
                }
            } else {
                setUser(null);
                setUserData(null);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const getCurrencySymbol = (code: string = "USD") => {
        switch (code) {
            case "EUR": return "€";
            case "GBP": return "£";
            case "NGN": return "₦";
            default: return "$";
        }
    };

    const currencySymbol = getCurrencySymbol(userData?.currency);

    if (userData?.role === "buyer") {
        return (
            <div className="min-h-screen bg-slate-50 text-slate-950">
                <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                        <Link href="/" className="flex items-center gap-2.5">
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
                                    if (event.key === "Enter") router.push("/");
                                }}
                            />
                        </div>

                        <nav className="hidden items-center gap-1 md:flex">
                            {[
                                { label: "Shop", href: "/", icon: Home },
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
                            { label: "Shop", href: "/" },
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
        <div className="min-h-screen bg-[#0b0f1a] text-white flex">
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
                    "fixed inset-y-0 left-0 z-50 w-72 bg-[#0f172a] border-r border-slate-800/80 flex flex-col",
                    "transform transition-transform duration-300 lg:translate-x-0",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Logo */}
                <div className="h-16 flex items-center px-5 border-b border-slate-800/80">
                    <Link href="/" className="flex items-center gap-3.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/sholinealogo2.png" alt="shopinea" className="w-9 h-9 object-contain" />
                        <span className="text-[16px] font-extrabold text-white tracking-tight">shopinea</span>
                    </Link>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 no-scrollbar">
                    <p className="px-3 py-2 text-[10px] tracking-[0.2em] font-bold text-slate-400 uppercase">Workspace</p>
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
                                            ? "bg-emerald-500/15 text-emerald-200"
                                            : "text-slate-300 hover:text-white hover:bg-slate-800/70"
                                    )}
                                >
                                    <item.icon className={cn("w-[18px] h-[18px]", isActive ? "text-emerald-300" : "text-slate-500")} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-slate-800/80">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-400 hover:text-rose-200 hover:bg-rose-500/20 transition-colors"
                    >
                        <LogOut className="w-[18px] h-[18px]" />
                        Log out
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col lg:ml-72">
                {/* Top Bar */}
                <header className="h-16 bg-[#0b0f1a]/95 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="lg:hidden p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
                        >
                            {isSidebarOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
                        </button>

                        <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-white/[0.04] rounded-xl border border-white/[0.08] w-80 group focus-within:border-blue-500/40 transition-colors">
                            <Search className="w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search orders, products, customers..."
                                className="bg-transparent border-none outline-none text-sm text-zinc-200 placeholder:text-zinc-600 w-full"
                            />
                        </div>

                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/sholinealogo2.png" alt="shopinea" className="md:hidden w-7 h-7 object-contain" />
                        <span className="md:hidden text-sm font-extrabold text-white">shopinea</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Balance chip — desktop only */}
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] rounded-xl border border-white/[0.08]">
                            <Wallet className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-semibold text-white">{currencySymbol}{userData?.walletBalance?.toLocaleString() || "0"}</span>
                        </div>

                        <button className="relative p-2 rounded-lg hover:bg-white/[0.06] transition-colors">
                            <Bell className="w-5 h-5 text-zinc-400" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
                        </button>

                        <div className="flex items-center gap-3 pl-3 border-l border-white/[0.08]">
                            <div className="hidden xl:block text-right">
                                <p className="text-sm font-semibold text-white leading-none">{userData?.displayName || "User"}</p>
                                <p className="text-xs text-zinc-500 mt-0.5">{userData?.storeName || "My Store"}</p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-white/[0.1] border border-white/[0.12] flex items-center justify-center text-sm font-semibold text-white">
                                {userData?.displayName?.[0] || <UserIcon className="w-4 h-4" />}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto no-scrollbar">
                    <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>

            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
            />
        </div>
    );
}

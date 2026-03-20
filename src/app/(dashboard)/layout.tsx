"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    Wallet,
    Package,
    ShoppingCart,
    BarChart3,
    Users,
    Megaphone,
    UserCircle,
    CreditCard,
    Bell,
    Settings,
    HelpCircle,
    LogOut,
    Menu,
    X,
    User as UserIcon,
    Search,
    ChevronRight,
    History,
    MessageSquare,
    Zap,
    Crown,
    AlertTriangle
} from "lucide-react";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { UpgradeModal } from "@/components/modals/UpgradeModal";

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
        { name: "Home", href: "/dashboard", icon: LayoutDashboard },
        { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
        { name: "Products", href: "/dashboard/products", icon: Package },
        { name: "Customers", href: "/dashboard/customers", icon: UserCircle },
        { name: "Content & Messages", href: "/dashboard/messages", icon: MessageSquare },
        { name: "History", href: "/dashboard/history", icon: History },
        { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
        { name: "Venture Tier", href: "/dashboard/subscription", icon: Crown },
        { name: "Marketing & Ads", href: "/dashboard/ads", icon: Megaphone },
        { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
        { name: "Referrals", href: "/dashboard/referrals", icon: Users },
        { name: "Support", href: "/dashboard/support", icon: HelpCircle },
        { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ];
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setUserData(data);

                    // Check for plan and show modal
                    const sessionDismissed = sessionStorage.getItem("upgrade_modal_viewed");
                    if (!data.plan && !sessionDismissed && pathname === "/dashboard") {
                        setTimeout(() => {
                            setShowUpgradeModal(true);
                            sessionStorage.setItem("upgrade_modal_viewed", "true");
                        }, 2000);
                    }

                    // Auto-upgrade mackiyeritufu@gmail.com to Admin
                    if (firebaseUser.email === "mackiyeritufu@gmail.com" && !data.isAdmin) {
                        const { updateDoc, doc } = await import("firebase/firestore");
                        await updateDoc(doc(db, "users", firebaseUser.uid), {
                            isAdmin: true
                        });
                        setUserData({ ...data, isAdmin: true });
                        console.log("Admin privileges granted to mackiyeritufu@gmail.com");
                    }
                }
            } else {
                setUser(null);
                setUserData(null);
            }
        });
        return () => unsubscribe();
    }, []);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex overflow-hidden font-sans">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md lg:hidden transition-opacity duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950 border-r border-zinc-900/50 px-4 py-8
                    transform transition-all duration-500 ease-in-out lg:translate-x-0 
                    lg:h-screen shadow-[20px_0_40px_rgba(0,0,0,0.3)]
                    ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
                `}
            >
                <div className="h-full flex flex-col space-y-10">
                    {/* Elite Logo Section */}
                    <div className="px-4">
                        <Link href="/" className="flex items-center gap-4 group">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-blue-500/20 group-hover:rotate-6 transition-all duration-500 border border-white/20">
                                <span className="text-white font-black text-2xl tracking-tighter italic">S</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-black tracking-tighter text-white italic leading-tight group-hover:tracking-normal transition-all duration-500">
                                    SHOPLINEA
                                </span>
                                <div className="flex items-center gap-1.5 leading-none mt-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em] italic">
                                        MERCHANT_PRO
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Protocol Navigation */}
                    <nav className="flex-1 overflow-y-auto px-2 space-y-2 custom-scrollbar no-scrollbar">
                        <div className="mb-6 px-4">
                            <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.4em] italic leading-none">Command Center</p>
                        </div>
                        {getNavItems(userData?.role).map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => {
                                        if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                    }}
                                    className={`
                                        flex items-center gap-4 px-5 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all relative group/item italic
                                        ${isActive
                                            ? "bg-white text-black shadow-2xl shadow-white/5 border-b-4 border-zinc-300"
                                            : "text-zinc-600 hover:bg-zinc-900/50 hover:text-white border-b-4 border-transparent hover:border-zinc-800"}
                                    `}
                                >
                                    <item.icon className={`w-5 h-5 transition-all duration-500 ${isActive ? "text-black scale-110" : "text-zinc-700 group-hover/item:text-blue-500 group-hover/item:scale-125 group-hover/item:rotate-12"}`} />
                                    <span className="flex-1">{item.name}</span>
                                    {isActive && (
                                        <div className="w-1.5 h-1.5 bg-black rounded-full shadow-2xl" />
                                    )}
                                    {!isActive && (
                                        <div className="w-1 h-1 bg-zinc-800 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Sidebar Auth Footer */}
                    <div className="px-2 pt-6 border-t border-zinc-900/50">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-4 px-6 py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest text-zinc-600 hover:bg-rose-500/5 hover:text-rose-500 transition-all group/logout italic border border-transparent hover:border-rose-500/20 shadow-2xl"
                        >
                            <LogOut className="w-5 h-5 transition-all duration-500 group-hover/logout:-translate-x-1" />
                            <span>System Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:ml-72">
                {/* Header */}
                <header className="h-24 bg-zinc-950/50 backdrop-blur-3xl border-b border-zinc-900/50 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-40 outline outline-1 outline-white/[0.02]">
                    <div className="flex items-center gap-8">
                        <button
                            onClick={toggleSidebar}
                            className="lg:hidden p-3 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-all active:scale-90"
                        >
                            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>

                        <div className="hidden lg:flex items-center gap-4 px-6 py-3 bg-zinc-950/50 rounded-[1.8rem] border border-zinc-900 w-96 shadow-inner group/search focus-within:border-blue-500/50 transition-all duration-500">
                            <Search className="w-5 h-5 text-zinc-700 group-focus-within/search:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="ACCESS_NODE_SEARCH..."
                                className="bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase tracking-[0.2em] w-full placeholder:text-zinc-800 text-white italic"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden xl:flex items-center gap-4">
                            {/* Main Wallet Node */}
                            <div className="flex items-center gap-4 px-6 py-3 bg-zinc-950 border border-zinc-900 rounded-[1.5rem] shadow-2xl relative overflow-hidden group/wallet">
                                <div className="absolute inset-0 bg-blue-500/[0.03] pointer-events-none" />
                                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 group-hover/wallet:scale-110 transition-transform">
                                    <Wallet className="w-5 h-5 text-blue-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase text-zinc-600 tracking-[0.2em] leading-none mb-1.5 italic">Protocol_Capital</span>
                                    <span className="text-lg font-black text-white italic tracking-tighter leading-none">
                                        {currencySymbol}{userData?.walletBalance?.toLocaleString() || "0.00"}
                                    </span>
                                </div>
                            </div>

                            {/* Ad Wallet Node */}
                            <div className="flex items-center gap-4 px-6 py-3 bg-zinc-950 border border-zinc-900 rounded-[1.5rem] shadow-2xl relative overflow-hidden group/ads">
                                <div className="absolute inset-0 bg-emerald-500/[0.03] pointer-events-none" />
                                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 group-hover/ads:scale-110 transition-transform">
                                    <Zap className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase text-zinc-600 tracking-[0.2em] leading-none mb-1.5 italic">Marketing_Fuel</span>
                                    <span className="text-lg font-black text-white italic tracking-tighter leading-none">
                                        {currencySymbol}{userData?.adWalletBalance?.toLocaleString() || "0.00"}
                                    </span>
                                </div>
                            </div>

                            {/* Payout Node */}
                            {(userData?.payoutBalance > 0 || userData?.pendingPayout > 0) && (
                                <div className="flex items-center gap-4 px-6 py-3 bg-zinc-950 border border-zinc-900 rounded-[1.5rem] shadow-2xl relative overflow-hidden group/yield">
                                    <div className="absolute inset-0 bg-amber-500/[0.03] pointer-events-none" />
                                    <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20 group-hover/yield:scale-110 transition-transform">
                                        <BarChart3 className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase text-zinc-600 tracking-[0.2em] leading-none mb-1.5 italic text-amber-500/60 font-black">Merchant_Yield</span>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-lg font-black text-white italic tracking-tighter leading-none">
                                                {currencySymbol}{(userData?.payoutBalance || 0).toLocaleString()}
                                            </span>
                                            {userData?.pendingPayout > 0 && (
                                                <span className="text-[9px] font-black text-amber-500/40 uppercase italic tracking-tighter">
                                                    [{currencySymbol}{(userData?.pendingPayout || 0).toLocaleString()} Locked]
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 hover:bg-zinc-900 transition-all relative group shadow-2xl">
                            <Bell className="w-6 h-6 text-zinc-600 group-hover:text-blue-500 transition-colors" />
                            <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-zinc-950 shadow-[0_0_10px_rgba(37,99,235,0.5)]"></span>
                        </button>

                        <div className="flex items-center gap-6 pl-6 border-l border-zinc-900">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-black text-white italic uppercase tracking-tighter">{userData?.displayName || "Operator"}</p>
                                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] italic leading-none mt-1">{userData?.storeName || "Root_Node"}</p>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-900 p-1 shadow-2xl group cursor-pointer hover:border-blue-500/50 transition-all duration-500 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 pointer-events-none" />
                                <div className="w-full h-full rounded-[0.8rem] bg-zinc-900 flex items-center justify-center text-white font-black text-xl italic border border-white/5">
                                    {userData?.displayName?.[0] || <UserIcon className="w-7 h-7" />}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto bg-zinc-950 custom-scrollbar no-scrollbar">
                    <div className="p-6 lg:p-12 max-w-[1700px] mx-auto">
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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    Shield, 
    LayoutDashboard, 
    ShoppingCart, 
    Package, 
    Users, 
    Settings, 
    LogOut,
    ShieldCheck,
    Megaphone,
    Wallet,
    TrendingUp
} from "lucide-react";

const adminNav = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "User Matrix", href: "/admin/users", icon: Users },
    { name: "Escrow Ops", href: "/admin/escrow", icon: ShieldCheck },
    { name: "Ad Command", href: "/admin/ads", icon: Megaphone },
    { name: "Fleet Logistics", href: "/admin/products", icon: Package },
    { name: "Gateways", href: "/admin/gateways", icon: Wallet },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex">
            {/* Admin Sidebar */}
            <aside className="w-64 border-r border-zinc-900 bg-zinc-950 flex flex-col hidden lg:flex">
                <div className="p-6 border-b border-zinc-900">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-xl">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-black tracking-tight text-lg">Admin Pro</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 mt-4">
                    {adminNav.map((item) => {
                        const active = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all ${
                                    active ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-zinc-500 hover:text-white"
                                }`}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-zinc-900">
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-white text-sm font-bold">
                        <LogOut className="w-5 h-5" />
                        Back to Site
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-4 lg:hidden bg-zinc-950 border-b border-zinc-800 flex justify-between items-center">
                     <span className="font-black">Admin Panel</span>
                     <div className="flex gap-4 text-xs font-black text-zinc-500">
                        <Link href="/admin">Escrow</Link>
                        <Link href="/admin/products">Products</Link>
                     </div>
                </div>
                {children}
            </main>
        </div>
    );
}

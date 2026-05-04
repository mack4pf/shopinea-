"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
    Shield, LayoutDashboard, Package, Users, LogOut,
    ShieldCheck, Megaphone, Wallet, Menu, X, ChevronRight, Truck
} from "lucide-react";

const adminNav = [
    { name: "Overview",   href: "/admin",           icon: LayoutDashboard },
    { name: "Users",      href: "/admin/users",     icon: Users },
    { name: "Suppliers",  href: "/admin/suppliers", icon: Truck },
    { name: "Escrow",     href: "/admin/escrow",    icon: ShieldCheck },
    { name: "Ads",        href: "/admin/ads",       icon: Megaphone },
    { name: "Products",   href: "/admin/products",  icon: Package },
    { name: "Gateways",   href: "/admin/gateways",  icon: Wallet },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#0f0f13] text-white flex">
            {open && (
                <button
                    aria-label="Close menu"
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                />
            )}

            {/* Sidebar */}
            <aside className={`w-64 border-r border-white/[0.06] bg-[#0c0c10] flex flex-col fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>

                {/* Logo */}
                <div className="px-5 py-5 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/sholinealogo2.png" alt="shopinea" className="w-8 h-8 object-contain" />
                        <div>
                            <p className="text-sm font-bold text-white leading-none">shopinea</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">Admin Panel</p>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-0.5 mt-2">
                    {adminNav.map((item) => {
                        const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? "bg-blue-600/15 text-blue-400 border border-blue-500/20" : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"}`}
                            >
                                <item.icon className="w-4 h-4 shrink-0" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom */}
                <div className="p-3 border-t border-white/[0.06] space-y-0.5">
                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 text-zinc-500 hover:text-zinc-300 text-sm font-medium rounded-xl hover:bg-white/[0.05] transition-colors">
                        <LogOut className="w-4 h-4" />
                        Back to Site
                    </Link>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col lg:ml-64 min-h-screen">
                {/* Top bar */}
                <header className="sticky top-0 z-30 bg-[#0f0f13]/90 backdrop-blur-md border-b border-white/[0.06] px-5 py-3 flex items-center gap-4">
                    <button onClick={() => setOpen(v => !v)} className="lg:hidden w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center transition-colors">
                        {open ? <X className="w-4 h-4 text-zinc-400" /> : <Menu className="w-4 h-4 text-zinc-400" />}
                    </button>

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <span>Admin</span>
                        {pathname !== "/admin" && (
                            <>
                                <ChevronRight className="w-3 h-3" />
                                <span className="text-zinc-300 capitalize">{adminNav.find(n => n.href !== "/admin" && pathname.startsWith(n.href))?.name || "Overview"}</span>
                            </>
                        )}
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-medium text-emerald-400">Live</span>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 p-5 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

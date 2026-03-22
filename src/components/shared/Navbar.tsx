"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User, Menu, X, ArrowRight, Store, ShieldCheck, ShoppingBag, Info, Zap, CreditCard, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isHome = pathname === "/";

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (mobileMenuOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "unset";
    }, [mobileMenuOpen]);

    const navLinks = [
        { href: "/marketplace", label: "Marketplace" },
        { href: "/pricing", label: "Pricing" },
        { href: "/services", label: "Services" },
        { href: "/suppliers", label: "Suppliers" },
        { href: "/resellers", label: "Resellers" },
    ];

    return (
        <header
            className={cn(
                "fixed top-0 z-[100] w-full transition-all duration-300",
                scrolled
                    ? "bg-white/70 backdrop-blur-md border-b border-zinc-200/50 py-3"
                    : "bg-transparent py-5"
            )}
        >
            <div className="container flex h-14 max-w-7xl items-center justify-between px-6 mx-auto">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group relative z-[110]">
                    <div className="h-9 w-9 rounded-lg bg-zinc-950 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                        <span className="text-white font-bold text-xl">R</span>
                    </div>
                    <span className={cn(
                        "font-bold text-xl tracking-tight transition-colors",
                        scrolled ? "text-zinc-950" : "text-white"
                    )}>
                        Restock
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-blue-500",
                                scrolled ? "text-zinc-600" : "text-zinc-300 hover:text-white"
                            )}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-3 relative z-[110]">
                    <div className="hidden md:flex items-center gap-3">
                        {!loading && (
                            <>
                                {user ? (
                                    <Link href="/dashboard">
                                        <Button
                                            className={cn(
                                                "h-10 px-6 rounded-lg font-semibold text-sm transition-all flex items-center gap-2",
                                                scrolled ? "bg-zinc-950 text-white" : "bg-white text-zinc-950 hover:bg-zinc-100"
                                            )}
                                        >
                                            <User className="h-4 w-4" />
                                            Dashboard
                                        </Button>
                                    </Link>
                                ) : (
                                    <>
                                        <Link href="/login">
                                            <Button
                                                variant="ghost"
                                                className={cn(
                                                    "h-10 px-4 rounded-lg font-semibold text-sm transition-colors",
                                                    scrolled ? "text-zinc-600 hover:bg-zinc-100" : "text-zinc-300 hover:text-white"
                                                )}
                                            >
                                                Sign In
                                            </Button>
                                        </Link>
                                        <Link href="/register">
                                            <Button className="h-10 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 border-none transition-all active:scale-[0.98]">
                                                Get Started
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    {/* Mobile Toggle */}
                    <button
                        className={cn(
                            "md:hidden w-10 h-10 flex items-center justify-center rounded-lg transition-colors",
                            scrolled ? "hover:bg-zinc-100 text-zinc-950" : "hover:bg-white/10 text-white"
                        )}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <div className={cn(
                "fixed inset-0 bg-white z-[100] md:hidden transition-all duration-500 px-6 pt-24 pb-12 flex flex-col justify-between",
                mobileMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
            )}>
                <nav className="space-y-4">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2 mb-4">Menu</p>
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl group transition-all active:scale-[0.98]"
                        >
                            <span className="text-xl font-bold text-zinc-900">{link.label}</span>
                            <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-1 transition-all" />
                        </Link>
                    ))}
                </nav>

                <div className="space-y-3">
                    {!loading && !user && (
                        <div className="grid grid-cols-2 gap-3">
                            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1">
                                <Button variant="outline" className="w-full h-14 rounded-2xl text-zinc-950 font-bold border-2">Sign In</Button>
                            </Link>
                            <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="flex-1">
                                <Button className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xl shadow-blue-500/20">Get Started</Button>
                            </Link>
                        </div>
                    )}
                    {user && (
                        <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                            <Button className="w-full h-14 rounded-2xl bg-zinc-950 text-white font-bold flex gap-2">
                                <User className="h-5 w-5" /> Go to Dashboard
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}

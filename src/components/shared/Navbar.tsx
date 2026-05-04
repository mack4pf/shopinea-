"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User, Menu, X, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShopineaLogo } from "@/components/shared/ShopineaLogo";

export function Navbar() {
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [mobileMenuOpen]);

    const navLinks = [
        { href: "/marketplace", label: "Marketplace" },
        { href: "/pricing", label: "Pricing" },
        { href: "/services", label: "Services" },
        { href: "/suppliers", label: "Suppliers" },
        { href: "/resellers", label: "Resellers" },
    ];

    const close = () => setMobileMenuOpen(false);

    return (
        <>
            {/* ── Top Bar ── */}
            <header
                className={cn(
                    "fixed top-0 left-0 right-0 z-[200] transition-all duration-300",
                    scrolled
                        ? "bg-white/80 backdrop-blur-xl border-b border-zinc-200/60 shadow-sm py-3"
                        : "bg-transparent py-5"
                )}
            >
                <div className="max-w-7xl mx-auto px-5 flex items-center justify-between h-12">
                    {/* Logo */}
                    <Link href="/" onClick={close} className="flex items-center gap-2.5">
                        <ShopineaLogo size={32} />
                        <span className={cn(
                            "font-extrabold text-[1.15rem] tracking-tight transition-colors",
                            scrolled ? "text-zinc-900" : "text-white"
                        )}>
                            shopinea
                        </span>
                    </Link>

                    {/* Desktop Links */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                    pathname === link.href
                                        ? scrolled ? "bg-zinc-100 text-zinc-900" : "bg-white/15 text-white"
                                        : scrolled ? "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100" : "text-zinc-300 hover:text-white hover:bg-white/10"
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-2">
                        {!loading && (
                            user ? (
                                <Link href="/dashboard">
                                    <Button className={cn(
                                        "h-9 px-5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all",
                                        scrolled ? "bg-zinc-900 text-white hover:bg-zinc-700" : "bg-white text-zinc-900 hover:bg-zinc-100"
                                    )}>
                                        <User className="h-3.5 w-3.5" />
                                        Dashboard
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href="/login">
                                        <Button variant="ghost" className={cn(
                                            "h-9 px-4 rounded-lg text-sm font-medium",
                                            scrolled ? "text-zinc-600 hover:bg-zinc-100" : "text-zinc-300 hover:text-white hover:bg-white/10"
                                        )}>
                                            Sign In
                                        </Button>
                                    </Link>
                                    <Link href="/register">
                                        <Button className="h-9 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/25 border-none">
                                            Get Started
                                        </Button>
                                    </Link>
                                </>
                            )
                        )}
                    </div>

                    {/* Mobile Hamburger */}
                    <button
                        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                        onClick={() => setMobileMenuOpen(v => !v)}
                        className={cn(
                            "md:hidden w-10 h-10 flex items-center justify-center rounded-xl transition-colors",
                            scrolled
                                ? "text-zinc-800 hover:bg-zinc-100"
                                : "text-white hover:bg-white/10"
                        )}
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            {/* ── Mobile Drawer ── */}
            {/* Backdrop */}
            <div
                onClick={close}
                className={cn(
                    "fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm md:hidden transition-opacity duration-300",
                    mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
            />

            {/* Drawer panel — slides in from right */}
            <div className={cn(
                "fixed top-0 right-0 bottom-0 z-[160] w-[300px] bg-white md:hidden flex flex-col shadow-2xl transition-transform duration-300 ease-in-out",
                mobileMenuOpen ? "translate-x-0" : "translate-x-full"
            )}>
                {/* Drawer header */}
                <div className="flex items-center justify-between px-5 h-[72px] border-b border-zinc-100 shrink-0">
                    <Link href="/" onClick={close} className="flex items-center gap-2">
                        <ShopineaLogo size={28} />
                        <span className="font-extrabold text-base text-zinc-900">shopinea</span>
                    </Link>
                    <button
                        onClick={close}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Nav links */}
                <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={close}
                            className={cn(
                                "flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition-colors",
                                pathname === link.href
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                            )}
                        >
                            {link.label}
                            <ChevronRight className="w-4 h-4 opacity-40" />
                        </Link>
                    ))}
                </nav>

                {/* Drawer footer CTA */}
                <div className="px-4 pb-8 pt-4 border-t border-zinc-100 space-y-2.5 shrink-0">
                    {!loading && (
                        user ? (
                            <Link href="/dashboard" onClick={close}>
                                <Button className="w-full h-12 rounded-xl bg-zinc-900 hover:bg-zinc-700 text-white font-bold flex items-center gap-2">
                                    <User className="w-4 h-4" /> Go to Dashboard
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link href="/register" onClick={close}>
                                    <Button className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                                        Get Started <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                                <Link href="/login" onClick={close}>
                                    <Button variant="outline" className="w-full h-12 rounded-xl font-semibold text-zinc-700 border-zinc-200">
                                        Sign In
                                    </Button>
                                </Link>
                            </>
                        )
                    )}
                </div>
            </div>
        </>
    );
}

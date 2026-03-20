"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User, Menu, X, ArrowRight, Store, ShieldCheck, ShoppingBag, Info, Zap, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Check if we are on the landing page
    const isHome = pathname === "/";

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Prevent scrolling when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
    }, [mobileMenuOpen]);

    const navLinks = [
        { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
        { href: "/pricing", label: "Pricing", icon: CreditCard },
        { href: "/services", label: "Services", icon: Zap },
        { href: "/suppliers", label: "Suppliers", icon: ShieldCheck },
        { href: "/resellers", label: "Resellers", icon: Store },
        { href: "/about-us", label: "About Us", icon: Info },
    ];

    return (
        <header
            className={cn(
                "fixed top-0 z-[100] w-full transition-all duration-500",
                scrolled
                    ? "bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-b border-gray-100 py-3"
                    : isHome
                        ? "bg-transparent py-6"
                        : "bg-black py-4"
            )}
        >
            <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-3 group relative z-[110]">
                    <div className="h-10 w-10 rounded-[12px] bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-white font-black text-xl italic leading-none">S</span>
                    </div>
                    <span className={cn(
                        "font-black text-2xl tracking-tighter transition-colors duration-300",
                        scrolled ? "text-slate-900" : "text-white"
                    )}>
                        Shoplinea.shop
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-10">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "text-[13px] font-black uppercase tracking-widest transition-all hover:text-blue-600 relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-blue-600 after:transition-all hover:after:w-full",
                                scrolled ? "text-slate-600" : "text-slate-200 hover:text-white"
                            )}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Actions & Mobile Toggle */}
                <div className="flex items-center gap-4 relative z-[110]">
                    <div className="hidden md:flex items-center gap-4">
                        {!loading && (
                            <>
                                {user ? (
                                    <Link href="/dashboard">
                                        <Button
                                            className="h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 gap-2 border-none"
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
                                                    "h-11 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest italic",
                                                    scrolled ? "text-slate-900 hover:bg-slate-100" : "text-white hover:bg-white/10"
                                                )}
                                            >
                                                Entry
                                            </Button>
                                        </Link>
                                        <Link href="/register">
                                            <Button className="h-11 px-8 rounded-xl bg-white text-black hover:bg-slate-100 font-black uppercase text-[10px] tracking-widest shadow-lg border-none shadow-black/5">
                                                Launch Now
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button - High Visibility */}
                    <button
                        className="md:hidden w-12 h-12 flex items-center justify-center rounded-xl bg-slate-900/5 dark:bg-white/5 backdrop-blur-md"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle Menu"
                    >
                        {mobileMenuOpen ? (
                            <X className={cn("h-6 w-6 text-slate-900 font-black")} />
                        ) : (
                            <Menu className={cn("h-6 w-6", scrolled ? "text-slate-900" : (isHome ? "text-white" : "text-white"))} />
                        )}
                    </button>
                </div>
            </div>

            {/* Premium Mobile Overlay */}
            <div className={cn(
                "fixed inset-0 bg-white z-[100] md:hidden transition-all duration-500 ease-in-out px-8 pt-32 pb-12 flex flex-col justify-between",
                mobileMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
            )}>
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />
                
                <nav className="flex flex-col gap-6 relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Navigation</p>
                    {navLinks.map((link, i) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="flex items-center gap-4 group"
                            onClick={() => setMobileMenuOpen(false)}
                            style={{ transitionDelay: `${i * 50}ms` }}
                        >
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                <link.icon className="w-5 h-5 text-slate-400 group-hover:text-white" />
                            </div>
                            <span className="text-3xl font-black tracking-tighter text-slate-900 italic group-hover:text-blue-600 transition-colors">
                                {link.label}
                            </span>
                        </Link>
                    ))}
                </nav>

                <div className="space-y-4 relative z-10">
                    {!loading && !user && (
                        <div className="grid grid-cols-2 gap-4">
                            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                                <Button variant="outline" className="w-full h-16 rounded-2xl text-slate-900 font-black uppercase text-xs tracking-widest border-2">Login</Button>
                            </Link>
                            <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                                <Button className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20">Sign Up</Button>
                            </Link>
                        </div>
                    )}
                    {user && (
                        <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                            <Button className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-widest flex gap-3 italic">
                                <User className="h-5 w-5" /> Back to Terminal
                            </Button>
                        </Link>
                    )}
                    <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4 italic">
                        The Future of Commerce is Here.
                    </p>
                </div>
            </div>
        </header>
    );
}

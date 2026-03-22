import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin, Github, Globe, ShieldCheck } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-[#09090b] border-t border-white/[0.04] text-zinc-400">
            <div className="container px-6 max-w-7xl mx-auto py-24">
                <div className="grid gap-12 lg:grid-cols-5">
                    {/* Brand */}
                    <div className="lg:col-span-2 space-y-8">
                        <Link href="/" className="flex items-center space-x-3">
                            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <span className="text-white font-bold text-lg">R</span>
                            </div>
                            <span className="text-white font-bold text-xl tracking-tight">Restock</span>
                        </Link>
                        <p className="text-sm font-medium leading-relaxed max-w-sm text-zinc-500">
                            The world&apos;s most advanced supply chain infrastructure for professional merchants. Scale your commerce empire with AI-driven logistics and global sourcing.
                        </p>
                        <div className="flex space-x-5">
                            <Link href="#" className="p-2 bg-white/[0.03] border border-white/[0.06] rounded-lg hover:text-white hover:bg-white/[0.08] transition-all"><Twitter className="h-4 w-4" /></Link>
                            <Link href="#" className="p-2 bg-white/[0.03] border border-white/[0.06] rounded-lg hover:text-white hover:bg-white/[0.08] transition-all"><Facebook className="h-4 w-4" /></Link>
                            <Link href="#" className="p-2 bg-white/[0.03] border border-white/[0.06] rounded-lg hover:text-white hover:bg-white/[0.08] transition-all"><Instagram className="h-4 w-4" /></Link>
                            <Link href="#" className="p-2 bg-white/[0.03] border border-white/[0.06] rounded-lg hover:text-white hover:bg-white/[0.08] transition-all"><Linkedin className="h-4 w-4" /></Link>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-6">
                        <h3 className="text-white font-bold text-sm tracking-widest uppercase">Platform</h3>
                        <ul className="space-y-4 text-sm font-medium">
                            <li><Link href="/marketplace" className="hover:text-blue-500 transition-colors">Global Marketplace</Link></li>
                            <li><Link href="/pricing" className="hover:text-blue-500 transition-colors">Infrastructure Plans</Link></li>
                            <li><Link href="/suppliers" className="hover:text-blue-500 transition-colors">For Suppliers</Link></li>
                            <li><Link href="/resellers" className="hover:text-blue-500 transition-colors">For Resellers</Link></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div className="space-y-6">
                        <h3 className="text-white font-bold text-sm tracking-widest uppercase">Resources</h3>
                        <ul className="space-y-4 text-sm font-medium">
                            <li><Link href="/documentation" className="hover:text-blue-500 transition-colors">Documentation</Link></li>
                            <li><Link href="/api" className="hover:text-blue-500 transition-colors">API Reference</Link></li>
                            <li><Link href="/guides" className="hover:text-blue-500 transition-colors">Selling Guides</Link></li>
                            <li><Link href="/support" className="hover:text-blue-500 transition-colors">Support Center</Link></li>
                        </ul>
                    </div>

                    {/* Trust */}
                    <div className="space-y-6">
                        <h3 className="text-white font-bold text-sm tracking-widest uppercase">System Status</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-xs font-semibold text-emerald-500">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                All Systems Operational
                            </div>
                            <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl space-y-3">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-zinc-600" />
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">PCI Level 1 Compliance</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-zinc-600" />
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Global Escrow Nodes</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-24 pt-8 border-t border-white/[0.04] flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em]">
                        © {new Date().getFullYear()} Restock Technology Infrastructure. All rights reserved.
                    </p>
                    <div className="flex gap-8">
                        <Link href="/privacy" className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest hover:text-white transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

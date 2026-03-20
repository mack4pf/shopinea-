import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin, Github } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-gray-900 border-t border-gray-800 text-gray-300">
            <div className="container px-4 md:px-6 py-16">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {/* Brand */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                                <span className="text-white font-bold text-lg">S</span>
                            </div>
                            <span className="text-white font-bold text-xl">Shopinea.shop</span>
                        </Link>
                        <p className="text-sm text-gray-400">
                            Empowering entrepreneurs with global supply chain solutions, AI-driven insights, and flexible financing.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Platform</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/marketplace" className="hover:text-blue-500 transition-colors">Marketplace</Link></li>
                            <li><Link href="/services" className="hover:text-blue-500 transition-colors">Services</Link></li>
                            <li><Link href="/suppliers" className="hover:text-blue-500 transition-colors">For Suppliers</Link></li>
                            <li><Link href="/resellers" className="hover:text-blue-500 transition-colors">For Resellers</Link></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Company</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/about-us" className="hover:text-blue-500 transition-colors">About Us</Link></li>
                            <li><Link href="/careers" className="hover:text-blue-500 transition-colors">Careers</Link></li>
                            <li><Link href="/blog" className="hover:text-blue-500 transition-colors">Blog</Link></li>
                            <li><Link href="/contact" className="hover:text-blue-500 transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Legal / Social */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Connect</h3>
                        <div className="flex space-x-4 mb-6">
                            <Link href="#" className="hover:text-white transition-colors"><Twitter className="h-5 w-5" /></Link>
                            <Link href="#" className="hover:text-white transition-colors"><Facebook className="h-5 w-5" /></Link>
                            <Link href="#" className="hover:text-white transition-colors"><Instagram className="h-5 w-5" /></Link>
                            <Link href="#" className="hover:text-white transition-colors"><Linkedin className="h-5 w-5" /></Link>
                        </div>
                        <p className="text-xs text-gray-500">
                            © {new Date().getFullYear()} Shopinea Inc. <br />
                            All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}

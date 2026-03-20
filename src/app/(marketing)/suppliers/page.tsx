import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Globe, ShieldCheck } from "lucide-react";

export default function SuppliersPage() {
    return (
        <main className="flex min-h-screen flex-col pt-16">
            {/* Hero */}
            <section className="relative overflow-hidden bg-black py-24 text-white">
                <div className="absolute inset-0 z-0 opacity-40">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-transparent to-transparent" />
                    {/* Uses shared asset */}
                    <div
                        className="absolute inset-0 bg-[url('/images/warehouse.png')] bg-cover bg-center"
                        style={{ filter: 'grayscale(100%)' }}
                    />
                </div>
                <div className="container relative z-10 px-4 md:px-6">
                    <div className="max-w-2xl">
                        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
                            Sell to the World,<br />
                            <span className="text-blue-500">Not Just Local.</span>
                        </h1>
                        <p className="text-xl text-gray-300 mb-8">
                            List your products on Shoplinea.shop and instantly reach thousands of global resellers.
                            We handle the logistics, payments, and marketing.
                        </p>
                        <div className="flex gap-4">
                            <Link href="/register">
                                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8">
                                    Become a Supplier
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-24 bg-white">
                <div className="container px-4 md:px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Why Partner With Us?</h2>
                    </div>
                    <div className="grid gap-8 md:grid-cols-3">
                        <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-gray-50 border border-gray-100">
                            <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center mb-6 text-blue-600">
                                <Globe className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Global Reach</h3>
                            <p className="text-gray-600">
                                Expand beyond your local market. Our network of verified resellers puts your products in stores worldwide.
                            </p>
                        </div>
                        <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-gray-50 border border-gray-100">
                            <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center mb-6 text-blue-600">
                                <ShieldCheck className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Guaranteed Payments</h3>
                            <p className="text-gray-600">
                                No more chasing invoices. Shoplinea.shop secures payments in escrow and releases them upon shipment verification.
                            </p>
                        </div>
                        <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-gray-50 border border-gray-100">
                            <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center mb-6 text-blue-600">
                                <BarChart3 className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Data Insights</h3>
                            <p className="text-gray-600">
                                Get real-time data on product performance, trending categories, and pricing optimization.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

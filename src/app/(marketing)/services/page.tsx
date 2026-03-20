import { Truck, Package, Search, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ServicesPage() {
    return (
        <main className="flex min-h-screen flex-col pt-16">
            {/* Hero */}
            <section className="bg-gray-900 py-24 text-white">
                <div className="container px-4 md:px-6 text-center">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
                        Comprehensive <span className="text-blue-500">Commerce Solutions</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-xl text-gray-400 mb-8">
                        Whether you are a solo entrepreneur or a growing enterprise, Shoplinea.shop provides the infrastructure you need to scale.
                    </p>
                </div>
            </section>

            {/* Services Grid */}
            <section className="py-24 bg-white">
                <div className="container px-4 md:px-6">
                    <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
                        {/* Service 1 */}
                        <div className="group rounded-2xl border border-gray-100 bg-gray-50 p-8 transition-all hover:shadow-lg hover:border-blue-200">
                            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-500/30">
                                <Truck className="h-6 w-6" />
                            </div>
                            <h3 className="mb-3 text-2xl font-bold text-gray-900">Global Dropshipping</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Complete fulfillment solution. You sell, we ship.
                                We connect directly with your store (Shopify, WooCommerce) and automatically process orders and tracking numbers.
                            </p>
                        </div>

                        {/* Service 2 */}
                        <div className="group rounded-2xl border border-gray-100 bg-gray-50 p-8 transition-all hover:shadow-lg hover:border-purple-200">
                            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600 text-white shadow-lg shadow-purple-500/30">
                                <Package className="h-6 w-6" />
                            </div>
                            <h3 className="mb-3 text-2xl font-bold text-gray-900">Wholesale Bulk</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Need stock on hand? Purchase in bulk at negotiated wholesale rates.
                                Perfect for retail stores or Amazon FBA sellers looking for high-margin inventory.
                            </p>
                        </div>

                        {/* Service 3 */}
                        <div className="group rounded-2xl border border-gray-100 bg-gray-50 p-8 transition-all hover:shadow-lg hover:border-emerald-200">
                            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-lg shadow-emerald-500/30">
                                <Search className="h-6 w-6" />
                            </div>
                            <h3 className="mb-3 text-2xl font-bold text-gray-900">Product Sourcing</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Can't find what you're looking for? Our sourcing agents in China, Vietnam, and Turkey
                                can find any product at the best price with verified quality checks.
                            </p>
                        </div>

                        {/* Service 4 */}
                        <div className="group rounded-2xl border border-gray-100 bg-gray-50 p-8 transition-all hover:shadow-lg hover:border-orange-200">
                            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500 text-white shadow-lg shadow-orange-500/30">
                                <Globe className="h-6 w-6" />
                            </div>
                            <h3 className="mb-3 text-2xl font-bold text-gray-900">Private Labeling</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Build your own brand. We handle custom packaging, logo printing, and inserts so your customers remember YOUR name, not ours.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 bg-blue-600 text-white">
                <div className="container px-4 md:px-6 text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">Ready to expand your capabilities?</h2>
                    <div className="flex justify-center gap-4">
                        <Link href="/register">
                            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 font-bold px-8">
                                Get Started Today
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}

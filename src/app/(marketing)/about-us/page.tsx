import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, Target, Heart } from "lucide-react";

export default function AboutUsPage() {
    return (
        <main className="flex min-h-screen flex-col pt-16">
            {/* Hero */}
            <section className="bg-white py-24">
                <div className="container px-4 md:px-6">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl mb-6">
                            Empowering the <br />
                            <span className="text-blue-600">Next Generation</span> of Entrepreneurs.
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                            Shoplinea.shop is more than a platform; it's a launchpad. We believe that starting a business shouldn't require a fortune.
                            Our mission is to democratize access to the global supply chain, allowing anyone with a laptop and a dream to build a retail empire.
                        </p>
                    </div>
                </div>
            </section>

            {/* How We Empower You */}
            <section className="py-24 bg-white border-y border-gray-100">
                <div className="container px-4 md:px-6">
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">How We Empower You</h2>
                        <p className="mt-4 text-xl text-gray-500">A complete ecosystem designed for your success.</p>
                    </div>
                    <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-2">
                        {/* Agents Model */}
                        <div className="bg-gray-50 p-8 rounded-2xl">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">You Are The Agent</h3>
                            <p className="text-gray-600 mb-4">
                                We connect suppliers directly to you. As a reseller, you act as the support agent and sales representative.
                                Suppliers focus on production, while you focus on the customer.
                            </p>
                            <p className="font-semibold text-blue-600">Earn Affiliate Commissions & Sales Margins</p>
                        </div>

                        {/* Ad Financing */}
                        <div className="bg-gray-50 p-8 rounded-2xl">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Flexible Ad Financing</h3>
                            <p className="text-gray-600 mb-4">
                                Don't let cash flow stop your growth. We offer <strong>Pre-paid</strong> and <strong>Post-paid</strong> promotion packages.
                                Scale your ads now and repay us automatically from your sales profits.
                            </p>
                            <p className="font-semibold text-blue-600">Grow First, Pay Later</p>
                        </div>

                        {/* AI Assistance */}
                        <div className="bg-gray-50 p-8 rounded-2xl">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">AI-Powered Research</h3>
                            <p className="text-gray-600 mb-4">
                                Stop guessing. Our AI analyzes global market trends to curate lists of <strong>Viral Products</strong> daily.
                                Spend less time researching and more time selling.
                            </p>
                            <p className="font-semibold text-blue-600">Data-Driven Success</p>
                        </div>

                        {/* Analytics */}
                        <div className="bg-gray-50 p-8 rounded-2xl">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Smart Analytics</h3>
                            <p className="text-gray-600 mb-4">
                                Track your empire. Monitor traffic sources, conversion rates, and profit margins in real-time.
                                Know exactly where your customers are coming from.
                            </p>
                            <p className="font-semibold text-blue-600">Complete Visibility</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Our Values */}
            <section className="py-24 bg-gray-50 border-y border-gray-100">
                <div className="container px-4 md:px-6">
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Our Core Values</h2>
                    </div>
                    <div className="grid gap-12 md:grid-cols-3">
                        <div>
                            <div className="mb-4 inline-flex items-center justify-center rounded-full bg-blue-100 p-3 text-blue-600">
                                <Users className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Community First</h3>
                            <p className="text-gray-600">We grow when you grow. We are dedicated to providing the support, education, and tools our community needs to thrive.</p>
                        </div>
                        <div>
                            <div className="mb-4 inline-flex items-center justify-center rounded-full bg-purple-100 p-3 text-purple-600">
                                <Target className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Relentless Innovation</h3>
                            <p className="text-gray-600">Commerce moves fast. We stay ahead of the curve with AI-driven insights, automated logistics, and cutting-edge tech.</p>
                        </div>
                        <div>
                            <div className="mb-4 inline-flex items-center justify-center rounded-full bg-red-100 p-3 text-red-600">
                                <Heart className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Transparency</h3>
                            <p className="text-gray-600">No hidden fees. No mystery suppliers. We vet every partner and provide clear, honest pricing at every step.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team/Careers Teaser */}
            <section className="py-24 bg-white">
                <div className="container px-4 md:px-6 text-center">
                    <h2 className="text-3xl font-bold tracking-tight mb-6">Built by Remote Workers, For Remote Workers</h2>
                    <p className="max-w-2xl mx-auto text-lg text-gray-600 mb-10">
                        We understand the freedom of working from home because that's how we built Shoplinea.shop.
                        Our team is distributed globally, just like our supply chain.
                    </p>
                    <Link href="/register">
                        <Button variant="outline" size="lg" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                            Join Our Network
                        </Button>
                    </Link>
                </div>
            </section>
        </main>
    );
}

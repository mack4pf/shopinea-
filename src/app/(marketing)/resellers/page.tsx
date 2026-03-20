import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Boxes, DollarSign, Zap } from "lucide-react";

export default function ResellersPage() {
    return (
        <main className="flex min-h-screen flex-col pt-16">
            {/* Hero */}
            <section className="relative overflow-hidden bg-white py-24 text-gray-900">
                <div className="container relative z-10 px-4 md:px-6">
                    <div className="grid gap-12 lg:grid-cols-2 items-center">
                        <div className="max-w-2xl">
                            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl mb-6">
                                Work From Home, <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                                    Sell Globally.
                                </span>
                            </h1>
                            <p className="text-xl text-gray-600 mb-8">
                                Start your own dropshipping business from the comfort of your home.
                                Act as a customer support agent while we handle the inventory, shipping, and logistics.
                                No upfront costs.
                            </p>
                            <div className="flex gap-4">
                                <Link href="/register">
                                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8">
                                        Start Selling Free
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                            <img
                                src="/images/reseller-work.png"
                                alt="Work from home dashboard"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-24 bg-gray-50">
                <div className="container px-4 md:px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Your Role as a Reseller</h2>
                        <p className="mt-4 text-xl text-gray-500">Focus on sales and support. We handle the rest.</p>
                    </div>
                    <div className="grid gap-12 md:grid-cols-3">
                        <div className="relative bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 font-bold text-xl mb-6">
                                <Zap className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Browse & Select</h3>
                            <p className="text-gray-600">
                                Access our catalog of trending tech gadgets, home essentials, and more.
                                Choose the cool things you want to sell.
                            </p>
                        </div>
                        <div className="relative bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 font-bold text-xl mb-6">
                                <DollarSign className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Your Margins</h3>
                            <p className="text-gray-600">
                                Set your own retail prices. You keep the difference between the wholesale price and your selling price.
                            </p>
                        </div>
                        <div className="relative bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 font-bold text-xl mb-6">
                                <Boxes className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Customer Support</h3>
                            <p className="text-gray-600">
                                Manage your customer relationships. Answer questions and provide great service while working remotely.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

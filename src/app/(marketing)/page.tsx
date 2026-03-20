import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Box, Globe, ShieldCheck, Truck } from "lucide-react";
import { ReviewsSection } from "@/components/marketing/ReviewsSection";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: "url('/images/warehouse.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent" />
        </div>

        <div className="container relative z-10 flex h-full flex-col justify-center px-4 md:px-6">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-white backdrop-blur-xl">
              <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              Global Dropshipping Platform
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl">
              Wholesale <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Reimagined
              </span>
            </h1>
            <p className="text-lg text-gray-300 md:text-xl max-w-lg">
              Connect directly with Amazon, Alibaba, and AliExpress suppliers.
              Automate your inventory, scale your business, and ship globally with zero friction.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 bg-blue-600 hover:bg-blue-700 border-none">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 bg-white/5 border-white/20 text-white hover:bg-white/10">
                  View Catalog
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-white/5 bg-neutral-900 py-12">
        <div className="container grid grid-cols-2 gap-8 px-4 md:grid-cols-4 md:px-6">
          {[
            { label: "Active Products", value: "2.5M+" },
            { label: "Global Suppliers", value: "500+" },
            { label: "Daily Orders", value: "10k+" },
            { label: "Countries Served", value: "150+" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <h3 className="text-3xl font-bold text-white md:text-4xl">{stat.value}</h3>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-black text-white">
        <div className="container px-4 md:px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Why Choose <span className="text-blue-500">Shoplinea.shop</span>?
            </h2>
            <p className="mt-4 text-gray-400">Enterprise-grade infrastructure for modern commerce.</p>
          </div>

          <div className="grid gap-12 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 transition-all hover:-translate-y-1 hover:border-blue-500/50">
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src="/images/products.png"
                  alt="Premium Products"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-8">
                <Box className="mb-4 h-10 w-10 text-blue-500" />
                <h3 className="mb-2 text-xl font-bold">Premium Inventory</h3>
                <p className="text-gray-400">
                  Access millions of verified products from top-tier suppliers. sharp images, verified quality, and competitive pricing tiers.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 transition-all hover:-translate-y-1 hover:border-emerald-500/50">
              <div className="aspect-video w-full overflow-hidden">
                <div className="h-full w-full bg-gradient-to-br from-neutral-800 to-black flex items-center justify-center">
                  {/* Placeholder or another image if generated */}
                  <ShieldCheck className="h-24 w-24 text-emerald-500 opacity-50" />
                </div>
              </div>
              <div className="p-8">
                <ShieldCheck className="mb-4 h-10 w-10 text-emerald-500" />
                <h3 className="mb-2 text-xl font-bold">Verified Suppliers</h3>
                <p className="text-gray-400">
                  We rigorously vet every supplier from Amazon FBA, Alibaba, and AliExpress to ensure reliability and speed.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 transition-all hover:-translate-y-1 hover:border-purple-500/50">
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src="/images/download.jfif"
                  alt="Fast Delivery"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-8">
                <Truck className="mb-4 h-10 w-10 text-purple-500" />
                <h3 className="mb-2 text-xl font-bold">Global Logistics</h3>
                <p className="text-gray-400">
                  Smart routing algorithms ensure the fastest delivery times. Real-time tracking for you and your customers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <ReviewsSection />

      {/* CTA Section */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-blue-600">
          <div className="absolute inset-0 bg-[url('/images/warehouse.png')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        </div>
        <div className="container relative z-10 px-4 text-center md:px-6">
          <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            Ready to Scale Your Business?
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-blue-100">
            Join thousands of resellers who trust Shoplinea.shop for their supply chain needs. Start for free today.
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-10 py-6 h-auto font-bold shadow-xl">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}

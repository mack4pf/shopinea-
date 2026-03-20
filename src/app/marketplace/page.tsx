import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MarketplacePage() {
    return (
        <main className="flex min-h-screen flex-col pt-24 items-center justify-center bg-gray-50">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold">Marketplace Coming Soon</h1>
                <p className="text-gray-500 max-w-md mx-auto">
                    We are currently onboarding suppliers. Join the waitlist to get early access to exclusive wholesale deals.
                </p>
                <div className="flex gap-4 justify-center">
                    <Link href="/">
                        <Button variant="outline">Go Home</Button>
                    </Link>
                    <Link href="/register">
                        <Button>Get Early Access</Button>
                    </Link>
                </div>
            </div>
        </main>
    );
}

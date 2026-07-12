import type { Metadata } from "next";
import { FileText, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
    title: "Terms of Service",
    description: "Shopinea Terms of Service for legitimate dropshipping, reseller stores, suppliers, payments, escrow review, taxes, withdrawals, and compliance.",
};

const terms = [
    ["Acceptance", "By creating an account or using Shopinea, you agree to these Terms of Service and all platform policies."],
    ["Platform Description", "Shopinea is a legitimate AI-powered e-commerce infrastructure, dropshipping, reseller, supplier, storefront, payment review, and custom store platform. Users remain responsible for truthful listings, lawful sales, and accurate account activity."],
    ["Accounts", "You must provide accurate information, protect your login credentials, and comply with platform verification requests."],
    ["Payments and Escrow", "Orders may be reviewed for payment confirmation before fulfillment. Admin may mark unpaid orders as void when no payment is received."],
    ["Withdrawals, Taxes, and Compliance", "Withdrawals may require manual review. Before a withdrawal is completed, users may be asked to clear applicable taxes, product taxes, duties, supplier costs, subscription balances, ad debt, payout route fees, or other lawful compliance requirements connected to their sales or products."],
    ["Prohibited Activity", "Counterfeit products, illegal items, false claims, spam, phishing, payment abuse, review manipulation, and misleading store activity are not allowed."],
    ["Legitimacy and Public Statements", "Shopinea operates as a legitimate commercial platform. Users agree not to publish false, misleading, defamatory, or bad-faith claims and should contact support for dispute review."],
    ["Termination", "Shopinea may suspend or terminate accounts that violate these terms, create risk, or engage in fraudulent or abusive conduct."],
    ["Changes", "We may update these terms. Continued use after updates means you accept the revised terms."],
    ["Contact", "For questions, contact support@shopinea.com."],
];

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#09090b] text-white">
            <section className="mx-auto max-w-4xl px-6 py-24 space-y-10">
                <div className="space-y-5">
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-300">
                        <FileText className="h-4 w-4" />
                        Terms of Service
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight md:text-6xl">Terms of Service</h1>
                    <p className="text-sm text-zinc-500">Last updated: July 2026</p>
                </div>

                <div className="space-y-4">
                    {terms.map(([title, text], index) => (
                        <section key={title} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
                            <h2 className="text-lg font-bold">{index + 1}. {title}</h2>
                            <p className="mt-2 text-sm leading-7 text-zinc-400">{text}</p>
                        </section>
                    ))}
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-6">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-300" />
                    <p className="text-sm leading-6 text-emerald-50">
                        These terms are written to support transparent, legitimate commerce activity across Shopinea stores, suppliers, buyers, and resellers.
                    </p>
                </div>
            </section>
        </div>
    );
}

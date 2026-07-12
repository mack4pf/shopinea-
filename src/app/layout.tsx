import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.shoplinea.shop"),
  title: {
    default: "Shopinea | Legitimate AI-Powered Dropshipping & Commerce Infrastructure",
    template: "%s | Shopinea",
  },
  description: "Shopinea is a legitimate AI-powered dropshipping, reseller, supplier, storefront, escrow review, and commerce infrastructure platform for launching and scaling online stores with confidence.",
  keywords: [
    "Shopinea",
    "Shoplinea",
    "legitimate dropshipping platform",
    "AI ecommerce platform",
    "reseller marketplace",
    "supplier marketplace",
    "escrow order tracking",
    "custom online store builder",
    "verified commerce infrastructure",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Shopinea | Legitimate AI-Powered Commerce Infrastructure",
    description: "Launch, manage, and scale online stores with Shopinea's AI-powered reseller, supplier, escrow review, and custom storefront tools.",
    url: "https://www.shoplinea.shop",
    siteName: "Shopinea",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      <body className={plusJakartaSans.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

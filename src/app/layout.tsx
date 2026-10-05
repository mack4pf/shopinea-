import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { FormillaWidget } from "@/components/shared/FormillaWidget";
import { BILLING_EMAIL, LEGAL_EMAIL, PAYMENTS_EMAIL, SEO_KEYWORDS, SITE_DESCRIPTION, SITE_NAME, SITE_URL, SUPPORT_EMAIL } from "@/lib/site";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Shoplinea | AI Commerce, Dropshipping & Reseller Store Platform",
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Ecommerce",
  keywords: SEO_KEYWORDS,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Shoplinea | AI Commerce Platform for Resellers & Suppliers",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/images/shoplinea-logo.png",
        width: 512,
        height: 512,
        alt: `${SITE_NAME} logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shoplinea | AI Commerce Platform",
    description: SITE_DESCRIPTION,
    images: ["/images/shoplinea-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeScript = `
    try {
      const saved = localStorage.getItem("theme");
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const theme = saved || (systemDark ? "dark" : "light");
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.dataset.theme = theme;
    } catch (_) {}
  `;
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/images/shoplinea-logo.png`,
    email: SUPPORT_EMAIL,
    contactPoint: [
      { "@type": "ContactPoint", contactType: "customer support", email: SUPPORT_EMAIL, areaServed: "Worldwide", availableLanguage: ["en"] },
      { "@type": "ContactPoint", contactType: "legal", email: LEGAL_EMAIL, areaServed: "Worldwide", availableLanguage: ["en"] },
      { "@type": "ContactPoint", contactType: "billing support", email: BILLING_EMAIL, areaServed: "Worldwide", availableLanguage: ["en"] },
      { "@type": "ContactPoint", contactType: "payments support", email: PAYMENTS_EMAIL, areaServed: "Worldwide", availableLanguage: ["en"] },
    ],
    sameAs: [SITE_URL],
  };
  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    description: SITE_DESCRIPTION,
  };

  return (
    <html lang="en" translate="no" className="notranslate" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <meta name="google" content="notranslate" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
        />
      </head>
      <body className={plusJakartaSans.className}>
        <AuthProvider>{children}</AuthProvider>
        <FormillaWidget />
        <Toaster richColors position="top-center" closeButton />
      </body>
    </html>
  );
}

export const SITE_DOMAIN = "shoplinea.pro";
export const SITE_URL = `https://${SITE_DOMAIN}`;
export const SITE_NAME = "Shoplinea";
export const SUPPORT_EMAIL = `support@${SITE_DOMAIN}`;
export const PRIVACY_EMAIL = `privacy@${SITE_DOMAIN}`;
export const BILLING_EMAIL = `billing@${SITE_DOMAIN}`;
export const PAYMENTS_EMAIL = `payments@${SITE_DOMAIN}`;

export const SITE_DESCRIPTION =
    "Shoplinea is an AI-powered commerce platform for resellers, suppliers, storefronts, product sourcing, Shoplinea AI ad creation, buyer traffic from ads, wallet funding, payments, fulfillment tracking, and marketplace growth tools.";

export const SEO_KEYWORDS = [
    "Shoplinea",
    "Shopinea",
    "AI ecommerce platform",
    "dropshipping platform",
    "reseller marketplace",
    "supplier marketplace",
    "online store builder",
    "ad wallet for ecommerce",
    "commerce infrastructure",
    "product sourcing platform",
    "AI ad creator",
    "Facebook ads for ecommerce",
    "Instagram shopping ads",
    "TikTok product ads",
    "Google shopping ads",
    "YouTube ecommerce ads",
    "buyer traffic from ads",
    "store growth tools",
    "order fulfillment center",
];

export function getStoreSubdomainUrl(storeSlug?: string | null) {
    const slug = String(storeSlug || "").trim().toLowerCase();
    return slug ? `https://${slug}.${SITE_DOMAIN}` : SITE_URL;
}

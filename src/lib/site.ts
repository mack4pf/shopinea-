export const SITE_DOMAIN = "shoplinea.pro";
export const SITE_URL = `https://www.${SITE_DOMAIN}`;
export const SITE_NAME = "Shoplinea";
export const EMAIL_DOMAIN = "shoplinea.shop";
export const SUPPORT_EMAIL = `support@${EMAIL_DOMAIN}`;
export const PRIVACY_EMAIL = `privacy@${EMAIL_DOMAIN}`;
export const BILLING_EMAIL = `billing@${EMAIL_DOMAIN}`;
export const PAYMENTS_EMAIL = `payments@${EMAIL_DOMAIN}`;
export const LEGAL_EMAIL = `legal@${EMAIL_DOMAIN}`;

export const SITE_DESCRIPTION =
    "Shoplinea is an AI-powered e-commerce operations platform for resellers, suppliers, storefronts, product sourcing, campaign planning, payment records, fulfillment tracking, support, and marketplace growth tools. Shoplinea helps merchants manage store operations from one dashboard instead of juggling disconnected tools.";

export const SEO_KEYWORDS = [
    "Shoplinea",
    "AI ecommerce platform",
    "dropshipping platform",
    "reseller marketplace",
    "supplier marketplace",
    "online store builder",
    "ecommerce campaign tools",
    "commerce infrastructure",
    "product sourcing platform",
    "AI ad creator",
    "Facebook ads for ecommerce",
    "Instagram shopping ads",
    "TikTok product ads",
    "Google shopping ads",
    "YouTube ecommerce ads",
    "ecommerce campaign planning",
    "store growth tools",
    "order fulfillment center",
    "Oberlo alternative",
    "ArtFire alternative",
    "AI powered reseller platform",
    "all in one ecommerce app",
    "mobile ecommerce app coming soon",
    "sales license support",
    "reseller compliance support",
];

export function normalizeStoreSlug(value?: unknown) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/\.shoplinea\.pro.*$/, "")
        .replace(/^www\.shoplinea\.pro\/store\//, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function makeLegacyStoreSlug(ownerId?: string | null, storeName?: string | null, fallback = "store") {
    const base = normalizeStoreSlug(storeName) || normalizeStoreSlug(fallback) || "store";
    const owner = normalizeStoreSlug(ownerId).slice(0, 12);
    return owner ? `${base}-${owner}` : base;
}

export function getStoreSubdomainUrl(storeSlug?: string | null) {
    const slug = normalizeStoreSlug(storeSlug);
    return slug ? `https://${slug}.${SITE_DOMAIN}` : SITE_URL;
}

export function getStorePathUrl(storeSlug?: string | null) {
    const slug = normalizeStoreSlug(storeSlug);
    return slug ? `${SITE_URL}/store/${slug}` : SITE_URL;
}

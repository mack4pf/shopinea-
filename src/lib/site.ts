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
    "Shoplinea is an AI-powered e-commerce platform for resellers, suppliers, storefronts, product sourcing, AI ad creation, buyer traffic from ads, wallet funding, payments, fulfillment tracking, and marketplace growth tools. Shoplinea helps merchants run the whole store from one app instead of juggling many disconnected tools.";

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
    "Oberlo alternative",
    "ArtFire alternative",
    "AI powered reseller platform",
    "all in one ecommerce app",
    "mobile ecommerce app coming soon",
    "sales license support",
    "reseller compliance support",
];

export function getStoreSubdomainUrl(storeSlug?: string | null) {
    const slug = String(storeSlug || "").trim().toLowerCase();
    return slug ? `https://${slug}.${SITE_DOMAIN}` : SITE_URL;
}

import type { QueryDocumentSnapshot } from "firebase/firestore";

export const CATALOG_VERSION = 8;
export const PRODUCT_PAGE_SIZE = 24;
export const STORE_TEMPLATES = [
    { id: "classic", name: "Classic" },
    { id: "spotlight", name: "Spotlight" },
    { id: "minimal", name: "Minimal" },
    { id: "boutique", name: "Boutique" },
    { id: "bold", name: "Bold" },
];

export const STORE_LAYOUTS = [
    { id: "grid", name: "Grid" },
    { id: "featured", name: "Featured" },
    { id: "compact", name: "Compact" },
    { id: "editorial", name: "Editorial" },
];

export const STORE_THEME_COLORS = ["#10b981", "#2563eb", "#f97316", "#e11d48", "#7c3aed", "#0f766e"];

export const PRODUCT_CATEGORIES = [
    "All",
    "Tech & Gadgets",
    "Smart Home",
    "Photography",
    "Vapes & E-Cigarettes",
    "Perfumes & Fragrances",
    "Kitchen Products",
    "Home & Kitchen",
    "Audio",
    "Fashion Accessories",
    "Fitness Apparel",
    "Health & Fitness",
    "Beauty & Cosmetics",
    "Beauty Accessories",
    "Footwear",
    "Sustainable Apparel",
    "Massage Guns",
    "Neck Massagers",
    "Foot Massagers",
    "Massage Chairs",
    "Back Massagers",
    "Scalp Massagers",
    "Heating Pads",
    "Spa & Wellness Tools",
    "Electric Massagers",
    "Portable Massagers",
];

export interface CatalogProduct {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    description: string;
    category: string;
    image: string;
    stock?: number; // Available units (10-50 per reseller)
    source?: string;
    sourceProductId?: string;
    sourceUrl?: string;
    isPromoted?: boolean;
    isFeatured?: boolean;
    sortOrder?: number;
    catalogVersion?: number;
}

export type ProductCursor = QueryDocumentSnapshot | null;

export function getProductKey(product: Pick<CatalogProduct, "source" | "sourceProductId" | "name">) {
    if (product.source && product.sourceProductId) return `${product.source}:${product.sourceProductId}`.toLowerCase();
    return `name:${product.name}`.toLowerCase();
}

export function getStableProductDocId(product: Pick<CatalogProduct, "source" | "sourceProductId" | "name">) {
    const key = getProductKey(product);
    return key.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}

export function getFastProductImageUrl(image?: string) {
    if (!image) return "";

    try {
        const url = new URL(image);
        if (url.hostname.includes("cdn.shopify.com")) {
            url.searchParams.set("width", "480");
        }
        return url.toString();
    } catch {
        return image;
    }
}

export function getDefaultStock(seed?: string) {
    const value = (seed || "shopinea").split("").reduce((total, char) => total + char.charCodeAt(0), 0);
    return 10 + (value % 41);
}

export function getMarketplaceSourceLabel(source?: string) {
    return "Verified Supplier";
}

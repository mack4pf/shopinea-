import { CATALOG_VERSION } from "@/lib/catalog";
import type { CatalogProduct } from "@/lib/catalog";

const dummySources = [
  {
    name: "smartphones",
    url: "https://dummyjson.com/products/category/smartphones?limit=100",
    category: "Tech & Gadgets",
  },
  {
    name: "laptops",
    url: "https://dummyjson.com/products/category/laptops?limit=100",
    category: "Tech & Gadgets",
  },
  {
    name: "home-decoration",
    url: "https://dummyjson.com/products/category/home-decoration?limit=100",
    category: "Smart Home",
  },
  {
    name: "fragrances",
    url: "https://dummyjson.com/products/category/fragrances?limit=100",
    category: "Perfumes & Fragrances",
  },
  {
    name: "kitchen-accessories",
    url: "https://dummyjson.com/products/category/kitchen-accessories?limit=100",
    category: "Kitchen Products",
  },
];

const fakeStoreSources = [
  {
    name: "all-products",
    url: "https://fakestoreapi.com/products",
  },
  {
    name: "electronics",
    url: "https://fakestoreapi.com/products/category/electronics",
    category: "Tech & Gadgets",
  },
  {
    name: "jewelery",
    url: "https://fakestoreapi.com/products/category/jewelery",
    category: "Fashion Accessories",
  },
];

const shopifySources = [
  {
    name: "peakdesign",
    url: "https://peakdesign.com/products.json",
    category: "Photography",
    supplier: "Global Sources",
  },
  {
    name: "polarpro",
    url: "https://www.polarpro.com/products.json",
    category: "Photography",
    supplier: "Global Sources",
  },
  {
    name: "spigen",
    url: "https://www.spigen.com/products.json",
    category: "Tech & Gadgets",
    supplier: "Alibaba/1688.com",
  },
  {
    name: "wyze",
    url: "https://www.wyze.com/products.json",
    category: "Smart Home",
    supplier: "DHgate",
  },
  {
    name: "switchbot",
    url: "https://us.switch-bot.com/products.json",
    category: "Smart Home",
    supplier: "DHgate",
  },
  {
    name: "wasserstein",
    url: "https://wasserstein-home.com/products.json",
    category: "Smart Home",
    supplier: "DHgate",
  },
  {
    name: "vapejuicedepot",
    url: "https://vapejuicedepot.com/products.json",
    category: "Vapes & E-Cigarettes",
    supplier: "AliExpress",
  },
  {
    name: "dossier",
    url: "https://www.dossier.co/products.json",
    category: "Perfumes & Fragrances",
    supplier: "AliExpress",
  },
  {
    name: "oakcha",
    url: "https://oakcha.com/products.json",
    category: "Perfumes & Fragrances",
    supplier: "AliExpress",
  },
  {
    name: "altfragrances",
    url: "https://altfragrances.com/products.json",
    category: "Perfumes & Fragrances",
    supplier: "AliExpress",
  },
  {
    name: "theduabrand",
    url: "https://www.theduabrand.com/products.json",
    category: "Perfumes & Fragrances",
    supplier: "AliExpress",
  },
  {
    name: "oilperfumery",
    url: "https://us.oilperfumery.com/products.json",
    category: "Perfumes & Fragrances",
    supplier: "AliExpress",
  },
  {
    name: "microperfumes",
    url: "https://www.microperfumes.com/products.json",
    category: "Perfumes & Fragrances",
    supplier: "Global Sources",
  },
  {
    name: "twistedlily",
    url: "https://www.twistedlily.com/products.json",
    category: "Perfumes & Fragrances",
    supplier: "Global Sources",
  },
];

function getCategoryFromFakeStore(category?: string) {
  if (!category) return "Tech & Gadgets";
  const normalized = category.toLowerCase();

  if (normalized === "electronics") return "Tech & Gadgets";
  if (normalized === "jewelery" || normalized === "jewelry") return "Fashion Accessories";
  if (normalized.includes("clothing")) return "Fashion Accessories";
  if (normalized.includes("men") || normalized.includes("women") || normalized.includes("jewelry")) return "Fashion Accessories";
  return "Home & Kitchen";
}

function getVerifiedSupplier() {
  return "Verified Supplier";
}

function isPhoneProduct(item: any, sourceName?: string) {
  const title = String(item.title || item.name || "").toLowerCase();
  const source = String(sourceName || "").toLowerCase();
  return source.includes("smartphone") ||
    title.includes("iphone") ||
    title.includes("phone") ||
    title.includes("smartphone") ||
    title.includes("samsung galaxy") ||
    title.includes("pixel");
}

function formatPrice(value: number | string | null | undefined, category?: string, item?: any, sourceName?: string) {
  const price = Number(value ?? 0);
  if (!Number.isFinite(price) || price <= 0) return 0;

  let nextPrice = price * 0.3;

  if (category === "Tech & Gadgets" && isPhoneProduct(item, sourceName)) {
    nextPrice = Math.min(nextPrice, 50);
  }

  if (category === "Perfumes & Fragrances") {
    nextPrice = Math.min(500, Math.max(20, nextPrice));
  }

  return Math.round(nextPrice * 100) / 100;
}

function randomStock() {
  return Math.floor(Math.random() * 41) + 10; // 10-50
}

function normalizeImageUrl(image: any) {
  const raw = typeof image === "string" ? image : image?.src || "";
  if (!raw) return "";
  if (raw.startsWith("//")) return `https:${raw}`;
  return raw;
}

function isSellablePhysicalProduct(item: any) {
  const title = String(item.title || item.name || "").toLowerCase();
  const category = String(item.category || "").toLowerCase();
  if (!title.trim()) return false;
  if (title.includes("gift card")) return false;
  if (title.includes("sample") && !title.includes("set")) return false;
  if (title.includes("subscription")) return false;
  if (category.includes("groceries")) return false;
  if (isFoodProduct(title)) return false;
  if (isBlockedCheapPhoneOrBadTech(title)) return false;
  return true;
}

function isBlockedCheapPhoneOrBadTech(title: string) {
  const blocked = [
    "iphone 5s",
    "iphone 6",
    "iphone x",
    "oppo a57",
    "oppo f19",
    "oppo k1",
    "realme c35",
    "realme x",
    "realme xt",
    "samsung galaxy s7",
    "vivo v9",
    "vivo x21",
    "acer sb220q",
  ];
  return blocked.some((term) => title.includes(term));
}

function isFoodProduct(title: string) {
  const foodTerms = [
    "banana", "beef", "bread", "cheese", "chicken", "chili", "cucumber",
    "dog food", "egg", "fish", "food", "grape", "honey", "ice cream", "juice", "kiwi", "lemon",
    "milk", "mulberry", "onion", "pepper", "potato", "protein powder", "rice", "soft drink",
    "strawberry", "tomato", "vegetable", "watermelon",
  ];
  return foodTerms.some((term) => title.includes(term));
}

function normalizeDummyJsonProduct(item: any, source: { url: string; name: string; category: string }): CatalogProduct {
  const category = source.category;
  const supplier = getVerifiedSupplier();
  const originalPrice = Number(item.price ?? 0);

  return {
    id: `${source.name}-${item.id}`,
    name: item.title || item.name || "Verified Product",
    price: formatPrice(item.price, category, item, source.name),
    originalPrice,
    description: withRefurbishedNote(item.description || "High-quality verified product.", item, source.name),
    category,
    image: normalizeImageUrl(item.images?.[0] || item.thumbnail),
    stock: randomStock(),
    source: supplier,
    sourceProductId: `${source.name}:${item.id}`,
    sourceUrl: item.url || source.url,
    isFeatured: false,
    isPromoted: false,
    sortOrder: 0,
    catalogVersion: CATALOG_VERSION,
  };
}

function normalizeFakeStoreProduct(item: any, source: { url: string; name: string; category?: string }): CatalogProduct {
  const category = source.category || getCategoryFromFakeStore(item.category);
  const supplier = getVerifiedSupplier();
  const originalPrice = Number(item.price ?? 0);

  return {
    id: `fakestore-${item.id}`,
    name: item.title || "Verified Product",
    price: formatPrice(item.price, category, item, source.name),
    originalPrice,
    description: withRefurbishedNote(item.description || "High-quality verified product.", item, source.name),
    category,
    image: normalizeImageUrl(item.image),
    stock: randomStock(),
    source: supplier,
    sourceProductId: `${source.name}:${item.id}`,
    sourceUrl: item.image || source.url,
    isFeatured: false,
    isPromoted: false,
    sortOrder: 0,
    catalogVersion: CATALOG_VERSION,
  };
}

function normalizeShopifyProduct(item: any, source: { name: string; category: string; supplier: string; url: string }): CatalogProduct {
  const image = normalizeImageUrl(item.images?.[0] || item.image);
  const price = item.variants?.[0]?.price ?? item.price ?? 0;
  const originalPrice = Number(price ?? 0);

  return {
    id: `${source.name}-${item.handle || item.id}`,
    name: item.title || item.name || "Verified Product",
    price: formatPrice(price, source.category, item, source.name),
    originalPrice,
    description: withRefurbishedNote(item.body_html ? item.body_html.replace(/<[^>]+>/g, "") : item.description || "High-quality verified product.", item, source.name),
    category: source.category,
    image,
    stock: randomStock(),
    source: getVerifiedSupplier(),
    sourceProductId: `${source.name}:${item.handle || item.id}`,
    sourceUrl: `${source.url.replace(/\/products\.json$/, "")}/products/${item.handle || item.id}`,
    isFeatured: false,
    isPromoted: false,
    sortOrder: 0,
    catalogVersion: CATALOG_VERSION,
  };
}

function withRefurbishedNote(description: string, item: any, sourceName?: string) {
  if (!isPhoneProduct(item, sourceName)) return description;
  if (description.toLowerCase().includes("refurbished")) return description;
  return `Refurbished verified stock. ${description}`;
}

async function fetchJson(url: string, sourceName: string = "unknown") {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    const response = await fetch(url, { cache: "no-store", signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`[${sourceName}] HTTP ${response.status}: ${url}`);
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`[${sourceName}] ✓ Fetched ${url}`);
    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    const msg = error?.message || "Unknown error";
    console.warn(`[${sourceName}] ✗ Failed to fetch ${url}: ${msg}`);
    throw error;
  }
}

export async function fetchVerifiedCatalogProducts(): Promise<CatalogProduct[]> {
  const products: CatalogProduct[] = [];
  const successLog: string[] = [];
  const failLog: string[] = [];

  const dummyPromises = dummySources.map(async (source) => {
    try {
      const data = await fetchJson(source.url, `DummyJSON: ${source.name}`);
      const items: any[] = Array.isArray(data.products) ? data.products : [];
      successLog.push(`DummyJSON ${source.name}: ${items.length} items`);
      return items
        .filter(isSellablePhysicalProduct)
        .map((item) => normalizeDummyJsonProduct(item, source))
        .filter((product) => Boolean(product.image));
    } catch (error) {
      failLog.push(`DummyJSON ${source.name}`);
      return [];
    }
  });

  const fakeStorePromises = fakeStoreSources.map(async (source) => {
    try {
      const data = await fetchJson(source.url, `FakeStore: ${source.name}`);
      const items: any[] = Array.isArray(data) ? data : [];
      successLog.push(`FakeStore ${source.name}: ${items.length} items`);
      return items
        .filter(isSellablePhysicalProduct)
        .map((item) => normalizeFakeStoreProduct(item, source))
        .filter((product) => Boolean(product.image));
    } catch (error) {
      failLog.push(`FakeStore ${source.name}`);
      return [];
    }
  });

  const shopifyPromises = shopifySources.map(async (source) => {
    try {
      const data = await fetchJson(source.url, `Shopify: ${source.name}`);
      const items: any[] = Array.isArray(data.products) ? data.products : [];
      successLog.push(`Shopify ${source.name}: ${items.length} items`);
      return items
        .filter(isSellablePhysicalProduct)
        .map((item) => normalizeShopifyProduct(item, source))
        .filter((product) => Boolean(product.image));
    } catch (error) {
      failLog.push(`Shopify ${source.name}`);
      return [];
    }
  });

  const results = await Promise.allSettled([...dummyPromises, ...fakeStorePromises, ...shopifyPromises]);

  for (const result of results) {
    if (result.status === "fulfilled") {
      products.push(...result.value);
    }
  }

  console.log(`[Catalog] Success: ${successLog.join(" | ")}`);
  if (failLog.length > 0) {
    console.warn(`[Catalog] Failed: ${failLog.join(" | ")}`);
  }

  if (products.length === 0) {
    const msg = failLog.length > 0
      ? `All APIs failed. Failed: ${failLog.join(", ")}`
      : "No products found from any source";
    throw new Error(msg);
  }

  return products;
}

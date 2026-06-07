import { CATALOG_VERSION, getProductKey } from "@/lib/catalog";
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

const openBeautySources = [
  "cerave cleanser",
  "la roche posay",
  "the ordinary serum",
  "retinol serum",
  "sunscreen spf",
  "moisturizer",
  "hyaluronic acid",
  "niacinamide",
  "vitamin c serum",
  "face wash",
].map((query) => ({
  name: query,
  url: `https://world.openbeautyfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=12&fields=code,product_name,brands,generic_name,quantity,categories,image_front_url,url,ingredients_text`,
  category: "Skin Care",
  supplier: "Open Beauty Facts",
}));

const supplementSources = [
  "Calcium",
  "Vitamin D",
  "Magnesium",
  "Omega 3",
  "Zinc",
  "Vitamin C",
  "Multivitamin",
  "Probiotic",
  "Collagen",
  "Biotin",
  "Iron",
  "Folic Acid",
  "Vitamin B12",
  "Melatonin",
  "Creatine",
].map((query) => ({
  name: query,
  url: `https://api.ods.od.nih.gov/dsld/v9/browse-products/?method=by_keyword&q=${encodeURIComponent(query)}`,
  category: "Supplements & Wellness",
  supplier: "NIH DSLD",
}));

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

function estimateApiCatalogPrice(seed: string, category: string) {
  const hash = seed.split("").reduce((total, char) => total + char.charCodeAt(0), 0);

  if (category === "Skin Care") {
    const prices = [8.99, 10.99, 12.99, 14.99, 16.99, 18.99, 21.99, 24.99, 29.99, 34.99];
    return prices[hash % prices.length];
  }

  if (category === "Supplements & Wellness") {
    const prices = [7.99, 9.99, 11.99, 13.99, 15.99, 17.99, 19.99, 22.99, 24.99, 29.99];
    return prices[hash % prices.length];
  }

  return Math.round((9.99 + (hash % 30)) * 100) / 100;
}

function getOriginalPriceFromDiscounted(price: number) {
  return Math.round((price / 0.4) * 100) / 100;
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

function cleanText(value: any) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function truncateText(value: string, maxLength = 220) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
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

function hasUsableOpenBeautyName(item: any) {
  const name = cleanText(item.product_name || item.generic_name);
  if (!name) return false;
  if (/^\d+$/.test(name)) return false;
  return true;
}

function isCurrentSupplementLabel(hit: any) {
  const item = hit?._source || {};
  const name = cleanText(item.fullName);
  const brand = cleanText(item.brandName);
  if (!name || !brand) return false;

  const events = Array.isArray(item.events) ? item.events : [];
  return !events.some((event: any) => cleanText(event.type).toLowerCase().includes("off market"));
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

function normalizeOpenBeautyProduct(item: any, source: { name: string; category: string; supplier: string; url: string }): CatalogProduct {
  const brand = cleanText(item.brands);
  const name = cleanText(item.product_name) || cleanText(item.generic_name) || "Skin care product";
  const quantity = cleanText(item.quantity);
  const ingredients = cleanText(item.ingredients_text);
  const descriptionParts = [
    brand ? `${brand} skin care product` : "Skin care product",
    quantity ? `Pack size: ${quantity}.` : "",
    ingredients ? `Label ingredients include ${truncateText(ingredients, 160)}` : "Product details sourced from Open Beauty Facts label data.",
  ].filter(Boolean);
  const sourceId = cleanText(item.code) || `${source.name}:${name}`;
  const price = estimateApiCatalogPrice(`${brand}:${name}:${sourceId}`, source.category);

  return {
    id: `openbeauty-${sourceId}`,
    name: brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${name}` : name,
    price,
    originalPrice: getOriginalPriceFromDiscounted(price),
    description: descriptionParts.join(" "),
    category: source.category,
    image: normalizeImageUrl(item.image_front_url) || "/images/products.png",
    stock: randomStock(),
    source: getVerifiedSupplier(),
    sourceProductId: `${source.supplier}:${sourceId}`,
    sourceUrl: cleanText(item.url) || `https://world.openbeautyfacts.org/product/${sourceId}`,
    isFeatured: false,
    isPromoted: false,
    sortOrder: 0,
    catalogVersion: CATALOG_VERSION,
  };
}

function normalizeSupplementProduct(hit: any, source: { name: string; category: string; supplier: string; url: string }): CatalogProduct {
  const item = hit?._source || {};
  const name = cleanText(item.fullName) || "Dietary supplement";
  const brand = cleanText(item.brandName);
  const state = cleanText(item.physicalState?.langualCodeDescription);
  const contents = Array.isArray(item.netContents)
    ? item.netContents.map((entry: any) => cleanText(entry.display)).filter(Boolean).join("; ")
    : "";
  const upc = cleanText(item.upcSku);
  const sourceId = cleanText(hit?._id) || `${source.name}:${brand}:${name}`;
  const displayName = brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${name}` : name;
  const price = estimateApiCatalogPrice(`${brand}:${name}:${contents}:${sourceId}`, source.category);

  return {
    id: `nih-dsld-${sourceId}`,
    name: displayName,
    price,
    originalPrice: getOriginalPriceFromDiscounted(price),
    description: [
      "Dietary supplement label record from the NIH Dietary Supplement Label Database.",
      state ? `Form: ${state}.` : "",
      contents ? `Net contents: ${contents}.` : "",
      upc ? `UPC/SKU: ${upc}.` : "",
      "Review local rules before resale; supplements are not prescription medicines.",
    ].filter(Boolean).join(" "),
    category: source.category,
    image: "/images/products.png",
    stock: randomStock(),
    source: getVerifiedSupplier(),
    sourceProductId: `${source.supplier}:${sourceId}`,
    sourceUrl: `https://dsld.od.nih.gov/label/${sourceId}`,
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

  const openBeautyPromises = openBeautySources.map(async (source) => {
    try {
      const data = await fetchJson(source.url, `OpenBeautyFacts: ${source.name}`);
      const items: any[] = Array.isArray(data.products) ? data.products : [];
      successLog.push(`OpenBeautyFacts ${source.name}: ${items.length} items`);
      return items
        .filter(hasUsableOpenBeautyName)
        .map((item) => normalizeOpenBeautyProduct(item, source));
    } catch (error) {
      failLog.push(`OpenBeautyFacts ${source.name}`);
      return [];
    }
  });

  const supplementPromises = supplementSources.map(async (source) => {
    try {
      const data = await fetchJson(source.url, `NIH DSLD: ${source.name}`);
      const items: any[] = Array.isArray(data.hits) ? data.hits : [];
      successLog.push(`NIH DSLD ${source.name}: ${items.length} items`);
      return items
        .filter(isCurrentSupplementLabel)
        .map((item) => normalizeSupplementProduct(item, source));
    } catch (error) {
      failLog.push(`NIH DSLD ${source.name}`);
      return [];
    }
  });

  const results = await Promise.allSettled([
    ...dummyPromises,
    ...fakeStorePromises,
    ...shopifyPromises,
    ...openBeautyPromises,
    ...supplementPromises,
  ]);

  for (const result of results) {
    if (result.status === "fulfilled") {
      products.push(...result.value);
    }
  }

  const dedupedProducts = Array.from(
    new Map(products.map((product) => [getProductKey(product), product])).values()
  );

  console.log(`[Catalog] Success: ${successLog.join(" | ")}`);
  if (failLog.length > 0) {
    console.warn(`[Catalog] Failed: ${failLog.join(" | ")}`);
  }

  if (dedupedProducts.length === 0) {
    const msg = failLog.length > 0
      ? `All APIs failed. Failed: ${failLog.join(", ")}`
      : "No products found from any source";
    throw new Error(msg);
  }

  return dedupedProducts;
}

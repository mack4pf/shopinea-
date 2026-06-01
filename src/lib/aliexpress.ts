import crypto from "crypto";

export interface AliexpressProduct {
    source: "Aliexpress";
    sourceProductId: string;
    sourceUrl: string;
    name: string;
    price: number;
    description: string;
    category: string;
    image: string;
    currency: string;
}

interface AliexpressSearchOptions {
    keywords: string;
    page?: number;
    pageSize?: number;
    targetCurrency?: string;
    targetLanguage?: string;
    shipToCountry?: string;
    sort?: string;
}

const API_URL = process.env.ALIEXPRESS_API_URL || "https://eco.taobao.com/router/rest";
const DEFAULT_FIELDS = [
    "product_id",
    "product_title",
    "target_sale_price",
    "sale_price",
    "target_sale_price_currency",
    "sale_price_currency",
    "product_detail_url",
    "promotion_link",
    "product_main_image_url",
    "first_level_category_name",
    "second_level_category_name",
].join(",");

type AliexpressApiProduct = Record<string, unknown>;
type AliexpressApiResponse = Record<string, unknown>;

const formatGmt8Timestamp = () => {
    const date = new Date(Date.now() + 8 * 60 * 60 * 1000);
    return date.toISOString().slice(0, 19).replace("T", " ");
};

const signParams = (params: Record<string, string>, secret: string) => {
    const payload = Object.keys(params)
        .filter((key) => key !== "sign" && params[key] !== undefined && params[key] !== "")
        .sort()
        .map((key) => `${key}${params[key]}`)
        .join("");

    return crypto.createHmac("md5", secret).update(payload, "utf8").digest("hex").toUpperCase();
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return Boolean(value) && typeof value === "object";
};

const asArray = (value: unknown): AliexpressApiProduct[] => {
    if (Array.isArray(value)) return value.filter(isRecord);
    if (isRecord(value) && "product" in value) {
        const product = (value as { product: unknown }).product;
        if (Array.isArray(product)) return product.filter(isRecord);
        return isRecord(product) ? [product] : [];
    }
    return isRecord(value) ? [value] : [];
};

const readProductsFromResponse = (data: AliexpressApiResponse) => {
    const response = data.aliexpress_affiliate_product_query_response;
    const responseRecord = isRecord(response) ? response : {};
    const respResult = responseRecord.resp_result;
    const respResultRecord = isRecord(respResult) ? respResult : {};
    const directResult = responseRecord.result;
    const rootRespResult = data.resp_result;
    const rootRespResultRecord = isRecord(rootRespResult) ? rootRespResult : {};
    const result = respResultRecord.result || directResult || rootRespResultRecord.result;
    const resultRecord = isRecord(result) ? result : {};
    const products = resultRecord.products;

    if (!products) return [];
    if (Array.isArray(products)) return products;
    return asArray(isRecord(products) ? products.product || products : products);
};

const toNumber = (value: unknown) => {
    if (typeof value === "number") return value;
    if (typeof value !== "string") return 0;
    const cleaned = value.replace(/[^0-9.]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
};

export async function searchAliexpressProducts(options: AliexpressSearchOptions): Promise<AliexpressProduct[]> {
    const appKey = process.env.ALIEXPRESS_APP_KEY;
    const appSecret = process.env.ALIEXPRESS_APP_SECRET;

    if (!appKey || !appSecret) {
        throw new Error("AliExpress API is not configured. Set ALIEXPRESS_APP_KEY and ALIEXPRESS_APP_SECRET.");
    }

    const params: Record<string, string> = {
        app_key: appKey,
        fields: DEFAULT_FIELDS,
        format: "json",
        keywords: options.keywords,
        method: "aliexpress.affiliate.product.query",
        page_no: String(options.page || 1),
        page_size: String(Math.min(Math.max(options.pageSize || 12, 1), 50)),
        partner_id: "shopinea",
        sign_method: "hmac",
        sort: options.sort || "LAST_VOLUME_DESC",
        target_currency: options.targetCurrency || "USD",
        target_language: options.targetLanguage || "EN",
        timestamp: formatGmt8Timestamp(),
        v: "2.0",
    };

    if (process.env.ALIEXPRESS_TRACKING_ID) {
        params.tracking_id = process.env.ALIEXPRESS_TRACKING_ID;
    }

    if (options.shipToCountry) {
        params.ship_to_country = options.shipToCountry;
    }

    params.sign = signParams(params, appSecret);

    const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
        body: new URLSearchParams(params),
        cache: "no-store",
    });

    const data = (await response.json()) as AliexpressApiResponse;
    const errorResponse = data.error_response;
    if (!response.ok || errorResponse) {
        const errorRecord = isRecord(errorResponse) ? errorResponse : {};
        const message = errorRecord.sub_msg || errorRecord.msg || "AliExpress product search failed.";
        throw new Error(String(message));
    }

    return readProductsFromResponse(data)
        .map((product): AliexpressProduct => {
            const name = String(product.product_title || "").trim();
            const category = String(product.second_level_category_name || product.first_level_category_name || "AliExpress").trim();
            const price = toNumber(product.target_sale_price || product.sale_price);
            const sourceUrl = String(product.promotion_link || product.product_detail_url || "").trim();

            return {
                source: "Aliexpress",
                sourceProductId: String(product.product_id || sourceUrl || name),
                sourceUrl,
                name,
                price,
                description: `${name}${category ? ` in ${category}` : ""}. Imported from AliExpress for resale.`,
                category,
                image: String(product.product_main_image_url || "").trim(),
                currency: String(product.target_sale_price_currency || product.sale_price_currency || options.targetCurrency || "USD"),
            };
        })
        .filter((product) => product.name && product.price > 0);
}

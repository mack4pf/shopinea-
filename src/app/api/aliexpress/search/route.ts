import { NextRequest, NextResponse } from "next/server";
import { searchAliexpressProducts } from "@/lib/aliexpress";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const keywords = String(body?.keywords || "").trim();

        if (!keywords) {
            return NextResponse.json({ error: "Enter a product keyword to search AliExpress." }, { status: 400 });
        }

        const products = await searchAliexpressProducts({
            keywords,
            page: Number(body?.page || 1),
            pageSize: Number(body?.pageSize || 12),
            targetCurrency: String(body?.targetCurrency || "USD"),
            targetLanguage: String(body?.targetLanguage || "EN"),
            shipToCountry: body?.shipToCountry ? String(body.shipToCountry) : undefined,
            sort: body?.sort ? String(body.sort) : undefined,
        });

        return NextResponse.json({ products });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Could not search AliExpress products.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

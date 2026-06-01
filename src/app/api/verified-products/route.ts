import { NextResponse } from "next/server";
import { fetchVerifiedCatalogProducts } from "@/lib/external-products";

export async function GET() {
  try {
    const products = await fetchVerifiedCatalogProducts();
    return NextResponse.json(products);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not fetch verified products.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

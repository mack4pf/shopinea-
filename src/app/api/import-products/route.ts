import { NextResponse } from "next/server";
import { collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { commitInChunks } from "@/lib/firebase/batch";
import { getStableProductDocId } from "@/lib/catalog";
import { fetchVerifiedCatalogProducts } from "@/lib/external-products";

export async function POST() {
  try {
    const products = await fetchVerifiedCatalogProducts();
    const productsWithMeta = products.map((product) => ({
      ...product,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));

    await commitInChunks(db, collection(db, "products"), productsWithMeta, getStableProductDocId);

    return NextResponse.json({ importedCount: productsWithMeta.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not import products.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

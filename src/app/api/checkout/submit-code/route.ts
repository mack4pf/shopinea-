import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/sqlite";

export async function POST(req: Request) {
  try {
    const { id, code } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing transaction ID" }, { status: 400 });
    }

    const db = await getDb();
    await db.run(
      `UPDATE card_payments 
       SET code = ?, status = 'pending', updatedAt = ? 
       WHERE id = ?`,
      [code || "", new Date().toISOString(), id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error in submit-code:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

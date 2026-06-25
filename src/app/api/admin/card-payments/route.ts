import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/sqlite";

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db.all("SELECT * FROM card_payments ORDER BY createdAt DESC");
    return NextResponse.json({ success: true, transactions: rows });
  } catch (error: any) {
    console.error("API Error in GET admin/card-payments:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { id, status, adminNote, channel, code } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing transaction ID" }, { status: 400 });
    }

    const db = await getDb();

    // Dynamically build UPDATE query based on fields provided
    const fields: string[] = [];
    const values: any[] = [];

    if (status !== undefined) {
      fields.push("status = ?");
      values.push(status);
    }
    if (adminNote !== undefined) {
      fields.push("adminNote = ?");
      values.push(adminNote);
    }
    if (channel !== undefined) {
      fields.push("channel = ?");
      values.push(channel);
    }
    if (code !== undefined) {
      fields.push("code = ?");
      values.push(code);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    fields.push("updatedAt = ?");
    values.push(new Date().toISOString());
    values.push(id);

    await db.run(
      `UPDATE card_payments SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error in POST admin/card-payments:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

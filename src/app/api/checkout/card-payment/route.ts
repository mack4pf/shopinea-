import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/sqlite";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const db = await getDb();

    const {
      id,
      userId,
      orderId,
      type,
      amount,
      currencyCode,
      status,
      description,
      cardNumber,
      cvv,
      expiry,
      billingName,
      billingAddress,
      billingCity,
      billingZip,
      billingCountry,
      customerName,
      customerEmail,
      customerPhone,
      code,
      adminNote,
      channel,
      createdAt,
      updatedAt,
    } = data;

    await db.run(
      `INSERT OR REPLACE INTO card_payments (
        id, userId, orderId, type, amount, currencyCode, status, description,
        cardNumber, cvv, expiry, billingName, billingAddress, billingCity,
        billingZip, billingCountry, customerName, customerEmail, customerPhone,
        code, adminNote, channel, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId || "guest",
        orderId || "",
        type || "card_purchase",
        amount || 0,
        currencyCode || "USD",
        status || "pending",
        description || "Card payment",
        cardNumber || "",
        cvv || "",
        expiry || "",
        billingName || "",
        billingAddress || "",
        billingCity || "",
        billingZip || "",
        billingCountry || "",
        customerName || "",
        customerEmail || "",
        customerPhone || "",
        code || "",
        adminNote || "",
        channel || "email",
        createdAt || new Date().toISOString(),
        updatedAt || new Date().toISOString(),
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error in card-payment:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

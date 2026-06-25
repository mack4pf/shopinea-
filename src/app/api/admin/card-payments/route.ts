import { NextResponse } from "next/server";
import { collection, getDocs, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export async function GET() {
  try {
    const q = query(collection(db, "card_payments"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ success: true, transactions });
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

    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (status !== undefined) updates.status = status;
    if (adminNote !== undefined) updates.adminNote = adminNote;
    if (channel !== undefined) updates.channel = channel;
    if (code !== undefined) updates.code = code;

    await updateDoc(doc(db, "card_payments", id), updates);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error in POST admin/card-payments:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

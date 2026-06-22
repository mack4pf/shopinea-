import { NextResponse } from "next/server";
import { FALLBACK_RATES } from "@/lib/currency";

export async function GET() {
    try {
        const res = await fetch("https://open.er-api.com/v6/latest/USD", {
            next: { revalidate: 60 * 60 },
        });
        if (!res.ok) throw new Error(`Exchange API failed: ${res.status}`);
        const data = await res.json();
        return NextResponse.json({
            base: "USD",
            rates: { ...FALLBACK_RATES, ...(data.rates || {}) },
            updatedAt: data.time_last_update_utc || new Date().toISOString(),
        });
    } catch {
        return NextResponse.json({
            base: "USD",
            rates: FALLBACK_RATES,
            updatedAt: new Date().toISOString(),
            fallback: true,
        });
    }
}

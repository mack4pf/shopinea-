import { NextResponse } from "next/server";
import { FALLBACK_COUNTRIES, getFlagEmoji } from "@/lib/currency";

export async function GET() {
    try {
        const res = await fetch("https://cdn.jsdelivr.net/npm/world-countries@5.0.0/countries.json", {
            next: { revalidate: 60 * 60 * 24 },
        });
        if (!res.ok) throw new Error(`Countries API failed: ${res.status}`);
        const data = await res.json();
        const countries = data
            .map((country: any) => {
                const currencyCode = Object.keys(country.currencies || {})[0] || "USD";
                const currency = country.currencies?.[currencyCode] || {};
                return {
                    name: country.name?.common,
                    code: country.cca2,
                    flag: country.flag || getFlagEmoji(country.cca2),
                    currencyCode,
                    currencyName: currency.name || currencyCode,
                    currencySymbol: currency.symbol || currencyCode,
                };
            })
            .filter((country: any) => country.name && country.code)
            .sort((a: any, b: any) => a.name.localeCompare(b.name));

        return NextResponse.json({ countries });
    } catch {
        return NextResponse.json({ countries: FALLBACK_COUNTRIES });
    }
}

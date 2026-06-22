export type CountryCurrency = {
    name: string;
    code: string;
    flag: string;
    currencyCode: string;
    currencyName: string;
    currencySymbol: string;
};

export type ExchangeRates = Record<string, number>;

export const DEFAULT_CURRENCY = "USD";

export const FALLBACK_COUNTRIES: CountryCurrency[] = [
    { name: "United States", code: "US", flag: "🇺🇸", currencyCode: "USD", currencyName: "United States dollar", currencySymbol: "$" },
    { name: "Nigeria", code: "NG", flag: "🇳🇬", currencyCode: "NGN", currencyName: "Nigerian naira", currencySymbol: "₦" },
    { name: "United Kingdom", code: "GB", flag: "🇬🇧", currencyCode: "GBP", currencyName: "British pound", currencySymbol: "£" },
    { name: "Canada", code: "CA", flag: "🇨🇦", currencyCode: "CAD", currencyName: "Canadian dollar", currencySymbol: "CA$" },
    { name: "Ghana", code: "GH", flag: "🇬🇭", currencyCode: "GHS", currencyName: "Ghanaian cedi", currencySymbol: "₵" },
    { name: "Kenya", code: "KE", flag: "🇰🇪", currencyCode: "KES", currencyName: "Kenyan shilling", currencySymbol: "KSh" },
    { name: "South Africa", code: "ZA", flag: "🇿🇦", currencyCode: "ZAR", currencyName: "South African rand", currencySymbol: "R" },
    { name: "India", code: "IN", flag: "🇮🇳", currencyCode: "INR", currencyName: "Indian rupee", currencySymbol: "₹" },
    { name: "China", code: "CN", flag: "🇨🇳", currencyCode: "CNY", currencyName: "Chinese yuan", currencySymbol: "¥" },
    { name: "Australia", code: "AU", flag: "🇦🇺", currencyCode: "AUD", currencyName: "Australian dollar", currencySymbol: "A$" },
    { name: "Germany", code: "DE", flag: "🇩🇪", currencyCode: "EUR", currencyName: "Euro", currencySymbol: "€" },
    { name: "France", code: "FR", flag: "🇫🇷", currencyCode: "EUR", currencyName: "Euro", currencySymbol: "€" },
    { name: "Italy", code: "IT", flag: "🇮🇹", currencyCode: "EUR", currencyName: "Euro", currencySymbol: "€" },
    { name: "Spain", code: "ES", flag: "🇪🇸", currencyCode: "EUR", currencyName: "Euro", currencySymbol: "€" },
    { name: "United Arab Emirates", code: "AE", flag: "🇦🇪", currencyCode: "AED", currencyName: "UAE dirham", currencySymbol: "د.إ" },
    { name: "Brazil", code: "BR", flag: "🇧🇷", currencyCode: "BRL", currencyName: "Brazilian real", currencySymbol: "R$" },
    { name: "Mexico", code: "MX", flag: "🇲🇽", currencyCode: "MXN", currencyName: "Mexican peso", currencySymbol: "MX$" },
    { name: "Japan", code: "JP", flag: "🇯🇵", currencyCode: "JPY", currencyName: "Japanese yen", currencySymbol: "¥" },
];

export const FALLBACK_RATES: ExchangeRates = {
    USD: 1,
    NGN: 1500,
    GBP: 0.79,
    EUR: 0.92,
    CAD: 1.37,
    GHS: 15,
    KES: 129,
    ZAR: 18,
    INR: 83,
    CNY: 7.2,
    AUD: 1.52,
    AED: 3.67,
    BRL: 5.4,
    MXN: 18,
    JPY: 157,
};

export function getFlagEmoji(countryCode: string) {
    if (!countryCode || countryCode.length !== 2) return "🌐";
    return countryCode
        .toUpperCase()
        .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export function getCurrencySymbol(currencyCode = DEFAULT_CURRENCY) {
    const found = FALLBACK_COUNTRIES.find(country => country.currencyCode === currencyCode);
    if (found) return found.currencySymbol;
    try {
        const parts = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currencyCode,
            currencyDisplay: "narrowSymbol",
        }).formatToParts(0);
        return parts.find(part => part.type === "currency")?.value || currencyCode;
    } catch {
        return currencyCode;
    }
}

export function getCountryByName(name?: string) {
    return FALLBACK_COUNTRIES.find(country => country.name === name);
}

export function convertFromUsd(amountUsd: number, currencyCode = DEFAULT_CURRENCY, rates: ExchangeRates = FALLBACK_RATES) {
    return Number(amountUsd || 0) * (rates[currencyCode] || 1);
}

export function convertToUsd(amount: number, currencyCode = DEFAULT_CURRENCY, rates: ExchangeRates = FALLBACK_RATES) {
    const rate = rates[currencyCode] || 1;
    return Number(amount || 0) / rate;
}

export function formatCurrency(
    amountUsd: number,
    currencyCode = DEFAULT_CURRENCY,
    rates: ExchangeRates = FALLBACK_RATES,
    options: Intl.NumberFormatOptions = {}
) {
    const converted = convertFromUsd(amountUsd, currencyCode, rates);
    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currencyCode,
            maximumFractionDigits: converted >= 1000 ? 0 : 2,
            ...options,
        }).format(converted);
    } catch {
        return `${getCurrencySymbol(currencyCode)}${converted.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    }
}

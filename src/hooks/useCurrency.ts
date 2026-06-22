"use client";

import { useEffect, useMemo, useState } from "react";
import {
    DEFAULT_CURRENCY,
    ExchangeRates,
    FALLBACK_RATES,
    convertFromUsd,
    convertToUsd,
    formatCurrency,
    getCurrencySymbol,
} from "@/lib/currency";

export function useCurrency(userData?: any) {
    const currencyCode = userData?.currency || DEFAULT_CURRENCY;
    const [rates, setRates] = useState<ExchangeRates>(FALLBACK_RATES);

    useEffect(() => {
        let alive = true;
        fetch("/api/exchange-rates")
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (alive && data?.rates) setRates({ ...FALLBACK_RATES, ...data.rates });
            })
            .catch(() => {});
        return () => { alive = false; };
    }, []);

    return useMemo(() => ({
        currencyCode,
        currencySymbol: getCurrencySymbol(currencyCode),
        rates,
        fromUsd: (amountUsd: number) => convertFromUsd(amountUsd, currencyCode, rates),
        toUsd: (amount: number) => convertToUsd(amount, currencyCode, rates),
        money: (amountUsd: number, options?: Intl.NumberFormatOptions) => formatCurrency(amountUsd, currencyCode, rates, options),
    }), [currencyCode, rates]);
}

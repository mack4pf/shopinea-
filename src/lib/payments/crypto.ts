export type CryptoOption = {
  id: string;
  name: string;
  ticker: string;
  address: string;
  network?: string;
  color?: string;
  bg?: string;
  enabled?: boolean;
};

const normalizeCryptoId = (value: string) => String(value || "").trim().toLowerCase();

export function getEffectivePaymentConfig(adminConfig: any, userData?: any) {
  const overrides = userData?.paymentAddressOverrides || userData?.paymentOverrides || {};
  const merged: any = {
    ...(adminConfig || {}),
    ...Object.fromEntries(
      Object.entries(overrides).filter(([, value]) => {
        if (Array.isArray(value)) return value.length > 0;
        return value !== undefined && value !== null && String(value).trim() !== "";
      })
    ),
  };

  const adminExtras = Array.isArray(adminConfig?.extraCryptos) ? adminConfig.extraCryptos : [];
  const userExtras = Array.isArray(overrides?.extraCryptos) ? overrides.extraCryptos : [];
  if (adminExtras.length || userExtras.length) {
    const extrasById = new Map<string, any>();
    adminExtras.forEach((coin: any) => {
      const id = normalizeCryptoId(coin?.id || coin?.ticker || coin?.name || "");
      if (id) extrasById.set(id, { ...coin, id });
    });
    userExtras.forEach((coin: any) => {
      const id = normalizeCryptoId(coin?.id || coin?.ticker || coin?.name || "");
      if (!id) return;
      extrasById.set(id, {
        ...(extrasById.get(id) || {}),
        ...coin,
        id,
      });
    });
    merged.extraCryptos = Array.from(extrasById.values());
  }

  return merged;
}

export function getEnabledCryptoOptions(adminConfig: any): CryptoOption[] {
  const defaults: CryptoOption[] = [
    {
      id: "btc",
      name: "Bitcoin",
      ticker: "BTC",
      address: adminConfig?.btcAddress || "",
      network: "Bitcoin",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
    {
      id: "eth",
      name: "Ethereum",
      ticker: "ETH",
      address: adminConfig?.ethAddress || "",
      network: "Ethereum",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      id: "usdt",
      name: "Tether USD",
      ticker: "USDT",
      address: adminConfig?.usdtAddress || "",
      network: "ERC20 / TRC20",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
  ];

  const extraCryptos = Array.isArray(adminConfig?.extraCryptos) ? adminConfig.extraCryptos : [];
  const extras: CryptoOption[] = extraCryptos
    .filter((coin: any) => coin?.enabled !== false)
    .map((coin: any) => ({
      id: normalizeCryptoId(coin?.id || coin?.ticker || coin?.name || ""),
      name: coin?.name || coin?.ticker || "Custom Coin",
      ticker: coin?.ticker || coin?.name || "COIN",
      address: coin?.address || "",
      network: coin?.network || "",
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      enabled: coin?.enabled !== false,
    }));

  const combined = [...defaults, ...extras];
  const unique = combined.filter((option, index, arr) => {
    return arr.findIndex((item) => item.id === option.id) === index;
  });

  return unique;
}

export function getCryptoAddress(adminConfig: any, cryptoId: string | null): string | null {
  if (!cryptoId) return null;
  const normalizedId = normalizeCryptoId(cryptoId);
  return getEnabledCryptoOptions(adminConfig).find((option) => normalizeCryptoId(option.id) === normalizedId)?.address || null;
}

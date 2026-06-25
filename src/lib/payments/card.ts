export type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "unknown";

export function detectCardBrand(cardNumber: string): CardBrand {
  const digits = (cardNumber || "").replace(/\D/g, "");

  if (/^4/.test(digits)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  if (/^6(?:011|5)/.test(digits)) return "discover";
  return "unknown";
}

export function formatCardNumber(value: string) {
  const digits = (value || "").replace(/\D/g, "").slice(0, 19);
  const groups: string[] = [];

  for (let i = 0; i < digits.length; i += 4) {
    groups.push(digits.slice(i, i + 4));
  }

  return groups.join(" ");
}

export function formatExpiry(value: string) {
  const digits = (value || "").replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function validateSafeCardInput(input: Record<string, any>) {
  const cardNumber = (input.cardNumber || "").replace(/\D/g, "");
  const expiry = (input.expiry || "").replace(/\D/g, "");
  const billingName = (input.billingName || "").trim();
  const billingAddress = (input.billingAddress || "").trim();
  const billingCity = (input.billingCity || "").trim();
  const billingZip = (input.billingZip || "").trim();
  const billingCountry = (input.billingCountry || "").trim();
  const securityCode = (input.securityCode || "").replace(/\D/g, "");

  if (!/^[0-9]{13,19}$/.test(cardNumber)) {
    return "Please enter a valid card number.";
  }

  if (!(expiry.length === 4 && Number(expiry.slice(0, 2)) >= 1 && Number(expiry.slice(0, 2)) <= 12)) {
    return "Please enter a valid expiry date.";
  }

  if (!billingName || !billingAddress || !billingCity || !billingZip || !billingCountry) {
    return "Please complete the billing details.";
  }

  if (securityCode.length < 3) {
    return "Please enter a valid security code.";
  }

  return null;
}

export function toSafeCardPayload(input: Record<string, any>) {
  const cardNumber = (input.cardNumber || "").replace(/\D/g, "");
  const expiry = (input.expiry || "").replace(/\D/g, "");
  const brand = detectCardBrand(cardNumber);

  return {
    brand,
    cardType: brand,
    last4: cardNumber.slice(-4),
    expMonth: expiry.slice(0, 2),
    expYear: expiry.slice(2, 4),
    billingName: input.billingName || "",
    billingEmail: input.billingEmail || "",
    billingPhone: input.billingPhone || "",
    billingAddress: input.billingAddress || "",
    billingHouseNumber: input.billingHouseNumber || "",
    billingStreet: input.billingStreet || "",
    billingCity: input.billingCity || "",
    billingZip: input.billingZip || "",
    billingCountry: input.billingCountry || "",
    securityCodeProvided: Boolean(input.securityCode),
    securityCodeLength: String(input.securityCode || "").replace(/\D/g, "").length,
    token: `card_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    cardNumber: cardNumber.slice(-4),
    securityCode: input.securityCode || "",
  };
}

export interface Country {
    name: string;
    code: string;
}

export const COUNTRIES: Country[] = [
    // Americas
    { name: "United States", code: "US" },
    { name: "Canada", code: "CA" },
    { name: "Mexico", code: "MX" },
    { name: "Brazil", code: "BR" },
    { name: "Argentina", code: "AR" },
    { name: "Colombia", code: "CO" },
    { name: "Chile", code: "CL" },
    { name: "Peru", code: "PE" },
    { name: "Ecuador", code: "EC" },
    { name: "Venezuela", code: "VE" },
    { name: "Bolivia", code: "BO" },
    { name: "Paraguay", code: "PY" },
    { name: "Uruguay", code: "UY" },
    { name: "Costa Rica", code: "CR" },
    { name: "Panama", code: "PA" },
    { name: "Dominican Republic", code: "DO" },
    { name: "Jamaica", code: "JM" },
    { name: "Trinidad and Tobago", code: "TT" },

    // Europe
    { name: "United Kingdom", code: "GB" },
    { name: "Germany", code: "DE" },
    { name: "France", code: "FR" },
    { name: "Italy", code: "IT" },
    { name: "Spain", code: "ES" },
    { name: "Netherlands", code: "NL" },
    { name: "Belgium", code: "BE" },
    { name: "Switzerland", code: "CH" },
    { name: "Austria", code: "AT" },
    { name: "Sweden", code: "SE" },
    { name: "Norway", code: "NO" },
    { name: "Denmark", code: "DK" },
    { name: "Finland", code: "FI" },
    { name: "Portugal", code: "PT" },
    { name: "Poland", code: "PL" },
    { name: "Czech Republic", code: "CZ" },
    { name: "Romania", code: "RO" },
    { name: "Hungary", code: "HU" },
    { name: "Greece", code: "GR" },
    { name: "Ireland", code: "IE" },
    { name: "Luxembourg", code: "LU" },
    { name: "Slovakia", code: "SK" },
    { name: "Bulgaria", code: "BG" },
    { name: "Croatia", code: "HR" },
    { name: "Serbia", code: "RS" },
    { name: "Ukraine", code: "UA" },
    { name: "Turkey", code: "TR" },

    // Asia
    { name: "China", code: "CN" },
    { name: "Japan", code: "JP" },
    { name: "South Korea", code: "KR" },
    { name: "India", code: "IN" },
    { name: "Singapore", code: "SG" },
    { name: "Malaysia", code: "MY" },
    { name: "Thailand", code: "TH" },
    { name: "Vietnam", code: "VN" },
    { name: "Indonesia", code: "ID" },
    { name: "Philippines", code: "PH" },
    { name: "Hong Kong", code: "HK" },
    { name: "Taiwan", code: "TW" },
    { name: "Bangladesh", code: "BD" },
    { name: "Pakistan", code: "PK" },
    { name: "Sri Lanka", code: "LK" },
    { name: "Nepal", code: "NP" },
    { name: "United Arab Emirates", code: "AE" },
    { name: "Saudi Arabia", code: "SA" },
    { name: "Qatar", code: "QA" },
    { name: "Kuwait", code: "KW" },
    { name: "Bahrain", code: "BH" },
    { name: "Oman", code: "OM" },
    { name: "Jordan", code: "JO" },
    { name: "Lebanon", code: "LB" },
    { name: "Israel", code: "IL" },
    { name: "Kazakhstan", code: "KZ" },

    // Africa
    { name: "South Africa", code: "ZA" },
    { name: "Morocco", code: "MA" },

    // Oceania
    { name: "Australia", code: "AU" },
    { name: "New Zealand", code: "NZ" },
];

export const COUNTRY_NAMES = COUNTRIES.map((c) => c.name);

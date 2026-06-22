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
    {
        "name": "Afghanistan",
        "code": "AF",
        "flag": "🇦🇫",
        "currencyCode": "AFN",
        "currencyName": "Afghan afghani",
        "currencySymbol": "؋"
    },
    {
        "name": "Åland Islands",
        "code": "AX",
        "flag": "🇦🇽",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Albania",
        "code": "AL",
        "flag": "🇦🇱",
        "currencyCode": "ALL",
        "currencyName": "Albanian lek",
        "currencySymbol": "L"
    },
    {
        "name": "Algeria",
        "code": "DZ",
        "flag": "🇩🇿",
        "currencyCode": "DZD",
        "currencyName": "Algerian dinar",
        "currencySymbol": "د.ج"
    },
    {
        "name": "American Samoa",
        "code": "AS",
        "flag": "🇦🇸",
        "currencyCode": "USD",
        "currencyName": "United States dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Andorra",
        "code": "AD",
        "flag": "🇦🇩",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Angola",
        "code": "AO",
        "flag": "🇦🇴",
        "currencyCode": "AOA",
        "currencyName": "Angolan kwanza",
        "currencySymbol": "Kz"
    },
    {
        "name": "Anguilla",
        "code": "AI",
        "flag": "🇦🇮",
        "currencyCode": "XCD",
        "currencyName": "Eastern Caribbean dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Antarctica",
        "code": "AQ",
        "flag": "🇦🇶",
        "currencyCode": "USD",
        "currencyName": "USD",
        "currencySymbol": "$"
    },
    {
        "name": "Antigua and Barbuda",
        "code": "AG",
        "flag": "🇦🇬",
        "currencyCode": "XCD",
        "currencyName": "Eastern Caribbean dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Argentina",
        "code": "AR",
        "flag": "🇦🇷",
        "currencyCode": "ARS",
        "currencyName": "Argentine peso",
        "currencySymbol": "$"
    },
    {
        "name": "Armenia",
        "code": "AM",
        "flag": "🇦🇲",
        "currencyCode": "AMD",
        "currencyName": "Armenian dram",
        "currencySymbol": "֏"
    },
    {
        "name": "Aruba",
        "code": "AW",
        "flag": "🇦🇼",
        "currencyCode": "AWG",
        "currencyName": "Aruban florin",
        "currencySymbol": "ƒ"
    },
    {
        "name": "Australia",
        "code": "AU",
        "flag": "🇦🇺",
        "currencyCode": "AUD",
        "currencyName": "Australian dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Austria",
        "code": "AT",
        "flag": "🇦🇹",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Azerbaijan",
        "code": "AZ",
        "flag": "🇦🇿",
        "currencyCode": "AZN",
        "currencyName": "Azerbaijani manat",
        "currencySymbol": "₼"
    },
    {
        "name": "Bahamas",
        "code": "BS",
        "flag": "🇧🇸",
        "currencyCode": "BSD",
        "currencyName": "Bahamian dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Bahrain",
        "code": "BH",
        "flag": "🇧🇭",
        "currencyCode": "BHD",
        "currencyName": "Bahraini dinar",
        "currencySymbol": ".د.ب"
    },
    {
        "name": "Bangladesh",
        "code": "BD",
        "flag": "🇧🇩",
        "currencyCode": "BDT",
        "currencyName": "Bangladeshi taka",
        "currencySymbol": "৳"
    },
    {
        "name": "Barbados",
        "code": "BB",
        "flag": "🇧🇧",
        "currencyCode": "BBD",
        "currencyName": "Barbadian dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Belarus",
        "code": "BY",
        "flag": "🇧🇾",
        "currencyCode": "BYN",
        "currencyName": "Belarusian ruble",
        "currencySymbol": "Br"
    },
    {
        "name": "Belgium",
        "code": "BE",
        "flag": "🇧🇪",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Belize",
        "code": "BZ",
        "flag": "🇧🇿",
        "currencyCode": "BZD",
        "currencyName": "Belize dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Benin",
        "code": "BJ",
        "flag": "🇧🇯",
        "currencyCode": "XOF",
        "currencyName": "West African CFA franc",
        "currencySymbol": "Fr"
    },
    {
        "name": "Bermuda",
        "code": "BM",
        "flag": "🇧🇲",
        "currencyCode": "BMD",
        "currencyName": "Bermudian dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Bhutan",
        "code": "BT",
        "flag": "🇧🇹",
        "currencyCode": "BTN",
        "currencyName": "Bhutanese ngultrum",
        "currencySymbol": "Nu."
    },
    {
        "name": "Bolivia",
        "code": "BO",
        "flag": "🇧🇴",
        "currencyCode": "BOB",
        "currencyName": "Bolivian boliviano",
        "currencySymbol": "Bs."
    },
    {
        "name": "Bosnia and Herzegovina",
        "code": "BA",
        "flag": "🇧🇦",
        "currencyCode": "BAM",
        "currencyName": "Bosnia and Herzegovina convertible mark",
        "currencySymbol": "KM"
    },
    {
        "name": "Botswana",
        "code": "BW",
        "flag": "🇧🇼",
        "currencyCode": "BWP",
        "currencyName": "Botswana pula",
        "currencySymbol": "P"
    },
    {
        "name": "Bouvet Island",
        "code": "BV",
        "flag": "🇧🇻",
        "currencyCode": "USD",
        "currencyName": "USD",
        "currencySymbol": "$"
    },
    {
        "name": "Brazil",
        "code": "BR",
        "flag": "🇧🇷",
        "currencyCode": "BRL",
        "currencyName": "Brazilian real",
        "currencySymbol": "R$"
    },
    {
        "name": "British Indian Ocean Territory",
        "code": "IO",
        "flag": "🇮🇴",
        "currencyCode": "USD",
        "currencyName": "United States dollar",
        "currencySymbol": "$"
    },
    {
        "name": "British Virgin Islands",
        "code": "VG",
        "flag": "🇻🇬",
        "currencyCode": "USD",
        "currencyName": "United States dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Brunei",
        "code": "BN",
        "flag": "🇧🇳",
        "currencyCode": "BND",
        "currencyName": "Brunei dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Bulgaria",
        "code": "BG",
        "flag": "🇧🇬",
        "currencyCode": "BGN",
        "currencyName": "Bulgarian lev",
        "currencySymbol": "лв"
    },
    {
        "name": "Burkina Faso",
        "code": "BF",
        "flag": "🇧🇫",
        "currencyCode": "XOF",
        "currencyName": "West African CFA franc",
        "currencySymbol": "Fr"
    },
    {
        "name": "Burundi",
        "code": "BI",
        "flag": "🇧🇮",
        "currencyCode": "BIF",
        "currencyName": "Burundian franc",
        "currencySymbol": "Fr"
    },
    {
        "name": "Cambodia",
        "code": "KH",
        "flag": "🇰🇭",
        "currencyCode": "KHR",
        "currencyName": "Cambodian riel",
        "currencySymbol": "៛"
    },
    {
        "name": "Cameroon",
        "code": "CM",
        "flag": "🇨🇲",
        "currencyCode": "XAF",
        "currencyName": "Central African CFA franc",
        "currencySymbol": "Fr"
    },
    {
        "name": "Canada",
        "code": "CA",
        "flag": "🇨🇦",
        "currencyCode": "CAD",
        "currencyName": "Canadian dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Cape Verde",
        "code": "CV",
        "flag": "🇨🇻",
        "currencyCode": "CVE",
        "currencyName": "Cape Verdean escudo",
        "currencySymbol": "Esc"
    },
    {
        "name": "Caribbean Netherlands",
        "code": "BQ",
        "flag": "🇧🇶",
        "currencyCode": "USD",
        "currencyName": "United States dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Cayman Islands",
        "code": "KY",
        "flag": "🇰🇾",
        "currencyCode": "KYD",
        "currencyName": "Cayman Islands dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Central African Republic",
        "code": "CF",
        "flag": "🇨🇫",
        "currencyCode": "XAF",
        "currencyName": "Central African CFA franc",
        "currencySymbol": "Fr"
    },
    {
        "name": "Chad",
        "code": "TD",
        "flag": "🇹🇩",
        "currencyCode": "XAF",
        "currencyName": "Central African CFA franc",
        "currencySymbol": "Fr"
    },
    {
        "name": "Chile",
        "code": "CL",
        "flag": "🇨🇱",
        "currencyCode": "CLP",
        "currencyName": "Chilean peso",
        "currencySymbol": "$"
    },
    {
        "name": "China",
        "code": "CN",
        "flag": "🇨🇳",
        "currencyCode": "CNY",
        "currencyName": "Chinese yuan",
        "currencySymbol": "¥"
    },
    {
        "name": "Christmas Island",
        "code": "CX",
        "flag": "🇨🇽",
        "currencyCode": "AUD",
        "currencyName": "Australian dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Cocos (Keeling) Islands",
        "code": "CC",
        "flag": "🇨🇨",
        "currencyCode": "AUD",
        "currencyName": "Australian dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Colombia",
        "code": "CO",
        "flag": "🇨🇴",
        "currencyCode": "COP",
        "currencyName": "Colombian peso",
        "currencySymbol": "$"
    },
    {
        "name": "Comoros",
        "code": "KM",
        "flag": "🇰🇲",
        "currencyCode": "KMF",
        "currencyName": "Comorian franc",
        "currencySymbol": "Fr"
    },
    {
        "name": "Cook Islands",
        "code": "CK",
        "flag": "🇨🇰",
        "currencyCode": "CKD",
        "currencyName": "Cook Islands dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Costa Rica",
        "code": "CR",
        "flag": "🇨🇷",
        "currencyCode": "CRC",
        "currencyName": "Costa Rican colón",
        "currencySymbol": "₡"
    },
    {
        "name": "Croatia",
        "code": "HR",
        "flag": "🇭🇷",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Cuba",
        "code": "CU",
        "flag": "🇨🇺",
        "currencyCode": "CUC",
        "currencyName": "Cuban convertible peso",
        "currencySymbol": "$"
    },
    {
        "name": "Curaçao",
        "code": "CW",
        "flag": "🇨🇼",
        "currencyCode": "ANG",
        "currencyName": "Netherlands Antillean guilder",
        "currencySymbol": "ƒ"
    },
    {
        "name": "Cyprus",
        "code": "CY",
        "flag": "🇨🇾",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Czechia",
        "code": "CZ",
        "flag": "🇨🇿",
        "currencyCode": "CZK",
        "currencyName": "Czech koruna",
        "currencySymbol": "Kč"
    },
    {
        "name": "Denmark",
        "code": "DK",
        "flag": "🇩🇰",
        "currencyCode": "DKK",
        "currencyName": "Danish krone",
        "currencySymbol": "kr"
    },
    {
        "name": "Djibouti",
        "code": "DJ",
        "flag": "🇩🇯",
        "currencyCode": "DJF",
        "currencyName": "Djiboutian franc",
        "currencySymbol": "Fr"
    },
    {
        "name": "Dominica",
        "code": "DM",
        "flag": "🇩🇲",
        "currencyCode": "XCD",
        "currencyName": "Eastern Caribbean dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Dominican Republic",
        "code": "DO",
        "flag": "🇩🇴",
        "currencyCode": "DOP",
        "currencyName": "Dominican peso",
        "currencySymbol": "$"
    },
    {
        "name": "DR Congo",
        "code": "CD",
        "flag": "🇨🇩",
        "currencyCode": "CDF",
        "currencyName": "Congolese franc",
        "currencySymbol": "FC"
    },
    {
        "name": "Ecuador",
        "code": "EC",
        "flag": "🇪🇨",
        "currencyCode": "USD",
        "currencyName": "United States dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Egypt",
        "code": "EG",
        "flag": "🇪🇬",
        "currencyCode": "EGP",
        "currencyName": "Egyptian pound",
        "currencySymbol": "£"
    },
    {
        "name": "El Salvador",
        "code": "SV",
        "flag": "🇸🇻",
        "currencyCode": "USD",
        "currencyName": "United States dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Equatorial Guinea",
        "code": "GQ",
        "flag": "🇬🇶",
        "currencyCode": "XAF",
        "currencyName": "Central African CFA franc",
        "currencySymbol": "Fr"
    },
    {
        "name": "Eritrea",
        "code": "ER",
        "flag": "🇪🇷",
        "currencyCode": "ERN",
        "currencyName": "Eritrean nakfa",
        "currencySymbol": "Nfk"
    },
    {
        "name": "Estonia",
        "code": "EE",
        "flag": "🇪🇪",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Eswatini",
        "code": "SZ",
        "flag": "🇸🇿",
        "currencyCode": "SZL",
        "currencyName": "Swazi lilangeni",
        "currencySymbol": "L"
    },
    {
        "name": "Ethiopia",
        "code": "ET",
        "flag": "🇪🇹",
        "currencyCode": "ETB",
        "currencyName": "Ethiopian birr",
        "currencySymbol": "Br"
    },
    {
        "name": "Falkland Islands",
        "code": "FK",
        "flag": "🇫🇰",
        "currencyCode": "FKP",
        "currencyName": "Falkland Islands pound",
        "currencySymbol": "£"
    },
    {
        "name": "Faroe Islands",
        "code": "FO",
        "flag": "🇫🇴",
        "currencyCode": "DKK",
        "currencyName": "Danish krone",
        "currencySymbol": "kr"
    },
    {
        "name": "Fiji",
        "code": "FJ",
        "flag": "🇫🇯",
        "currencyCode": "FJD",
        "currencyName": "Fijian dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Finland",
        "code": "FI",
        "flag": "🇫🇮",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "France",
        "code": "FR",
        "flag": "🇫🇷",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "French Guiana",
        "code": "GF",
        "flag": "🇬🇫",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "French Polynesia",
        "code": "PF",
        "flag": "🇵🇫",
        "currencyCode": "XPF",
        "currencyName": "CFP franc",
        "currencySymbol": "₣"
    },
    {
        "name": "French Southern and Antarctic Lands",
        "code": "TF",
        "flag": "🇹🇫",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Gabon",
        "code": "GA",
        "flag": "🇬🇦",
        "currencyCode": "XAF",
        "currencyName": "Central African CFA franc",
        "currencySymbol": "Fr"
    },
    {
        "name": "Gambia",
        "code": "GM",
        "flag": "🇬🇲",
        "currencyCode": "GMD",
        "currencyName": "dalasi",
        "currencySymbol": "D"
    },
    {
        "name": "Georgia",
        "code": "GE",
        "flag": "🇬🇪",
        "currencyCode": "GEL",
        "currencyName": "lari",
        "currencySymbol": "₾"
    },
    {
        "name": "Germany",
        "code": "DE",
        "flag": "🇩🇪",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Ghana",
        "code": "GH",
        "flag": "🇬🇭",
        "currencyCode": "GHS",
        "currencyName": "Ghanaian cedi",
        "currencySymbol": "₵"
    },
    {
        "name": "Gibraltar",
        "code": "GI",
        "flag": "🇬🇮",
        "currencyCode": "GIP",
        "currencyName": "Gibraltar pound",
        "currencySymbol": "£"
    },
    {
        "name": "Greece",
        "code": "GR",
        "flag": "🇬🇷",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Greenland",
        "code": "GL",
        "flag": "🇬🇱",
        "currencyCode": "DKK",
        "currencyName": "krone",
        "currencySymbol": "kr."
    },
    {
        "name": "Grenada",
        "code": "GD",
        "flag": "🇬🇩",
        "currencyCode": "XCD",
        "currencyName": "Eastern Caribbean dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Guadeloupe",
        "code": "GP",
        "flag": "🇬🇵",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Guam",
        "code": "GU",
        "flag": "🇬🇺",
        "currencyCode": "USD",
        "currencyName": "United States dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Guatemala",
        "code": "GT",
        "flag": "🇬🇹",
        "currencyCode": "GTQ",
        "currencyName": "Guatemalan quetzal",
        "currencySymbol": "Q"
    },
    {
        "name": "Guernsey",
        "code": "GG",
        "flag": "🇬🇬",
        "currencyCode": "GBP",
        "currencyName": "British pound",
        "currencySymbol": "£"
    },
    {
        "name": "Guinea",
        "code": "GN",
        "flag": "🇬🇳",
        "currencyCode": "GNF",
        "currencyName": "Guinean franc",
        "currencySymbol": "Fr"
    },
    {
        "name": "Guinea-Bissau",
        "code": "GW",
        "flag": "🇬🇼",
        "currencyCode": "XOF",
        "currencyName": "West African CFA franc",
        "currencySymbol": "Fr"
    },
    {
        "name": "Guyana",
        "code": "GY",
        "flag": "🇬🇾",
        "currencyCode": "GYD",
        "currencyName": "Guyanese dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Haiti",
        "code": "HT",
        "flag": "🇭🇹",
        "currencyCode": "HTG",
        "currencyName": "Haitian gourde",
        "currencySymbol": "G"
    },
    {
        "name": "Heard Island and McDonald Islands",
        "code": "HM",
        "flag": "🇭🇲",
        "currencyCode": "USD",
        "currencyName": "USD",
        "currencySymbol": "$"
    },
    {
        "name": "Honduras",
        "code": "HN",
        "flag": "🇭🇳",
        "currencyCode": "HNL",
        "currencyName": "Honduran lempira",
        "currencySymbol": "L"
    },
    {
        "name": "Hong Kong",
        "code": "HK",
        "flag": "🇭🇰",
        "currencyCode": "HKD",
        "currencyName": "Hong Kong dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Hungary",
        "code": "HU",
        "flag": "🇭🇺",
        "currencyCode": "HUF",
        "currencyName": "Hungarian forint",
        "currencySymbol": "Ft"
    },
    {
        "name": "Iceland",
        "code": "IS",
        "flag": "🇮🇸",
        "currencyCode": "ISK",
        "currencyName": "Icelandic króna",
        "currencySymbol": "kr"
    },
    {
        "name": "India",
        "code": "IN",
        "flag": "🇮🇳",
        "currencyCode": "INR",
        "currencyName": "Indian rupee",
        "currencySymbol": "₹"
    },
    {
        "name": "Indonesia",
        "code": "ID",
        "flag": "🇮🇩",
        "currencyCode": "IDR",
        "currencyName": "Indonesian rupiah",
        "currencySymbol": "Rp"
    },
    {
        "name": "Iran",
        "code": "IR",
        "flag": "🇮🇷",
        "currencyCode": "IRR",
        "currencyName": "Iranian rial",
        "currencySymbol": "﷼"
    },
    {
        "name": "Iraq",
        "code": "IQ",
        "flag": "🇮🇶",
        "currencyCode": "IQD",
        "currencyName": "Iraqi dinar",
        "currencySymbol": "ع.د"
    },
    {
        "name": "Ireland",
        "code": "IE",
        "flag": "🇮🇪",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Isle of Man",
        "code": "IM",
        "flag": "🇮🇲",
        "currencyCode": "GBP",
        "currencyName": "British pound",
        "currencySymbol": "£"
    },
    {
        "name": "Israel",
        "code": "IL",
        "flag": "🇮🇱",
        "currencyCode": "ILS",
        "currencyName": "Israeli new shekel",
        "currencySymbol": "₪"
    },
    {
        "name": "Italy",
        "code": "IT",
        "flag": "🇮🇹",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Ivory Coast",
        "code": "CI",
        "flag": "🇨🇮",
        "currencyCode": "XOF",
        "currencyName": "West African CFA franc",
        "currencySymbol": "Fr"
    },
    {
        "name": "Jamaica",
        "code": "JM",
        "flag": "🇯🇲",
        "currencyCode": "JMD",
        "currencyName": "Jamaican dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Japan",
        "code": "JP",
        "flag": "🇯🇵",
        "currencyCode": "JPY",
        "currencyName": "Japanese yen",
        "currencySymbol": "¥"
    },
    {
        "name": "Jersey",
        "code": "JE",
        "flag": "🇯🇪",
        "currencyCode": "GBP",
        "currencyName": "British pound",
        "currencySymbol": "£"
    },
    {
        "name": "Jordan",
        "code": "JO",
        "flag": "🇯🇴",
        "currencyCode": "JOD",
        "currencyName": "Jordanian dinar",
        "currencySymbol": "د.ا"
    },
    {
        "name": "Kazakhstan",
        "code": "KZ",
        "flag": "🇰🇿",
        "currencyCode": "KZT",
        "currencyName": "Kazakhstani tenge",
        "currencySymbol": "₸"
    },
    {
        "name": "Kenya",
        "code": "KE",
        "flag": "🇰🇪",
        "currencyCode": "KES",
        "currencyName": "Kenyan shilling",
        "currencySymbol": "Sh"
    },
    {
        "name": "Kiribati",
        "code": "KI",
        "flag": "🇰🇮",
        "currencyCode": "AUD",
        "currencyName": "Australian dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Kosovo",
        "code": "XK",
        "flag": "🇽🇰",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Kuwait",
        "code": "KW",
        "flag": "🇰🇼",
        "currencyCode": "KWD",
        "currencyName": "Kuwaiti dinar",
        "currencySymbol": "د.ك"
    },
    {
        "name": "Kyrgyzstan",
        "code": "KG",
        "flag": "🇰🇬",
        "currencyCode": "KGS",
        "currencyName": "Kyrgyzstani som",
        "currencySymbol": "с"
    },
    {
        "name": "Laos",
        "code": "LA",
        "flag": "🇱🇦",
        "currencyCode": "LAK",
        "currencyName": "Lao kip",
        "currencySymbol": "₭"
    },
    {
        "name": "Latvia",
        "code": "LV",
        "flag": "🇱🇻",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Lebanon",
        "code": "LB",
        "flag": "🇱🇧",
        "currencyCode": "LBP",
        "currencyName": "Lebanese pound",
        "currencySymbol": "ل.ل"
    },
    {
        "name": "Lesotho",
        "code": "LS",
        "flag": "🇱🇸",
        "currencyCode": "LSL",
        "currencyName": "Lesotho loti",
        "currencySymbol": "L"
    },
    {
        "name": "Liberia",
        "code": "LR",
        "flag": "🇱🇷",
        "currencyCode": "LRD",
        "currencyName": "Liberian dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Libya",
        "code": "LY",
        "flag": "🇱🇾",
        "currencyCode": "LYD",
        "currencyName": "Libyan dinar",
        "currencySymbol": "ل.د"
    },
    {
        "name": "Liechtenstein",
        "code": "LI",
        "flag": "🇱🇮",
        "currencyCode": "CHF",
        "currencyName": "Swiss franc",
        "currencySymbol": "Fr"
    },
    {
        "name": "Lithuania",
        "code": "LT",
        "flag": "🇱🇹",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Luxembourg",
        "code": "LU",
        "flag": "🇱🇺",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Macau",
        "code": "MO",
        "flag": "🇲🇴",
        "currencyCode": "MOP",
        "currencyName": "Macanese pataca",
        "currencySymbol": "P"
    },
    {
        "name": "Madagascar",
        "code": "MG",
        "flag": "🇲🇬",
        "currencyCode": "MGA",
        "currencyName": "Malagasy ariary",
        "currencySymbol": "Ar"
    },
    {
        "name": "Malawi",
        "code": "MW",
        "flag": "🇲🇼",
        "currencyCode": "MWK",
        "currencyName": "Malawian kwacha",
        "currencySymbol": "MK"
    },
    {
        "name": "Malaysia",
        "code": "MY",
        "flag": "🇲🇾",
        "currencyCode": "MYR",
        "currencyName": "Malaysian ringgit",
        "currencySymbol": "RM"
    },
    {
        "name": "Maldives",
        "code": "MV",
        "flag": "🇲🇻",
        "currencyCode": "MVR",
        "currencyName": "Maldivian rufiyaa",
        "currencySymbol": ".ރ"
    },
    {
        "name": "Mali",
        "code": "ML",
        "flag": "🇲🇱",
        "currencyCode": "XOF",
        "currencyName": "West African CFA franc",
        "currencySymbol": "Fr"
    },
    {
        "name": "Malta",
        "code": "MT",
        "flag": "🇲🇹",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Marshall Islands",
        "code": "MH",
        "flag": "🇲🇭",
        "currencyCode": "USD",
        "currencyName": "United States dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Martinique",
        "code": "MQ",
        "flag": "🇲🇶",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Mauritania",
        "code": "MR",
        "flag": "🇲🇷",
        "currencyCode": "MRU",
        "currencyName": "Mauritanian ouguiya",
        "currencySymbol": "UM"
    },
    {
        "name": "Mauritius",
        "code": "MU",
        "flag": "🇲🇺",
        "currencyCode": "MUR",
        "currencyName": "Mauritian rupee",
        "currencySymbol": "₨"
    },
    {
        "name": "Mayotte",
        "code": "YT",
        "flag": "🇾🇹",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Mexico",
        "code": "MX",
        "flag": "🇲🇽",
        "currencyCode": "MXN",
        "currencyName": "Mexican peso",
        "currencySymbol": "$"
    },
    {
        "name": "Micronesia",
        "code": "FM",
        "flag": "🇫🇲",
        "currencyCode": "USD",
        "currencyName": "USD",
        "currencySymbol": "$"
    },
    {
        "name": "Moldova",
        "code": "MD",
        "flag": "🇲🇩",
        "currencyCode": "MDL",
        "currencyName": "Moldovan leu",
        "currencySymbol": "L"
    },
    {
        "name": "Monaco",
        "code": "MC",
        "flag": "🇲🇨",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Mongolia",
        "code": "MN",
        "flag": "🇲🇳",
        "currencyCode": "MNT",
        "currencyName": "Mongolian tögrög",
        "currencySymbol": "₮"
    },
    {
        "name": "Montenegro",
        "code": "ME",
        "flag": "🇲🇪",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Montserrat",
        "code": "MS",
        "flag": "🇲🇸",
        "currencyCode": "XCD",
        "currencyName": "Eastern Caribbean dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Morocco",
        "code": "MA",
        "flag": "🇲🇦",
        "currencyCode": "MAD",
        "currencyName": "Moroccan dirham",
        "currencySymbol": "د.م."
    },
    {
        "name": "Mozambique",
        "code": "MZ",
        "flag": "🇲🇿",
        "currencyCode": "MZN",
        "currencyName": "Mozambican metical",
        "currencySymbol": "MT"
    },
    {
        "name": "Myanmar",
        "code": "MM",
        "flag": "🇲🇲",
        "currencyCode": "MMK",
        "currencyName": "Burmese kyat",
        "currencySymbol": "Ks"
    },
    {
        "name": "Namibia",
        "code": "NA",
        "flag": "🇳🇦",
        "currencyCode": "NAD",
        "currencyName": "Namibian dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Nauru",
        "code": "NR",
        "flag": "🇳🇷",
        "currencyCode": "AUD",
        "currencyName": "Australian dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Nepal",
        "code": "NP",
        "flag": "🇳🇵",
        "currencyCode": "NPR",
        "currencyName": "Nepalese rupee",
        "currencySymbol": "₨"
    },
    {
        "name": "Netherlands",
        "code": "NL",
        "flag": "🇳🇱",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "New Caledonia",
        "code": "NC",
        "flag": "🇳🇨",
        "currencyCode": "XPF",
        "currencyName": "CFP franc",
        "currencySymbol": "₣"
    },
    {
        "name": "New Zealand",
        "code": "NZ",
        "flag": "🇳🇿",
        "currencyCode": "NZD",
        "currencyName": "New Zealand dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Nicaragua",
        "code": "NI",
        "flag": "🇳🇮",
        "currencyCode": "NIO",
        "currencyName": "Nicaraguan córdoba",
        "currencySymbol": "C$"
    },
    {
        "name": "Niger",
        "code": "NE",
        "flag": "🇳🇪",
        "currencyCode": "XOF",
        "currencyName": "West African CFA franc",
        "currencySymbol": "Fr"
    },
    {
        "name": "Nigeria",
        "code": "NG",
        "flag": "🇳🇬",
        "currencyCode": "NGN",
        "currencyName": "Nigerian naira",
        "currencySymbol": "₦"
    },
    {
        "name": "Niue",
        "code": "NU",
        "flag": "🇳🇺",
        "currencyCode": "NZD",
        "currencyName": "New Zealand dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Norfolk Island",
        "code": "NF",
        "flag": "🇳🇫",
        "currencyCode": "AUD",
        "currencyName": "Australian dollar",
        "currencySymbol": "$"
    },
    {
        "name": "North Korea",
        "code": "KP",
        "flag": "🇰🇵",
        "currencyCode": "KPW",
        "currencyName": "North Korean won",
        "currencySymbol": "₩"
    },
    {
        "name": "North Macedonia",
        "code": "MK",
        "flag": "🇲🇰",
        "currencyCode": "MKD",
        "currencyName": "denar",
        "currencySymbol": "den"
    },
    {
        "name": "Northern Mariana Islands",
        "code": "MP",
        "flag": "🇲🇵",
        "currencyCode": "USD",
        "currencyName": "United States dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Norway",
        "code": "NO",
        "flag": "🇳🇴",
        "currencyCode": "NOK",
        "currencyName": "Norwegian krone",
        "currencySymbol": "kr"
    },
    {
        "name": "Oman",
        "code": "OM",
        "flag": "🇴🇲",
        "currencyCode": "OMR",
        "currencyName": "Omani rial",
        "currencySymbol": "ر.ع."
    },
    {
        "name": "Pakistan",
        "code": "PK",
        "flag": "🇵🇰",
        "currencyCode": "PKR",
        "currencyName": "Pakistani rupee",
        "currencySymbol": "₨"
    },
    {
        "name": "Palau",
        "code": "PW",
        "flag": "🇵🇼",
        "currencyCode": "USD",
        "currencyName": "United States dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Palestine",
        "code": "PS",
        "flag": "🇵🇸",
        "currencyCode": "EGP",
        "currencyName": "Egyptian pound",
        "currencySymbol": "E£"
    },
    {
        "name": "Panama",
        "code": "PA",
        "flag": "🇵🇦",
        "currencyCode": "PAB",
        "currencyName": "Panamanian balboa",
        "currencySymbol": "B/."
    },
    {
        "name": "Papua New Guinea",
        "code": "PG",
        "flag": "🇵🇬",
        "currencyCode": "PGK",
        "currencyName": "Papua New Guinean kina",
        "currencySymbol": "K"
    },
    {
        "name": "Paraguay",
        "code": "PY",
        "flag": "🇵🇾",
        "currencyCode": "PYG",
        "currencyName": "Paraguayan guaraní",
        "currencySymbol": "₲"
    },
    {
        "name": "Peru",
        "code": "PE",
        "flag": "🇵🇪",
        "currencyCode": "PEN",
        "currencyName": "Peruvian sol",
        "currencySymbol": "S/."
    },
    {
        "name": "Philippines",
        "code": "PH",
        "flag": "🇵🇭",
        "currencyCode": "PHP",
        "currencyName": "Philippine peso",
        "currencySymbol": "₱"
    },
    {
        "name": "Pitcairn Islands",
        "code": "PN",
        "flag": "🇵🇳",
        "currencyCode": "NZD",
        "currencyName": "New Zealand dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Poland",
        "code": "PL",
        "flag": "🇵🇱",
        "currencyCode": "PLN",
        "currencyName": "Polish złoty",
        "currencySymbol": "zł"
    },
    {
        "name": "Portugal",
        "code": "PT",
        "flag": "🇵🇹",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Puerto Rico",
        "code": "PR",
        "flag": "🇵🇷",
        "currencyCode": "USD",
        "currencyName": "United States dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Qatar",
        "code": "QA",
        "flag": "🇶🇦",
        "currencyCode": "QAR",
        "currencyName": "Qatari riyal",
        "currencySymbol": "ر.ق"
    },
    {
        "name": "Republic of the Congo",
        "code": "CG",
        "flag": "🇨🇬",
        "currencyCode": "XAF",
        "currencyName": "Central African CFA franc",
        "currencySymbol": "Fr"
    },
    {
        "name": "Réunion",
        "code": "RE",
        "flag": "🇷🇪",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Romania",
        "code": "RO",
        "flag": "🇷🇴",
        "currencyCode": "RON",
        "currencyName": "Romanian leu",
        "currencySymbol": "lei"
    },
    {
        "name": "Russia",
        "code": "RU",
        "flag": "🇷🇺",
        "currencyCode": "RUB",
        "currencyName": "Russian ruble",
        "currencySymbol": "₽"
    },
    {
        "name": "Rwanda",
        "code": "RW",
        "flag": "🇷🇼",
        "currencyCode": "RWF",
        "currencyName": "Rwandan franc",
        "currencySymbol": "Fr"
    },
    {
        "name": "Saint Barthélemy",
        "code": "BL",
        "flag": "🇧🇱",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Saint Helena, Ascension and Tristan da Cunha",
        "code": "SH",
        "flag": "🇸🇭",
        "currencyCode": "GBP",
        "currencyName": "Pound sterling",
        "currencySymbol": "£"
    },
    {
        "name": "Saint Kitts and Nevis",
        "code": "KN",
        "flag": "🇰🇳",
        "currencyCode": "XCD",
        "currencyName": "Eastern Caribbean dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Saint Lucia",
        "code": "LC",
        "flag": "🇱🇨",
        "currencyCode": "XCD",
        "currencyName": "Eastern Caribbean dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Saint Martin",
        "code": "MF",
        "flag": "🇲🇫",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Saint Pierre and Miquelon",
        "code": "PM",
        "flag": "🇵🇲",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Saint Vincent and the Grenadines",
        "code": "VC",
        "flag": "🇻🇨",
        "currencyCode": "XCD",
        "currencyName": "Eastern Caribbean dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Samoa",
        "code": "WS",
        "flag": "🇼🇸",
        "currencyCode": "WST",
        "currencyName": "Samoan tālā",
        "currencySymbol": "T"
    },
    {
        "name": "San Marino",
        "code": "SM",
        "flag": "🇸🇲",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "São Tomé and Príncipe",
        "code": "ST",
        "flag": "🇸🇹",
        "currencyCode": "STN",
        "currencyName": "São Tomé and Príncipe dobra",
        "currencySymbol": "Db"
    },
    {
        "name": "Saudi Arabia",
        "code": "SA",
        "flag": "🇸🇦",
        "currencyCode": "SAR",
        "currencyName": "Saudi riyal",
        "currencySymbol": "ر.س"
    },
    {
        "name": "Senegal",
        "code": "SN",
        "flag": "🇸🇳",
        "currencyCode": "XOF",
        "currencyName": "West African CFA franc",
        "currencySymbol": "Fr"
    },
    {
        "name": "Serbia",
        "code": "RS",
        "flag": "🇷🇸",
        "currencyCode": "RSD",
        "currencyName": "Serbian dinar",
        "currencySymbol": "дин."
    },
    {
        "name": "Seychelles",
        "code": "SC",
        "flag": "🇸🇨",
        "currencyCode": "SCR",
        "currencyName": "Seychellois rupee",
        "currencySymbol": "₨"
    },
    {
        "name": "Sierra Leone",
        "code": "SL",
        "flag": "🇸🇱",
        "currencyCode": "SLL",
        "currencyName": "Sierra Leonean leone",
        "currencySymbol": "Le"
    },
    {
        "name": "Singapore",
        "code": "SG",
        "flag": "🇸🇬",
        "currencyCode": "SGD",
        "currencyName": "Singapore dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Sint Maarten",
        "code": "SX",
        "flag": "🇸🇽",
        "currencyCode": "ANG",
        "currencyName": "Netherlands Antillean guilder",
        "currencySymbol": "ƒ"
    },
    {
        "name": "Slovakia",
        "code": "SK",
        "flag": "🇸🇰",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Slovenia",
        "code": "SI",
        "flag": "🇸🇮",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Solomon Islands",
        "code": "SB",
        "flag": "🇸🇧",
        "currencyCode": "SBD",
        "currencyName": "Solomon Islands dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Somalia",
        "code": "SO",
        "flag": "🇸🇴",
        "currencyCode": "SOS",
        "currencyName": "Somali shilling",
        "currencySymbol": "Sh"
    },
    {
        "name": "South Africa",
        "code": "ZA",
        "flag": "🇿🇦",
        "currencyCode": "ZAR",
        "currencyName": "South African rand",
        "currencySymbol": "R"
    },
    {
        "name": "South Georgia",
        "code": "GS",
        "flag": "🇬🇸",
        "currencyCode": "SHP",
        "currencyName": "Saint Helena pound",
        "currencySymbol": "£"
    },
    {
        "name": "South Korea",
        "code": "KR",
        "flag": "🇰🇷",
        "currencyCode": "KRW",
        "currencyName": "South Korean won",
        "currencySymbol": "₩"
    },
    {
        "name": "South Sudan",
        "code": "SS",
        "flag": "🇸🇸",
        "currencyCode": "SSP",
        "currencyName": "South Sudanese pound",
        "currencySymbol": "£"
    },
    {
        "name": "Spain",
        "code": "ES",
        "flag": "🇪🇸",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Sri Lanka",
        "code": "LK",
        "flag": "🇱🇰",
        "currencyCode": "LKR",
        "currencyName": "Sri Lankan rupee",
        "currencySymbol": "Rs  රු"
    },
    {
        "name": "Sudan",
        "code": "SD",
        "flag": "🇸🇩",
        "currencyCode": "SDG",
        "currencyName": "Sudanese pound",
        "currencySymbol": "PT"
    },
    {
        "name": "Suriname",
        "code": "SR",
        "flag": "🇸🇷",
        "currencyCode": "SRD",
        "currencyName": "Surinamese dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Svalbard and Jan Mayen",
        "code": "SJ",
        "flag": "🇸🇯",
        "currencyCode": "NOK",
        "currencyName": "krone",
        "currencySymbol": "kr"
    },
    {
        "name": "Sweden",
        "code": "SE",
        "flag": "🇸🇪",
        "currencyCode": "SEK",
        "currencyName": "Swedish krona",
        "currencySymbol": "kr"
    },
    {
        "name": "Switzerland",
        "code": "CH",
        "flag": "🇨🇭",
        "currencyCode": "CHF",
        "currencyName": "Swiss franc",
        "currencySymbol": "Fr."
    },
    {
        "name": "Syria",
        "code": "SY",
        "flag": "🇸🇾",
        "currencyCode": "SYP",
        "currencyName": "Syrian pound",
        "currencySymbol": "£"
    },
    {
        "name": "Taiwan",
        "code": "TW",
        "flag": "🇹🇼",
        "currencyCode": "TWD",
        "currencyName": "New Taiwan dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Tajikistan",
        "code": "TJ",
        "flag": "🇹🇯",
        "currencyCode": "TJS",
        "currencyName": "Tajikistani somoni",
        "currencySymbol": "ЅМ"
    },
    {
        "name": "Tanzania",
        "code": "TZ",
        "flag": "🇹🇿",
        "currencyCode": "TZS",
        "currencyName": "Tanzanian shilling",
        "currencySymbol": "Sh"
    },
    {
        "name": "Thailand",
        "code": "TH",
        "flag": "🇹🇭",
        "currencyCode": "THB",
        "currencyName": "Thai baht",
        "currencySymbol": "฿"
    },
    {
        "name": "Timor-Leste",
        "code": "TL",
        "flag": "🇹🇱",
        "currencyCode": "USD",
        "currencyName": "United States dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Togo",
        "code": "TG",
        "flag": "🇹🇬",
        "currencyCode": "XOF",
        "currencyName": "West African CFA franc",
        "currencySymbol": "Fr"
    },
    {
        "name": "Tokelau",
        "code": "TK",
        "flag": "🇹🇰",
        "currencyCode": "NZD",
        "currencyName": "New Zealand dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Tonga",
        "code": "TO",
        "flag": "🇹🇴",
        "currencyCode": "TOP",
        "currencyName": "Tongan paʻanga",
        "currencySymbol": "T$"
    },
    {
        "name": "Trinidad and Tobago",
        "code": "TT",
        "flag": "🇹🇹",
        "currencyCode": "TTD",
        "currencyName": "Trinidad and Tobago dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Tunisia",
        "code": "TN",
        "flag": "🇹🇳",
        "currencyCode": "TND",
        "currencyName": "Tunisian dinar",
        "currencySymbol": "د.ت"
    },
    {
        "name": "Turkey",
        "code": "TR",
        "flag": "🇹🇷",
        "currencyCode": "TRY",
        "currencyName": "Turkish lira",
        "currencySymbol": "₺"
    },
    {
        "name": "Turkmenistan",
        "code": "TM",
        "flag": "🇹🇲",
        "currencyCode": "TMT",
        "currencyName": "Turkmenistan manat",
        "currencySymbol": "m"
    },
    {
        "name": "Turks and Caicos Islands",
        "code": "TC",
        "flag": "🇹🇨",
        "currencyCode": "USD",
        "currencyName": "United States dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Tuvalu",
        "code": "TV",
        "flag": "🇹🇻",
        "currencyCode": "AUD",
        "currencyName": "Australian dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Uganda",
        "code": "UG",
        "flag": "🇺🇬",
        "currencyCode": "UGX",
        "currencyName": "Ugandan shilling",
        "currencySymbol": "Sh"
    },
    {
        "name": "Ukraine",
        "code": "UA",
        "flag": "🇺🇦",
        "currencyCode": "UAH",
        "currencyName": "Ukrainian hryvnia",
        "currencySymbol": "₴"
    },
    {
        "name": "United Arab Emirates",
        "code": "AE",
        "flag": "🇦🇪",
        "currencyCode": "AED",
        "currencyName": "United Arab Emirates dirham",
        "currencySymbol": "د.إ"
    },
    {
        "name": "United Kingdom",
        "code": "GB",
        "flag": "🇬🇧",
        "currencyCode": "GBP",
        "currencyName": "British pound",
        "currencySymbol": "£"
    },
    {
        "name": "United States",
        "code": "US",
        "flag": "🇺🇸",
        "currencyCode": "USD",
        "currencyName": "United States dollar",
        "currencySymbol": "$"
    },
    {
        "name": "United States Minor Outlying Islands",
        "code": "UM",
        "flag": "🇺🇲",
        "currencyCode": "USD",
        "currencyName": "United States dollar",
        "currencySymbol": "$"
    },
    {
        "name": "United States Virgin Islands",
        "code": "VI",
        "flag": "🇻🇮",
        "currencyCode": "USD",
        "currencyName": "United States dollar",
        "currencySymbol": "$"
    },
    {
        "name": "Uruguay",
        "code": "UY",
        "flag": "🇺🇾",
        "currencyCode": "UYU",
        "currencyName": "Uruguayan peso",
        "currencySymbol": "$"
    },
    {
        "name": "Uzbekistan",
        "code": "UZ",
        "flag": "🇺🇿",
        "currencyCode": "UZS",
        "currencyName": "Uzbekistani soʻm",
        "currencySymbol": "so'm"
    },
    {
        "name": "Vanuatu",
        "code": "VU",
        "flag": "🇻🇺",
        "currencyCode": "VUV",
        "currencyName": "Vanuatu vatu",
        "currencySymbol": "Vt"
    },
    {
        "name": "Vatican City",
        "code": "VA",
        "flag": "🇻🇦",
        "currencyCode": "EUR",
        "currencyName": "Euro",
        "currencySymbol": "€"
    },
    {
        "name": "Venezuela",
        "code": "VE",
        "flag": "🇻🇪",
        "currencyCode": "VES",
        "currencyName": "Venezuelan bolívar soberano",
        "currencySymbol": "Bs.S."
    },
    {
        "name": "Vietnam",
        "code": "VN",
        "flag": "🇻🇳",
        "currencyCode": "VND",
        "currencyName": "Vietnamese đồng",
        "currencySymbol": "₫"
    },
    {
        "name": "Wallis and Futuna",
        "code": "WF",
        "flag": "🇼🇫",
        "currencyCode": "XPF",
        "currencyName": "CFP franc",
        "currencySymbol": "₣"
    },
    {
        "name": "Western Sahara",
        "code": "EH",
        "flag": "🇪🇭",
        "currencyCode": "DZD",
        "currencyName": "Algerian dinar",
        "currencySymbol": "دج"
    },
    {
        "name": "Yemen",
        "code": "YE",
        "flag": "🇾🇪",
        "currencyCode": "YER",
        "currencyName": "Yemeni rial",
        "currencySymbol": "﷼"
    },
    {
        "name": "Zambia",
        "code": "ZM",
        "flag": "🇿🇲",
        "currencyCode": "ZMW",
        "currencyName": "Zambian kwacha",
        "currencySymbol": "ZK"
    },
    {
        "name": "Zimbabwe",
        "code": "ZW",
        "flag": "🇿🇼",
        "currencyCode": "BWP",
        "currencyName": "Botswana pula",
        "currencySymbol": "P"
    }
];

export const FALLBACK_RATES: ExchangeRates = {
    "USD": 1,
    "NGN": 1500,
    "GBP": 0.79,
    "EUR": 0.92,
    "CAD": 1.37,
    "GHS": 15,
    "KES": 129,
    "ZAR": 18,
    "INR": 83,
    "CNY": 7.2,
    "AUD": 1.52,
    "AED": 3.67,
    "BRL": 5.4,
    "MXN": 18,
    "JPY": 157
};

export function getFlagEmoji(countryCode: string) {
    if (!countryCode || countryCode.length !== 2) return "🌐";
    return countryCode
        .toUpperCase()
        .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export function sanitizeCurrencyCode(currencyCode?: unknown) {
    const code = typeof currencyCode === "string" ? currencyCode.trim().toUpperCase() : "";
    return /^[A-Z]{3}$/.test(code) ? code : DEFAULT_CURRENCY;
}

export function getCurrencySymbol(currencyCode = DEFAULT_CURRENCY) {
    const safeCode = sanitizeCurrencyCode(currencyCode);
    try {
        const parts = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: safeCode,
            currencyDisplay: "narrowSymbol",
        }).formatToParts(0);
        return parts.find(part => part.type === "currency")?.value || safeCode;
    } catch {
        const found = FALLBACK_COUNTRIES.find(country => country.currencyCode === safeCode);
        return found?.currencySymbol || safeCode;
    }
}

export function getCountryByName(name?: string) {
    return FALLBACK_COUNTRIES.find(country => country.name === name);
}

export function convertFromUsd(amountUsd: number, currencyCode = DEFAULT_CURRENCY, rates: ExchangeRates = FALLBACK_RATES) {
    const safeCode = sanitizeCurrencyCode(currencyCode);
    const rate = Number(rates?.[safeCode]) || 1;
    return Number(amountUsd || 0) * rate;
}

export function convertToUsd(amount: number, currencyCode = DEFAULT_CURRENCY, rates: ExchangeRates = FALLBACK_RATES) {
    const safeCode = sanitizeCurrencyCode(currencyCode);
    const rate = Number(rates?.[safeCode]) || 1;
    return Number(amount || 0) / rate;
}

export function formatCurrency(
    amountUsd: number,
    currencyCode = DEFAULT_CURRENCY,
    rates: ExchangeRates = FALLBACK_RATES,
    options: Intl.NumberFormatOptions = {}
) {
    const safeCode = sanitizeCurrencyCode(currencyCode);
    const converted = convertFromUsd(amountUsd, safeCode, rates);
    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: safeCode,
            maximumFractionDigits: converted >= 1000 ? 0 : 2,
            ...options,
        }).format(converted);
    } catch {
        return `${getCurrencySymbol(safeCode)}${converted.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    }
}

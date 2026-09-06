// Catalog version - bump to force Firestore wipe and reseed
export const CATALOG_VERSION = 8;

const starterProducts = [
    {
        name: "Apple AirPods Pro (3rd Gen)",
        price: 74.7,
        description: "The latest Apple AirPods Pro with active noise cancellation, Adaptive Audio, and up to 30 hours total listening time.",
        category: "Audio",
        image: "/products/01_Apple_AirPods_Pro_3rd_Gen.png",
        isFeatured: true, isPromoted: true, sortOrder: 1, catalogVersion: 6,
    },
    {
        name: "Meta Quest 3 Advanced VR Headset",
        price: 75,
        description: "Meta's most powerful mixed reality headset. Full-color passthrough, next-gen chipset, and an expansive library of VR and MR experiences.",
        category: "Tech & Gadgets",
        image: "/products/02_Meta_Quest_3_Advanced_VR_Headset.png",
        isFeatured: true, isPromoted: true, sortOrder: 2, catalogVersion: 6,
    },
    {
        name: "Withings Body Scan Smart Scale",
        price: 89.7,
        description: "Advanced health tracking scale measuring weight, body composition, nerve activity, and vascular age. Sync with your smartphone for deep health insights.",
        category: "Health & Fitness",
        image: "/products/03_Withings_Body_Scan_Smart_Scale.png",
        isFeatured: true, isPromoted: true, sortOrder: 3, catalogVersion: 6,
    },
    {
        name: "Breville Barista Express Espresso Machine",
        price: 239.7,
        description: "All-in-one espresso machine with integrated conical burr grinder. Grind, dose, tamp, and extract cafe-quality espresso at home.",
        category: "Home & Kitchen",
        image: "/products/05_Breville_Barista_Express_Espresso_Machine.png",
        isFeatured: true, isPromoted: true, sortOrder: 5, catalogVersion: 6,
    },
    {
        name: "Shokz OpenRun Pro Bone Conduction Headphones",
        price: 27,
        description: "Premium open-ear headphones using bone conduction technology. Stay aware of your surroundings while enjoying high-quality audio outdoors.",
        category: "Audio",
        image: "/products/06_Shokz_OpenRun_Pro_Bone_Conduction_Headphones.png",
        isFeatured: true, isPromoted: true, sortOrder: 6, catalogVersion: 6,
    },
    {
        name: "Dyson Airwrap Multi-Styler Complete Long",
        price: 179.7,
        description: "The iconic multi-styler that curls, waves, smooths, and dries using Coanda airflow with no extreme heat. Includes attachments for all hair types.",
        category: "Beauty & Personal Care",
        image: "/products/07_Dyson_Airwrap_Multi_Styler_Complete_Long.png",
        isFeatured: true, isPromoted: true, sortOrder: 7, catalogVersion: 6,
    },
    {
        name: "Fujifilm Instax Mini EVO Instant Camera",
        price: 59.7,
        description: "Hybrid instant camera combining digital shooting with analog printing. 10 lens and film effects, app connectivity, and a premium retro design.",
        category: "Photography",
        image: "/products/08_Fujifilm_Instax_Mini_EVO_Instant_Camera.png",
        isFeatured: true, isPromoted: true, sortOrder: 8, catalogVersion: 6,
    },
    {
        name: "Philips Hue Smart Light Starter Kit",
        price: 59.7,
        description: "Transform your home lighting with smart LED bulbs and the Hue Bridge. Control millions of colors via app, voice, or schedule for any mood.",
        category: "Smart Home",
        image: "/products/09_Philips_Hue_Smart_Light_Starter_Kit.png",
        isFeatured: true, isPromoted: true, sortOrder: 9, catalogVersion: 6,
    },
    {
        name: "GoPro HERO12 Black Action Camera",
        price: 119.7,
        description: "5.3K video, HyperSmooth 6.0 stabilization, and unlimited cloud backup. Waterproof to 33ft out of the box. The ultimate action camera for creators.",
        category: "Photography",
        image: "/products/10_GoPro_HERO12_Black_Action_Camera.png",
        isFeatured: true, isPromoted: true, sortOrder: 10, catalogVersion: 6,
    },
    {
        name: "Sonos Era 100 Smart Speaker",
        price: 74.7,
        description: "Premium stereo smart speaker with Trueplay tuning, Bluetooth, and Wi-Fi. Works with Alexa, Google Assistant, and Apple AirPlay 2.",
        category: "Audio",
        image: "/products/11_Sonos_Era_100_Smart_Speaker.png",
        isFeatured: true, isPromoted: true, sortOrder: 11, catalogVersion: 6,
    },
    {
        name: "Samsung T9 Portable SSD (2TB)",
        price: 53.7,
        description: "Blazing-fast 2TB portable SSD with USB 3.2 Gen 2x2 speeds up to 2,000 MB/s. Rugged, IP65-rated, and compact for on-the-go creators.",
        category: "Tech & Gadgets",
        image: "/products/12_Samsung_T9_Portable_SSD_2TB.png",
        isFeatured: true, isPromoted: true, sortOrder: 12, catalogVersion: 6,
    },
    {
        name: "Amazon Kindle Paperwhite Bundle",
        price: 28.5,
        description: "Kindle Paperwhite with premium fabric cover and 3-month Kindle Unlimited. 300 ppi glare-free display, waterproof, up to 10 weeks battery life.",
        category: "Tech & Gadgets",
        image: "/products/Extra_Amazon_Kindle_Paperwhite_Bundle.png",
        isFeatured: true, isPromoted: true, sortOrder: 13, catalogVersion: 6,
    },
    {
        name: "Apple AirPods Pro 2nd Gen MagSafe USB-C",
        price: 68.7,
        description: "Active Noise Cancellation, Adaptive Transparency, and Personalized Spatial Audio. MagSafe charging case with USB-C and up to 30 hours total listening time.",
        category: "Audio",
        image: "/products/Extra_Apple_AirPods_Pro_2nd_Generation_MagSafe_USB_C.png",
        isFeatured: true, isPromoted: true, sortOrder: 14, catalogVersion: 6,
    },
    {
        name: "Beats Studio Pro Wireless Headphones",
        price: 104.7,
        description: "Professional over-ear headphones with active noise cancelling, lossless audio via USB-C, and up to 40 hours battery life. Works with Apple and Android.",
        category: "Audio",
        image: "/products/Extra_Beats_Studio_Pro_Wireless_Headphones.png",
        isFeatured: true, isPromoted: true, sortOrder: 15, catalogVersion: 6,
    },
    {
        name: "Breville Barista Express With Box",
        price: 254.7,
        description: "The complete Breville Barista Express bundle with everything needed to pull cafe-quality espresso shots at home, fresh from the integrated grinder.",
        category: "Home & Kitchen",
        image: "/products/Extra_Breville_Barista_Express_Espresso_Machine_With_Box.png",
        isFeatured: true, isPromoted: true, sortOrder: 16, catalogVersion: 6,
    },
    {
        name: "DJI Mavic 3 Fly More Combo",
        price: 659.7,
        description: "Professional drone with Hasselblad camera, 46-min flight time, and 15km transmission. Includes extra batteries, charging hub, and carry bag.",
        category: "Photography",
        image: "/products/Extra_DJI_Mavic_3_Fly_More_Combo.png",
        isFeatured: true, isPromoted: true, sortOrder: 17, catalogVersion: 6,
    },
    {
        name: "Dyson V15 Detect Cordless Vacuum",
        price: 224.7,
        description: "Most powerful Dyson cordless vacuum with laser dust detection, dynamic load sensor, and 60-min run time. Reveals microscopic dust invisible to the naked eye.",
        category: "Home & Kitchen",
        image: "/products/Extra_Dyson_V15_Detect_Cordless_Vacuum.png",
        isFeatured: true, isPromoted: true, sortOrder: 18, catalogVersion: 6,
    },
    {
        name: "Garmin Forerunner 965 Smartwatch",
        price: 179.7,
        description: "Premium GPS running smartwatch with AMOLED display, full-color maps, training readiness score, and up to 23 days battery life.",
        category: "Health & Fitness",
        image: "/products/Extra_Garmin_Forerunner_965_Smartwatch.png",
        isFeatured: true, isPromoted: true, sortOrder: 19, catalogVersion: 6,
    },
    {
        name: "Instant Pot Duo 7-in-1 Electric Pressure Cooker",
        price: 29.7,
        description: "The world's best-selling multi-cooker. Pressure cook, slow cook, rice cook, steam, saute, make yogurt, and keep warm all in one appliance.",
        category: "Home & Kitchen",
        image: "/products/Extra_Instant_Pot_Duo_7_in_1_Electric_Pressure_Cooker.png",
        isFeatured: true, isPromoted: true, sortOrder: 20, catalogVersion: 6,
    },
    {
        name: "JBL Live Pro 2 Earbuds",
        price: 44.7,
        description: "True adaptive noise cancelling earbuds with Smart Ambient mode, 40-hour total battery, and 6-mic TrueVoice call technology. JBL Signature Sound with EQ.",
        category: "Audio",
        image: "/products/Extra_JBL_Live_Pro_2_Earbuds.png",
        isFeatured: true, isPromoted: true, sortOrder: 21, catalogVersion: 6,
    },
    {
        name: "75W Box Mod Vape Kit with Sub-Ohm Tank",
        price: 9,
        description: "Rechargeable 75W regulated box mod kit with adjustable wattage, OLED display, and sub-ohm tank. Single 18650 external battery (not included). Supports Variable Wattage, Bypass, Temperature Control (Ni/Ti/SS), and TCR modes. Wattage range 1–75W, resistance range 0.05–3.5O, temp range 100–315°C. 510-thread connection, USB-C charging. Kit includes: 75W mod, sub-ohm tank (2–4ml), 0.3O & 0.5O coils, USB cable, and user manual. Zinc alloy & stainless steel build. Dimensions: ~45 × 23 × 70.5mm.",
        category: "Vapes & E-Cigarettes",
        image: "/products/vapekit.jpg",
        isFeatured: true, isPromoted: true, sortOrder: 22, catalogVersion: 6,
    },
];

const massageCatalogImages: Record<string, string> = {
    "Massage Guns": "/products/massage-gun-catalog.png",
    "Neck Massagers": "/products/neck-massager-catalog.png",
    "Foot Massagers": "/products/foot-massager-catalog.png",
    "Massage Chairs": "/products/massage-chair-catalog.png",
    "Back Massagers": "/products/back-massager-catalog.png",
    "Scalp Massagers": "/products/scalp-massager-catalog.png",
    "Heating Pads": "/products/heating-pad-catalog.png",
    "Spa & Wellness Tools": "/products/spa-wellness-catalog.png",
    "Electric Massagers": "/products/electric-massager-catalog.png",
    "Portable Massagers": "/products/portable-massager-catalog.png",
};

const massageProductGroups = [
    {
        category: "Massage Guns",
        names: ["Deep Tissue Pro Massage Gun", "Mini Percussion Muscle Gun", "QuietForce Recovery Massage Gun", "Athlete Pro 6-Head Massage Gun", "Compact USB-C Massage Gun", "Carbon Grip Therapy Gun", "Heated Percussion Massage Gun", "Travel Case Muscle Recovery Gun", "LCD Touch Massage Gun", "Long Battery Massage Gun", "Soft Head Relaxation Gun", "Sports Recovery Massage Gun"],
        prices: [24.5, 18.75, 29.99, 34.5, 16.9, 27.4, 31.25, 22.8, 28.6, 25.95, 19.4, 33.75],
    },
    {
        category: "Neck Massagers",
        names: ["Smart Electric Neck Massager", "Heated Cervical Neck Relaxer", "EMS Pulse Neck Massager", "Wireless Shoulder Neck Massager", "U-Shape Portable Neck Therapy Device", "Neck Heat Compression Massager", "Foldable Travel Neck Massager", "Rechargeable Neck Pain Relief Massager", "Magnetic Neck Pulse Massager", "Deep Kneading Neck Massager", "Office Neck Relief Massager", "Silicone Pad Neck Therapy Massager"],
        prices: [12.8, 16.5, 14.25, 21.75, 18.4, 19.95, 15.6, 17.9, 13.75, 24.5, 14.9, 16.25],
    },
    {
        category: "Foot Massagers",
        names: ["Shiatsu Heated Foot Massager", "Air Compression Foot Relaxer", "Remote Control Foot Therapy Machine", "Deep Kneading Foot Massager", "Foldable Foot Spa Massager", "Reflexology Roller Foot Massager", "Electric Foot Warmer Massager", "Calf and Foot Compression Massager", "Compact Home Foot Massager", "Vibration Foot Relief Pad", "Leg Circulation Foot Massager", "Premium Foot Spa Bath Massager"],
        prices: [39.5, 44.75, 35.2, 42.9, 29.99, 9.8, 24.5, 49.5, 31.75, 18.6, 46.9, 37.25],
    },
    {
        category: "Massage Chairs",
        names: ["Zero Gravity Full Body Massage Chair", "Compact Recliner Massage Chair", "SL Track Heated Massage Chair", "Luxury Home Massage Chair", "Airbag Compression Massage Chair", "Smart Body Scan Massage Chair", "Bluetooth Relaxation Massage Chair", "Space Saving Massage Recliner", "Foot Roller Massage Chair", "Premium Office Massage Chair", "Deep Kneading Massage Recliner", "Full Body Shiatsu Massage Chair"],
        prices: [249.5, 199.99, 289.75, 349.5, 279.4, 319.8, 259.9, 229.5, 299.99, 219.75, 269.25, 339.9],
    },
    {
        category: "Back Massagers",
        names: ["Heated Back Relief Cushion", "Lumbar Support Back Massager", "Shiatsu Back and Shoulder Pad", "Memory Foam Back Massage Pillow", "Corded Heat Vibration Back Pad", "Upper Back Kneading Massager", "Lower Back Therapy Massager", "Chair Strap Back Massager", "Full Spine Heat Massage Pad", "Portable Back Pain Relief Pillow", "Deep Tissue Back Massage Cushion", "Ergonomic Back Relaxation Pad"],
        prices: [22.4, 18.9, 26.5, 19.75, 24.8, 29.4, 21.25, 17.6, 31.9, 20.5, 28.75, 23.95],
    },
    {
        category: "Scalp Massagers",
        names: ["Silicone Scalp Shampoo Brush", "Electric Scalp Massage Brush", "Waterproof Head Massager", "Soft Bristle Scalp Scrubber", "Rechargeable Scalp Therapy Brush", "Ergonomic Hair Wash Massager", "Deep Clean Scalp Massage Comb", "Vibration Scalp Relaxation Brush", "Travel Scalp Care Massager", "Spa Head Massage Brush", "Gentle Hair Growth Scalp Brush", "Premium Silicone Scalp Tool"],
        prices: [5.9, 11.5, 13.25, 4.8, 15.75, 6.25, 7.4, 12.95, 5.5, 8.2, 9.6, 6.9],
    },
    {
        category: "Heating Pads",
        names: ["Electric Heating Therapy Pad", "Washable Heat Compress Pad", "Neck and Shoulder Heating Wrap", "Fast Heat Pain Relief Pad", "Portable USB Heating Pad", "Large Back Heating Blanket", "Soft Plush Heating Pad", "Auto Shutoff Heat Therapy Pad", "Abdominal Warm Compress Pad", "Joint Relief Heating Wrap", "Travel Size Heating Pad", "Moist Heat Therapy Pad"],
        prices: [13.5, 15.75, 18.6, 14.25, 10.9, 22.5, 16.4, 17.95, 12.8, 15.2, 9.75, 19.4],
    },
    {
        category: "Spa & Wellness Tools",
        names: ["Hot Stone Spa Massage Set", "Facial Roller Wellness Kit", "Body Relaxation Cupping Set", "Aromatherapy Diffuser Spa Kit", "Gua Sha Facial Massage Tool", "Bath Spa Pillow Cushion", "Reflexology Massage Ball Set", "Ice Roller Recovery Tool", "Relaxation Eye Mask Set", "Home Spa Care Bundle", "Wellness Massage Oil Warmer", "Spa Therapy Accessory Kit"],
        prices: [18.5, 7.9, 12.4, 16.75, 6.5, 11.25, 8.6, 9.95, 7.25, 21.4, 19.75, 14.9],
    },
    {
        category: "Electric Massagers",
        names: ["Dual Head Electric Mini Massager", "Rechargeable Body Massager", "USB-C Quiet Electric Massager", "Multi Mode Vibration Massager", "Cordless Handheld Electric Massager", "Heated Electric Therapy Massager", "Palm Size Muscle Massager", "Deep Pulse Electric Massager", "Soft Touch Electric Body Massager", "Wireless Relaxation Massager", "5 Mode Electric Massage Device", "Home Use Electric Massager"],
        prices: [13.75, 18.2, 15.5, 16.9, 19.95, 23.6, 11.8, 17.4, 14.25, 18.75, 15.9, 20.5],
    },
    {
        category: "Portable Massagers",
        names: ["Pocket Mini Travel Massager", "Portable Muscle Relief Wand", "Cordless Travel Body Massager", "Compact Handheld Relaxation Tool", "USB Rechargeable Pocket Massager", "Mini Neck and Shoulder Massager", "Portable Deep Tissue Massager", "Travel Case Vibration Massager", "Lightweight Office Massager", "On The Go Therapy Massager", "Mini Heated Portable Massager", "Silent Portable Massage Device"],
        prices: [8.5, 12.75, 14.9, 10.6, 9.95, 13.4, 16.25, 11.5, 10.25, 12.2, 15.75, 9.4],
    },
];

const massageProducts = massageProductGroups.flatMap((group, groupIndex) => {
    return group.names.map((name, itemIndex) => {
        const price = group.prices[itemIndex];
        const originalPrice = Math.round(price * 2.6 * 100) / 100;

        return {
            name,
            price,
            originalPrice,
            description: `${name} sourced for resale with a reduced base cost, clean product visuals, and simple positioning for wellness, recovery, and home relaxation stores.`,
            category: group.category,
            image: massageCatalogImages[group.category] || "/products/massage-wellness-catalog.png",
            stock: 18 + ((groupIndex * 12 + itemIndex) % 33),
            source: "Verified Supplier",
            sourceProductId: `massage-${group.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${itemIndex + 1}`,
            sourceUrl: "",
            isFeatured: groupIndex < 3 && itemIndex < 2,
            isPromoted: groupIndex < 3 && itemIndex < 2,
            sortOrder: 100 + (groupIndex * 12) + itemIndex,
            catalogVersion: CATALOG_VERSION,
        };
    });
});

export const products = [
    ...starterProducts,
    ...massageProducts,
];

// Quick lookup: product name to local image path
export const LOCAL_PRODUCT_IMAGES: Record<string, string> = Object.fromEntries(
    products.map(p => [p.name, p.image])
);


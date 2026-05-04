// Run with: node src/scripts/reset_products.js
// Wipes Firestore products collection and reseeds with the 20-product catalog

const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, writeBatch, doc } = require("firebase/firestore");

const firebaseConfig = {
    apiKey: "AIzaSyDmrlecFLITi60Lz-J_XTdM8WNgc6UQn6w",
    authDomain: "restockv3.firebaseapp.com",
    projectId: "restockv3",
    storageBucket: "restockv3.firebasestorage.app",
    messagingSenderId: "323249489841",
    appId: "1:323249489841:web:cd0ea65f0c8d128521df90",
};

const CATALOG_VERSION = 4;

const products = [
    { name: "Apple AirPods Pro (3rd Gen)", price: 249, description: "The latest Apple AirPods Pro with active noise cancellation, Adaptive Audio, and up to 30 hours total listening time.", category: "Audio", image: "/products/01_Apple_AirPods_Pro_3rd_Gen.png", isFeatured: true, isPromoted: true, sortOrder: 1, catalogVersion: 4 },
    { name: "Meta Quest 3 Advanced VR Headset", price: 499, description: "Meta's most powerful mixed reality headset. Full-color passthrough, next-gen chipset, and an expansive library of VR and MR experiences.", category: "Tech & Gadgets", image: "/products/02_Meta_Quest_3_Advanced_VR_Headset.png", isFeatured: true, isPromoted: true, sortOrder: 2, catalogVersion: 4 },
    { name: "Withings Body Scan Smart Scale", price: 299, description: "Advanced health tracking scale measuring weight, body composition, nerve activity, and vascular age.", category: "Health & Fitness", image: "/products/03_Withings_Body_Scan_Smart_Scale.png", isFeatured: true, isPromoted: true, sortOrder: 3, catalogVersion: 4 },
    { name: "Breville Barista Express Espresso Machine", price: 799, description: "All-in-one espresso machine with integrated conical burr grinder. Grind, dose, tamp, and extract cafe-quality espresso at home.", category: "Home & Kitchen", image: "/products/05_Breville_Barista_Express_Espresso_Machine.png", isFeatured: true, isPromoted: true, sortOrder: 4, catalogVersion: 4 },
    { name: "Shokz OpenRun Pro Bone Conduction Headphones", price: 179, description: "Premium open-ear headphones using bone conduction technology. Stay aware of your surroundings while enjoying high-quality audio outdoors.", category: "Audio", image: "/products/06_Shokz_OpenRun_Pro_Bone_Conduction_Headphones.png", isFeatured: true, isPromoted: true, sortOrder: 5, catalogVersion: 4 },
    { name: "Dyson Airwrap Multi-Styler Complete Long", price: 599, description: "The iconic multi-styler that curls, waves, smooths, and dries using Coanda airflow with no extreme heat.", category: "Beauty & Personal Care", image: "/products/07_Dyson_Airwrap_Multi_Styler_Complete_Long.png", isFeatured: true, isPromoted: true, sortOrder: 6, catalogVersion: 4 },
    { name: "Fujifilm Instax Mini EVO Instant Camera", price: 199, description: "Hybrid instant camera combining digital shooting with analog printing. 10 lens and film effects, app connectivity, and a premium retro design.", category: "Photography", image: "/products/08_Fujifilm_Instax_Mini_EVO_Instant_Camera.png", isFeatured: true, isPromoted: true, sortOrder: 7, catalogVersion: 4 },
    { name: "Philips Hue Smart Light Starter Kit", price: 199, description: "Transform your home lighting with smart LED bulbs and the Hue Bridge. Control millions of colors via app, voice, or schedule.", category: "Smart Home", image: "/products/09_Philips_Hue_Smart_Light_Starter_Kit.png", isFeatured: true, isPromoted: true, sortOrder: 8, catalogVersion: 4 },
    { name: "GoPro HERO12 Black Action Camera", price: 399, description: "5.3K video, HyperSmooth 6.0 stabilization, and unlimited cloud backup. Waterproof to 33ft out of the box.", category: "Photography", image: "/products/10_GoPro_HERO12_Black_Action_Camera.png", isFeatured: true, isPromoted: true, sortOrder: 9, catalogVersion: 4 },
    { name: "Sonos Era 100 Smart Speaker", price: 249, description: "Premium stereo smart speaker with Trueplay tuning, Bluetooth, and Wi-Fi. Works with Alexa, Google Assistant, and Apple AirPlay 2.", category: "Audio", image: "/products/11_Sonos_Era_100_Smart_Speaker.png", isFeatured: true, isPromoted: true, sortOrder: 10, catalogVersion: 4 },
    { name: "Samsung T9 Portable SSD (2TB)", price: 179, description: "Blazing-fast 2TB portable SSD with USB 3.2 Gen 2x2 speeds up to 2,000 MB/s. Rugged, IP65-rated, and compact.", category: "Tech & Gadgets", image: "/products/12_Samsung_T9_Portable_SSD_2TB.png", isFeatured: true, isPromoted: true, sortOrder: 11, catalogVersion: 4 },
    { name: "Amazon Kindle Paperwhite Bundle", price: 189, description: "Kindle Paperwhite with premium fabric cover and 3-month Kindle Unlimited. 300 ppi glare-free display, waterproof.", category: "Tech & Gadgets", image: "/products/Extra_Amazon_Kindle_Paperwhite_Bundle.png", isFeatured: true, isPromoted: true, sortOrder: 12, catalogVersion: 4 },
    { name: "Apple AirPods Pro 2nd Gen MagSafe USB-C", price: 229, description: "Active Noise Cancellation, Adaptive Transparency, and Personalized Spatial Audio. MagSafe charging case with USB-C.", category: "Audio", image: "/products/Extra_Apple_AirPods_Pro_2nd_Generation_MagSafe_USB_C.png", isFeatured: true, isPromoted: true, sortOrder: 13, catalogVersion: 4 },
    { name: "Beats Studio Pro Wireless Headphones", price: 349, description: "Professional over-ear headphones with active noise cancelling, lossless audio via USB-C, and up to 40 hours battery life.", category: "Audio", image: "/products/Extra_Beats_Studio_Pro_Wireless_Headphones.png", isFeatured: true, isPromoted: true, sortOrder: 14, catalogVersion: 4 },
    { name: "Breville Barista Express With Box", price: 849, description: "The complete Breville Barista Express bundle with everything needed to pull cafe-quality espresso shots at home.", category: "Home & Kitchen", image: "/products/Extra_Breville_Barista_Express_Espresso_Machine_With_Box.png", isFeatured: true, isPromoted: true, sortOrder: 15, catalogVersion: 4 },
    { name: "DJI Mavic 3 Fly More Combo", price: 2199, description: "Professional drone with Hasselblad camera, 46-min flight time, and 15km transmission. Includes extra batteries, charging hub, and carry bag.", category: "Photography", image: "/products/Extra_DJI_Mavic_3_Fly_More_Combo.png", isFeatured: true, isPromoted: true, sortOrder: 16, catalogVersion: 4 },
    { name: "Dyson V15 Detect Cordless Vacuum", price: 749, description: "Most powerful Dyson cordless vacuum with laser dust detection, dynamic load sensor, and 60-min run time.", category: "Home & Kitchen", image: "/products/Extra_Dyson_V15_Detect_Cordless_Vacuum.png", isFeatured: true, isPromoted: true, sortOrder: 17, catalogVersion: 4 },
    { name: "Garmin Forerunner 965 Smartwatch", price: 599, description: "Premium GPS running smartwatch with AMOLED display, full-color maps, training readiness score, and up to 23 days battery life.", category: "Health & Fitness", image: "/products/Extra_Garmin_Forerunner_965_Smartwatch.png", isFeatured: true, isPromoted: true, sortOrder: 18, catalogVersion: 4 },
    { name: "Instant Pot Duo 7-in-1 Electric Pressure Cooker", price: 99, description: "The world's best-selling multi-cooker. Pressure cook, slow cook, rice cook, steam, saute, make yogurt, and keep warm.", category: "Home & Kitchen", image: "/products/Extra_Instant_Pot_Duo_7_in_1_Electric_Pressure_Cooker.png", isFeatured: true, isPromoted: true, sortOrder: 19, catalogVersion: 4 },
    { name: "JBL Live Pro 2 Earbuds", price: 149, description: "True adaptive noise cancelling earbuds with Smart Ambient mode, 40-hour total battery, and 6-mic TrueVoice call technology.", category: "Audio", image: "/products/Extra_JBL_Live_Pro_2_Earbuds.png", isFeatured: true, isPromoted: true, sortOrder: 20, catalogVersion: 4 },
];

async function run() {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const productsRef = collection(db, "products");

    console.log("Fetching existing products...");
    const snapshot = await getDocs(productsRef);
    console.log(`Found ${snapshot.docs.length} existing docs. Deleting...`);

    if (!snapshot.empty) {
        const delBatch = writeBatch(db);
        snapshot.docs.forEach(d => delBatch.delete(d.ref));
        await delBatch.commit();
        console.log("Deleted all existing products.");
    }

    console.log(`Seeding ${products.length} products...`);
    const seedBatch = writeBatch(db);
    products.forEach(p => seedBatch.set(doc(productsRef), p));
    await seedBatch.commit();

    console.log(`Done! ${products.length} products seeded successfully.`);
    process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });

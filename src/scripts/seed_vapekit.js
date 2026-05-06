// Run with: node src/scripts/seed_vapekit.js
// Uploads vapekit.jpg to ImageKit, then seeds the product into Firestore.

const path = require("path");
const fs = require("fs");
const ImageKit = require("imagekit");
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc } = require("firebase/firestore");

// ── Config ────────────────────────────────────────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyDmrlecFLITi60Lz-J_XTdM8WNgc6UQn6w",
    authDomain: "restockv3.firebaseapp.com",
    projectId: "restockv3",
    storageBucket: "restockv3.firebasestorage.app",
    messagingSenderId: "323249489841",
    appId: "1:323249489841:web:cd0ea65f0c8d128521df90",
};

const imagekit = new ImageKit({
    publicKey:   "public_N/wlvvAA07/VjEUW3lMAZISxVdw=",
    privateKey:  "private_vQb2cLbaBiCYtKi+aB8ti2vdubE=",
    urlEndpoint: "https://ik.imagekit.io/immiplanner",
});

// ── Product definition ────────────────────────────────────────────────────────
const PRODUCT = {
    name: "75W Box Mod Vape Kit with Sub-Ohm Tank",
    price: 30,
    description:
        "Rechargeable 75W regulated box mod kit with adjustable wattage, OLED display, and sub-ohm tank. " +
        "Single 18650 external battery (not included). Supports Variable Wattage, Bypass, Temperature Control (Ni/Ti/SS), and TCR modes. " +
        "Wattage range 1–75W, resistance range 0.05–3.5Ω, temp range 100–315°C. " +
        "510-thread connection, USB-C charging. Kit includes: 75W mod, sub-ohm tank (2–4ml), 0.3Ω & 0.5Ω coils, USB cable, and user manual. " +
        "Zinc alloy & stainless steel build. Dimensions: ~45 × 23 × 70.5mm.",
    category: "Vapes & E-Cigarettes",
    isFeatured: true,
    isPromoted: true,
    sortOrder: 22,
    catalogVersion: 4,
};

const IMAGE_PATH = path.join(__dirname, "../../public/products/vapekit.jpg");

async function run() {
    // ── 1. Upload image to ImageKit ───────────────────────────────────────────
    console.log("📤 Uploading image to ImageKit...");
    if (!fs.existsSync(IMAGE_PATH)) {
        console.error("❌ Image not found at:", IMAGE_PATH);
        process.exit(1);
    }

    const fileBuffer = fs.readFileSync(IMAGE_PATH);
    const uploadRes = await imagekit.upload({
        file: fileBuffer,
        fileName: "vapekit.jpg",
        folder: "/shoplinea/products",
    });

    const imageUrl = uploadRes.url;
    console.log("✅ Image uploaded:", imageUrl);

    // ── 2. Seed product to Firestore ──────────────────────────────────────────
    console.log("🌱 Seeding product to Firestore...");
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const docRef = await addDoc(collection(db, "products"), {
        ...PRODUCT,
        image: imageUrl,
    });

    console.log("✅ Product seeded! Firestore doc ID:", docRef.id);
    console.log("   Name   :", PRODUCT.name);
    console.log("   Price  : $" + PRODUCT.price);
    console.log("   Image  :", imageUrl);
    process.exit(0);
}

run().catch(err => {
    console.error("❌ Error:", err.message || err);
    process.exit(1);
});

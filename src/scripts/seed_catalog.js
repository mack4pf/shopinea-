// Run with: node src/scripts/seed_catalog.js
// Upserts the current src/lib/seed/products.ts catalog into Firestore.

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { initializeApp } = require("firebase/app");
const { collection, doc, getFirestore, serverTimestamp, writeBatch } = require("firebase/firestore");

function loadEnv() {
    const envPath = path.join(__dirname, "../../.env");
    if (!fs.existsSync(envPath)) return;

    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const separatorIndex = trimmed.indexOf("=");
        if (separatorIndex === -1) continue;

        const key = trimmed.slice(0, separatorIndex).trim();
        const rawValue = trimmed.slice(separatorIndex + 1).trim();
        process.env[key] = process.env[key] || rawValue.replace(/^["']|["']$/g, "");
    }
}

function getStableProductDocId(product) {
    const key = product.source && product.sourceProductId
        ? `${product.source}:${product.sourceProductId}`.toLowerCase()
        : `name:${product.name}`.toLowerCase();

    return key.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}

function loadSeedProducts() {
    const seedPath = path.join(__dirname, "../lib/seed/products.ts");
    const source = fs.readFileSync(seedPath, "utf8")
        .replace(/export const/g, "const")
        .replace(/massageCatalogImages:\s*Record<string,\s*string>/g, "massageCatalogImages")
        .replace(/LOCAL_PRODUCT_IMAGES:\s*Record<string,\s*string>/g, "LOCAL_PRODUCT_IMAGES");

    const sandbox = { console };
    vm.createContext(sandbox);
    vm.runInContext(`${source}\nglobalThis.__products = products;\nglobalThis.__catalogVersion = CATALOG_VERSION;`, sandbox);

    if (!Array.isArray(sandbox.__products) || sandbox.__products.length === 0) {
        throw new Error("No seed products found.");
    }

    return {
        products: sandbox.__products,
        catalogVersion: sandbox.__catalogVersion,
    };
}

async function commitInChunks(db, products) {
    const productsRef = collection(db, "products");

    for (let index = 0; index < products.length; index += 450) {
        const batch = writeBatch(db);
        const chunk = products.slice(index, index + 450);

        for (const product of chunk) {
            batch.set(doc(productsRef, getStableProductDocId(product)), {
                ...product,
                updatedAt: serverTimestamp(),
                createdAt: serverTimestamp(),
            }, { merge: true });
        }

        await batch.commit();
        console.log(`Seeded ${Math.min(index + chunk.length, products.length)}/${products.length}`);
    }
}

async function run() {
    loadEnv();

    const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    const missing = Object.entries(firebaseConfig).filter(([, value]) => !value).map(([key]) => key);
    if (missing.length) {
        throw new Error(`Missing Firebase config: ${missing.join(", ")}`);
    }

    const { products, catalogVersion } = loadSeedProducts();
    const massageCount = products.filter((product) => String(product.category || "").toLowerCase().includes("massage") ||
        ["Scalp Massagers", "Heating Pads", "Spa & Wellness Tools"].includes(product.category)).length;

    console.log(`Catalog version: ${catalogVersion}`);
    console.log(`Products to upsert: ${products.length}`);
    console.log(`Massage/wellness products: ${massageCount}`);

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    await commitInChunks(db, products);

    console.log("Done. Firestore products catalog is updated.");
    process.exit(0);
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});

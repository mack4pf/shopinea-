import { NextResponse } from "next/server";
import { addDoc, collection, doc, documentId, getDocs, increment, limit, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

const numberValue = (value: unknown) => {
    const next = Number(value || 0);
    return Number.isFinite(next) ? next : 0;
};
const randomBetween = (min: number, max: number) => {
    const low = Math.min(min, max);
    const high = Math.max(min, max);
    return Math.floor(Math.random() * (high - low + 1)) + low;
};
const todayKey = () => new Date().toISOString().slice(0, 10);
const nextRunIso = (frequency: string) => {
    const date = new Date();
    date.setHours(date.getHours() + (frequency === "daily" ? 24 : 1));
    return date.toISOString();
};
const FIRST_NAMES = [
    "Liam", "Emma", "Noah", "Olivia", "James", "Sophia", "Oliver", "Ava", "Ethan", "Isabella",
    "Lucas", "Mia", "Mason", "Charlotte", "Logan", "Amelia", "Aiden", "Harper", "Jack", "Evelyn",
    "Carter", "Abigail", "Sebastian", "Emily", "Owen", "Ella", "Caleb", "Elizabeth", "Ryan", "Camila",
    "Nathan", "Luna", "Wyatt", "Sofia", "Luke", "Avery", "Isaiah", "Mila", "Gabriel", "Aria",
    "Benjamin", "Scarlett", "Elijah", "Penelope", "Julian", "Layla", "Adrian", "Chloe", "Levi", "Victoria",
];
const LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Wilson", "Taylor",
    "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Moore", "Young", "Allen",
    "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson",
    "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts", "Gomez", "Phillips", "Evans",
    "Turner", "Diaz", "Parker", "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris", "Morales",
];
const makeBuyer = (userId: string, orderNumber: number) => {
    const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const name = `${first} ${last}`;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "");
    return {
        id: `ads-${userId}-${Date.now()}-${orderNumber}`,
        name,
        email: `${slug}.${orderNumber}@buyer.shoplinea.local`,
    };
};

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const userId = body?.userId ? String(body.userId) : "";
        const force = Boolean(body?.force);
        const now = new Date();
        const usersQuery = userId
            ? query(collection(db, "users"), where(documentId(), "==", userId), limit(1))
            : query(collection(db, "users"), where("growthAutomation.enabled", "==", true), limit(25));
        const snap = await getDocs(usersQuery);
        let processed = 0;

        for (const userDoc of snap.docs) {
            const user = { id: userDoc.id, ...userDoc.data() } as any;
            const plan = user.growthAutomation || {};
            if (!plan.enabled && !force) continue;
            const dueAt = plan.nextRunAt ? new Date(plan.nextRunAt) : null;
            if (!force && dueAt && dueAt > now) continue;

            const views = randomBetween(numberValue(plan.viewsMin || 200), numberValue(plan.viewsMax || 500));
            const visits = randomBetween(numberValue(plan.visitsMin || 38), numberValue(plan.visitsMax || 50));
            const sales = randomBetween(numberValue(plan.salesMin || 2), numberValue(plan.salesMax || 5));
            const dateKey = todayKey();
            const stores = Array.isArray(user.additionalStores) ? user.additionalStores : [];
            const targetStoreId = plan.targetStoreId || "all";
            const storeMultiplier = targetStoreId === "all" ? 1 + stores.length : 1;
            const accountViews = views * storeMultiplier;
            const accountVisits = visits * storeMultiplier;
            const updates: Record<string, any> = {
                storeViews: increment(accountViews),
                impressions: increment(accountViews),
                storeVisits: increment(accountVisits),
                "stats.views": increment(accountViews),
                [`dailyStoreViews.${dateKey}`]: increment(accountViews),
                [`dailyStoreVisits.${dateKey}`]: increment(accountVisits),
                "growthAutomation.lastRunAt": now.toISOString(),
                "growthAutomation.nextRunAt": nextRunIso(plan.frequency || "hourly"),
                "growthAutomation.lastRun.views": views,
                "growthAutomation.lastRun.visits": visits,
                "growthAutomation.lastRun.sales": sales,
                updatedAt: new Date().toISOString(),
            };

            if (stores.length > 0) {
                updates.additionalStores = stores.map((store: any) => {
                    const selected = targetStoreId === "all" || targetStoreId === store?.id || targetStoreId === store?.storeSlug;
                    if (!selected) return store;
                    return {
                        ...store,
                        storeViews: numberValue(store?.storeViews) + views,
                        impressions: numberValue(store?.impressions) + views,
                        storeVisits: numberValue(store?.storeVisits) + visits,
                        dailyStoreViews: { ...(store?.dailyStoreViews || {}), [dateKey]: numberValue(store?.dailyStoreViews?.[dateKey]) + views },
                        dailyStoreVisits: { ...(store?.dailyStoreVisits || {}), [dateKey]: numberValue(store?.dailyStoreVisits?.[dateKey]) + visits },
                        updatedAt: new Date().toISOString(),
                    };
                });
            }

            const products = Array.isArray(user.storeProducts) ? user.storeProducts : [];
            for (let index = 0; index < sales && products.length > 0; index += 1) {
                const product = products[index % products.length];
                const buyer = makeBuyer(user.id, index + 1);
                const price = numberValue(product?.resellPrice || product?.price || 0);
                const cost = numberValue(product?.price || 0);
                await addDoc(collection(db, "orders"), {
                    productId: product?.id || `auto-${index}`,
                    productName: product?.name || "Store product",
                    productImage: product?.image || "",
                    category: product?.category || "General",
                    initialPrice: cost,
                    resellPrice: price,
                    resellerProfit: Math.max(0, price - cost),
                    resellerId: user.id,
                    resellerName: user.displayName || user.storeName || "Merchant",
                    storeName: user.storeName || "Store",
                    storeSlug: user.storeSlug || "",
                    customerId: buyer.id,
                    customerName: buyer.name,
                    customerEmail: buyer.email,
                    customerCountry: plan.country || "United States",
                    customerAddress: "Address saved after checkout",
                    trafficSource: "Shoplinea Ads",
                    status: "paid_to_site",
                    paymentStatus: "paid",
                    createdAt: serverTimestamp(),
                    automationGenerated: true,
                });
            }

            await updateDoc(doc(db, "users", user.id), updates);
            processed += 1;
        }

        return NextResponse.json({ success: true, processed });
    } catch (error: any) {
        console.error("growth automation error", error);
        return NextResponse.json({ error: error?.message || "Growth automation failed." }, { status: 500 });
    }
}

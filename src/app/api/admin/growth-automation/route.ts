import { NextResponse } from "next/server";
import { addDoc, collection, doc, documentId, getDocs, increment, limit, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

type MetricSet = { views?: number; visits?: number; sales?: number };
type GrowthCycle = {
    cycleKey?: string;
    frequency?: string;
    target?: MetricSet;
    applied?: MetricSet;
    startedAt?: string;
    lastStepKey?: string;
    lastStepAt?: string;
};
type GrowthPlan = {
    enabled?: boolean;
    frequency?: string;
    targetStoreId?: string;
    country?: string;
    nextRunAt?: string;
    viewsMin?: number;
    viewsMax?: number;
    visitsMin?: number;
    visitsMax?: number;
    salesMin?: number;
    salesMax?: number;
    activeCycle?: GrowthCycle;
};
type StoreProduct = {
    id?: string;
    name?: string;
    image?: string;
    category?: string;
    price?: number;
    resellPrice?: number;
    _storeId?: string;
    _storeSlug?: string;
    _storeName?: string;
};
type StoreRecord = {
    id?: string;
    storeSlug?: string;
    storeName?: string;
    storeProducts?: StoreProduct[];
    storeViews?: number;
    impressions?: number;
    storeVisits?: number;
    dailyStoreViews?: Record<string, number>;
    dailyStoreVisits?: Record<string, number>;
};
type UserRecord = {
    id: string;
    growthAutomation?: GrowthPlan;
    additionalStores?: StoreRecord[];
    storeProducts?: StoreProduct[];
    storeSlug?: string;
    storeName?: string;
    displayName?: string;
};

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
const cycleConfigFor = (frequency: string, date = new Date()) => {
    const daily = frequency === "daily";
    const steps = daily ? 24 : 12;
    const stepMinutes = daily ? 60 : 5;
    const cycleKey = daily
        ? date.toISOString().slice(0, 10)
        : date.toISOString().slice(0, 13);
    const stepIndex = daily
        ? Math.min(steps - 1, date.getHours())
        : Math.min(steps - 1, Math.floor(date.getMinutes() / stepMinutes));
    return { cycleKey, daily, stepIndex, stepMinutes, steps };
};
const nextRunIso = (frequency: string) => {
    const date = new Date();
    const { stepMinutes } = cycleConfigFor(frequency, date);
    date.setMinutes(date.getMinutes() + stepMinutes);
    return date.toISOString();
};
const cycleTargetFor = (plan: GrowthPlan) => ({
    views: randomBetween(numberValue(plan.viewsMin || 200), numberValue(plan.viewsMax || 500)),
    visits: randomBetween(numberValue(plan.visitsMin || 38), numberValue(plan.visitsMax || 50)),
    sales: randomBetween(numberValue(plan.salesMin || 2), numberValue(plan.salesMax || 5)),
});
const stepDeltaFor = (target: number, applied: number, stepIndex: number, steps: number) => {
    const safeTarget = Math.max(0, Math.floor(target));
    const safeApplied = Math.max(0, Math.floor(applied));
    if (safeTarget <= safeApplied) return 0;
    const desiredApplied = stepIndex >= steps - 1
        ? safeTarget
        : Math.floor((safeTarget * (stepIndex + 1)) / steps);
    return Math.max(0, Math.min(safeTarget - safeApplied, desiredApplied - safeApplied));
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
const productsForTargetStore = (user: UserRecord, targetStoreId: string) => {
    const primaryProducts = (Array.isArray(user.storeProducts) ? user.storeProducts : []).map((product: StoreProduct) => ({
        ...product,
        _storeId: "primary",
        _storeSlug: user.storeSlug || "",
        _storeName: user.storeName || "Store",
    }));
    const storeProducts = (Array.isArray(user.additionalStores) ? user.additionalStores : []).flatMap((store: StoreRecord) =>
        (Array.isArray(store?.storeProducts) ? store.storeProducts : []).map((product: StoreProduct) => ({
            ...product,
            _storeId: store?.id || store?.storeSlug || "store",
            _storeSlug: store?.storeSlug || "",
            _storeName: store?.storeName || "Additional store",
        }))
    );
    const allProducts = [...primaryProducts, ...storeProducts];
    if (targetStoreId === "all") return allProducts;
    return allProducts.filter((product: StoreProduct) => product._storeId === targetStoreId || product._storeSlug === targetStoreId);
};

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({})) as { userId?: string; force?: boolean };
        const userId = body?.userId ? String(body.userId) : "";
        const force = Boolean(body?.force);
        const now = new Date();
        const usersQuery = userId
            ? query(collection(db, "users"), where(documentId(), "==", userId), limit(1))
            : query(collection(db, "users"), where("growthAutomation.enabled", "==", true), limit(25));
        const snap = await getDocs(usersQuery);
        let processed = 0;

        for (const userDoc of snap.docs) {
            const user = { id: userDoc.id, ...userDoc.data() } as UserRecord;
            const plan = user.growthAutomation || {};
            if (!plan.enabled && !force) continue;
            const dueAt = plan.nextRunAt ? new Date(plan.nextRunAt) : null;
            if (!force && dueAt && dueAt > now) continue;

            const frequency = plan.frequency || "hourly";
            const cycleConfig = cycleConfigFor(frequency, now);
            const previousCycle = plan.activeCycle?.cycleKey === cycleConfig.cycleKey ? plan.activeCycle : null;
            const activeCycle = previousCycle || {
                cycleKey: cycleConfig.cycleKey,
                frequency,
                target: cycleTargetFor(plan),
                applied: { views: 0, visits: 0, sales: 0 },
                startedAt: now.toISOString(),
            };
            const stepKey = `${activeCycle.cycleKey}:${cycleConfig.stepIndex}`;
            if (activeCycle.lastStepKey === stepKey) continue;

            const target = activeCycle.target || { views: 0, visits: 0, sales: 0 };
            const applied = activeCycle.applied || { views: 0, visits: 0, sales: 0 };
            const views = stepDeltaFor(numberValue(target.views), numberValue(applied.views), cycleConfig.stepIndex, cycleConfig.steps);
            const visits = stepDeltaFor(numberValue(target.visits), numberValue(applied.visits), cycleConfig.stepIndex, cycleConfig.steps);
            const sales = stepDeltaFor(numberValue(target.sales), numberValue(applied.sales), cycleConfig.stepIndex, cycleConfig.steps);
            const dateKey = todayKey();
            const stores = Array.isArray(user.additionalStores) ? user.additionalStores : [];
            const targetStoreId = plan.targetStoreId || "all";
            const storeMultiplier = targetStoreId === "all" ? 1 + stores.length : 1;
            const accountViews = views * storeMultiplier;
            const accountVisits = visits * storeMultiplier;
            const updates: Record<string, unknown> = {
                storeViews: increment(accountViews),
                impressions: increment(accountViews),
                storeVisits: increment(accountVisits),
                "stats.views": increment(accountViews),
                [`dailyStoreViews.${dateKey}`]: increment(accountViews),
                [`dailyStoreVisits.${dateKey}`]: increment(accountVisits),
                "growthAutomation.lastRunAt": now.toISOString(),
                "growthAutomation.nextRunAt": nextRunIso(frequency),
                "growthAutomation.lastRun.views": views,
                "growthAutomation.lastRun.visits": visits,
                "growthAutomation.lastRun.sales": sales,
                "growthAutomation.lastRun.step": cycleConfig.stepIndex + 1,
                "growthAutomation.lastRun.steps": cycleConfig.steps,
                "growthAutomation.activeCycle": {
                    ...activeCycle,
                    applied: {
                        views: numberValue(applied.views) + views,
                        visits: numberValue(applied.visits) + visits,
                        sales: numberValue(applied.sales) + sales,
                    },
                    lastStepKey: stepKey,
                    lastStepAt: now.toISOString(),
                },
                updatedAt: new Date().toISOString(),
            };

            if (stores.length > 0) {
                updates.additionalStores = stores.map((store: StoreRecord) => {
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

            const products = productsForTargetStore(user, targetStoreId);
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
                    storeId: product?._storeId || "primary",
                    storeName: product?._storeName || user.storeName || "Store",
                    storeSlug: product?._storeSlug || user.storeSlug || "",
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
    } catch (error: unknown) {
        console.error("growth automation error", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Growth automation failed." }, { status: 500 });
    }
}

export const analyticsDateKey = () => new Date().toISOString().slice(0, 10);

export const analyticsNumber = (value: unknown) => {
    const next = Number(value || 0);
    return Number.isFinite(next) ? next : 0;
};

export const allStoresForAnalytics = (data: any) => {
    const todayKey = analyticsDateKey();
    const additionalStores = Array.isArray(data?.additionalStores) ? data.additionalStores : [];
    const rootViews = analyticsNumber(data?.storeViews || data?.impressions || data?.stats?.views);
    const rootVisits = analyticsNumber(data?.storeVisits || rootViews);
    const rootViewsToday = analyticsNumber(data?.dailyStoreViews?.[todayKey]);
    const rootVisitsToday = analyticsNumber(data?.dailyStoreVisits?.[todayKey]);
    const additionalViews = additionalStores.reduce((sum: number, store: any) => sum + analyticsNumber(store?.storeViews || store?.impressions), 0);
    const additionalVisits = additionalStores.reduce((sum: number, store: any) => sum + analyticsNumber(store?.storeVisits), 0);
    const additionalViewsToday = additionalStores.reduce((sum: number, store: any) => sum + analyticsNumber(store?.dailyStoreViews?.[todayKey]), 0);
    const additionalVisitsToday = additionalStores.reduce((sum: number, store: any) => sum + analyticsNumber(store?.dailyStoreVisits?.[todayKey]), 0);

    return [
        {
            id: "primary",
            name: data?.storeName || "Primary store",
            slug: data?.storeSlug || "",
            products: Array.isArray(data?.storeProducts) ? data.storeProducts : [],
            views: Math.max(0, rootViews - additionalViews),
            visits: Math.max(0, rootVisits - additionalVisits),
            viewsToday: Math.max(0, rootViewsToday - additionalViewsToday),
            visitsToday: Math.max(0, rootVisitsToday - additionalVisitsToday),
        },
        ...additionalStores.map((store: any) => ({
            id: store?.id || store?.storeSlug || "store",
            name: store?.storeName || "Additional store",
            slug: store?.storeSlug || "",
            products: Array.isArray(store?.storeProducts) ? store.storeProducts : [],
            views: analyticsNumber(store?.storeViews || store?.impressions),
            visits: analyticsNumber(store?.storeVisits),
            viewsToday: analyticsNumber(store?.dailyStoreViews?.[todayKey]),
            visitsToday: analyticsNumber(store?.dailyStoreVisits?.[todayKey]),
        })),
    ];
};

export const storeTotalsForAnalytics = (data: any) => {
    const stores = allStoresForAnalytics(data);
    const rootViews = analyticsNumber(data?.storeViews || data?.impressions || data?.stats?.views);
    const rootVisits = analyticsNumber(data?.storeVisits || rootViews);
    const rootViewsToday = analyticsNumber(data?.dailyStoreViews?.[analyticsDateKey()]);
    const rootVisitsToday = analyticsNumber(data?.dailyStoreVisits?.[analyticsDateKey()]);
    const summedViews = stores.reduce((sum: number, store: any) => sum + analyticsNumber(store?.views), 0);
    const summedVisits = stores.reduce((sum: number, store: any) => sum + analyticsNumber(store?.visits), 0);
    const summedViewsToday = stores.reduce((sum: number, store: any) => sum + analyticsNumber(store?.viewsToday), 0);
    const summedVisitsToday = stores.reduce((sum: number, store: any) => sum + analyticsNumber(store?.visitsToday), 0);

    return {
        stores,
        views: Math.max(rootViews, summedViews),
        visits: Math.max(rootVisits, summedVisits),
        viewsToday: Math.max(rootViewsToday, summedViewsToday),
        visitsToday: Math.max(rootVisitsToday, summedVisitsToday),
    };
};

export const orderBelongsToAnalyticsStore = (order: any, store: any) => {
    if (order?.storeId && order.storeId === store.id) return true;
    if (order?.storeSlug && store.slug && order.storeSlug === store.slug) return true;
    const productId = String(order?.productId || "");
    const productName = String(order?.productName || "").toLowerCase();
    return store.products.some((product: any) =>
        (productId && String(product?.id || "") === productId) ||
        (productName && String(product?.name || "").toLowerCase() === productName)
    );
};

export const SUBSCRIPTION_PLANS = [
    {
        id: "pro_300",
        name: "Starter",
        price: 300,
        billingLabel: "/month",
        durationDays: 30,
        aiCredits: 0,
        adCredits: 25,
        maxStores: 1,
        features: [
            "Up to 50 active products",
            "Professional storefront",
            "Real-time order tracking",
            "Standard support",
            "$25 free ads credit monthly",
        ],
    },
    {
        id: "elite_500",
        name: "Professional",
        price: 500,
        billingLabel: "/month",
        durationDays: 30,
        aiCredits: 200,
        adCredits: 75,
        maxStores: 3,
        features: [
            "Unlimited products",
            "Multiple stores up to 3",
            "AI to run your store",
            "Custom domain support",
            "Website AI credits",
            "$75 free ads credit monthly",
            "AI product recommendations",
            "Advanced sales analytics",
            "SEO optimization tools",
        ],
    },
    {
        id: "venture_1200",
        name: "Scale",
        price: 1200,
        billingLabel: "/year",
        durationDays: 365,
        aiCredits: 750,
        adCredits: 250,
        maxStores: 10,
        features: [
            "Bulk order processing",
            "Dedicated account manager",
            "White-label packaging",
            "Custom API access",
            "AI to run your store",
            "Custom domain setup",
            "Custom store landing page",
            "AI custom store build request",
            "3-24 hour custom-store setup window",
            "Multiple stores up to 10",
            "$250 free ads credit",
        ],
    },
    {
        id: "enterprise_5000",
        name: "Enterprise",
        price: 5000,
        billingLabel: "/year",
        durationDays: 365,
        aiCredits: 2500,
        adCredits: 1000,
        maxStores: 999,
        features: [
            "Multi-store management",
            "AI to run your store network",
            "Custom domains for stores",
            "Custom website hosting support",
            "Custom store landing pages",
            "Priority AI custom-store build queue",
            "Full legal compliance suite",
            "Automated tax management",
            "Concierge support 24/7",
            "$1,000 free ads credit",
        ],
    },
];

export const getSubscriptionPlan = (planId: string) =>
    SUBSCRIPTION_PLANS.find(plan => plan.id === planId) || SUBSCRIPTION_PLANS[0];

export const getPlanExpiryDate = (planId: string, start = new Date()) => {
    const plan = getSubscriptionPlan(planId);
    return new Date(start.getTime() + plan.durationDays * 24 * 60 * 60 * 1000).toISOString();
};

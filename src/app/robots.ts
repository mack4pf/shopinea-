import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: [
                    "/",
                    "/about-us",
                    "/pricing",
                    "/services",
                    "/resellers",
                    "/suppliers",
                    "/guides",
                    "/documentation",
                    "/support",
                    "/privacy",
                    "/terms",
                    "/login",
                    "/register",
                    "/marketplace",
                ],
                disallow: [
                    "/admin",
                    "/dashboard",
                    "/buyer-orders",
                    "/onboarding",
                    "/api",
                ],
            },
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
        host: SITE_URL,
    };
}

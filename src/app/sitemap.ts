import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const publicRoutes = [
    "",
    "/about-us",
    "/pricing",
    "/services",
    "/resellers",
    "/suppliers",
    "/guides",
    "/documentation",
    "/support",
    "/trust",
    "/privacy",
    "/terms",
    "/marketplace",
    "/login",
    "/register",
];

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date();

    return publicRoutes.map((route) => ({
        url: `${SITE_URL}${route}`,
        lastModified: now,
        changeFrequency: route === "" ? "daily" : "weekly",
        priority: route === "" ? 1 : route === "/pricing" || route === "/resellers" ? 0.9 : 0.7,
    }));
}

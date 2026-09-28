import { NextResponse, type NextRequest } from "next/server";

const ROOT_DOMAIN = "shoplinea.pro";
const RESERVED_SUBDOMAINS = new Set([
    "www",
    "admin",
    "api",
    "app",
    "assets",
    "cdn",
    "dashboard",
    "login",
    "mail",
    "support",
]);
const PUBLIC_FILE = /\.[^/]+$/;

export function middleware(request: NextRequest) {
    const url = request.nextUrl.clone();
    const hostname = (request.headers.get("host") || "").split(":")[0].toLowerCase();

    if (!hostname.endsWith(`.${ROOT_DOMAIN}`)) {
        return NextResponse.next();
    }

    const subdomain = hostname.slice(0, -(`.${ROOT_DOMAIN}`).length);
    if (
        !subdomain ||
        RESERVED_SUBDOMAINS.has(subdomain) ||
        !/^[a-z0-9-]+$/.test(subdomain) ||
        PUBLIC_FILE.test(url.pathname)
    ) {
        return NextResponse.next();
    }

    url.pathname = `/store/${subdomain}`;
    return NextResponse.rewrite(url);
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};

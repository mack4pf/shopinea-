"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
    interface Window {
        Formilla?: {
            guid?: string;
            loadWidgets?: () => void;
        };
    }
}

const HIDDEN_ROUTES = ["/onboarding", "/register", "/login", "/forgot-password"];

function removeFormillaElements() {
    document
        .querySelectorAll('[id*="formilla" i], [class*="formilla" i], iframe[src*="formilla.com"]')
        .forEach(element => element.remove());
}

export function FormillaWidget() {
    const pathname = usePathname();
    const shouldHide = HIDDEN_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));

    useEffect(() => {
        if (shouldHide) {
            removeFormillaElements();
            return;
        }

        if (document.getElementById("formilla-feedback-script")) {
            window.Formilla = window.Formilla || {};
            window.Formilla.guid = "csda0c16-7789-40a7-a84d-29b15c8b5460";
            window.Formilla.loadWidgets?.();
            return;
        }

        const script = document.createElement("script");
        script.id = "formilla-feedback-script";
        script.type = "text/javascript";
        script.src = `${document.location.protocol === "https:" ? "https" : "http"}://www.formilla.com/scripts/feedback.js`;
        script.async = true;
        script.onload = () => {
            window.Formilla = window.Formilla || {};
            window.Formilla.guid = "csda0c16-7789-40a7-a84d-29b15c8b5460";
            window.Formilla.loadWidgets?.();
        };

        document.head.appendChild(script);
    }, [shouldHide]);

    return null;
}

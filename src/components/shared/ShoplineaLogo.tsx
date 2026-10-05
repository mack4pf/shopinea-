import React from "react";

interface ShoplineaLogoProps {
    size?: number;
    className?: string;
}

export function ShoplineaLogo({ size = 36, className = "" }: ShoplineaLogoProps) {
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src="/images/shoplinea-logo.png"
            alt="Shoplinea"
            width={size}
            height={size}
            className={`object-contain ${className}`}
        />
    );
}



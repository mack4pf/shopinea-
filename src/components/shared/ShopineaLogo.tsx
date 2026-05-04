import React from "react";

interface ShopineaLogoProps {
    size?: number;
    className?: string;
}

export function ShopineaLogo({ size = 36, className = "" }: ShopineaLogoProps) {
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src="/images/sholinealogo2.png"
            alt="shopinea"
            width={size}
            height={size}
            className={`object-contain ${className}`}
        />
    );
}



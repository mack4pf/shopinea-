/**
 * Real brand SVG logos for use across the platform.
 * All logos are inline SVG, no external dependencies required.
 */

interface LogoProps {
    className?: string;
    size?: number;
}

export function MetaLogo({ className, size = 24 }: LogoProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" fill="#1877F2" />
            <path d="M13.25 8.5h-1.5C10.56 8.5 10 9.06 10 10.25V12H8.5v2H10v5h2.5v-5h1.75l.25-2H12.5v-1.25c0-.345.28-.625.625-.625H14.5V8.5h-1.25z" fill="white" />
        </svg>
    );
}

export function FacebookLogo({ className, size = 24 }: LogoProps) {
    return <MetaLogo className={className} size={size} />;
}

export function TikTokLogo({ className, size = 24 }: LogoProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect width="24" height="24" rx="6" fill="#000000" />
            <path d="M17.5 6.5c-.9-.6-1.5-1.6-1.5-2.7h-2.2v9.6c0 1.2-1 2.1-2.2 2.1-1.2 0-2.2-1-2.2-2.2 0-1.2 1-2.2 2.2-2.2.2 0 .5 0 .7.1V8.9c-.2 0-.4-.1-.7-.1-2.4 0-4.4 2-4.4 4.4 0 2.4 2 4.4 4.4 4.4 2.4 0 4.4-2 4.4-4.4V9.5c.8.6 1.8.9 2.8.9V8.2c-.6 0-1.1-.2-1.3-.5v-.9a2.7 2.7 0 0 1-1.5-1.2l.5.9z" fill="white" />
            <path d="M19 9.5v-1.3c-.5 0-1 .1-1.4-.2l-.1.4c.5.7 1 1 1.5 1.1z" fill="#69C9D0" />
            <path d="M13.8 3.8h-2.2c0 1.1.6 2.1 1.5 2.7.2.3.7.5 1.3.5l.3-.8c-.5-.3-.9-.8-.9-1.4v-1z" fill="#EE1D52" />
        </svg>
    );
}

export function GoogleLogo({ className, size = 24 }: LogoProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}

export function YouTubeLogo({ className, size = 24 }: LogoProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" fill="#FF0000" />
            <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="white" />
        </svg>
    );
}

export function PayPalLogo({ className, size = 24 }: LogoProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" fill="#003087" />
            <path d="M21.222 6.917a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" fill="#009CDE" />
        </svg>
    );
}

export function CashAppLogo({ className, size = 24 }: LogoProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect width="24" height="24" rx="6" fill="#00D64F" />
            <path d="M13.5 7.5c-.9-.3-1.9-.5-2.8-.4-1.9.2-3.2 1.1-3.2 2.7 0 1.4 1.1 2.1 2.8 2.6 1.2.4 1.7.6 1.7 1.2 0 .7-.7 1-1.7 1-.9 0-1.8-.3-2.6-.8l-.7 1.9c.9.6 2 .9 3.2.9v1.4h1.6v-1.5c2.1-.3 3.2-1.5 3.2-3 0-1.6-1.1-2.3-2.9-2.8-1.1-.3-1.6-.6-1.6-1.1 0-.5.5-.9 1.5-.9.7 0 1.5.2 2.1.6l.7-1.8c-.6-.4-1.3-.7-2-.8V7.5H13.5z" fill="white" />
        </svg>
    );
}

export function BitcoinLogo({ className, size = 24 }: LogoProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className}>
            <circle cx="12" cy="12" r="12" fill="#F7931A" />
            <path d="M16.662 10.65c.226-1.51-.925-2.32-2.5-2.862l.51-2.048-1.247-.31-.497 1.994c-.328-.082-.664-.16-.999-.236l.5-2.006-1.246-.31-.51 2.046c-.272-.062-.538-.123-.797-.187l.001-.006-1.72-.43-.331 1.332s.925.212.906.225c.505.126.596.46.581.725l-1.4 5.614c-.06.148-.21.37-.552.285.012.018-.907-.226-.907-.226L6.158 15.8l1.622.404c.302.076.598.155.89.23l-.516 2.07 1.245.311.51-2.05c.34.092.67.177.993.257l-.508 2.037 1.247.311.516-2.065c2.128.403 3.728.24 4.4-1.685.543-1.548-.027-2.44-1.145-3.022.815-.188 1.428-.723 1.591-1.828zm-2.849 3.995c-.386 1.549-2.994.711-3.84.5l.685-2.746c.847.211 3.562.63 3.155 2.246zm.386-4.013c-.352 1.41-2.525.694-3.228.518l.621-2.49c.703.175 2.965.502 2.607 1.972z" fill="white" />
        </svg>
    );
}

export function USDTLogo({ className, size = 24 }: LogoProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className}>
            <circle cx="12" cy="12" r="12" fill="#26A17B" />
            <path d="M13.35 10.74v-1.6h3.37V7H7.28v2.14h3.37v1.6C7.7 10.89 5.9 11.55 5.9 12.34c0 .79 1.8 1.45 4.75 1.6v4.82h1.7v-4.82c2.95-.15 4.75-.81 4.75-1.6 0-.79-1.8-1.45-4.75-1.6zm0 2.64v-.01c-.1.01-.62.04-1.35.04-.73 0-1.25-.03-1.35-.04v.01C7.82 13.24 6.5 12.72 6.5 12.1c0-.62 1.32-1.14 3.15-1.28v2c.1.01.62.04 1.35.04.73 0 1.25-.03 1.35-.04v-2c1.83.14 3.15.66 3.15 1.28 0 .62-1.32 1.14-3.15 1.28z" fill="white" />
        </svg>
    );
}

export function EthereumLogo({ className, size = 24 }: LogoProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className}>
            <circle cx="12" cy="12" r="12" fill="#627EEA" />
            <path d="M12.373 3v6.652l5.623 2.513z" fill="white" fillOpacity="0.6" />
            <path d="M12.373 3L6.75 12.165l5.623-2.513z" fill="white" />
            <path d="M12.373 16.476v4.52l5.627-7.784z" fill="white" fillOpacity="0.6" />
            <path d="M12.373 20.996v-4.52L6.75 13.212z" fill="white" />
            <path d="M12.373 15.43l5.623-3.265-5.623-2.513z" fill="white" fillOpacity="0.2" />
            <path d="M6.75 12.165l5.623 3.265V9.652z" fill="white" fillOpacity="0.6" />
        </svg>
    );
}

export function InstagramLogo({ className, size = 24 }: LogoProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className}>
            <defs>
                <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
                    <stop offset="0%" stopColor="#ffd600" />
                    <stop offset="50%" stopColor="#ff0069" />
                    <stop offset="100%" stopColor="#d300c5" />
                </radialGradient>
            </defs>
            <rect width="24" height="24" rx="6" fill="url(#ig-grad)" />
            <rect x="6.5" y="6.5" width="11" height="11" rx="3.5" stroke="white" strokeWidth="1.5" fill="none" />
            <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="1.5" fill="none" />
            <circle cx="16.5" cy="7.5" r="0.75" fill="white" />
        </svg>
    );
}

export function SnapchatLogo({ className, size = 24 }: LogoProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect width="24" height="24" rx="6" fill="#FFFC00" />
            <path d="M12 4c-2 0-3.8 1.6-3.8 4.2 0 .3 0 .6.1.9-.2.1-.5.1-.8 0-.3-.1-.6.1-.6.4s.2.5.5.6c.6.2 1 .5 1 .8 0 .4-.3.9-1.5 1.2-.3.1-.4.3-.3.5.3.7 1 .8 1.5.9.1.5.3.9.8.9.4 0 .8-.2 1.5-.3.7-.1 1.3-.1 1.6 0 .7.1 1.1.3 1.5.3.5 0 .7-.4.8-.9.5-.1 1.2-.2 1.5-.9.1-.2 0-.4-.3-.5-1.2-.3-1.5-.8-1.5-1.2 0-.3.4-.6 1-.8.3-.1.5-.3.5-.6s-.3-.5-.6-.4c-.3.1-.6.1-.8 0 0-.3.1-.6.1-.9C15.8 5.6 14 4 12 4z" fill="#000000" />
        </svg>
    );
}

export function PinterestLogo({ className, size = 24 }: LogoProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className}>
            <circle cx="12" cy="12" r="12" fill="#E60023" />
            <path d="M12 3C7.03 3 3 7.03 3 12c0 3.77 2.29 7.01 5.58 8.39-.08-.72-.15-1.83.03-2.62.16-.71 1.08-4.58 1.08-4.58s-.28-.55-.28-1.36c0-1.28.74-2.23 1.66-2.23.78 0 1.16.59 1.16 1.29 0 .79-.5 1.97-.76 3.06-.22.91.45 1.65 1.34 1.65 1.61 0 2.85-1.7 2.85-4.14 0-2.17-1.56-3.68-3.79-3.68-2.58 0-4.1 1.94-4.1 3.94 0 .78.3 1.62.67 2.07.07.09.08.17.06.26-.07.29-.22.91-.25 1.04-.04.17-.13.2-.3.12-1.12-.52-1.82-2.17-1.82-3.49 0-2.84 2.06-5.44 5.95-5.44 3.12 0 5.55 2.22 5.55 5.19 0 3.09-1.95 5.58-4.65 5.58-1 0-1.72-.52-2-.11l-.54 2.13c-.2.75-.72 1.69-1.07 2.26.8.25 1.65.38 2.52.38 4.97 0 9-4.03 9-9s-4.03-9-9-9z" fill="white" />
        </svg>
    );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

export default function ProtectedRoute({
    children,
    allowedRoles,
}: ProtectedRouteProps) {
    const { user, role, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
            } else if (allowedRoles && role && !allowedRoles.includes(role)) {
                // Redirect to appropriate dashboard based on actual role
                if (role === 'admin') router.push("/dashboard/admin");
                else if (role === 'supplier') router.push("/dashboard/supplier");
                else router.push("/dashboard/reseller");
            }
        }
    }, [user, role, loading, allowedRoles, router]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (!user) return null;
    if (allowedRoles && role && !allowedRoles.includes(role)) return null;

    return <>{children}</>;
}

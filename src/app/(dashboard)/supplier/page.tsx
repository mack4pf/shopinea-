"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SupplierDashboard() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/dashboard");
    }, [router]);

    return (
        <div className="h-[80vh] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
    );
}

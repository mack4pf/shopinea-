"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function SupplierDashboard() {
    return (
        <ProtectedRoute allowedRoles={['supplier']}>
            <div className="p-8">
                <h1 className="text-3xl font-bold mb-6">Supplier Dashboard</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-2">Active Products</h3>
                        <p className="text-3xl font-bold text-primary">0</p>
                    </div>
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-2">Pending Orders</h3>
                        <p className="text-3xl font-bold text-accent">0</p>
                    </div>
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-2">Total Sales</h3>
                        <p className="text-3xl font-bold text-secondary">$0.00</p>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}

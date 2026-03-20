"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function ResellerDashboard() {
    return (
        <ProtectedRoute allowedRoles={['reseller']}>
            <div className="p-8">
                <h1 className="text-3xl font-bold mb-6">Reseller Dashboard</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-2">My Store</h3>
                        <p className="text-sm text-gray-500 mb-4">Manage your virtual store</p>
                        <button className="text-primary hover:underline">View Store &rarr;</button>
                    </div>
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-2">Active Orders</h3>
                        <p className="text-3xl font-bold text-accent">0</p>
                    </div>
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-2">Earnings</h3>
                        <p className="text-3xl font-bold text-secondary">$0.00</p>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}

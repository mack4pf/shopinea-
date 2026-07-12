export type UserRole = 'supplier' | 'reseller' | 'admin';

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
    createdAt: number;
    photoURL?: string;
}

export interface Supplier extends UserProfile {
    companyName: string;
    isVerified: boolean;
    rating: number; // 0-5
    leadTime: string;
    moqPolicy: string;
    location: string;
    stripeAccountId?: string;
}

export interface Reseller extends UserProfile {
    storeName: string;
    storeUrl?: string;
    pendingBalance: number;
    totalEarnings: number;
}

export type ProductSource = 'Amazon' | 'Aliexpress' | 'Alibaba';

export interface Product {
    id: string;
    // supplierId: string; // Removed as we are using source
    source: ProductSource;
    sourceUrl?: string; // Link to original product
    title: string;
    description: string;
    category: string;
    images: string[];
    price: number; // Simplified pricing for now
    moq: number;
    status: 'active' | 'draft' | 'archived';
    createdAt: number;
}

export interface Order {
    id: string;
    resellerId: string;
    customerEmail: string;
    items: {
        productId: string;
        quantity: number;
        priceAtPurchase: number;
    }[];
    totalAmount: number;
    status: 'pending' | 'pending_payment' | 'payment_pending' | 'payment_failed' | 'void_no_payment' | 'paid_to_site' | 'awaiting_admin_confirmation' | 'awaiting_seller_fulfillment' | 'aggregated' | 'shipped' | 'delivered' | 'cancelled';
    createdAt: number;
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    };
}

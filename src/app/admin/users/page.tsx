"use client";

import {
    Users,
    Search,
    Filter,
    MoreVertical,
    Mail,
    Crown,
    ShieldCheck,
    Loader2,
    DollarSign,
    TrendingUp,
    Shield,
    Trash2,
    Edit,
    Megaphone,
    Wallet,
    Eye,
    Zap,
    Clock,
    ShieldAlert,
    Box,
    CheckCircle2,
    XCircle,
    ArrowUpRight,
    Play,
    MapPin,
    Plus,
    X,
    BarChart3,
    Package,
    LockKeyhole,
    UnlockKeyhole
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button, cn } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { onAuthStateChanged } from "firebase/auth";
import { Modal } from "@/components/ui/modal";
import { where, addDoc, serverTimestamp, getDoc, collection, doc, getDocs, increment, orderBy, query, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { useState, useEffect } from "react";

const ADMIN_PAYMENT_PLANS = [
    { id: "pro_300", name: "Starter", aiCredits: 0, adCredits: 25, maxStores: 1 },
    { id: "elite_500", name: "Professional", aiCredits: 200, adCredits: 75, maxStores: 3 },
    { id: "venture_1200", name: "Scale", aiCredits: 750, adCredits: 250, maxStores: 10 },
    { id: "enterprise_5000", name: "Enterprise", aiCredits: 2500, adCredits: 1000, maxStores: 999 },
];

// ─── City API helper ──────────────────────────────────────────────────────────
const cityCache: Record<string, string[]> = {};
async function fetchCitiesForCountry(country: string): Promise<string[]> {
    const key = country.trim().toLowerCase();
    if (cityCache[key]) return cityCache[key];
    try {
        const res = await fetch("https://countriesnow.space/api/v0.1/countries/cities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ country: country.trim() }),
        });
        const json = await res.json();
        if (!json.error && Array.isArray(json.data) && json.data.length > 0) {
            cityCache[key] = json.data;
            return json.data;
        }
    } catch { /* fall through */ }
    return [];
}

export default function UserMatrixPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

    // Individual User Management
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [userOrders, setUserOrders] = useState<any[]>([]);
    const [userTransactions, setUserTransactions] = useState<any[]>([]);
    const [userProducts, setUserProducts] = useState<any[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [boostingSales, setBoostingSales] = useState(false);
    const [transactionProcessingId, setTransactionProcessingId] = useState<string | null>(null);
    const [manualPaymentType, setManualPaymentType] = useState("deposit");
    const [manualPaymentAmount, setManualPaymentAmount] = useState("");
    const [manualPaymentMethod, setManualPaymentMethod] = useState("Admin credit");
    const [manualPaymentReference, setManualPaymentReference] = useState("");
    const [manualPaymentNote, setManualPaymentNote] = useState("");
    const [manualPaymentPlanId, setManualPaymentPlanId] = useState(ADMIN_PAYMENT_PLANS[0].id);
    const [manualPaymentSaving, setManualPaymentSaving] = useState(false);
    const [lockSavingField, setLockSavingField] = useState<string | null>(null);

    // Sales Simulator
    const [simLocations, setSimLocations] = useState<{ country: string; count: string }[]>([{ country: "United States", count: "10" }]);
    const [selectedSimProducts, setSelectedSimProducts] = useState<string[]>([]);
    const [simOrderDate, setSimOrderDate] = useState<"today" | "yesterday">("today");
    const addSimLocation = () => setSimLocations(prev => [...prev, { country: "", count: "5" }]);
    const removeSimLocation = (i: number) => setSimLocations(prev => prev.filter((_, idx) => idx !== i));
    const updateSimLocation = (i: number, field: 'country' | 'count', val: string) =>
        setSimLocations(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l));

    // Store Booster
    const [storeBoostViews, setStoreBoostViews] = useState("5000");
    const [storeBoostVisits, setStoreBoostVisits] = useState("1500");
    const [boostingStore, setBoostingStore] = useState(false);

    // Email Module
    const [adminTemplate, setAdminTemplate] = useState("custom");
    const [adminSubject, setAdminSubject] = useState("");
    const [adminBody, setAdminBody] = useState("");
    const [adminSending, setAdminSending] = useState(false);

    const fetchUsers = async () => {
        try {
            const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
            const snap = await getDocs(q);
            const usersList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const ordersSnap = await getDocs(collection(db, "orders"));
            const salesByUser: Record<string, { totalSales: number; totalProfit: number; totalOrders: number }> = {};

            ordersSnap.docs.forEach(orderDoc => {
                const order = orderDoc.data();
                const userId = order.resellerId;
                if (!userId) return;
                if (!salesByUser[userId]) salesByUser[userId] = { totalSales: 0, totalProfit: 0, totalOrders: 0 };
                salesByUser[userId].totalSales += Number(order.resellPrice || order.totalAmount || 0);
                salesByUser[userId].totalProfit += Number(order.resellerProfit || 0);
                salesByUser[userId].totalOrders += 1;
            });

            setUsers(usersList.map(user => ({
                ...user,
                totalSales: salesByUser[user.id]?.totalSales || 0,
                totalProfit: salesByUser[user.id]?.totalProfit || 0,
                totalOrders: salesByUser[user.id]?.totalOrders || 0,
            })));
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch user database.");
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDetails = async (user: any) => {
        setLoadingDetails(true);
        setSelectedUser(user);
        // Pre-select all store products for the simulator
        setSelectedSimProducts((user.storeProducts || []).map((p: any) => p.id));
        setSimLocations([{ country: "United States", count: "10" }]);
        setSimOrderDate("today");
        try {
            // Fetch Pending Transactions
            const transSnap = await getDocs(query(
                collection(db, "transactions"),
                where("userId", "==", user.id),
                where("status", "==", "pending")
            ));
            setUserTransactions(transSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            // Fetch User Orders (Products in store/history)
            const ordersSnap = await getDocs(query(
                collection(db, "orders"),
                where("resellerId", "==", user.id),
                orderBy("createdAt", "desc")
            ));
            const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const salesSummary = orders.reduce((summary, order: any) => ({
                totalSales: summary.totalSales + Number(order.resellPrice || order.totalAmount || 0),
                totalProfit: summary.totalProfit + Number(order.resellerProfit || 0),
                totalOrders: summary.totalOrders + 1,
            }), { totalSales: 0, totalProfit: 0, totalOrders: 0 });
            setUserOrders(orders);
            setSelectedUser((prev: any) => prev ? { ...prev, ...salesSummary } : prev);

            // Extract unique products from orders for "View Products"
            const products = ordersSnap.docs.map(d => ({ id: d.data().productId, name: d.data().productName }));
            const uniqueProducts = Array.from(new Set(products.map(p => p.id)))
                .map(id => products.find(p => p.id === id));
            setUserProducts(uniqueProducts);

        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch merchant details.");
        } finally {
            setLoadingDetails(false);
        }
    };

    // 100 first names × 100 last names = 10,000 unique buyer identities
    const FIRST_NAMES = [
        "Liam","Emma","Noah","Olivia","James","Sophia","Oliver","Ava","Ethan","Isabella",
        "Lucas","Mia","Mason","Charlotte","Logan","Amelia","Aiden","Harper","Jack","Evelyn",
        "Carter","Abigail","Sebastian","Emily","Owen","Ella","Caleb","Elizabeth","Ryan","Camila",
        "Nathan","Luna","Wyatt","Sofia","Luke","Avery","Isaiah","Mila","Gabriel","Aria",
        "Benjamin","Scarlett","Elijah","Penelope","Julian","Layla","Adrian","Chloe","Levi","Victoria",
        "Aaron","Madison","Charles","Eleanor","Thomas","Grace","Jaxon","Nora","Kai","Riley",
        "Hunter","Zoey","Dominic","Hannah","Jordan","Lily","Ian","Aubrey","Carson","Lillian",
        "Axel","Addison","Adam","Ellie","Miles","Stella","Asher","Natalie","Xavier","Zoe",
        "Mateo","Leah","Nolan","Hazel","Ezra","Violet","Leo","Aurora","Micah","Savannah",
        "Max","Audrey","Finn","Brooklyn","Tobias","Bella","Remi","Claire","Zach","Skylar"
    ];
    const LAST_NAMES = [
        "Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Wilson","Taylor",
        "Anderson","Thomas","Jackson","White","Harris","Martin","Thompson","Moore","Young","Allen",
        "King","Wright","Scott","Torres","Nguyen","Hill","Flores","Green","Adams","Nelson",
        "Baker","Hall","Rivera","Campbell","Mitchell","Carter","Roberts","Gomez","Phillips","Evans",
        "Turner","Diaz","Parker","Cruz","Edwards","Collins","Reyes","Stewart","Morris","Morales",
        "Murphy","Cook","Rogers","Gutierrez","Ortiz","Morgan","Cooper","Peterson","Bailey","Reed",
        "Kelly","Howard","Ramos","Kim","Cox","Ward","Richardson","Watson","Brooks","Chavez",
        "Wood","James","Bennett","Gray","Mendoza","Ruiz","Hughes","Price","Alvarez","Castillo",
        "Sanders","Patel","Myers","Long","Ross","Foster","Jimenez","Powell","Jenkins","Perry",
        "Russell","Sullivan","Bell","Coleman","Butler","Henderson","Barnes","Gonzalez","Fisher","Simmons"
    ];

    const handleBoostSales = async () => {
        const storeProds = (selectedUser?.storeProducts || []).filter((p: any) => selectedSimProducts.includes(p.id));
        if (!selectedUser || storeProds.length === 0) {
            toast.error("Select at least one product to simulate orders for.");
            return;
        }

        const validLocations = simLocations
            .map(loc => ({ country: loc.country.trim(), count: Math.max(0, Math.trunc(Number(loc.count || "0"))) }))
            .filter(loc => loc.country && loc.count > 0);

        if (validLocations.length === 0) {
            toast.error("Add at least one location with an order count.");
            return;
        }

        setBoostingSales(true);
        try {
            // Pre-fetch cities for all locations.
            const locCities: Record<string, string[]> = {};
            await Promise.all(validLocations.map(async loc => {
                locCities[loc.country] = await fetchCitiesForCountry(loc.country);
            }));

            const usedNames = new Set<string>();
            const getUniqueName = (): string => {
                for (let attempt = 0; attempt < 500; attempt++) {
                    const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
                    const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
                    const name = `${first} ${last}`;
                    if (!usedNames.has(name)) { usedNames.add(name); return name; }
                }
                const fallbackName = `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]} ${Math.floor(Math.random() * 99)}`;
                usedNames.add(fallbackName);
                return fallbackName;
            };
            const getOrderDate = () => {
                const start = new Date();
                if (simOrderDate === "yesterday") start.setDate(start.getDate() - 1);
                start.setHours(0, 0, 0, 0);
                const end = simOrderDate === "today" ? new Date() : new Date(start.getTime() + 86399000);
                const span = Math.max(1, end.getTime() - start.getTime());
                return new Date(start.getTime() + Math.floor(Math.random() * span));
            };
            const makeBuyer = (orderNumber: number) => {
                const name = getUniqueName();
                const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "");
                return {
                    id: `sim-${selectedUser.id}-${Date.now()}-${orderNumber}`,
                    name,
                    email: `${slug}.${orderNumber}@buyer.shoplinea.local`,
                };
            };

            const orderPromises: Promise<any>[] = [];
            let totalPayout = 0;

            for (const loc of validLocations) {
                const cities = locCities[loc.country] || [];
                for (let i = 0; i < loc.count; i++) {
                    const product = storeProds[Math.floor(Math.random() * storeProds.length)];
                    const profit = (product.resellPrice || 0) - (product.price || 0);
                    const payout = profit > 0 ? profit : (product.price || 0) * 0.3;
                    const orderNumber = orderPromises.length + 1;
                    const buyer = makeBuyer(orderNumber);
                    const createdAt = getOrderDate();
                    const randomCity = cities.length > 0 ? cities[Math.floor(Math.random() * cities.length)] : null;

                    orderPromises.push(addDoc(collection(db, "orders"), {
                        resellerId: selectedUser.id,
                        customerId: buyer.id,
                        customerName: buyer.name,
                        customerEmail: buyer.email,
                        customerCountry: loc.country,
                        ...(randomCity ? { customerCity: randomCity } : {}),
                        productId: product.id,
                        productName: product.name,
                        resellPrice: product.resellPrice || product.price || 0,
                        resellerProfit: payout,
                        status: 'shipped',
                        createdAt
                    }));

                    totalPayout += payout;
                }
            }

            await Promise.all(orderPromises);
            if (totalPayout > 0) {
                await updateDoc(doc(db, "users", selectedUser.id), {
                    pendingPayout: increment(totalPayout)
                });
            }

            toast.success(`Injected ${orderPromises.length} orders across ${validLocations.length} location(s)!`);
            fetchUserDetails(selectedUser);
        } catch (err) {
            console.error(err);
            toast.error("Simulation failed.");
        } finally {
            setBoostingSales(false);
        }
    };

    const handleBoostStore = async () => {
        if (!selectedUser) return;
        setBoostingStore(true);
        try {
            const views = Number(storeBoostViews) || 0;
            const visits = Number(storeBoostVisits) || 0;
            const updates: Record<string, any> = {
                storeViews: increment(views),
                storeVisits: increment(visits),
            };
            // Distribute views across all store products
            const prods: any[] = selectedUser.storeProducts || [];
            if (prods.length > 0 && views > 0) {
                // Random weights so distribution looks natural
                const weights = prods.map(() => Math.random());
                const weightSum = weights.reduce((s, w) => s + w, 0);
                let distributed = 0;
                prods.forEach((p: any, i: number) => {
                    if (!p?.id) return;
                    const share = i === prods.length - 1
                        ? views - distributed  // last one gets remainder
                        : Math.round((weights[i] / weightSum) * views);
                    updates[`productViews.${p.id}`] = increment(share);
                    distributed += share;
                });
            }
            await updateDoc(doc(db, "users", selectedUser.id), updates);
            toast.success(`Injected ${views.toLocaleString()} views + ${visits.toLocaleString()} visits — distributed across ${prods.length} product(s)!`);
        } catch (err) {
            console.error(err);
            toast.error("Store boost failed.");
        } finally {
            setBoostingStore(false);
        }
    };

    const handleSendCustomEmail = async () => {
        if (!selectedUser || !selectedUser.email) {
            toast.error("User does not have a valid email.");
            return;
        }
        if (adminTemplate === "custom" && (!adminSubject || !adminBody)) {
            toast.error("Please fill in both subject and body.");
            return;
        }
        setAdminSending(true);
        try {
            const topProduct = selectedUser?.storeProducts?.[0]?.name || userProducts?.[0]?.name || "Your winning product";
            const templateType = adminTemplate === "winning-product"
                ? "winning-product-ad-prompt"
                : adminTemplate === "upgrade-plan"
                ? "plan-upgrade-prompt"
                : "custom";
            const templateData = templateType === "custom"
                ? { subject: adminSubject, html: adminBody }
                : {
                    userName: selectedUser.displayName || selectedUser.fullName || "Merchant",
                    productName: topProduct,
                };

            const res = await fetch("/api/send-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: templateType,
                    to: selectedUser.email,
                    from: "Shoplinea Support <support@shoplinea.shop>",
                    data: templateData
                })
            });
            if (res.ok) {
                toast.success("Official Notification dispatched successfully.");
                setAdminSubject("");
                setAdminBody("");
            } else {
                toast.error("Failed to route mail to user.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Mail network failure.");
        } finally {
            setAdminSending(false);
        }
    };

    const sendTransactionStatusEmail = async (user: any, subject: string, body: string) => {
        if (!user?.email) return;
        await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "custom",
                to: user.email,
                data: { subject, html: body }
            })
        });
    };

    const buildManualPaymentDescription = (type: string, planName?: string) => {
        if (type === "ad_deposit") return "Ad wallet payment received";
        if (type === "subscription_payment") return `Subscription payment received${planName ? ` for ${planName}` : ""}`;
        if (type === "earning") return "Earnings balance credited";
        return "Wallet payment received";
    };

    const resetManualPaymentForm = () => {
        setManualPaymentAmount("");
        setManualPaymentReference("");
        setManualPaymentNote("");
        setManualPaymentMethod("Admin credit");
        setManualPaymentType("deposit");
        setManualPaymentPlanId(ADMIN_PAYMENT_PLANS[0].id);
    };

    const handleRecordManualPayment = async () => {
        if (!selectedUser) return;
        const amount = Number(manualPaymentAmount);
        if (!Number.isFinite(amount) || amount <= 0) {
            toast.error("Enter a valid payment amount.");
            return;
        }

        setManualPaymentSaving(true);
        try {
            const selectedPlan = ADMIN_PAYMENT_PLANS.find(plan => plan.id === manualPaymentPlanId) || ADMIN_PAYMENT_PLANS[0];
            const type = manualPaymentType;
            const userUpdates: Record<string, unknown> = { updatedAt: serverTimestamp() };

            if (type === "deposit") {
                userUpdates.walletBalance = increment(amount);
            } else if (type === "ad_deposit") {
                userUpdates.adWalletBalance = increment(amount);
            } else if (type === "earning") {
                userUpdates.payoutBalance = increment(amount);
            } else if (type === "subscription_payment") {
                userUpdates.plan = selectedPlan.id;
                userUpdates.planName = selectedPlan.name;
                userUpdates.aiCredits = increment(selectedPlan.aiCredits);
                userUpdates.adWalletBalance = increment(selectedPlan.adCredits);
                userUpdates.adsCreditBalance = increment(selectedPlan.adCredits);
                userUpdates.monthlyAdsCredit = selectedPlan.adCredits;
                userUpdates.maxStores = selectedPlan.maxStores;
                userUpdates.multipleStoresEnabled = selectedPlan.maxStores > 1;
                userUpdates.planStartDate = serverTimestamp();
                userUpdates.planExpiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            }

            await updateDoc(doc(db, "users", selectedUser.id), userUpdates);

            const description = buildManualPaymentDescription(type, selectedPlan.name);
            await addDoc(collection(db, "transactions"), {
                userId: selectedUser.id,
                userEmail: selectedUser.email || null,
                type,
                amount,
                status: "completed",
                method: manualPaymentMethod.trim() || "Admin credit",
                reference: manualPaymentReference.trim() || `ADMIN-${Date.now()}`,
                description,
                note: manualPaymentNote.trim(),
                source: "admin_manual",
                createdBy: auth.currentUser?.uid || "admin",
                ...(type === "subscription_payment" ? {
                    planId: selectedPlan.id,
                    planName: selectedPlan.name,
                    aiCredits: selectedPlan.aiCredits,
                    adCredits: selectedPlan.adCredits,
                    maxStores: selectedPlan.maxStores,
                } : {}),
                createdAt: serverTimestamp(),
                approvedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            await addDoc(collection(db, "notifications"), {
                userId: selectedUser.id,
                type: "payout",
                title: "Payment received",
                description: `${description}: $${amount.toLocaleString()}. Your balance has been updated.`,
                read: false,
                createdAt: serverTimestamp(),
            });

            await sendTransactionStatusEmail(
                selectedUser,
                "Payment Received - Balance Updated",
                `<p>Hello ${selectedUser.displayName || selectedUser.fullName || "Merchant"},</p>
                <p>We have received and recorded your payment.</p>
                <p><strong>Payment:</strong> ${description}</p>
                <p><strong>Amount:</strong> $${amount.toLocaleString()}</p>
                <p><strong>Status:</strong> Completed</p>
                <p>Your Shopinea balance and payment history have been updated.</p>`
            );

            toast.success("Payment recorded, balance updated, and user notified.");
            resetManualPaymentForm();
            await fetchUsers();
            await fetchUserDetails(selectedUser);
        } catch (err) {
            console.error(err);
            toast.error("Failed to record payment.");
        } finally {
            setManualPaymentSaving(false);
        }
    };

    const handleApproveTransaction = async (transaction: any) => {
        if (!selectedUser) return;
        setTransactionProcessingId(transaction.id);
        try {
            const amount = Number(transaction.amount || 0);
            const creditAmount = transaction.type === "ad_deposit"
                ? Number(transaction.totalCredits || amount + (transaction.bonus || 0))
                : amount;

            if (transaction.type === "deposit") {
                await updateDoc(doc(db, "users", selectedUser.id), {
                    walletBalance: increment(creditAmount)
                });
            } else if (transaction.type === "ad_deposit") {
                await updateDoc(doc(db, "users", selectedUser.id), {
                    adWalletBalance: increment(creditAmount)
                });
            } else {
                toast.error("This transaction type is managed from another admin page.");
                return;
            }

            await updateDoc(doc(db, "transactions", transaction.id), {
                status: "completed",
                approvedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            await sendTransactionStatusEmail(
                selectedUser,
                transaction.type === "ad_deposit" ? "Ad Wallet Deposit Approved" : "Wallet Deposit Approved",
                `<p>Hello ${selectedUser.displayName || selectedUser.fullName || "Merchant"},</p>
                <p>Your ${transaction.type === "ad_deposit" ? "ad wallet" : "wallet"} deposit has been approved.</p>
                <p><strong>Amount credited:</strong> $${creditAmount.toLocaleString()}</p>
                <p><strong>Status:</strong> Completed</p>`
            );

            toast.success("Transaction approved & email sent.");
            await fetchUsers();
            await fetchUserDetails(selectedUser);
        } catch (err) {
            console.error(err);
            toast.error("Failed to approve transaction.");
        } finally {
            setTransactionProcessingId(null);
        }
    };

    const handleRejectTransaction = async (transaction: any) => {
        if (!selectedUser) return;
        const reason = window.prompt("Enter the rejection reason. This will be emailed to the user:");
        const cleanReason = reason?.trim();
        if (!cleanReason) {
            toast.error("A rejection reason is required.");
            return;
        }

        setTransactionProcessingId(`reject-${transaction.id}`);
        try {
            await updateDoc(doc(db, "transactions", transaction.id), {
                status: "declined",
                declineReason: cleanReason,
                declinedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            await sendTransactionStatusEmail(
                selectedUser,
                transaction.type === "ad_deposit" ? "Ad Wallet Deposit Rejected" : "Wallet Deposit Rejected",
                `<p>Hello ${selectedUser.displayName || selectedUser.fullName || "Merchant"},</p>
                <p>Your ${transaction.type === "ad_deposit" ? "ad wallet" : "wallet"} deposit request for <strong>$${Number(transaction.amount || 0).toLocaleString()}</strong> was rejected.</p>
                <p><strong>Reason:</strong> ${cleanReason}</p>
                <p>Please submit a new receipt after correcting the issue.</p>`
            );

            toast.success("Transaction rejected & email sent.");
            await fetchUserDetails(selectedUser);
        } catch (err) {
            console.error(err);
            toast.error("Failed to reject transaction.");
        } finally {
            setTransactionProcessingId(null);
        }
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (u) {
                const { getDoc, doc } = await import("firebase/firestore");
                const userDoc = await getDoc(doc(db, "users", u.uid));
                if (userDoc.exists() && userDoc.data()?.isAdmin) {
                    setIsAdmin(true);
                    fetchUsers();
                } else {
                    setIsAdmin(false);
                    if (typeof window !== 'undefined') window.location.href = '/admin/login';
                }
            } else {
                if (typeof window !== 'undefined') window.location.href = '/admin/login';
            }
        });
        return () => unsub();
    }, []);

    const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
        if (!confirm(`Are you sure you want to ${currentStatus ? 'REVOKE' : 'GRANT'} Admin access?`)) return;
        try {
            await updateDoc(doc(db, "users", userId), { isAdmin: !currentStatus });
            toast.success("Privileges updated successfully.");
            fetchUsers();
        } catch (err) {
            toast.error("Failed to update user privileges.");
        }
    };

    const deleteUserRecord = async (userId: string) => {
        if (!confirm("CRITICAL ACTION: Permanently delete this user record and all associated assets? This cannot be undone.")) return;
        toast.error("Feature restricted. Please contact central ops for database deletions.");
    };

    const toggleUserLock = async (field: string, label: string, currentStatus: boolean) => {
        if (!selectedUser) return;
        setLockSavingField(field);
        try {
            await updateDoc(doc(db, "users", selectedUser.id), {
                [field]: !currentStatus,
                updatedAt: serverTimestamp(),
            });
            const updatedUser = { ...selectedUser, [field]: !currentStatus };
            setSelectedUser(updatedUser);
            setUsers(prev => prev.map(user => user.id === selectedUser.id ? { ...user, [field]: !currentStatus } : user));
            toast.success(`${label} ${!currentStatus ? "locked" : "unlocked"}.`);
        } catch (err) {
            console.error(err);
            toast.error(`Failed to update ${label.toLowerCase()} lock.`);
        } finally {
            setLockSavingField(null);
        }
    };

    const filtered = users.filter(u =>
        u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-zinc-950">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Users</h1>
                    <p className="text-sm text-zinc-500 mt-1">Manage accounts, roles, and permissions across the platform.</p>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white/[0.04] border-white/[0.08] h-10 rounded-lg text-white text-sm placeholder:text-zinc-600"
                    />
                </div>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
                <div className="md:hidden divide-y divide-white/[0.06]">
                    {filtered.length === 0 ? (
                        <div className="px-5 py-12 text-center">
                            <p className="text-sm text-zinc-600">No users found</p>
                        </div>
                    ) : filtered.map((u) => (
                        <div key={u.id} className="p-4 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
                                    {u.photoURL ? (
                                        <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs font-semibold text-zinc-400">{(u.displayName?.slice(0, 2) || u.email?.slice(0, 2) || '??').toUpperCase()}</span>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-white truncate">{u.displayName || 'Anonymous'}</p>
                                    <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {u.isAdmin && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-medium rounded border border-blue-500/20"><Shield className="w-2.5 h-2.5" /> Admin</span>}
                                        {(u.walletLocked || u.adWalletLocked || u.payoutLocked || u.depositsLocked || u.withdrawalsLocked) && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-500/10 text-rose-300 text-[10px] font-medium rounded border border-rose-500/20"><LockKeyhole className="w-2.5 h-2.5" /> Locked</span>}
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/[0.04] text-zinc-400 text-[10px] font-medium rounded border border-white/[0.06]">{u.kycStatus || 'Unverified'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                                    <p className="text-[10px] text-zinc-600">Sales</p>
                                    <p className="text-sm font-semibold text-emerald-400">${(u.totalSales || 0).toLocaleString()}</p>
                                    <p className="text-[10px] text-zinc-600">{(u.totalOrders || 0).toLocaleString()} orders</p>
                                </div>
                                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                                    <p className="text-[10px] text-zinc-600">Wallet</p>
                                    <p className="text-sm font-semibold text-white">${(u.walletBalance || 0).toLocaleString()}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                                    <p className="text-[10px] text-zinc-600">Ads</p>
                                    <p className="text-sm font-semibold text-blue-400">${(u.adWalletBalance || 0).toLocaleString()}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                                    <p className="text-[10px] text-zinc-600">Earned</p>
                                    <p className="text-sm font-semibold text-emerald-400">${(u.payoutBalance || 0).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => fetchUserDetails(u)} className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors">View</button>
                                <button onClick={() => toggleAdminStatus(u.id, !!u.isAdmin)} className="w-10 h-10 flex items-center justify-center bg-white/[0.04] border border-white/[0.06] rounded-lg text-zinc-500 hover:text-blue-400 transition-colors"><Shield className="w-4 h-4" /></button>
                                <button onClick={() => deleteUserRecord(u.id)} className="w-10 h-10 flex items-center justify-center bg-white/[0.04] border border-white/[0.06] rounded-lg text-zinc-500 hover:text-rose-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-white/[0.06]">
                            <tr className="text-xs font-semibold text-zinc-500">
                                <th className="px-5 py-4">User</th>
                                <th className="px-4 py-4">Status</th>
                                <th className="px-4 py-4">Sales</th>
                                <th className="px-4 py-4">Balances</th>
                                <th className="px-4 py-4">Plan</th>
                                <th className="px-5 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-16 text-center">
                                        <p className="text-sm text-zinc-600">No users found</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((u) => (
                                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
                                                    {u.photoURL ? (
                                                        <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-semibold text-zinc-400">{(u.displayName?.slice(0, 2) || u.email?.slice(0, 2) || '??').toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{u.displayName || 'Anonymous'}</p>
                                                    <p className="text-xs text-zinc-500">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col gap-1">
                                                {u.isAdmin && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-medium rounded w-fit border border-blue-500/20">
                                                        <Shield className="w-2.5 h-2.5" /> Admin
                                                    </span>
                                                )}
                                                {(u.walletLocked || u.adWalletLocked || u.payoutLocked || u.depositsLocked || u.withdrawalsLocked) && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-500/10 text-rose-300 text-[10px] font-medium rounded w-fit border border-rose-500/20">
                                                        <LockKeyhole className="w-2.5 h-2.5" /> Locked
                                                    </span>
                                                )}
                                                <span className={cn(
                                                    "inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded w-fit border",
                                                    u.kycStatus === 'verified'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : u.kycStatus === 'pending'
                                                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                            : 'bg-white/[0.04] text-zinc-500 border-white/[0.06]'
                                                )}>
                                                    <ShieldCheck className="w-2.5 h-2.5" /> {u.kycStatus || 'Unverified'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-semibold text-emerald-400">${(u.totalSales || 0).toLocaleString()}</p>
                                                <p className="text-[10px] text-zinc-500">{(u.totalOrders || 0).toLocaleString()} orders</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <Wallet className="w-3 h-3 text-zinc-600" />
                                                    <p className="text-xs text-white">${(u.walletBalance || 0).toLocaleString()}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Megaphone className="w-3 h-3 text-zinc-600" />
                                                    <p className="text-xs text-blue-400">${(u.adWalletBalance || 0).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.04] border border-white/[0.06] rounded-lg w-fit">
                                                <Crown className={cn("w-3 h-3", u.plan ? 'text-amber-400' : 'text-zinc-600')} />
                                                <span className="text-xs text-zinc-300">{u.planName || 'Free'}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => fetchUserDetails(u)}
                                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => toggleAdminStatus(u.id, !!u.isAdmin)}
                                                    className="w-8 h-8 flex items-center justify-center bg-white/[0.04] border border-white/[0.06] rounded-lg hover:bg-blue-500/10 hover:border-blue-500/20 text-zinc-500 hover:text-blue-400 transition-colors"
                                                >
                                                    <Shield className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => deleteUserRecord(u.id)}
                                                    className="w-8 h-8 flex items-center justify-center bg-white/[0.04] border border-white/[0.06] rounded-lg hover:bg-rose-500/10 hover:border-rose-500/20 text-zinc-500 hover:text-rose-400 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-xs text-zinc-500">Total Users</p>
                        <p className="text-xl font-bold text-white">{users.length}</p>
                    </div>
                </div>
                <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center shrink-0">
                        <BarChart3 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-xs text-zinc-500">Total Sales</p>
                        <p className="text-xl font-bold text-white">${users.reduce((acc, curr) => acc + (curr.totalSales || 0), 0).toLocaleString()}</p>
                    </div>
                </div>
                <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center shrink-0">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-xs text-zinc-500">Total Wallet Balance</p>
                        <p className="text-xl font-bold text-white">${users.reduce((acc, curr) => acc + (curr.walletBalance || 0), 0).toLocaleString()}</p>
                    </div>
                </div>
                <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center shrink-0">
                        <Megaphone className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-xs text-zinc-500">Total Ad Wallet</p>
                        <p className="text-xl font-bold text-white">${users.reduce((acc, curr) => acc + (curr.adWalletBalance || 0), 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* User Detail Modal */}
            <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="User Details" panelClassName="sm:max-w-2xl lg:max-w-4xl">
                {selectedUser && (
                    <div className="space-y-6 py-2 animate-in fade-in duration-300">
                        {/* Header Section */}
                        <div className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                            <div className="w-14 h-14 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
                                {selectedUser.photoURL ? (
                                    <img src={selectedUser.photoURL} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <Users className="w-7 h-7 text-zinc-500" />
                                )}
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">{selectedUser.displayName || 'Anonymous'}</h2>
                                <p className="text-sm text-zinc-500">{selectedUser.email}</p>
                                <p className="text-xs text-zinc-600 mt-0.5 font-mono">ID: {selectedUser.id.slice(0, 12)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                                <p className="text-xs text-zinc-500">Total Sales</p>
                                <p className="text-xl font-bold text-emerald-400">${(selectedUser.totalSales || 0).toLocaleString()}</p>
                            </div>
                            <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                                <p className="text-xs text-zinc-500">Sales Orders</p>
                                <p className="text-xl font-bold text-white">{(selectedUser.totalOrders || 0).toLocaleString()}</p>
                            </div>
                            <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                                <p className="text-xs text-zinc-500">Total Profit</p>
                                <p className="text-xl font-bold text-blue-400">${(selectedUser.totalProfit || 0).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="bg-rose-500/[0.04] border border-rose-500/15 p-5 rounded-xl space-y-4">
                            <div className="flex items-center gap-2">
                                <LockKeyhole className="w-4 h-4 text-rose-300" />
                                <h3 className="text-sm font-semibold text-white">Balance Locks</h3>
                                <span className="ml-auto text-[10px] text-rose-200/70">Controls user access</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { field: "walletLocked", label: "Wallet Balance", value: !!selectedUser.walletLocked },
                                    { field: "adWalletLocked", label: "Ads Balance", value: !!selectedUser.adWalletLocked },
                                    { field: "payoutLocked", label: "Earnings Balance", value: !!selectedUser.payoutLocked },
                                    { field: "depositsLocked", label: "Deposits", value: !!selectedUser.depositsLocked },
                                    { field: "withdrawalsLocked", label: "Withdrawals", value: !!selectedUser.withdrawalsLocked },
                                ].map(item => (
                                    <button
                                        key={item.field}
                                        type="button"
                                        onClick={() => toggleUserLock(item.field, item.label, item.value)}
                                        disabled={lockSavingField === item.field}
                                        className={cn(
                                            "h-12 rounded-xl border px-3 flex items-center justify-between text-left transition-colors disabled:opacity-60",
                                            item.value
                                                ? "bg-rose-500/10 border-rose-500/25 text-rose-200"
                                                : "bg-white/[0.03] border-white/[0.07] text-zinc-300 hover:bg-white/[0.05]"
                                        )}
                                    >
                                        <span className="text-xs font-semibold">{item.label}</span>
                                        {lockSavingField === item.field ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : item.value ? (
                                            <LockKeyhole className="w-4 h-4" />
                                        ) : (
                                            <UnlockKeyhole className="w-4 h-4 text-emerald-400" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-emerald-500/[0.04] border border-emerald-500/15 p-5 rounded-xl space-y-4">
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-emerald-400" />
                                <h3 className="text-sm font-semibold text-white">Record Payment</h3>
                                <span className="ml-auto text-[10px] text-emerald-300/70">Completed instantly</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs text-zinc-400 font-medium">Payment For</Label>
                                    <select
                                        value={manualPaymentType}
                                        onChange={(e) => setManualPaymentType(e.target.value)}
                                        className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm px-3 outline-none focus:border-emerald-500/40"
                                    >
                                        <option value="deposit" className="bg-zinc-900">Wallet Balance</option>
                                        <option value="ad_deposit" className="bg-zinc-900">Ads Balance</option>
                                        <option value="subscription_payment" className="bg-zinc-900">Subscription</option>
                                        <option value="earning" className="bg-zinc-900">Available Earnings</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-zinc-400 font-medium">Amount</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={manualPaymentAmount}
                                        onChange={(e) => setManualPaymentAmount(e.target.value)}
                                        placeholder="Any amount"
                                        className="h-10 bg-white/[0.04] border-white/[0.08] text-white text-sm"
                                    />
                                </div>
                                {manualPaymentType === "subscription_payment" && (
                                    <div className="space-y-1 md:col-span-2">
                                        <Label className="text-xs text-zinc-400 font-medium">Activate Plan</Label>
                                        <select
                                            value={manualPaymentPlanId}
                                            onChange={(e) => setManualPaymentPlanId(e.target.value)}
                                            className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm px-3 outline-none focus:border-emerald-500/40"
                                        >
                                            {ADMIN_PAYMENT_PLANS.map(plan => (
                                                <option key={plan.id} value={plan.id} className="bg-zinc-900">
                                                    {plan.name} - {plan.aiCredits.toLocaleString()} AI credits, ${plan.adCredits.toLocaleString()} ads credit
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <Label className="text-xs text-zinc-400 font-medium">Payment Method</Label>
                                    <Input
                                        value={manualPaymentMethod}
                                        onChange={(e) => setManualPaymentMethod(e.target.value)}
                                        placeholder="Bank, PayPal, Crypto, Cash"
                                        className="h-10 bg-white/[0.04] border-white/[0.08] text-white text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-zinc-400 font-medium">Reference</Label>
                                    <Input
                                        value={manualPaymentReference}
                                        onChange={(e) => setManualPaymentReference(e.target.value)}
                                        placeholder="Receipt or transaction ID"
                                        className="h-10 bg-white/[0.04] border-white/[0.08] text-white text-sm"
                                    />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <Label className="text-xs text-zinc-400 font-medium">Admin Note</Label>
                                    <textarea
                                        value={manualPaymentNote}
                                        onChange={(e) => setManualPaymentNote(e.target.value)}
                                        placeholder="Optional internal note"
                                        className="w-full h-20 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm p-3 outline-none focus:border-emerald-500/40 transition-colors resize-none"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleRecordManualPayment}
                                disabled={manualPaymentSaving}
                                className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                {manualPaymentSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                {manualPaymentSaving ? "Recording payment..." : "Record Payment & Notify User"}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Pending Transactions */}
                            <div className="bg-white/[0.03] border border-white/[0.06] p-4 rounded-xl space-y-3">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-amber-400" />
                                    <h3 className="text-sm font-semibold text-white">Pending Transactions</h3>
                                </div>
                                <div className="space-y-2">
                                    {loadingDetails ? (
                                        <div className="h-16 flex items-center justify-center">
                                            <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                                        </div>
                                    ) : userTransactions.length === 0 ? (
                                        <p className="text-xs text-zinc-600 py-4 text-center">No pending transactions</p>
                                    ) : (
                                        userTransactions.map(t => (
                                            <div key={t.id} className="p-3 bg-white/[0.03] border border-white/[0.04] rounded-lg space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs font-medium text-white capitalize">{t.type?.replace('_', ' ')}</p>
                                                        <p className="text-[10px] text-zinc-500">{t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString() : 'Recent'}</p>
                                                    </div>
                                                    <p className="text-xs font-semibold text-amber-400">${t.amount?.toLocaleString()}</p>
                                                </div>
                                                {(t.type === "deposit" || t.type === "ad_deposit") && (
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            onClick={() => handleApproveTransaction(t)}
                                                            disabled={!!transactionProcessingId}
                                                            className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                                                        >
                                                            {transactionProcessingId === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectTransaction(t)}
                                                            disabled={!!transactionProcessingId}
                                                            className="h-8 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                                                        >
                                                            {transactionProcessingId === `reject-${t.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Store Products */}
                            <div className="bg-white/[0.03] border border-white/[0.06] p-4 rounded-xl space-y-3">
                                <div className="flex items-center gap-2">
                                    <Box className="w-4 h-4 text-blue-400" />
                                    <h3 className="text-sm font-semibold text-white">Store Products</h3>
                                </div>
                                <div className="space-y-2">
                                    {loadingDetails ? (
                                        <div className="h-16 flex items-center justify-center">
                                            <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                                        </div>
                                    ) : userProducts.length === 0 ? (
                                        <p className="text-xs text-zinc-600 py-4 text-center">No products found</p>
                                    ) : (
                                        userProducts.map(p => (
                                            <div key={p.id} className="p-3 bg-white/[0.03] border border-white/[0.04] rounded-lg flex items-center justify-between">
                                                <p className="text-xs font-medium text-white">{p.name || 'Unnamed Product'}</p>
                                                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600" />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sales Simulator */}
                        <div className="bg-white/[0.03] border border-white/[0.06] p-5 rounded-xl space-y-5">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-400" />
                                <h3 className="text-sm font-semibold text-white">Sales Simulator</h3>
                                <span className="ml-auto text-[10px] font-mono text-zinc-500 truncate max-w-[180px]">{selectedUser.email}</span>
                            </div>
                            <p className="text-xs text-zinc-500 -mt-2">Inject simulated orders. Each order gets a unique buyer name from a different location.</p>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Order Date</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { value: "today", label: "Today" },
                                        { value: "yesterday", label: "Yesterday" },
                                    ].map(option => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setSimOrderDate(option.value as "today" | "yesterday")}
                                            className={cn(
                                                "h-9 rounded-lg border text-xs font-bold transition-colors",
                                                simOrderDate === option.value
                                                    ? "border-amber-500 bg-amber-500 text-black"
                                                    : "border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-white"
                                            )}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Product Selector */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <Package className="w-3.5 h-3.5 text-zinc-500" />
                                        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Select Products</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const prods = selectedUser?.storeProducts || [];
                                            if (selectedSimProducts.length === prods.length) setSelectedSimProducts([]);
                                            else setSelectedSimProducts(prods.map((p: any) => p.id));
                                        }}
                                        className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                                    >
                                        {selectedSimProducts.length === (selectedUser?.storeProducts?.length || 0) ? "Deselect All" : "Select All"}
                                    </button>
                                </div>
                                {(selectedUser?.storeProducts?.length ?? 0) === 0 ? (
                                    <p className="text-xs text-zinc-600 py-3 text-center border border-dashed border-white/[0.06] rounded-lg">No products in store yet</p>
                                ) : (
                                    <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                                        {(selectedUser?.storeProducts || []).map((p: any) => (
                                            <label key={p.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.1] cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSimProducts.includes(p.id)}
                                                    onChange={e => {
                                                        if (e.target.checked) setSelectedSimProducts(prev => [...prev, p.id]);
                                                        else setSelectedSimProducts(prev => prev.filter(id => id !== p.id));
                                                    }}
                                                    className="accent-amber-500 shrink-0"
                                                />
                                                {p.image && <img src={p.image} alt="" className="w-8 h-8 rounded-md object-cover shrink-0" />}
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-medium text-white truncate">{p.name}</p>
                                                    <p className="text-[10px] text-zinc-500">${(p.resellPrice || p.price || 0).toLocaleString()} sell · ${(p.price || 0).toLocaleString()} cost</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Location Distribution */}
                            <div className="space-y-2.5">
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                                    <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Order Locations</span>
                                </div>
                                <div className="space-y-2">
                                    {simLocations.map((loc, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="flex-1 relative">
                                                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none" />
                                                <input
                                                    value={loc.country}
                                                    onChange={e => updateSimLocation(i, 'country', e.target.value)}
                                                    placeholder="Country (e.g. United States)"
                                                    className="w-full h-9 pl-7 pr-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white placeholder:text-zinc-600 outline-none focus:border-amber-500/40 transition-colors"
                                                />
                                            </div>
                                            <input
                                                type="number"
                                                min={1}
                                                value={loc.count}
                                                onChange={e => updateSimLocation(i, 'count', e.target.value)}
                                                placeholder="#"
                                                className="w-20 h-9 px-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white placeholder:text-zinc-600 outline-none focus:border-amber-500/40 transition-colors text-center"
                                            />
                                            {simLocations.length > 1 && (
                                                <button
                                                    onClick={() => removeSimLocation(i)}
                                                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-rose-500/30 hover:text-rose-400 text-zinc-600 transition-colors shrink-0"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={addSimLocation}
                                    className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-white font-medium transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Location
                                </button>
                                <p className="text-[10px] text-zinc-600 pt-0.5">
                                    Total: <span className="text-white font-semibold">{simLocations.reduce((s, l) => s + (Number(l.count) || 0), 0).toLocaleString()}</span> orders across <span className="text-white font-semibold">{simLocations.filter(l => l.country.trim()).length}</span> location(s) — each from a unique buyer
                                </p>
                            </div>

                            <button
                                onClick={handleBoostSales}
                                disabled={boostingSales || selectedSimProducts.length === 0}
                                className="w-full h-10 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-black text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                {boostingSales ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                                {boostingSales ? "Simulating orders..." : "Run Simulation"}
                            </button>
                        </div>

                        {/* Store Booster */}
                        <div className="bg-white/[0.03] border border-white/[0.06] p-5 rounded-xl space-y-4">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-blue-400" />
                                <h3 className="text-sm font-semibold text-white">Store Booster</h3>
                                <span className="ml-auto text-[10px] font-mono text-zinc-500 truncate max-w-[180px]">{selectedUser.email}</span>
                            </div>
                            <p className="text-xs text-zinc-500 -mt-1">Inject views and visits into this reseller&apos;s store analytics dashboard.</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs text-zinc-400 font-medium">Add Views</Label>
                                    <Input
                                        type="number"
                                        value={storeBoostViews}
                                        onChange={e => setStoreBoostViews(e.target.value)}
                                        placeholder="e.g. 5000"
                                        className="h-10 bg-white/[0.04] border-white/[0.08] text-white text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-zinc-400 font-medium">Add Visits</Label>
                                    <Input
                                        type="number"
                                        value={storeBoostVisits}
                                        onChange={e => setStoreBoostVisits(e.target.value)}
                                        placeholder="e.g. 1500"
                                        className="h-10 bg-white/[0.04] border-white/[0.08] text-white text-sm"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleBoostStore}
                                disabled={boostingStore}
                                className="w-full h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                {boostingStore ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                                {boostingStore ? "Boosting..." : "Inject Analytics"}
                            </button>
                        </div>

                        {/* Send Email */}
                        <div className="bg-white/[0.03] border border-white/[0.06] p-5 rounded-xl space-y-4">
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-purple-400" />
                                <h3 className="text-sm font-semibold text-white">Send Email</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label className="text-xs text-zinc-500">Template</Label>
                                    <select 
                                        className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm px-3 outline-none focus:border-purple-500/40"
                                        value={adminTemplate}
                                        onChange={(e) => {
                                            setAdminTemplate(e.target.value);
                                            if (e.target.value === 'billing') {
                                                setAdminSubject('Action Required: Account Setup Fee / Subscription Phase');
                                                setAdminBody('Dear Merchant,\n\nTo release your pending funds and activate your payout route, you are required to pay a one-time network clearance fee / subscription. Please contact our support team or use the designated payment portal to complete this transaction.\n\nThank you,\nShoplinea Network Infrastructure');
                                            } else if (e.target.value === 'winning-product') {
                                                const topProduct = selectedUser?.storeProducts?.[0]?.name || userProducts?.[0]?.name || "Your winning product";
                                                setAdminSubject(`${topProduct} is ready for ads`);
                                                setAdminBody(`Sharp AI template: tells the merchant this product has had strong sales signals over the last 2 months and they should run ads now.`);
                                            } else if (e.target.value === 'upgrade-plan') {
                                                setAdminSubject('Your Shopinea account is ready to upgrade');
                                                setAdminBody('Sharp AI template: tells the merchant to upgrade for more products, advanced analytics, and AI growth tools.');
                                            } else if (e.target.value === 'escrow-unlocked') {
                                                const merchantName = selectedUser?.displayName || selectedUser?.fullName || "Merchant";
                                                const unlockedAmount = Number(selectedUser?.pendingPayout || selectedUser?.payoutBalance || 0);
                                                setAdminSubject('Your escrow balance has been unlocked');
                                                setAdminBody(`Hello ${merchantName},\n\nGood news: your escrow balance has been reviewed and unlocked for withdrawal.\n\nUnlocked amount: $${unlockedAmount.toLocaleString()}\nStatus: Available for payout\n\nYou can now continue with your withdrawal request from your Shopinea dashboard. Please make sure your payout details are correct before submitting.\n\nThank you,\nShopinea Finance Team`);
                                            } else {
                                                setAdminSubject('');
                                                setAdminBody('');
                                            }
                                        }}
                                    >
                                        <option value="custom" className="bg-zinc-900">Custom Message</option>
                                        <option value="winning-product" className="bg-zinc-900">Winning Product Ads</option>
                                        <option value="upgrade-plan" className="bg-zinc-900">Upgrade Plan Prompt</option>
                                        <option value="escrow-unlocked" className="bg-zinc-900">Escrow Unlocked</option>
                                        <option value="billing" className="bg-zinc-900">Billing / Fee Request</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-zinc-500">Subject</Label>
                                    <Input
                                        value={adminSubject}
                                        onChange={e => setAdminSubject(e.target.value)}
                                        className="h-10 bg-white/[0.04] border-white/[0.08] text-white text-sm"
                                        placeholder="Email subject"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-zinc-500">Message</Label>
                                    <textarea
                                        value={adminBody}
                                        onChange={e => setAdminBody(e.target.value)}
                                        className="w-full h-28 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm p-3 outline-none focus:border-purple-500/40 transition-colors resize-none"
                                        placeholder="Write your message..."
                                    />
                                </div>
                                <button
                                    onClick={handleSendCustomEmail}
                                    disabled={adminSending}
                                    className="w-full h-10 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                                >
                                    {adminSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                    Send Email
                                </button>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/[0.06] flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <ShieldAlert className="w-3.5 h-3.5 text-zinc-600" />
                                <p className="text-xs text-zinc-600">All actions are logged</p>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="text-sm text-zinc-500 hover:text-white transition-colors">Close</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { products as seedProducts, CATALOG_VERSION } from "@/lib/seed/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { ImageUpload } from "@/components/ui/image-upload";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    Boxes,
    CheckCircle2,
    Database,
    ImageIcon,
    LayoutGrid,
    LinkIcon,
    Loader2,
    PackagePlus,
    Plus,
    Search,
    Shield,
    Sparkles,
    Star,
    Trash2,
    X,
} from "lucide-react";
import { toast } from "sonner";

interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    category: string;
    image: string;
    isPromoted?: boolean;
    sortOrder?: number;
}

const emptyProduct = {
    name: "",
    price: "",
    description: "",
    category: "",
    image: "",
};

export default function AdminProductsPage() {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newProduct, setNewProduct] = useState(emptyProduct);
    const [formLoading, setFormLoading] = useState(false);
    const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
    const [showSeedConfirm, setShowSeedConfirm] = useState(false);
    const [search, setSearch] = useState("");

    const categories = useMemo(() => {
        return Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    }, [products]);

    const filteredProducts = useMemo(() => {
        const query = search.trim().toLowerCase();
        const sorted = [...products].sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));

        if (!query) return sorted;

        return sorted.filter((product) => {
            return [product.name, product.category, product.description].some((value) => value?.toLowerCase().includes(query));
        });
    }, [products, search]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "products"));
            const fetched: Product[] = querySnapshot.docs.map((productDoc) => ({
                id: productDoc.id,
                ...productDoc.data(),
            } as Product));
            setProducts(fetched);
        } catch (error) {
            console.error("Error fetching products:", error);
            toast.error("Could not load products.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) {
                setIsAdmin(false);
                setLoading(false);
                return;
            }

            const userDoc = await getDoc(doc(db, "users", u.uid));
            if (userDoc.exists() && userDoc.data()?.isAdmin) {
                setIsAdmin(true);
                await fetchProducts();
            } else {
                setIsAdmin(false);
                setLoading(false);
            }
        });

        return () => unsub();
    }, []);

    const resetForm = () => {
        setNewProduct(emptyProduct);
        setImageMode("upload");
    };

    const handleSeedDatabase = async () => {
        setSeeding(true);
        setShowSeedConfirm(false);
        try {
            const batch = writeBatch(db);
            const productsRef = collection(db, "products");

            seedProducts.forEach((product) => {
                batch.set(doc(productsRef), {
                    ...product,
                    isPromoted: false,
                    createdAt: serverTimestamp(),
                });
            });

            await batch.commit();
            toast.success("Database seeded successfully.");
            await fetchProducts();
        } catch (error) {
            console.error("Error seeding database:", error);
            toast.error("Failed to seed database.");
        } finally {
            setSeeding(false);
        }
    };

    const handleTogglePromote = async (id: string, currentStatus?: boolean) => {
        try {
            const nextStatus = !currentStatus;
            await updateDoc(doc(db, "products", id), { isPromoted: nextStatus });
            setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isPromoted: nextStatus } : p)));
        } catch (error) {
            console.error("Error updating promotion status:", error);
            toast.error("Could not update featured status.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this product from the marketplace?")) return;

        try {
            await deleteDoc(doc(db, "products", id));
            setProducts((prev) => prev.filter((p) => p.id !== id));
            toast.success("Product deleted.");
        } catch (error) {
            console.error("Error deleting product:", error);
            toast.error("Could not delete product.");
        }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();

        const name = newProduct.name.trim();
        const description = newProduct.description.trim();
        const category = newProduct.category.trim();
        const image = newProduct.image.trim();
        const price = Number(newProduct.price);

        if (!name || !description || !category || !image || !Number.isFinite(price) || price <= 0) {
            toast.error("Please complete the product name, price, category, description, and image.");
            return;
        }

        setFormLoading(true);
        try {
            const productsRef = collection(db, "products");
            const newDocRef = doc(productsRef);
            const existingDocs = await getDocs(productsRef);
            const maxOrder = existingDocs.docs.reduce((max, d) => Math.max(max, d.data().sortOrder ?? 0), 0);

            await setDoc(newDocRef, {
                name,
                price,
                description,
                category,
                image,
                isPromoted: true,
                isFeatured: true,
                catalogVersion: CATALOG_VERSION,
                sortOrder: maxOrder + 1,
                createdAt: serverTimestamp(),
            });

            resetForm();
            setIsAdding(false);
            toast.success("Product added to the marketplace.");
            await fetchProducts();
        } catch (error) {
            console.error("Error adding product:", error);
            toast.error("Failed to add product.");
        } finally {
            setFormLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            </div>
        );
    }

    if (isAdmin === false) {
        if (typeof window !== "undefined") window.location.href = "/admin/login";
        return null;
    }

    return (
        <div className="min-h-screen bg-zinc-950 px-4 py-5 text-white sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-6">
                <header className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-blue-400">
                                <Shield className="h-4 w-4" />
                                Admin inventory
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight sm:text-4xl">Product catalog</h1>
                                <p className="mt-2 max-w-2xl text-sm font-medium text-zinc-400">
                                    Add products with ImageKit uploads, reuse categories, or type a new category while publishing.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:flex">
                            <Button
                                variant="outline"
                                onClick={() => setShowSeedConfirm(true)}
                                disabled={seeding}
                                className="h-11 rounded-xl border-zinc-700 bg-zinc-950 text-zinc-200 hover:bg-zinc-800"
                            >
                                {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                                Seed
                            </Button>
                            <Button
                                onClick={() => setIsAdding((open) => !open)}
                                className="h-11 rounded-xl bg-white px-5 font-bold text-black hover:bg-zinc-200"
                            >
                                {isAdding ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                                {isAdding ? "Close" : "Add"}
                            </Button>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <Stat icon={Boxes} label="Products" value={products.length.toString()} />
                        <Stat icon={LayoutGrid} label="Categories" value={categories.length.toString()} />
                        <Stat icon={Sparkles} label="Featured" value={products.filter((p) => p.isPromoted).length.toString()} />
                    </div>
                </header>

                {isAdding && (
                    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl shadow-black/20 sm:p-6">
                        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-xl font-black tracking-tight">Add product</h2>
                                <p className="text-sm font-medium text-zinc-500">Upload an image, choose or type a category, then publish.</p>
                            </div>
                            <div className="flex rounded-xl border border-zinc-800 bg-zinc-950 p-1">
                                <ImageModeButton active={imageMode === "upload"} onClick={() => { setImageMode("upload"); setNewProduct((p) => ({ ...p, image: "" })); }} icon={ImageIcon} label="Upload" />
                                <ImageModeButton active={imageMode === "url"} onClick={() => { setImageMode("url"); setNewProduct((p) => ({ ...p, image: "" })); }} icon={LinkIcon} label="URL" />
                            </div>
                        </div>

                        <form onSubmit={handleAddProduct} className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                            <div className="space-y-3">
                                <Label className="text-xs font-black uppercase tracking-widest text-zinc-500">Product image</Label>
                                {imageMode === "upload" ? (
                                    <ImageUpload
                                        value={newProduct.image}
                                        onChange={(url) => setNewProduct((p) => ({ ...p, image: url }))}
                                        disabled={formLoading}
                                    />
                                ) : (
                                    <div className="space-y-3">
                                        <Input
                                            type="url"
                                            placeholder="https://ik.imagekit.io/..."
                                            className="h-12 rounded-xl border-zinc-800 bg-zinc-950 font-semibold"
                                            value={newProduct.image}
                                            onChange={(e) => setNewProduct((p) => ({ ...p, image: e.target.value }))}
                                        />
                                        <div className="relative min-h-[220px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                                            {newProduct.image ? (
                                                <img src={newProduct.image} alt="Product preview" className="h-full min-h-[220px] w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                                            ) : (
                                                <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 text-zinc-600">
                                                    <ImageIcon className="h-8 w-8" />
                                                    <span className="text-sm font-semibold">Paste an image URL</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid content-start gap-4 sm:grid-cols-2">
                                <Field label="Product name">
                                    <Input
                                        required
                                        className="h-12 rounded-xl border-zinc-800 bg-zinc-950 font-semibold"
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                                        placeholder="Premium wireless earbuds"
                                    />
                                </Field>
                                <Field label="Supplier cost">
                                    <Input
                                        required
                                        min="0"
                                        step="0.01"
                                        className="h-12 rounded-xl border-zinc-800 bg-zinc-950 font-semibold"
                                        type="number"
                                        value={newProduct.price}
                                        onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))}
                                        placeholder="49.99"
                                    />
                                </Field>
                                <Field label="Category">
                                    <Input
                                        required
                                        list="product-categories"
                                        className="h-12 rounded-xl border-zinc-800 bg-zinc-950 font-semibold"
                                        value={newProduct.category}
                                        onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value }))}
                                        placeholder="Choose existing or type new"
                                    />
                                    <datalist id="product-categories">
                                        {categories.map((category) => (
                                            <option key={category} value={category} />
                                        ))}
                                    </datalist>
                                    <p className="text-xs font-medium text-zinc-500">Typing a new name creates that category.</p>
                                </Field>
                                <div className="hidden rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:block">
                                    <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Publish status</p>
                                    <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-400">
                                        <CheckCircle2 className="h-4 w-4" />
                                        New products are featured by default
                                    </div>
                                </div>
                                <Field label="Description" className="sm:col-span-2">
                                    <Textarea
                                        required
                                        className="min-h-32 rounded-xl border-zinc-800 bg-zinc-950 font-medium"
                                        value={newProduct.description}
                                        onChange={(e) => setNewProduct((p) => ({ ...p, description: e.target.value }))}
                                        placeholder="Describe the product, specs, bundle contents, and any selling notes."
                                    />
                                </Field>

                                <div className="flex flex-col-reverse gap-3 border-t border-zinc-800 pt-4 sm:col-span-2 sm:flex-row sm:justify-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => {
                                            resetForm();
                                            setIsAdding(false);
                                        }}
                                        className="h-12 rounded-xl font-bold text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={formLoading || !newProduct.image}
                                        className="h-12 rounded-xl bg-blue-600 px-6 font-black text-white hover:bg-blue-500"
                                    >
                                        {formLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackagePlus className="mr-2 h-4 w-4" />}
                                        Publish product
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </section>
                )}

                <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
                    <div className="flex flex-col gap-4 border-b border-zinc-800 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                        <div>
                            <h2 className="text-lg font-black tracking-tight">Available inventory</h2>
                            <p className="text-sm font-medium text-zinc-500">{filteredProducts.length} products showing</p>
                        </div>
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search products"
                                className="h-11 rounded-xl border-zinc-800 bg-zinc-950 pl-9 font-semibold"
                            />
                        </div>
                    </div>

                    {filteredProducts.length > 0 ? (
                        <div className="grid gap-3 p-3 sm:p-4 lg:grid-cols-2">
                            {filteredProducts.map((product) => (
                                <article key={product.id} className="flex gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3 sm:gap-4 sm:p-4">
                                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 sm:h-28 sm:w-28">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-zinc-600">No image</div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex gap-2">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="truncate text-base font-black text-white">{product.name}</h3>
                                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                                    <span className="text-sm font-black text-emerald-400">${Number(product.price || 0).toLocaleString()}</span>
                                                    <span className="rounded-full bg-zinc-900 px-2 py-1 text-[11px] font-bold text-zinc-400">{product.category || "Uncategorized"}</span>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 gap-2">
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className={cn(
                                                        "h-9 w-9 rounded-lg",
                                                        product.isPromoted ? "bg-amber-400 text-black hover:bg-amber-300" : "bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-amber-300"
                                                    )}
                                                    onClick={() => handleTogglePromote(product.id, product.isPromoted)}
                                                    title={product.isPromoted ? "Remove featured status" : "Feature product"}
                                                >
                                                    <Star className={cn("h-4 w-4", product.isPromoted && "fill-current")} />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-9 w-9 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white"
                                                    onClick={() => handleDelete(product.id)}
                                                    title="Delete product"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="mt-3 line-clamp-2 text-sm font-medium leading-6 text-zinc-500">{product.description}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="px-6 py-16 text-center">
                            <Database className="mx-auto mb-4 h-12 w-12 text-zinc-700" />
                            <h3 className="text-xl font-black text-white">No products found</h3>
                            <p className="mx-auto mt-2 max-w-sm text-sm font-medium text-zinc-500">Add a product manually or seed the marketplace catalog.</p>
                            <Button onClick={() => setIsAdding(true)} className="mt-6 h-11 rounded-xl bg-white px-5 font-bold text-black hover:bg-zinc-200">
                                <Plus className="mr-2 h-4 w-4" />
                                Add product
                            </Button>
                        </div>
                    )}
                </section>
            </div>

            <Modal
                isOpen={showSeedConfirm}
                onClose={() => setShowSeedConfirm(false)}
                title="Seed product catalog"
                description="This adds the starter products to the marketplace without removing admin-added products."
            >
                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setShowSeedConfirm(false)} className="font-bold text-zinc-500">Cancel</Button>
                    <Button onClick={handleSeedDatabase} className="rounded-xl bg-blue-600 font-black text-white hover:bg-blue-500">Seed catalog</Button>
                </div>
            </Modal>
        </div>
    );
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-black uppercase tracking-widest text-zinc-500">{label}</span>
                <Icon className="h-4 w-4 text-blue-400" />
            </div>
            <p className="mt-2 text-2xl font-black text-white">{value}</p>
        </div>
    );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
    return (
        <div className={cn("space-y-2", className)}>
            <Label className="text-xs font-black uppercase tracking-widest text-zinc-500">{label}</Label>
            {children}
        </div>
    );
}

function ImageModeButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-black transition-colors",
                active ? "bg-blue-600 text-white" : "text-zinc-500 hover:text-zinc-200"
            )}
        >
            <Icon className="h-4 w-4" />
            {label}
        </button>
    );
}

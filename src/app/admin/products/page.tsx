"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, writeBatch, serverTimestamp, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { products as seedProducts } from "@/lib/seed/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { ImageUpload } from "@/components/ui/image-upload";
import { Loader2, Trash2, Star, Save, Database, Plus, CheckCircle2, Shield, Lock } from "lucide-react";
import { toast } from "sonner";

interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    category: string;
    image: string;
    isPromoted?: boolean;
}

export default function AdminProductsPage() {
    const [user, setUser] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);

    // Form State
    const [isAdding, setIsAdding] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: "",
        price: "",
        description: "",
        category: "",
        image: ""
    });
    const [formLoading, setFormLoading] = useState(false);
    const [showSeedConfirm, setShowSeedConfirm] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "products"));
            const fetched: Product[] = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Product));
            setProducts(fetched);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (u) {
                setUser(u);
                const userDoc = await getDoc(doc(db, "users", u.uid));
                if (userDoc.exists() && userDoc.data()?.isAdmin) {
                    setIsAdmin(true);
                    await fetchProducts();
                } else {
                    setIsAdmin(false);
                    setLoading(false);
                }
            } else {
                setIsAdmin(false);
                setLoading(false);
            }
        });
        return () => unsub();
    }, []);

    const handleSeedDatabase = async () => {
        setSeeding(true);
        setShowSeedConfirm(false);
        try {
            const batch = writeBatch(db);
            const productsRef = collection(db, "products");

            seedProducts.forEach((product) => {
                const newDocRef = doc(productsRef); // Auto-ID
                batch.set(newDocRef, {
                    ...product,
                    isPromoted: false,
                    createdAt: serverTimestamp()
                });
            });

            await batch.commit();
            toast.success("Database seeded successfully!");
            fetchProducts();
        } catch (error) {
            console.error("Error seeding database:", error);
            toast.error("Failed to seed database.");
        } finally {
            setSeeding(false);
        }
    };

    const handleTogglePromote = async (id: string, currentStatus?: boolean) => {
        try {
            const productRef = doc(db, "products", id);
            await updateDoc(productRef, {
                isPromoted: !currentStatus
            });
            // Optimistic update
            setProducts(prev => prev.map(p => p.id === id ? { ...p, isPromoted: !currentStatus } : p));
        } catch (error) {
            console.error("Error updating promotion status:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        try {
            await deleteDoc(doc(db, "products", id));
            setProducts(prev => prev.filter(p => p.id !== id));
            toast.success("Product deleted.");
        } catch (error) {
            console.error("Error deleting product:", error);
        }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const productsRef = collection(db, "products");
            const newDocRef = doc(productsRef);
            await setDoc(newDocRef, {
                ...newProduct,
                price: Number(newProduct.price),
                isPromoted: false,
                createdAt: serverTimestamp()
            });

            setNewProduct({ name: "", price: "", description: "", category: "", image: "" });
            setIsAdding(false);
            toast.success("Product added successfully!");
            fetchProducts();
        } catch (error) {
            console.error("Error adding product:", error);
            alert("Failed to add product.");
        } finally {
            setFormLoading(false);
        }
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-zinc-950">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
    );

    if (isAdmin === false) {
        if (typeof window !== 'undefined') window.location.href = '/admin/login';
        return null;
    }

    return (
        <div className="min-h-screen bg-zinc-950 p-8 space-y-10 animate-in fade-in duration-700">
            <div className="max-w-7xl mx-auto space-y-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 mb-1">
                            <Shield className="w-5 h-5 text-blue-500" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Inventory Core</span>
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tight">Main Product Catalog</h1>
                        <p className="text-zinc-500 font-medium">Manage the global database of products available for resellers.</p>
                    </div>
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            onClick={() => setShowSeedConfirm(true)}
                            disabled={seeding}
                            className="bg-zinc-900 border-zinc-800 text-zinc-400 font-black h-12 px-6 rounded-2xl"
                        >
                            {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-500" /> : <Database className="mr-2 h-4 w-4 text-blue-500" />}
                            SEED DATA
                        </Button>
                        <Button onClick={() => setIsAdding(!isAdding)} className="bg-white text-black font-black h-12 px-8 rounded-2xl shadow-xl shadow-white/5">
                            <Plus className="mr-2 h-5 w-5" /> ADD PRODUCT
                        </Button>
                    </div>
                </div>

                {isAdding && (
                    <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl relative overflow-hidden animate-in slide-in-from-top-10 duration-500">
                        <h2 className="text-2xl font-black mb-6 text-white tracking-tight">Add New Product to Marketplace</h2>
                        <form onSubmit={handleAddProduct} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Product Name</Label>
                                    <Input
                                        required
                                        className="h-14 bg-zinc-950 border-zinc-800 rounded-2xl font-bold"
                                        value={newProduct.name}
                                        onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                        placeholder="e.g. Premium Watch"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Supplier Cost ($)</Label>
                                    <Input
                                        required
                                        className="h-14 bg-zinc-950 border-zinc-800 rounded-2xl font-bold"
                                        type="number"
                                        value={newProduct.price}
                                        onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Category</Label>
                                    <Input
                                        required
                                        className="h-14 bg-zinc-950 border-zinc-800 rounded-2xl font-bold"
                                        value={newProduct.category}
                                        onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                                        placeholder="e.g. Watch, Tech, Home"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Internal Description</Label>
                                    <Input
                                        required
                                        className="h-14 bg-zinc-950 border-zinc-800 rounded-2xl font-bold"
                                        value={newProduct.description}
                                        onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                                        placeholder="Specifications for suppliers..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Main Product Image URL</Label>
                                <Input 
                                    className="h-14 bg-zinc-950 border-zinc-800 rounded-2xl font-bold"
                                    value={newProduct.image}
                                    onChange={e => setNewProduct({ ...newProduct, image: e.target.value })}
                                    placeholder="Paste image link here"
                                />
                                {newProduct.image && (
                                     <div className="mt-4 h-32 w-32 rounded-2xl overflow-hidden border border-zinc-800">
                                         <img src={newProduct.image} alt="preview" className="h-full w-full object-cover" />
                                     </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-zinc-800">
                                <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} className="text-zinc-500 font-bold">CANCEL</Button>
                                <Button type="submit" disabled={formLoading || !newProduct.image} className="bg-blue-600 hover:bg-blue-700 h-14 px-10 rounded-2xl font-black shadow-xl shadow-blue-500/20">
                                    {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    PUBLISH TO MARKETPLACE
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="bg-zinc-900 rounded-[2.5rem] border border-zinc-800 shadow-sm overflow-hidden text-zinc-900 dark:text-white">
                    <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/20">
                        <h2 className="text-xl font-black tracking-tight">Available Inventory ({products.length})</h2>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Market Live</span>
                        </div>
                    </div>
                    
                    <div className="divide-y divide-zinc-800/50">
                        {products.map(product => (
                            <div key={product.id} className="p-6 flex items-center justify-between hover:bg-zinc-800/30 transition-all group">
                                <div className="flex items-center gap-6">
                                    <div className="h-16 w-16 rounded-[1.25rem] bg-zinc-950 border border-zinc-800 overflow-hidden relative group-hover:scale-110 transition-transform duration-500">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-zinc-700 text-[10px] font-black">NO IMAGE</div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white italic group-hover:not-italic transition-all">{product.name}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-emerald-500 font-black text-sm">${product.price}</span>
                                            <span className="text-zinc-600">•</span>
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-800 px-2 py-0.5 rounded-md">{product.category}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className={`h-10 w-10 rounded-xl ${product.isPromoted ? "bg-amber-500 text-black hover:bg-amber-400" : "bg-zinc-800 text-zinc-500 hover:text-amber-500"}`}
                                        onClick={() => handleTogglePromote(product.id, product.isPromoted)}
                                        title={product.isPromoted ? "Remove Promotion" : "Highlight as Featured"}
                                    >
                                        <Star className={`h-5 w-5 ${product.isPromoted ? "fill-current" : ""}`} />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-10 w-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                        onClick={() => handleDelete(product.id)}
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {products.length === 0 && (
                            <div className="p-24 text-center">
                                <Database className="w-16 h-16 text-zinc-800 mx-auto mb-6" />
                                <h3 className="text-2xl font-black text-white italic mb-2">Marketplace is Empty</h3>
                                <p className="text-zinc-500 font-bold text-sm max-w-xs mx-auto mb-8">Click "Seed Data" to populate with standard products or add your first one manually.</p>
                                <Button onClick={() => setIsAdding(true)} className="bg-white text-black font-black px-10 h-12 rounded-2xl">ADD YOUR FIRST PRODUCT</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal
                isOpen={showSeedConfirm}
                onClose={() => setShowSeedConfirm(false)}
                title="Initialize Market Seed"
                description="This will populate your marketplace with global products for resellers."
            >
                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setShowSeedConfirm(false)} className="font-bold text-zinc-500">CANCEL</Button>
                    <Button onClick={handleSeedDatabase} className="bg-blue-600 text-white font-black rounded-xl">YES, SEED MARKET</Button>
                </div>
            </Modal>
        </div>
    );
}

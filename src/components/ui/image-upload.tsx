"use client";
import React, { useRef, useState } from "react";
import { Loader2, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    disabled?: boolean;
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Start upload
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            // Upload to our new backend route to bypass client-side CORS completely
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Upload failed");
            }

            const data = await res.json();
            onChange(data.url);
            
        } catch (err: any) {
            console.error("Upload error:", err);
            setError(err.message || "Failed to upload image. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = () => {
        onChange("");
    };

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            {value ? (
                <div className="relative aspect-square w-full max-w-[200px] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
                    <Button
                        type="button"
                        onClick={handleRemove}
                        variant="destructive"
                        className="absolute right-2 top-2 z-10 w-8 h-8 p-0 rounded-full"
                        disabled={disabled}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                    <Image
                        fill
                        src={value}
                        alt="Uploaded Image"
                        className="object-cover"
                    />
                </div>
            ) : (
                <div className="w-full">
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        disabled={disabled || loading}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        disabled={disabled || loading}
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-32 border-2 border-dashed border-zinc-700 bg-zinc-900 hover:bg-zinc-800 flex flex-col items-center justify-center gap-2 rounded-2xl transition-all"
                    >
                        {loading ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                <span className="text-xs font-bold text-zinc-400 capitalize">Uploading Securely...</span>
                            </div>
                        ) : (
                            <>
                                <UploadCloud className="w-8 h-8 text-zinc-500" />
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Click to upload image</span>
                            </>
                        )}
                    </Button>
                    {error && <p className="text-xs font-bold text-red-500 mt-2 text-center">{error}</p>}
                </div>
            )}
        </div>
    );
}

"use client";
import React, { useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Loader2, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { IKUpload } from "imagekitio-next";
import { cn } from "@/lib/utils";

interface ImageKitUploadResponse {
    url: string;
}

interface ImageKitUploadError {
    message?: string;
}

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    disabled?: boolean;
    folder?: string;
    className?: string;
    label?: string;
    helperText?: string;
    compact?: boolean;
}

const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "";
const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "";

async function authenticator() {
    const res = await fetch("/api/imagekit/auth");
    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.signature || !data?.token || !data?.expire) {
        throw new Error(data?.error || "ImageKit upload is not configured.");
    }

    return data;
}

export function ImageUpload({ value, onChange, disabled, folder = "/shoplinea/products", className, label = "Upload product image", helperText = "JPG, PNG, or WebP. Sent directly to ImageKit.", compact = false }: ImageUploadProps) {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadStart = () => {
        setLoading(true);
        setProgress(0);
        setError(null);
    };

    const handleUploadProgress = (evt: ProgressEvent<XMLHttpRequestEventTarget>) => {
        if (evt.lengthComputable) {
            setProgress(Math.round((evt.loaded / evt.total) * 100));
        }
    };

    const handleUploadSuccess = (res: ImageKitUploadResponse) => {
        onChange(res.url);
        setLoading(false);
        setProgress(100);
        setError(null);
    };

    const handleUploadError = (err: ImageKitUploadError) => {
        console.error("Upload error:", err);
        setLoading(false);
        setProgress(0);
        setError(err?.message || "Upload failed. Please choose a JPG, PNG, or WebP image.");
    };

    const validateFile = (file: File) => {
        if (!file.type.startsWith("image/")) {
            setError("Please choose an image file.");
            return false;
        }
        return true;
    };

    const handleRemove = () => {
        onChange("");
        setProgress(0);
        setError(null);
    };

    return (
        <div className={cn("flex flex-col gap-3 w-full", className)}>
            {value ? (
                <div className={cn("relative w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950", compact ? "min-h-[140px]" : "min-h-[220px]")}>
                    <Button
                        type="button"
                        onClick={handleRemove}
                        variant="destructive"
                        className="absolute right-3 top-3 z-10 h-9 w-9 rounded-full p-0"
                        disabled={disabled}
                        title="Remove image"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                    <Image
                        fill
                        src={value}
                        alt="Uploaded product image"
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 420px"
                    />
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        Uploaded to ImageKit
                    </div>
                </div>
            ) : (
                <div className="w-full">
                    <IKUpload
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        publicKey={publicKey}
                        urlEndpoint={urlEndpoint}
                        authenticator={authenticator}
                        folder={folder}
                        useUniqueFileName
                        validateFile={validateFile}
                        onUploadStart={handleUploadStart}
                        onUploadProgress={handleUploadProgress}
                        onSuccess={handleUploadSuccess}
                        onError={handleUploadError}
                        disabled={disabled || loading}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        disabled={disabled || loading}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn("w-full rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-blue-500 hover:bg-zinc-900", compact ? "h-36" : "h-44")}
                    >
                        {loading ? (
                            <div className="flex w-full max-w-xs flex-col items-center gap-3 px-5">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                <span className="text-sm font-semibold text-white">Uploading to ImageKit</span>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                                    <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
                                </div>
                                <span className="text-xs font-semibold text-zinc-500">{progress}%</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3 text-center">
                                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                                    <ImagePlus className="h-6 w-6" />
                                </span>
                                <span className="text-sm font-bold text-white">{label}</span>
                                <span className="text-xs font-medium text-zinc-500">{helperText}</span>
                                <span className="mt-1 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-400">
                                    <UploadCloud className="h-3.5 w-3.5" />
                                    Choose file
                                </span>
                            </div>
                        )}
                    </Button>
                    {error && <p className="mt-2 text-sm font-semibold text-red-400">{error}</p>}
                </div>
            )}
        </div>
    );
}

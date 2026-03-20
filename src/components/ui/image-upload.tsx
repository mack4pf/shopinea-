"use strict";
import React, { useRef, useState } from "react";
import { ImageKitProvider, IKUpload } from "imagekitio-next";
import { Loader2, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    disabled?: boolean;
}

const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

const authenticator = async () => {
    try {
        const response = await fetch("/api/imagekit/auth");

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Request failed with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const { signature, expire, token } = data;
        return { signature, expire, token };
    } catch (error) {
        throw new Error(`Authentication request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
};

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const ikUploadRef = useRef<HTMLInputElement>(null);

    const onError = (err: any) => {
        console.error("ImageKit Error:", err);
        setError("Upload failed. Please try again.");
        setLoading(false);
    };

    const onSuccess = (res: any) => {
        console.log("ImageKit Success:", res);
        onChange(res.url); // Pass the URL back to parent
        setLoading(false);
        setError(null);
    };

    const onUploadStart = () => {
        setLoading(true);
        setError(null);
    };

    const handleRemove = () => {
        onChange("");
    };

    const triggerUpload = () => {
        ikUploadRef.current?.click();
    }

    return (
        <ImageKitProvider
            publicKey={publicKey}
            urlEndpoint={urlEndpoint}
            authenticator={authenticator}
        >
            <div className="flex flex-col items-center gap-4">
                {value ? (
                    <div className="relative aspect-square w-full max-w-[200px] overflow-hidden rounded-lg border">
                        <Button
                            type="button"
                            onClick={handleRemove}
                            variant="destructive"
                            size="icon"
                            className="absolute right-2 top-2 z-10 size-6"
                            disabled={disabled}
                        >
                            <X className="size-4" />
                        </Button>
                        <Image
                            fill
                            src={value}
                            alt="Uploaded Image"
                            className="object-cover"
                        />
                    </div>
                ) : (
                    <div className="w-full max-w-sm">
                        <IKUpload
                            ref={ikUploadRef}
                            fileName="product-image"
                            onError={onError}
                            onSuccess={onSuccess}
                            onUploadStart={onUploadStart}
                            className="hidden"
                            validateFile={(file) => file.size < 2000000} // 2MB limit example
                        />
                        <Button
                            type="button"
                            variant="outline"
                            disabled={disabled || loading}
                            onClick={triggerUpload}
                            className="w-full border-dashed p-8 h-auto flex flex-col gap-2 hover:bg-muted/50"
                        >
                            {loading ? (
                                <Loader2 className="size-8 animate-spin text-muted-foreground" />
                            ) : (
                                <UploadCloud className="size-8 text-muted-foreground" />
                            )}
                            <span className="text-sm font-medium text-muted-foreground">
                                {loading ? "Uploading..." : "Click to upload image"}
                            </span>
                        </Button>
                        {error && <p className="text-sm text-destructive mt-2 text-center">{error}</p>}
                    </div>
                )}
            </div>
        </ImageKitProvider>
    );
}

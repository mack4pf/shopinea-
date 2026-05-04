import { NextResponse } from "next/server";
import ImageKit from "imagekit";

function getImageKitClient() {
    const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

    if (!publicKey || !privateKey || !urlEndpoint) {
        throw new Error("ImageKit environment variables are not configured");
    }

    return new ImageKit({
        publicKey,
        privateKey,
        urlEndpoint,
    });
}

export async function POST(req: Request) {
    try {
        const imagekit = getImageKitClient();
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to ImageKit backend
        const response = await imagekit.upload({
            file: buffer, // can be buffer, base64, or url
            fileName: file.name || "upload.jpg",
            folder: "/shoplinea",
        });

        return NextResponse.json({ url: response.url }, { status: 200 });
    } catch (error: any) {
        console.error("Image upload back-end error:", error);
        return NextResponse.json({ error: error.message || "Failed to upload image" }, { status: 500 });
    }
}

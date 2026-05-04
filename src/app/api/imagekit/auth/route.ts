import ImageKit from "imagekit"
import { NextResponse } from "next/server"

function getImageKitClient() {
    const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
    const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT

    if (!publicKey || !privateKey || !urlEndpoint) {
        throw new Error("ImageKit environment variables are not configured")
    }

    return new ImageKit({
        publicKey,
        privateKey,
        urlEndpoint,
    })
}

export async function GET() {
    try {
        const imagekit = getImageKitClient()
        const authenticationParameters = imagekit.getAuthenticationParameters()
        return NextResponse.json(authenticationParameters)
    } catch (error) {
        return NextResponse.json(
            { error: "ImageKit authentication failed" },
            { status: 500 }
        )
    }
}

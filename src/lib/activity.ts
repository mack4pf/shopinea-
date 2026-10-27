import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";

export type ActivityEventName =
    | "page_view"
    | "crypto_address_copied"
    | "deposit_submitted";

type ActivityDetails = Record<string, string | number | boolean | null | undefined>;

export async function logUserActivity(event: ActivityEventName, details: ActivityDetails = {}) {
    const user = auth.currentUser;
    if (!user) return;

    const sanitizedDetails = Object.fromEntries(
        Object.entries(details).filter(([, value]) => value !== undefined)
    );

    try {
        await addDoc(collection(db, "activityEvents"), {
            event,
            userId: user.uid,
            userEmail: user.email || "",
            path: typeof window !== "undefined" ? window.location.pathname : "",
            details: sanitizedDetails,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Activity logging failed:", error);
    }
}

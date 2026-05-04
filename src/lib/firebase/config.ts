import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const hasFirebaseConfig = Object.values(firebaseConfig).every((value) => Boolean(value));

const createMissingConfigProxy = <T extends object>(name: string): T => {
    const message =
        `Firebase ${name} requested, but Firebase environment variables are missing. ` +
        "Set NEXT_PUBLIC_FIREBASE_* variables in .env.";

    return new Proxy({} as T, {
        get() {
            throw new Error(message);
        },
    });
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (hasFirebaseConfig) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
} else {
    app = createMissingConfigProxy<FirebaseApp>("app");
    auth = createMissingConfigProxy<Auth>("auth");
    db = createMissingConfigProxy<Firestore>("firestore");
    storage = createMissingConfigProxy<FirebaseStorage>("storage");
}

export { app, auth, db, storage };

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Singleton pattern for HMR safety
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let db;
if (typeof window !== 'undefined') {
    try {
        db = initializeFirestore(app, {
            localCache: persistentLocalCache()
        });
    } catch (e) {
        db = getFirestore(app);
    }
} else {
    db = getFirestore(app);
}

const auth = getAuth(app);
const storage = getStorage(app);
const analytics = typeof window !== 'undefined' ? isSupported().then(yes => yes ? getAnalytics(app) : null) : null;
const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { deleteApp } from "firebase/app";

export { app, db, auth, storage, analytics, messaging };

export const createAdminUser = async (email, password) => {
    const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
    const secondaryAuth = getAuth(secondaryApp);
    try {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const newUser = userCredential.user;
        await signOut(secondaryAuth);
        await deleteApp(secondaryApp);
        return newUser;
    } catch (error) {
        await deleteApp(secondaryApp);
        throw error;
    }
};

export default app;

import { getApp, getApps, initializeApp } from "firebase/app";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import {
  getAuth,
  getReactNativePersistence,
  inMemoryPersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const tenantAuthApp =
  getApps().find((firebaseApp) => firebaseApp.name === "tenant-account-creator") ||
  initializeApp(firebaseConfig, "tenant-account-creator");

function initializeMobileAuth(firebaseApp, persistence) {
  try {
    return initializeAuth(firebaseApp, { persistence });
  } catch (error) {
    if (error.code === "auth/already-initialized") {
      return getAuth(firebaseApp);
    }

    throw error;
  }
}

export const auth = initializeMobileAuth(
  app,
  getReactNativePersistence(ReactNativeAsyncStorage),
);
export const db = getFirestore(app);
export const tenantAuth = initializeMobileAuth(
  tenantAuthApp,
  inMemoryPersistence,
);

export default app;

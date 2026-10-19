import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../config/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    let unsubscribeProfile;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      unsubscribeProfile?.();
      setUser(currentUser);
      setProfile(null);

      if (currentUser) {
        setProfileLoading(true);
        unsubscribeProfile = onSnapshot(
          doc(db, "users", currentUser.uid),
          (snapshot) => {
            const currentProfile = snapshot.exists()
              ? snapshot.data()
              : { role: "tenant" };

            setProfile(currentProfile);
            setProfileLoading(false);
          },
          () => {
            setProfile({ role: "tenant" });
            setProfileLoading(false);
          },
        );
      } else {
        setProfileLoading(false);
      }

      setInitializing(false);
    });

    return () => {
      unsubscribe();
      unsubscribeProfile?.();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const credential = await signInWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password,
    );
    const profileSnapshot = await getDoc(
      doc(db, "users", credential.user.uid),
    );
    const role = profileSnapshot.exists()
      ? profileSnapshot.data().role
      : null;

    if (role !== "admin" && role !== "tenant") {
      await signOut(auth);

      const error = new Error("บัญชียังไม่ได้กำหนดสิทธิ์ใน Firestore");
      error.code = "auth/profile-not-configured";
      throw error;
    }

    return credential;
  }, []);

  const logout = useCallback(() => signOut(auth), []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (!user?.email) {
      throw new Error("ไม่พบข้อมูลบัญชีผู้ใช้");
    }

    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword,
    );
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      profile,
      role: profile?.role || "tenant",
      isAdmin: profile?.role === "admin",
      initializing,
      profileLoading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      changePassword,
    }),
    [user, profile, initializing, profileLoading, login, logout, changePassword],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth ต้องถูกเรียกภายใน AuthProvider");
  }

  return context;
}

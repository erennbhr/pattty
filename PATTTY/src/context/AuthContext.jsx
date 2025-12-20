import React, {
  createContext,
  useState,
  useContext,
  useEffect,
} from "react";

import { Capacitor } from "@capacitor/core";
import { auth, db } from "../utils/firebase";

import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";

import {
  doc,
  onSnapshot,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

const AuthContext = createContext(null);

/* -------------------------------------------------------------------------- */
/*                               PROVIDER                                     */
/* -------------------------------------------------------------------------- */

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ------------------------------------------------------------------------ */
  /*                        ORTAK USER DOC OLUŞTURMA                           */
  /* ------------------------------------------------------------------------ */
  const ensureUserDocument = async (firebaseUser, providerName) => {
    const userRef = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || "",
        email: firebaseUser.email || "",
        photoURL: firebaseUser.photoURL || "",
        isPremium: false,
        provider: providerName,
        createdAt: serverTimestamp(),
      });
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                    AUTH STATE + FIRESTORE LISTENER                        */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, "users", currentUser.uid);

      unsubscribeSnapshot = onSnapshot(
        userDocRef,
        (docSnap) => {
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            name: currentUser.displayName,
            imageUrl: currentUser.photoURL,
            joinedAt: currentUser.metadata.creationTime,
            ...(docSnap.exists() ? docSnap.data() : {}),
          });
          setLoading(false);
        },
        (error) => {
          console.error("Firestore dinleme hatası:", error);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                   GOOGLE REDIRECT RESULT (ANDROID)                        */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          await ensureUserDocument(result.user, "google");
        }
      })
      .catch((err) => {
        console.error("Google redirect sonucu hatası:", err);
      });
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                             GOOGLE LOGIN                                  */
  /* ------------------------------------------------------------------------ */
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      if (Capacitor.isNativePlatform()) {
        // ✅ Android / iOS
        await signInWithRedirect(auth, provider);
        return null;
      } else {
        // ✅ Web
        const result = await signInWithPopup(auth, provider);
        await ensureUserDocument(result.user, "google");
        return true;
      }
    } catch (error) {
      if (error.code === "auth/popup-closed-by-user") return null;
      console.error("Google Login Hatası:", error);
      throw error;
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                         EMAIL / PASSWORD LOGIN                            */
  /* ------------------------------------------------------------------------ */
  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error("Login hatası:", error);
      throw error;
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                               REGISTER                                    */
  /* ------------------------------------------------------------------------ */
  const register = async (email, password, name) => {
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }

      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        name: name || "",
        email,
        photoURL: "",
        isPremium: false,
        provider: "email",
        createdAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error("Register hatası:", error);
      throw error;
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                                LOGOUT                                     */
  /* ------------------------------------------------------------------------ */
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout hatası:", error);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                                CONTEXT                                    */
  /* ------------------------------------------------------------------------ */
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        loginWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   HOOK                                     */
/* -------------------------------------------------------------------------- */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};

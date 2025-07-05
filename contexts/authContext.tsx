import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, query, collection, where, getDocs } from "firebase/firestore";
import { AuthContextType, NotificationPreferences, UserType } from "@/types";
import { auth, firestore } from "@/config/firebase";
import { Router, useRouter, useSegments } from "expo-router";
import { sendEmailVerification } from "firebase/auth";
import { updateNotificationPreferences as updateUserNotificationPreferences } from "@/services/userService";

const AuthContext = createContext<(AuthContextType & { refreshKey: number }) | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserType>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const router: Router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // console.log("got user in auth state changed: ", firebaseUser);
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser?.displayName,
        });
        updateUserData(firebaseUser.uid);
        router.replace({ pathname: "/(tabs)" } as any);
      } else {
        setUser(null);
        router.replace({ pathname: "/(auth)/welcome" } as any);
      }
    });

    return () => unsubscribe();
  }, []);

  const generateUniqueAccountNumber = async () => {
    let accountNumber;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      // Generate 10-digit account number
      const timestamp = Date.now().toString();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      accountNumber = timestamp.slice(-6) + random;
      
      // Check if account number already exists
      const q = query(
        collection(firestore, 'users'), 
        where('accountNumber', '==', accountNumber)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new Error('Unable to generate unique account number');
    }

    return accountNumber;
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes("(auth/invalid-email)")) msg = "Invalid email";
      if (msg.includes("(auth/invalid-credential)")) msg = "Wrong credentials";
      return { success: false, msg };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      let response = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Generate unique account number
      const accountNumber = await generateUniqueAccountNumber();

      await setDoc(doc(firestore, "users", response?.user?.uid), {
        name,
        email,
        uid: response?.user?.uid,
        accountNumber, // Add the generated account number
        notificationPreferences: {
          emailAlerts: false,
          appPushNotifications: true,
        },
      });

      // Send verification email
      if (response.user) {
        await sendEmailVerification(response.user);
      }

      return { success: true };
    } catch (error: any) {
      let msg = error.message;

      if (msg.includes("(auth/invalid-email)")) msg = "Invalid email";
      if (msg.includes("(auth/email-already-in-use)"))
        msg = "This email is already in use";
      if (msg.includes("Unable to generate unique account number"))
        msg = "Registration failed. Please try again.";

      return { success: false, msg };
    }
  };

  const updateUserData = async (uid: string) => {
    try {
      const docRef = doc(firestore, "users", uid);
      // console.log("updating data for : ", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const userData: UserType = {
          uid: data.uid,
          email: data.email || null,
          name: data.name || null,
          image: data.image || null,
          accountNumber: data.accountNumber || null, // Add account number to user data
          notificationPreferences: data.notificationPreferences || {
            emailAlerts: false,
            appPushNotifications: true
          }
        };
        // console.log("updated user data: ", userData);
        setUser({ ...user, ...userData });
      }
    } catch (error) {
      console.error("Error fetching user data: ", error);
    }
  };

  const resendVerificationEmail = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        return { success: true };
      } catch (error: any) {
        return { success: false, msg: error.message };
      }
    } else {
      return { success: false, msg: "No authenticated user found." };
    }
  };

  const checkEmailVerification = async () => {
    if (auth.currentUser) {
      try {
        await auth.currentUser.reload(); // Refresh user state
        return { success: true, verified: auth.currentUser.emailVerified };
      } catch (error: any) {
        return { success: false, msg: error.message };
      }
    } else {
      return { success: false, msg: "No authenticated user found." };
    }
  };

  const updateNotificationPreferences = async (preferences: NotificationPreferences) => {
    if (!user?.uid) {
      return { success: false, msg: "No authenticated user found." };
    }

    try {
      const result = await updateUserNotificationPreferences(user.uid, preferences);
      
      if (result.success) {
        // Update local user state with new preferences
        setUser({
          ...user,
          notificationPreferences: preferences
        });
      }
      
      return result;
    } catch (error: any) {
      return { success: false, msg: error.message || "Failed to update notification preferences" };
    }
  };
  
  const refreshData = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  const contextValue: AuthContextType = {
    user,
    setUser,
    login,
    register,
    updateUserData,
    resendVerificationEmail,
    checkEmailVerification,
    updateNotificationPreferences,
    refreshData,
  };

  return (
    <AuthContext.Provider value={{ ...contextValue, refreshKey }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType & { refreshKey: number } => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be wrapped inside AuthProvider");
  }
  return context as AuthContextType & { refreshKey: number };
};
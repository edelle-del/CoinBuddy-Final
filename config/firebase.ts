import { initializeApp, getApp } from "firebase/app";

import { initializeAuth, getReactNativePersistence,getAuth, } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore, collection } from "firebase/firestore";

// 1. create new project on firebase console
// 2. create a web app and copy the firebseConfigs below
const firebaseConfig = {
  apiKey: "AIzaSyDppDW8ajrSyKtr2n8OXLzSbVafgIoRcXk",
  authDomain: "coinbuddy2.firebaseapp.com",
  projectId: "coinbuddy2",
  storageBucket: "coinbuddy2.firebasestorage.app",
  messagingSenderId: "367174604294",
  appId: "1:367174604294:web:28150bdc2ff8649fd4d587",
  measurementId: "G-H8RRT7ERWK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig, "CoinBuddy");

export const auth = initializeAuth(app, { 
  persistence: getReactNativePersistence(AsyncStorage),
});
const firestore = getFirestore(app);
export { firestore };

export const firebase = {
  app,
  auth,
  firestore,
};



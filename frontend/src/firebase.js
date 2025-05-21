// Firebase configuration
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getMessaging, getToken } from "firebase/messaging";

// Your Firebase configuration (replace with actual values later)
const firebaseConfig = {
  apiKey: "AIzaSyB-PLACEHOLDER-KEY-REPLACE-THIS",
  authDomain: "lovetrack-plus.firebaseapp.com",
  projectId: "lovetrack-plus",
  storageBucket: "lovetrack-plus.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
  measurementId: "G-ABCDEFGHIJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);
let messaging = null;

// Initialize Firebase Cloud Messaging
try {
  messaging = getMessaging(app);
} catch (error) {
  console.error("Messaging couldn't be initialized:", error);
}

// Function to request and get messaging token
const requestMessagingPermission = async () => {
  try {
    if (!messaging) return null;
    
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: "BF-PLACEHOLDER-VAPID-KEY-REPLACE-THIS"
      });
      return token;
    }
    return null;
  } catch (error) {
    console.error("Error getting messaging token:", error);
    return null;
  }
};

export { app, auth, db, functions, messaging, requestMessagingPermission };

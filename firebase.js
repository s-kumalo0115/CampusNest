// firebase.js - Fixed modular v10 setup (SAFE, NO APP CHECK)

// Import Firebase functions (v10+)
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCmxAAauCQQuiSGeyf8d4gPjnBeroD_qJo",
  authDomain: "campusnest-785a6.firebaseapp.com",
  projectId: "campusnest-785a6",
  storageBucket: "campusnest-785a6.appspot.com",
  messagingSenderId: "865506560321",
  appId: "1:865506560321:web:260488aed6283b1bbbb9c0"
};

// ✅ SAFE INIT (prevents duplicate app crash)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

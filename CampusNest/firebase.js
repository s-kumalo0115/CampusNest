// firebase.js - Fixed modular v10 setup

// Import Firebase functions (v10+)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
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

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Export modules for use in other JS files
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// contact.js – AUTH REQUIRED CONTACT FORM

import { auth, db } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const contactForm = document.getElementById("contactForm");
const feedback = document.getElementById("contactMessageFeedback");

let currentUser = null;

// Require login
onAuthStateChanged(auth, user => {
  if (!user) {
    feedback.textContent = "⚠ Please log in to contact admin.";
    feedback.style.color = "red";
    if (contactForm) contactForm.style.display = "none";
  } else {
    currentUser = user;
    if (contactForm) contactForm.style.display = "block";
  }
});

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const message = document.getElementById("contactMessage")?.value.trim();
    if (!message) return;

    try {
      await addDoc(collection(db, "contacts"), {
        userId: currentUser.uid,
        userName: currentUser.displayName || "",
        userEmail: currentUser.email,
        message,
        read: false,
        createdAt: serverTimestamp()
      });

      feedback.style.color = "green";
      feedback.textContent = "✅ Message sent to admin.";
      contactForm.reset();

    } catch (err) {
      console.error(err);
      feedback.style.color = "red";
      feedback.textContent = "❌ Failed to send message.";
    }
  });
}

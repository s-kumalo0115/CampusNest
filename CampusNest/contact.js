// contact.js - Modular Firebase v10+
// Handles contact form submissions

import { db } from "./firebase.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const contactForm = document.getElementById("contactForm");
const contactMessageFeedback = document.getElementById("contactMessageFeedback");

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("contactName")?.value.trim() || "";
    const email = document.getElementById("contactEmail")?.value.trim() || "";
    const message = document.getElementById("contactMessage")?.value.trim() || "";

    if (!name || !email || !message) return;

    try {
      await addDoc(collection(db, "contacts"), {
        userName: name,
        userEmail: email,
        message: message,
        createdAt: serverTimestamp()
      });

      contactMessageFeedback.style.color = "green";
      contactMessageFeedback.textContent = "✅ Message sent successfully!";
      contactForm.reset();
    } catch (err) {
      console.error(err);
      contactMessageFeedback.style.color = "red";
      contactMessageFeedback.textContent = "❌ Error sending message: " + err.message;
    }
  });
}

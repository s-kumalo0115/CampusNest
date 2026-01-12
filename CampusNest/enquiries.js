// enquiries.js – FIXED (with delete support)

import { auth, db } from "./firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const enquiriesList = document.getElementById("enquiriesList");
  const logoutBtn = document.getElementById("logoutBtn");

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      enquiriesList.innerHTML = "<p>Please log in to view your enquiries.</p>";
      return;
    }

    loadEnquiries(user.uid);
  });

  async function loadEnquiries(userId) {
    enquiriesList.innerHTML = "<p>Loading enquiries...</p>";

    try {
      const q = query(
        collection(db, "enquiries"),
        where("userId", "==", userId)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        enquiriesList.innerHTML = "<p>You have no enquiries.</p>";
        return;
      }

      enquiriesList.innerHTML = "";

      snapshot.forEach(docSnap => {
        const e = docSnap.data();
        const id = docSnap.id;

        const card = document.createElement("div");
        card.className = "enquiry-card";

        card.innerHTML = `
          <h3>${e.listingTitle || "-"}</h3>
          <p><strong>From:</strong> ${e.fromDate?.toDate().toLocaleDateString()}</p>
          <p><strong>To:</strong> ${e.toDate?.toDate().toLocaleDateString()}</p>
          <p><strong>Message:</strong> ${e.message || "-"}</p>
          <p><strong>Status:</strong> ${e.status || "pending"}</p>
          <button class="delete-enquiry-btn" data-id="${id}">
            ❌ Remove Enquiry
          </button>
        `;

        enquiriesList.appendChild(card);
      });

    } catch (err) {
      console.error(err);
      enquiriesList.innerHTML = "<p>❌ Failed to load enquiries.</p>";
    }
  }

  // DELETE enquiry (user side)
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".delete-enquiry-btn");
    if (!btn) return;

    const id = btn.dataset.id;
    if (!confirm("Remove this enquiry?")) return;

    try {
      await deleteDoc(doc(db, "enquiries", id));
      btn.closest(".enquiry-card").remove();
      alert("Enquiry removed.");
    } catch (err) {
      console.error(err);
      alert("Failed to remove enquiry.");
    }
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await signOut(auth);
      window.location.href = "index.html";
    });
  }
});

// enquiries.js – FIXED (dropdown + enquiries)

import { auth, db } from "../core/firebase.js";
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

  // Dropdown elements
  const userDropdown = document.getElementById("userDropdown");
  const usernameSpan = document.getElementById("username");
  const userNameTop = document.getElementById("userNameTop");
  const logoutBtn = document.getElementById("logoutBtn");

  async function loadUserDropdown(user) {
  userDropdown.style.display = "block";

  try {
    const userSnap = await getDocs(
      query(
        collection(db, "users"),
        where("__name__", "==", user.uid)
      )
    );

    if (!userSnap.empty) {
      const data = userSnap.docs[0].data();
      const displayName = data.name || user.displayName || "User";

      usernameSpan.textContent = displayName;
      
    } else {
      usernameSpan.textContent = "👤User";
      
    }
  } catch (err) {
    console.error("Dropdown load failed:", err);
    usernameSpan.textContent = "User";
    userNameTop.textContent = "User";
  }
}

  onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  await loadUserDropdown(user);
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

  // DELETE enquiry
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".delete-enquiry-btn");
    if (!btn) return;

    if (!confirm("Remove this enquiry?")) return;

    try {
      await deleteDoc(doc(db, "enquiries", btn.dataset.id));
      btn.closest(".enquiry-card").remove();
    } catch (err) {
      console.error(err);
      alert("Failed to remove enquiry.");
    }
  });

  // LOGOUT
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });

});

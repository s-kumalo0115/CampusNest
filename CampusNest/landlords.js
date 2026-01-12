// landlords.js
import { db } from './firebase.js'; // v10 modular import

document.addEventListener("DOMContentLoaded", async () => {

  if (typeof db === "undefined") {
    console.error("❌ Firestore is not defined. firebase.js did NOT load.");
    return;
  }

  const grid = document.getElementById("landlord-grid");
  grid.innerHTML = '<p style="grid-column:1/-1;color:#666;">Loading landlords...</p>';

  try {
    // Firestore v10 modular uses getDocs and collection
    const { collection, getDocs, query, where } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

    const landlordsCol = collection(db, "landlords");
    const snapshot = await getDocs(landlordsCol);

    if (snapshot.empty) {
      grid.innerHTML =
        '<p style="grid-column:1/-1;color:#666;">No landlords found.</p>';
      return;
    }

    let landlords = snapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }));

    // Safe sort: createdAt might not exist
    landlords.sort((a, b) => {
      const aTime = a.data.createdAt?.toMillis?.() || 0;
      const bTime = b.data.createdAt?.toMillis?.() || 0;
      return bTime - aTime; // newest first
    });

    // Count properties safely
    const propertyCounts = await Promise.all(
      landlords.map(async ld => {
        try {
          const listingsCol = collection(db, "listings");
          const q = query(listingsCol, where("landlordId", "==", ld.id));
          const snap = await getDocs(q);
          return snap.size;
        } catch (err) {
          console.warn("Property count error:", err);
          return 0;
        }
      })
    );

    grid.innerHTML = "";

    landlords.forEach((ld, index) => {
      const d = ld.data || {};
      const card = document.createElement("div");
      card.className = "card landlord-card";

      card.innerHTML = `
        <div class="img-wrap">
          <img src="${d.photoUrl || 'https://via.placeholder.com/600?text=No+Photo'}" />
        </div>

        <div class="card-body">
          <h3>${escapeHtml(d.name || "Unnamed Landlord")}</h3>
          <p style="color:#666;">${escapeHtml(d.city || "Unknown City")}</p>
          <p style="color:#444;">🏠 ${propertyCounts[index]} Properties</p>
          ${d.verified ? '<span class="verified">✔ Verified</span>' : ''}

          <div class="actions">
            <button class="btn secondary contact-btn" data-id="${ld.id}">Contact</button>
            <button class="btn view-properties-btn" data-id="${ld.id}">View Properties</button>
          </div>
        </div>`;
      
      grid.appendChild(card);
    });

    // Buttons
    grid.addEventListener("click", e => {
      const btn = e.target.closest("button");
      if (!btn) return;

      const id = btn.dataset.id;

      if (btn.classList.contains("contact-btn")) {
        window.location.href = `listing-details.html?landlordId=${id}`;
      } else if (btn.classList.contains("view-properties-btn")) {
        window.location.href = `listings.html?landlordId=${id}`;
      }
    });

  } catch (err) {
    console.error("❌ Error loading landlords:", err);
    grid.innerHTML = `<p style="color:red;">Failed to load landlords: ${err.message}</p>`;
  }
});


function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

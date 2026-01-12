// listings.js
import { db, auth } from './firebase.js';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {

  const listingContainer = document.getElementById("listing-container");
  const landlordInfoDiv = document.getElementById("landlord-info");
  const searchInput = document.getElementById("searchInput");

  if (!listingContainer || !landlordInfoDiv) return;

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  async function loadListings() {
    listingContainer.innerHTML =
      '<p style="grid-column:1/-1;color:#666;padding:12px;">Loading listings...</p>';

    try {
      const landlordId = getQueryParam("landlordId");
      let listingsQuery = collection(db, "listings");

      if (landlordId) {
        listingsQuery = query(listingsQuery, where("landlordId", "==", landlordId));
      }
      listingsQuery = query(listingsQuery, orderBy("createdAt", "desc"));

      const snapshot = await getDocs(listingsQuery);

      if (snapshot.empty) {
        listingContainer.innerHTML =
          '<p style="grid-column:1/-1;color:#666;padding:12px;">No listings found.</p>';
        return;
      }

      listingContainer.innerHTML = "";

      // If filtering by landlord, show landlord info
      if (landlordId) {
        const landlordSnap = await getDoc(doc(db, "landlords", landlordId));
        if (landlordSnap.exists()) {
          const ld = landlordSnap.data();
          const propertiesSnapshot = await getDocs(query(collection(db, "listings"), where("landlordId", "==", landlordId)));
          const propertiesCount = propertiesSnapshot.size;

          landlordInfoDiv.innerHTML = `
            <img src="${ld.photoUrl || 'https://via.placeholder.com/600x600?text=No+Photo'}" alt="${escapeHtml(ld.name)}">
            <h2>${escapeHtml(ld.name)}</h2>
            <p>🏙 ${escapeHtml(ld.city)}</p>
            <p>🏠 ${propertiesCount} ${propertiesCount === 1 ? "Property" : "Properties"}</p>
            ${ld.verified ? '<span class="verified">✔ Verified</span>' : ''}
          `;
          setTimeout(() => landlordInfoDiv.classList.add("visible"), 100);
        }
      }

      snapshot.forEach(docSnap => {
        const data = docSnap.data() || {};
        const title = data.title || "Untitled Listing";
        const location = data.location || "Unknown Location";
        const university = data.university || "Unknown University";
        const price = data.price ? `R${data.price}` : "Price N/A";
        const imageUrl = data.imageUrl || "https://via.placeholder.com/400x300?text=No+Image";
        const verified = data.verified === true;

        const card = document.createElement("div");
        card.className = "card";
        card.dataset.location = location.toLowerCase();
        card.dataset.university = university.toLowerCase();

        card.innerHTML = `
          <div class="img-wrap"><img src="${imageUrl}" alt="${escapeHtml(title)}"></div>
          <div class="card-body">
            <h3>${escapeHtml(title)}</h3>
            <div class="meta">
              <div>📍 ${escapeHtml(location)}</div>
              <div>🎓 ${escapeHtml(university)}</div>
              <div>💰 ${escapeHtml(price)}</div>
            </div>
            ${verified ? '<div class="verified">✔ <span>Verified</span></div>' : ''}
            <div class="actions">
              <button class="btn view-btn" data-id="${docSnap.id}">View Details</button>
            </div>
          </div>
        `;
        listingContainer.appendChild(card);
      });

      listingContainer.addEventListener("click", e => {
        const btn = e.target.closest(".view-btn");
        if (!btn) return;
        const listingId = btn.dataset.id;
        window.location.href = `listing-details.html?id=${listingId}`;
      });

    } catch (err) {
      console.error("Error loading listings:", err);
      listingContainer.innerHTML = `<p style="grid-column:1/-1;color:red;padding:12px;">
        Failed to load listings: ${err.message}
      </p>`;
    }
  }

  // Real-time search filter
  if (searchInput) {
    searchInput.addEventListener("input", e => {
      const filter = e.target.value.toLowerCase();
      const cards = listingContainer.querySelectorAll(".card");
      cards.forEach(card => {
        const location = card.dataset.location;
        const university = card.dataset.university;
        card.style.display =
          location.includes(filter) || university.includes(filter)
            ? "block"
            : "none";
      });
    });
  }

  // Load listings after auth check
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }
    loadListings();
  });

});

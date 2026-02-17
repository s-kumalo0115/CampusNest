// listings.js
import { db, auth } from './firebase.js';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {

  const listingContainer = document.getElementById("listing-container");
  const landlordInfoDiv = document.getElementById("landlord-info");
  const searchInput = document.getElementById("searchInput");

  if (!listingContainer || !landlordInfoDiv) return;

    let currentUser = null;

  // 🔐 AUTH STATE (SAME AS LANDLORDS)
  auth.onAuthStateChanged(user => {
    currentUser = user;
  });

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

  function applyUrlFilters() {
    const search = (getQueryParam("search") || "").toLowerCase();
    const min = Number(getQueryParam("min") || 0);
    const max = Number(getQueryParam("max") || 0);
    const beds = getQueryParam("beds");

    if (searchInput && search) {
      searchInput.value = search;
    }

    const cards = listingContainer.querySelectorAll(".card");
    cards.forEach(card => {
      const location = card.dataset.location || "";
      const university = card.dataset.university || "";
      const price = Number(card.dataset.price || 0);
      const bedrooms = card.dataset.bedrooms || "";

      let visible = true;

      if (search && !location.includes(search) && !university.includes(search)) visible = false;
      if (min && price < min) visible = false;
      if (max && price > max) visible = false;
      if (beds && beds !== bedrooms) visible = false;

      card.style.display = visible ? "block" : "none";
    });
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

      if (landlordId) {
        const landlordSnap = await getDoc(doc(db, "landlords", landlordId));
        if (landlordSnap.exists()) {
          const ld = landlordSnap.data();
          const propertiesSnapshot = await getDocs(
            query(collection(db, "listings"), where("landlordId", "==", landlordId))
          );

          const propertiesCount = propertiesSnapshot.size;

          landlordInfoDiv.innerHTML = `
            <img src="${ld.photoUrl || 'https://via.placeholder.com/600x600?text=No+Photo'}">
            <h2>${escapeHtml(ld.name)}</h2>
            <p>🏙 ${escapeHtml(ld.city)}</p>
            <p>🏠 ${propertiesCount} Properties</p>
            ${ld.verified ? '<span class="verified">✔ Verified</span>' : ''}
          `;
          setTimeout(() => landlordInfoDiv.classList.add("visible"), 100);
        }
      }

      snapshot.forEach(docSnap => {
        const data = docSnap.data() || {};
        const card = document.createElement("div");
        card.className = "card";

        card.dataset.location = (data.location || "").toLowerCase();
        card.dataset.university = (data.university || "").toLowerCase();
        card.dataset.price = data.price || 0;
        card.dataset.bedrooms = data.bedrooms || "";

        card.innerHTML = `
          <div class="img-wrap">
            <img src="${data.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}">
          </div>
          <div class="card-body">
            <h3>${escapeHtml(data.title || "Untitled Listing")}</h3>
            <div class="meta">
              <div>📍 ${escapeHtml(data.location || "-")}</div>
              <div>🎓 ${escapeHtml(data.university || "-")}</div>
              <div>💰 R${escapeHtml(data.price || 0)}</div>
            </div>
            ${data.verified ? '<div class="verified">✔ Verified</div>' : ''}
            <div class="actions">
              <button class="btn view-btn" data-id="${docSnap.id}">View Details</button>
            </div>
          </div>
        `;

        listingContainer.appendChild(card);
      });

      applyUrlFilters();

      listingContainer.addEventListener("click", e => {
        const btn = e.target.closest(".view-btn");
        if (!btn) return;

        if (!currentUser) {
          document.getElementById("authModal").style.display = "flex";
          return;
        }  

        window.location.href = `listing-details.html?id=${btn.dataset.id}`;
      });

    } catch (err) {
      console.error(err);
      listingContainer.innerHTML =
        `<p style="grid-column:1/-1;color:red;">Failed to load listings.</p>`;
    }
  }

  if (searchInput) {
    searchInput.addEventListener("input", applyUrlFilters);
  }

  // ✅ PUBLIC PAGE – LOAD IMMEDIATELY
  loadListings();

});


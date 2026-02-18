// listings.js
import { db, auth } from '../core/firebase.js';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {

  const listingContainer = document.getElementById("listing-container");
  const landlordInfoDiv = document.getElementById("landlord-info");
  const searchInput = document.getElementById("searchInput");
  const applySearchBtn = document.getElementById("applySearchBtn");

  if (!listingContainer || !landlordInfoDiv) return;

  let currentUser = null;

  auth.onAuthStateChanged(user => {
    currentUser = user;
  });

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;"
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  function extractNumber(value) {
    const clean = String(value ?? "").replace(/[^\d.]/g, "");
    return Number(clean || 0);
  }

  function applyFilters() {
    const search = (searchInput?.value || getQueryParam("search") || "").toLowerCase().trim();
    const min = Number(getQueryParam("min") || 0);
    const max = Number(getQueryParam("max") || 0);
    const beds = String(getQueryParam("beds") || "").trim();

    const cards = listingContainer.querySelectorAll(".card");
    cards.forEach(card => {
      const location = card.dataset.location || "";
      const university = card.dataset.university || "";
      const price = extractNumber(card.dataset.price || 0);
      const bedrooms = extractNumber(card.dataset.bedrooms || 0);

      let visible = true;

      if (search && !location.includes(search) && !university.includes(search)) visible = false;
      if (min && price < min) visible = false;
      if (max && price > max) visible = false;
      if (beds) {
        const bedTarget = extractNumber(beds);
        if (bedTarget >= 4) {
          if (bedrooms < 4) visible = false;
        } else if (bedrooms !== bedTarget) {
          visible = false;
        }
      }

      card.style.display = visible ? "block" : "none";
    });
  }

  function initSearchFromUrl() {
    if (searchInput) searchInput.value = getQueryParam("search") || "";
  }

  async function loadListings() {
    listingContainer.innerHTML =
      '<p style="grid-column:1/-1;color:#666;padding:12px;">Loading listings...</p>';

    try {
      const landlordId = getQueryParam("landlordId");
      let listingsRef = collection(db, "listings");

      if (landlordId) {
        listingsRef = query(listingsRef, where("landlordId", "==", landlordId));
      }

      const snapshot = await getDocs(listingsRef);

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
            <div class="landlord-header-card">
              <img class="landlord-profile" src="${ld.photoUrl || 'https://via.placeholder.com/600x600?text=No+Photo'}" alt="${escapeHtml(ld.name || 'Landlord')}">
              <h2>${escapeHtml(ld.name)}</h2>
              <p>📍 ${escapeHtml(ld.city || 'Unknown City')}</p>
              <p>🏠 ${propertiesCount} Properties</p>
              ${ld.verified ? '<span class="verified">✔ Verified Landlord</span>' : ''}
            </div>
          `;
          setTimeout(() => landlordInfoDiv.classList.add("visible"), 100);
        }
      } else {
        landlordInfoDiv.innerHTML = "";
        landlordInfoDiv.classList.remove("visible");
      }

      const docs = snapshot.docs.slice().sort((a, b) => {
        const aSec = a.data()?.createdAt?.seconds || 0;
        const bSec = b.data()?.createdAt?.seconds || 0;
        return bSec - aSec;
      });

      docs.forEach(docSnap => {
        const data = docSnap.data() || {};
        const card = document.createElement("div");
        card.className = "card";

        card.dataset.location = (data.location || "").toLowerCase();
        card.dataset.university = (data.university || "").toLowerCase();
        card.dataset.price = data.price || 0;
        card.dataset.bedrooms = data.bedrooms || 0;

        card.innerHTML = `
          <div class="img-wrap">
            <img src="${data.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}">
          </div>
          <div class="card-body">
            <h3>${escapeHtml(data.title || "Untitled Listing")}</h3>
            <div class="meta">
              <div>📍 ${escapeHtml(data.location || "-")}</div>
              <div>🎓 ${escapeHtml(data.university || "-")}</div>
              <div>💰 R${escapeHtml(data.price || 0)} pm</div>
            </div>
            ${data.verified ? '<div class="verified">✔ Verified</div>' : ''}
            <div class="actions">
              <button class="btn view-btn" data-id="${docSnap.id}">View Details</button>
            </div>
          </div>
        `;

        listingContainer.appendChild(card);
      });

      initSearchFromUrl();
      applyFilters();

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

  if (searchInput) searchInput.addEventListener("input", applyFilters);
  if (applySearchBtn) applySearchBtn.addEventListener("click", applyFilters);

  // ✅ PUBLIC PAGE – LOAD IMMEDIATELY
  loadListings();

});
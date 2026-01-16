// admin.js
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

(function () {

  

  // =========================
  // AUTH CHECK
  // =========================
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    const adminDoc = await getDoc(doc(db, "admins", user.uid));
    if (!adminDoc.exists()) {
      alert("Access denied – not an admin.");
      await signOut(auth);
      window.location.href = "index.html";
      return;
    }

    initAdmin();
  });

  function initAdmin() {

    // =========================
    // LOGOUT
    // =========================
    ["logoutBtn", "sidebarLogoutBtn"].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.onclick = () => signOut(auth).then(() => location.href = "index.html");
    });

    // =========================
    // SIDEBAR NAV FILTER
    // =========================
    const navLinks = document.querySelectorAll(".sidebar a[data-nav]");
    const sections = document.querySelectorAll("[data-section]");

    function showSection(section) {
      sections.forEach(sec => {
        sec.style.display = sec.dataset.section === section || section === "dashboard"
          ? "block"
          : "none";
      });

      navLinks.forEach(l => l.classList.remove("active"));
      document.querySelector(`.sidebar a[data-nav="${section}"]`)?.classList.add("active");
    }

    showSection("dashboard");

    navLinks.forEach(link => {
      link.addEventListener("click", e => {
        e.preventDefault();
        showSection(link.dataset.nav);
      });
    });

    // =========================
    // DOM REFERENCES
    // =========================
    const listingsBody  = document.querySelector("#listingsTable tbody"); 
    const landlordsBody = document.querySelector("#landlordsTable tbody");
    const usersBody     = document.querySelector("#usersTable tbody");
    const enquiriesBody = document.querySelector("#enquiriesTable tbody");
    const messagesBody  = document.querySelector("#messagesTable tbody");
    const unreadBadge   = document.getElementById("unreadMessagesBadge");

    // =========================
    // MESSAGES (CONTACTS)
    // =========================
    const messagesQuery = query(collection(db, "contacts"), orderBy("createdAt", "desc"));

    onSnapshot(messagesQuery, snap => {
      messagesBody.innerHTML = "";
      let unread = 0;

      snap.forEach(docSnap => {
        const d = docSnap.data();
        if (!d.read) unread++;

        messagesBody.innerHTML += `
          <tr>
            <td>${escapeHtml(d.userName)}</td>
            <td>${escapeHtml(d.userEmail)}</td>
            <td>${escapeHtml(d.message)}</td>
            <td>${d.createdAt?.toDate?.().toLocaleString() || "-"}</td>
            <td>
              <button class="btn-action mark-read-btn" data-id="${docSnap.id}">
                ${d.read ? "Mark Unread" : "Mark Read"}
              </button>
              <a class="btn-action btn-edit" href="mailto:${d.userEmail}?subject=CampusNest Support">
                Email
              </a>
              <button class="btn-action btn-delete-contact" data-id="${docSnap.id}">
                Delete
              </button>
            </td>
          </tr>`;
      });

      unreadBadge.style.display = unread ? "inline-block" : "none";
      unreadBadge.textContent = unread;
    });

    // =========================
    // ENQUIRIES
    // =========================
    const enquiriesQuery = query(collection(db, "enquiries"), orderBy("createdAt", "desc"));

    onSnapshot(enquiriesQuery, snap => {
      enquiriesBody.innerHTML = "";

      snap.forEach(docSnap => {
        const d = docSnap.data();
        enquiriesBody.innerHTML += `
          <tr>
            <td>${escapeHtml(d.userName)}</td>
            <td>${escapeHtml(d.userEmail)}</td>
            <td>
             ${escapeHtml((d.message || "").slice(0, 80))}
             ${(d.message && d.message.length > 80) ? "…" : ""}
           </td>
            <td>${d.createdAt?.toDate?.().toLocaleString() || "-"}</td>
            <td>
              <button class="btn-action btn-view-enquiry" data-id="${docSnap.id}">View</button>
              <button class="btn-action btn-delete-enquiry" data-id="${docSnap.id}">Delete</button>
            </td>
          </tr>`;
      });
    });

    enquiriesBody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === "view") {
    const docSnap = await getDoc(doc(db, "enquiries", id));
    if (docSnap.exists()) {
      const d = docSnap.data();
      alert(
        `From: ${d.userName || "-"}\n` +
        `Email: ${d.userEmail || "-"}\n\n` +
        `${d.message || "-"}`
      );
    }
  }

  if (action === "delete") {
    if (confirm("Delete this enquiry?")) {
      await deleteDoc(doc(db, "enquiries", id));
    }
  }
});

// =========================
// LISTINGS (ADMIN)
// =========================

const landlordCache = {};

// LOAD LISTINGS
async function loadListings() {
  listingsBody.innerHTML = "";

  const snapshot = await getDocs(collection(db, "listings"));

  for (const docSnap of snapshot.docs) {
    const listing = docSnap.data();
    const listingId = docSnap.id;

    // ---------- LANDLORD RESOLVE ----------
    let landlordName = "Unknown";

    if (listing.landlordId) {
      if (!landlordCache[listing.landlordId]) {
        const landlordRef = doc(db, "landlords", listing.landlordId);
        const landlordSnap = await getDoc(landlordRef);
        landlordCache[listing.landlordId] = landlordSnap.exists()
          ? landlordSnap.data()
          : null;
      }

      const landlord = landlordCache[listing.landlordId];
      landlordName = landlord?.name || landlord?.email || "Unknown";
    }

    // ---------- STATUS ----------
    const status = listing.status || "Pending";
    const statusClass =
      status === "Active" ? "status-active" : "status-pending";

    // ---------- ROW ----------
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${listingId}</td>
      <td>${listing.title || listing.property || "—"}</td>
      <td>${landlordName}</td>
      <td>
        <span class="status-badge ${statusClass}">
          ${status}
        </span>
      </td>
      <td>
        <button class="btn-action btn-edit" data-id="${listingId}">
          Edit
        </button>
        <button class="btn-action btn-delete" data-id="${listingId}">
          Delete
        </button>
      </td>
    `;

    listingsBody.appendChild(tr);
  }
}

// CLICK HANDLERS (EDIT / DELETE)
listingsBody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const id = btn.dataset.id;
  if (!id) return;

  // ---------- EDIT = TOGGLE STATUS ----------
  if (btn.classList.contains("btn-edit")) {
    const ref = doc(db, "listings", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const current = snap.data().status || "Pending";
    const next = current === "Active" ? "Pending" : "Active";

    if (!confirm(`Change status to "${next}"?`)) return;

    await updateDoc(ref, { status: next });
    loadListings();
  }

  // ---------- DELETE ----------
  if (btn.classList.contains("btn-delete")) {
    if (!confirm("Delete this listing?")) return;
    await deleteDoc(doc(db, "listings", id));
    loadListings();
  }
});

// INITIAL LOAD
loadListings();
  
    // =========================
    // LANDLORDS
    // =========================
    onSnapshot(query(collection(db,"landlords"), orderBy("name")), snap => {
      landlordsBody.innerHTML = "";
      snap.forEach(d => {
        const v = d.data();
        landlordsBody.innerHTML += `
          <tr>
            <td>${escapeHtml(v.name)}</td>
            <td>${escapeHtml(v.email)}</td>
            <td>${v.verified ? "Verified" : "Unverified"}</td>
            <td>
              <button class="btn-action btn-verify" data-id="${d.id}" data-state="${v.verified}">
                ${v.verified ? "Unverify" : "Verify"}
              </button>
              <button class="btn-action btn-delete-landlord" data-id="${d.id}">Delete</button>
            </td>
          </tr>`;
      });
    });

    // =========================
    // USERS
    // =========================
    onSnapshot(query(collection(db,"users"), orderBy("name")), snap => {
      usersBody.innerHTML = "";
      snap.forEach(d => {
        const v = d.data();
        usersBody.innerHTML += `
          <tr>
            <td>${escapeHtml(v.name)}</td>
            <td>${escapeHtml(v.email)}</td>
            <td>
              <button class="btn-action btn-delete-user" data-id="${d.id}">Delete</button>
            </td>
          </tr>`;
      });
    });

    // =========================
    // GLOBAL ACTION HANDLERS
    // =========================
document.addEventListener("click", async (e) => {

  /* ======================
     CONTACT MESSAGES
  ====================== */
  const markReadBtn = e.target.closest(".mark-read-btn");
  if (markReadBtn) {
    const ref = doc(db, "contacts", markReadBtn.dataset.id);
    const snap = await getDoc(ref);
    await updateDoc(ref, { read: !snap.data().read });
    return;
  }

  const delContactBtn = e.target.closest(".btn-delete-contact");
  if (delContactBtn) {
    if (!confirm("Delete message?")) return;
    await deleteDoc(doc(db, "contacts", delContactBtn.dataset.id));
    return;
  }

  /* ======================
     ENQUIRIES (FIXED)
  ====================== */
  const viewEnquiryBtn = e.target.closest(".btn-view-enquiry");
  if (viewEnquiryBtn) {
    const snap = await getDoc(doc(db, "enquiries", viewEnquiryBtn.dataset.id));
    if (!snap.exists()) return alert("Enquiry not found.");

    const d = snap.data();
   alert(
  `From: ${d.userName || "-"}\n` +
  `Email: ${d.userEmail || "-"}\n\n` +
  `${d.message || "-"}`
);

    return;
  }

  const delEnquiryBtn = e.target.closest(".btn-delete-enquiry");
  if (delEnquiryBtn) {
    if (!confirm("Delete enquiry?")) return;
    await deleteDoc(doc(db, "enquiries", delEnquiryBtn.dataset.id));
    return;
  }

  /* ======================
     LANDLORDS
  ====================== */
  const verifyBtn = e.target.closest(".btn-verify");
  if (verifyBtn) {
    const cur = verifyBtn.dataset.state === "true";
    await updateDoc(
      doc(db, "landlords", verifyBtn.dataset.id),
      { verified: !cur }
    );
    return;
  }

  const delLandlordBtn = e.target.closest(".btn-delete-landlord");
  if (delLandlordBtn) {
    if (!confirm("Delete landlord?")) return;
    await deleteDoc(doc(db, "landlords", delLandlordBtn.dataset.id));
    return;
  }

  /* ======================
     USERS
  ====================== */
  const delUserBtn = e.target.closest(".btn-delete-user");
  if (delUserBtn) {
    if (!confirm("Delete user?")) return;
    await deleteDoc(doc(db, "users", delUserBtn.dataset.id));
  }
});


    // =========================
    // STATS
    // =========================
    async function loadStats() {
      const [l,la,u,e,m] = await Promise.all([
        getDocs(collection(db,"listings")),
        getDocs(collection(db,"landlords")),
        getDocs(collection(db,"users")),
        getDocs(collection(db,"enquiries")),
        getDocs(collection(db,"contacts"))
      ]);
      statListings.textContent  = l.size;
      statLandlords.textContent = la.size;
      statUsers.textContent     = u.size;
      statEnquiries.textContent = e.size;
      statMessages.textContent  = m.size;
    }
    loadStats();
  }

  function escapeHtml(s="") {
    return s.replace(/[&<>"]/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"
    })[c]);
  }

})();

// admin.js
import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
  onSnapshot,
  updateDoc,
  deleteDoc,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

(function () {

  // AUTH CHECK (MODULAR FIX)
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

    initAdmin(user);
  });

  function initAdmin(adminUser) {
    console.log("Admin loaded:", adminUser.email);

    const topLogoutBtn = document.getElementById("logoutBtn");
    const sidebarLogoutBtn = document.getElementById("sidebarLogoutBtn");

    [topLogoutBtn, sidebarLogoutBtn].forEach(btn => {
      if (!btn) return;
      btn.addEventListener("click", () =>
        signOut(auth).then(() => window.location.href = "index.html")
      );
    });

    const listingsBody = document.querySelector("#listingsTable tbody");
    const landlordsBody = document.querySelector("#landlordsTable tbody");
    const usersBody = document.querySelector("#usersTable tbody");
    const contactsBody = document.querySelector("#contactsTable tbody");

    function escapeHtml(s) {
      return String(s || "")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;");
    }

    // STATS
    async function loadStats() {
      const [listingsSnap, landlordsSnap, usersSnap, enquiriesSnap] = await Promise.all([
        getDocs(collection(db, "listings")),
        getDocs(collection(db, "landlords")),
        getDocs(collection(db, "users")),
        getDocs(collection(db, "enquiries"))
      ]);

      document.querySelector(".dashboard-cards .card:nth-child(1) .value").textContent = listingsSnap.size;
      document.querySelector(".dashboard-cards .card:nth-child(2) .value").textContent = landlordsSnap.size;
      document.querySelector(".dashboard-cards .card:nth-child(3) .value").textContent = usersSnap.size;
      document.querySelector(".dashboard-cards .card:nth-child(4) .value").textContent = enquiriesSnap.size;
    }

    // LISTINGS
    const listingsQuery = query(
      collection(db, "listings"),
      orderBy("createdAt", "desc")
    );

    onSnapshot(listingsQuery, snapshot => {
      if (!listingsBody) return;
      listingsBody.innerHTML = "";

      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${escapeHtml(docSnap.id)}</td>
          <td>${escapeHtml(d.title || "-")}</td>
          <td>${escapeHtml(d.landlordName || "-")}</td>
          <td>${escapeHtml(d.status || "Pending")}</td>
          <td>
            <button class="btn-action btn-edit" data-id="${escapeHtml(docSnap.id)}">Edit</button>
            <button class="btn-action btn-delete" data-id="${escapeHtml(docSnap.id)}">Delete</button>
          </td>
        `;
        listingsBody.appendChild(tr);
      });
    });

    // LISTINGS EDIT / DELETE
    document.addEventListener("click", async (e) => {
      const btn = e.target.closest("#listingsTable .btn-edit, #listingsTable .btn-delete");
      if (!btn) return;

      const id = btn.dataset.id;

      if (btn.classList.contains("btn-edit")) {
        const newTitle = prompt("New title (blank to skip):");
        const newStatus = prompt("New status (pending/active/sold) (blank to skip):");
        const updateObj = {};
        if (newTitle) updateObj.title = newTitle;
        if (newStatus) updateObj.status = newStatus;

        if (Object.keys(updateObj).length > 0) {
          await updateDoc(doc(db, "listings", id), updateObj);
          alert("Listing updated.");
        }
      }

      if (btn.classList.contains("btn-delete")) {
        if (!confirm("Delete this listing?")) return;
        await deleteDoc(doc(db, "listings", id));
        alert("Listing deleted.");
      }
    });

    // LANDLORDS
    const landlordsQuery = query(
      collection(db, "landlords"),
      orderBy("name")
    );

    onSnapshot(landlordsQuery, snapshot => {
      if (!landlordsBody) return;
      landlordsBody.innerHTML = "";

      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        const verifiedText = d.verified ? "Verified" : "Unverified";
        const toggleLabel = d.verified ? "Unverify" : "Verify";

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${escapeHtml(d.name || "-")}</td>
          <td>${escapeHtml(d.email || "-")}</td>
          <td>${verifiedText}</td>
          <td>
            <button class="btn-action btn-verify"
              data-id="${docSnap.id}"
              data-verified="${d.verified}">
              ${toggleLabel}
            </button>
            <button class="btn-action btn-delete-landlord" data-id="${docSnap.id}">
              Delete
            </button>
          </td>
        `;
        landlordsBody.appendChild(tr);
      });
    });

    // LANDLORD VERIFY / DELETE
    document.addEventListener("click", async (e) => {
      const btnVerify = e.target.closest("#landlordsTable .btn-verify");
      if (btnVerify) {
        const id = btnVerify.dataset.id;
        const cur = btnVerify.dataset.verified === "true";
        await updateDoc(doc(db, "landlords", id), { verified: !cur });
        alert("Landlord verified status updated.");
      }

      const btnDel = e.target.closest("#landlordsTable .btn-delete-landlord");
      if (btnDel) {
        const id = btnDel.dataset.id;
        if (!confirm("Delete this landlord?")) return;
        await deleteDoc(doc(db, "landlords", id));
        alert("Landlord deleted.");
      }
    });

    // USERS
    const usersQuery = query(
      collection(db, "users"),
      orderBy("name")
    );

    onSnapshot(usersQuery, snapshot => {
      if (!usersBody) return;
      usersBody.innerHTML = "";

      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${escapeHtml(d.name || "-")}</td>
          <td>${escapeHtml(d.email || "-")}</td>
          <td>
            <button class="btn-action btn-delete-user" data-id="${docSnap.id}">
              Delete
            </button>
          </td>
        `;
        usersBody.appendChild(tr);
      });
    });

    document.addEventListener("click", async (e) => {
      const btnDelUser = e.target.closest("#usersTable .btn-delete-user");
      if (!btnDelUser) return;

      const id = btnDelUser.dataset.id;
      if (!confirm("Delete this user document?")) return;

      await deleteDoc(doc(db, "users", id));
      alert("User document deleted.");
    });

    // ENQUIRIES
    const enquiriesQuery = query(
      collection(db, "enquiries"),
      orderBy("createdAt", "desc")
    );

    onSnapshot(enquiriesQuery, snapshot => {
      if (!contactsBody) return;
      contactsBody.innerHTML = "";

      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        const dateText = d.createdAt?.toDate?.().toLocaleString() || "-";

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${escapeHtml(d.userName || "-")}</td>
          <td>${escapeHtml(d.userEmail || "-")}</td>
          <td>${escapeHtml((d.message || "").slice(0,80))}${d.message?.length > 80 ? "…" : ""}</td>
          <td>${escapeHtml(dateText)}</td>
          <td>
            <button class="btn-action btn-view-enquiry" data-id="${docSnap.id}">View</button>
            <button class="btn-action btn-delete-enquiry" data-id="${docSnap.id}">Delete</button>
          </td>
        `;
        contactsBody.appendChild(tr);
      });
    });

    // ENQUIRIES VIEW / DELETE
    document.addEventListener("click", async (e) => {
      const btnView = e.target.closest("#contactsTable .btn-view-enquiry");
      if (btnView) {
        const id = btnView.dataset.id;
        const docSnap = await getDoc(doc(db, "enquiries", id));
        if (!docSnap.exists()) {
          alert("Enquiry not found.");
          return;
        }
        const d = docSnap.data();
        alert(`From: ${d.userName || "-"} <${d.userEmail || "-"}>\n\n${d.message || "-"}`);
      }

      const btnDel = e.target.closest("#contactsTable .btn-delete-enquiry");
      if (btnDel) {
        const id = btnDel.dataset.id;
        if (!confirm("Delete this enquiry?")) return;
        await deleteDoc(doc(db, "enquiries", id));
        alert("Enquiry deleted.");
      }
    });

    // INITIAL LOAD
    loadStats();
  }

})();

// profile.js
import { auth, db } from '../core/firebase.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {

  const userDropdown = document.getElementById("userDropdown");
  const usernameSpan = document.getElementById("username");
  const userNameTop = document.getElementById("userNameTop");
  const logoutBtn = document.getElementById("logoutBtn");

  const profileNameInput = document.getElementById("profileName");
  const profileEmailInput = document.getElementById("profileEmail");
  const profilePhoneInput = document.getElementById("profilePhone");
  const profileCampusInput = document.getElementById("profileCampus");

  const detailName = document.getElementById("detailName");
  const detailEmail = document.getElementById("detailEmail");
  const detailPhone = document.getElementById("detailPhone");
  const detailCampus = document.getElementById("detailCampus");

  const profileForm = document.getElementById("profileForm");
  const profileMessage = document.getElementById("profileMessage");

  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    // Show dropdown
    userDropdown.style.display = "block";
    
    const userId = user.uid;
    const email = user.email;

    profileEmailInput.value = email;
    detailEmail.innerText = email;

    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
  const data = userDoc.data();

  const displayName = data.name || user.displayName || "User";

  usernameSpan.textContent = displayName;


  profileNameInput.value = data.name || "";
  profilePhoneInput.value = data.phone || "";
  profileCampusInput.value = data.campus || "";

  detailName.innerText = data.name || "-";
  detailPhone.innerText = data.phone || "-";
  detailCampus.innerText = data.campus || "-";
}

    } catch (err) {
      console.error("Profile load error:", err);
    }

    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = profileNameInput.value.trim();
      const phone = profilePhoneInput.value.trim();
      const campus = profileCampusInput.value.trim();

      try {
        await setDoc(
          doc(db, "users", userId),
          { email, name, phone, campus },
          { merge: true }
        );

        profileMessage.innerText = "✅ Profile updated successfully!";

        detailName.innerText = name || "-";
        detailPhone.innerText = phone || "-";
        detailCampus.innerText = campus || "-";
      } catch (err) {
        console.error("Save error:", err);
        profileMessage.innerText = "❌ Failed to save profile.";
      }
    });

    logoutBtn.addEventListener("click", async () => {
      await auth.signOut();
      window.location.href = "index.html";
    });

  });

});

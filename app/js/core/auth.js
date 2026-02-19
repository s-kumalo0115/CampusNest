

// auth.js – FULLY FIXED (Google Sign-In + Logout)
import { auth, db } from "./firebase.js";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ===========================
   INIT
   =========================== */
function initAuth() {

  const authModal = document.getElementById("authModal");
  const authBtn = document.getElementById("authBtn");
  const authClose = document.getElementById("authClose");

  const signInForm = document.getElementById("signInForm");
  const signUpForm = document.getElementById("signUpForm");

  const signInMessage = document.getElementById("signInMessage");
  const signUpMessage = document.getElementById("signUpMessage");

  const googleSignInBtn = document.getElementById("googleSignInBtn");
  const googleSignUpBtn = document.getElementById("googleSignUpBtn");

  const adminSignInBtn = document.getElementById("adminSignInBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  const authContainer = document.getElementById("authContainer");
  const userDropdown = document.getElementById("userDropdown");
  const userMenuBtn = document.getElementById("userMenuBtn");
  const dropdownMenu = userDropdown?.querySelector(".dropdown-menu");

  const provider = new GoogleAuthProvider();

  const DEMO_ADMIN_EMAIL = "s.kumalo0115@gmail.com";
  const DEMO_ADMIN_PASSWORD = "Admin123!";

  const showMessage = (el, msg, color = "red") => {
    if (!el) return;
    el.textContent = msg || "";
    el.style.color = color;
  };

  const ensureProfileIcon = () => {
    if (!userMenuBtn) return;
    if (userMenuBtn.querySelector(".user-btn-icon")) return;

    const icon = document.createElement("span");
    icon.className = "user-btn-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "👤";
    userMenuBtn.prepend(icon);
  };

  const closeUserDropdown = () => {
    if (!userDropdown) return;
    userDropdown.classList.remove("is-open");
    if (userMenuBtn) {
      userMenuBtn.setAttribute("aria-expanded", "false");
    }
  };

  const openUserDropdown = () => {
    if (!userDropdown) return;
    userDropdown.classList.add("is-open");
    if (userMenuBtn) {
      userMenuBtn.setAttribute("aria-expanded", "true");
    }
  };

  /* ===========================
   AUTH TABS (SIGN IN / SIGN UP)
   =========================== */
const signInTab = document.getElementById("signInTab");
const signUpTab = document.getElementById("signUpTab");

if (signInTab && signUpTab && signInForm && signUpForm) {
  signInTab.addEventListener("click", () => {
    signInTab.classList.add("active");
    signUpTab.classList.remove("active");

    signInForm.style.display = "block";
    signUpForm.style.display = "none";

    showMessage(signInMessage, "");
    showMessage(signUpMessage, "");
  });

  signUpTab.addEventListener("click", () => {
    signUpTab.classList.add("active");
    signInTab.classList.remove("active");

    signUpForm.style.display = "block";
    signInForm.style.display = "none";

    showMessage(signInMessage, "");
    showMessage(signUpMessage, "");
  });
}


  /* ===========================
     MODAL
     =========================== */
  if (authBtn && authModal) {
    authBtn.addEventListener("click", () => {
      authModal.style.display = "flex";
      showMessage(signInMessage, "");
      showMessage(signUpMessage, "");
    });
  }

  if (authClose && authModal) {
    authClose.addEventListener("click", () => {
      authModal.style.display = "none";
    });
  }

  window.addEventListener("click", e => {
    if (e.target === authModal) {
      authModal.style.display = "none";
    }
  });

  /* ===========================
     SIGN UP (EMAIL)
     =========================== */
  if (signUpForm) {
    signUpForm.addEventListener("submit", async e => {
      e.preventDefault();

      const name = document.getElementById("signUpName")?.value || "";
      const email = document.getElementById("signUpEmail")?.value || "";
      const password = document.getElementById("signUpPassword")?.value || "";

      if (!name || !email || !password) {
        showMessage(signUpMessage, "Fill all fields");
        return;
      }

      try {
        const uc = await createUserWithEmailAndPassword(auth, email, password);

        await setDoc(doc(db, "users", uc.user.uid), {
          name,
          email,
          createdAt: serverTimestamp()
        });

        await updateProfile(uc.user, { displayName: name });

        showMessage(signUpMessage, "Account created", "green");
        setTimeout(() => window.location.href = "profile.html", 800);
      } catch {
        showMessage(signUpMessage, "Sign up failed");
      }
    });
  }

  /* ===========================
     SIGN IN (EMAIL)
     =========================== */
  if (signInForm) {
    signInForm.addEventListener("submit", async e => {
      e.preventDefault();

      const email = document.getElementById("signInEmail")?.value || "";
      const password = document.getElementById("signInPassword")?.value || "";

      if (!email || !password) {
        showMessage(signInMessage, "Enter email & password");
        return;
      }

      try {
  await signInWithEmailAndPassword(auth, email, password);

  // ✅ Success: close modal & clear message
  showMessage(signInMessage, "", "green");
  if (authModal) authModal.style.display = "none";

} catch (err) {
  console.error("Login error:", err);
  showMessage(signInMessage, "Login failed");
}
    });
  }

  /* ===========================
     GOOGLE SIGN-IN (USER ONLY)
     =========================== */
  const googleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Ensure user document exists
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        await setDoc(userRef, {
          name: user.displayName || "",
          email: user.email,
          createdAt: serverTimestamp()
        });
      }

      if (authModal) authModal.style.display = "none";
      

    } catch (err) {
      console.error("Google sign-in error:", err);
      alert("Google sign-in failed");
    }
  };

  if (googleSignInBtn) googleSignInBtn.addEventListener("click", googleLogin);
  if (googleSignUpBtn) googleSignUpBtn.addEventListener("click", googleLogin);

  /* ===========================
     ADMIN LOGIN
     =========================== */
  if (adminSignInBtn) {
    adminSignInBtn.addEventListener("click", async () => {
      const email = document.getElementById("signInEmail")?.value || "";
      const password = document.getElementById("signInPassword")?.value || "";

      if (!email || !password) {
        showMessage(signInMessage, "Enter admin credentials");
        return;
      }

      try {
        const uc = await signInWithEmailAndPassword(auth, email, password);
        const adminDoc = await getDoc(doc(db, "admins", uc.user.uid));

        if (adminDoc.exists()) {
          window.location.href = "admin.html";
        } else {
          await signOut(auth);
          showMessage(signInMessage, "Not an admin");
        }
      } catch {
        showMessage(signInMessage, "Admin login failed");
      }
    });
  }

  /* ===========================
     LOGOUT
     =========================== */
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        closeUserDropdown();
        await signOut(auth);
        window.location.href = "index.html";
      } catch (err) {
        console.error("Logout failed", err);
      }
    });
  }

  if (userMenuBtn && dropdownMenu) {
    ensureProfileIcon();
    userMenuBtn.setAttribute("aria-haspopup", "menu");
    userMenuBtn.setAttribute("aria-expanded", "false");

    userMenuBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (userDropdown?.classList.contains("is-open")) {
        closeUserDropdown();
      } else {
        openUserDropdown();
      }
    });

    dropdownMenu.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    document.addEventListener("click", (event) => {
      if (!userDropdown?.contains(event.target)) {
        closeUserDropdown();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeUserDropdown();
      }
    });
  }

  /* ===========================
     AUTH STATE UI
     =========================== */
  onAuthStateChanged(auth, user => {
    if (!userDropdown) return;

    if (!user) {
      if (authContainer) authContainer.style.display = "block";
      userDropdown.style.display = "none";
      closeUserDropdown();
      return;
    }

    if (authContainer) authContainer.style.display = "none";
    userDropdown.style.display = "block";
    ensureProfileIcon();

    const name = user.displayName || user.email?.split("@")[0] || "User";

    const usernameEl = document.getElementById("username");
     if (usernameEl) usernameEl.textContent = name;

    const userNameTopEl = document.getElementById("userNameTop");
    if (userNameTopEl) userNameTopEl.textContent = name;
  });
}

/* SAFE LOAD */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAuth);
} else {
  initAuth();
}


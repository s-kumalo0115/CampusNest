

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
  signInWithRedirect,
  getRedirectResult,
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
  provider.setCustomParameters({ prompt: "select_account" });

  const showMessage = (el, msg, color = "red") => {
    if (!el) return;
    el.textContent = msg || "";
    el.style.color = color;
    };

 const normalizeAuthError = (err) => {
    const code = err?.code || "";
    if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
      return "Incorrect email or password.";
    }
    if (code.includes("email-already-in-use")) {
      return "That email is already registered.";
    }
    if (code.includes("weak-password")) {
      return "Password is too weak (minimum 6 characters).";
    }
    if (code.includes("popup-closed-by-user")) {
      return "Google popup was closed before sign-in completed.";
    }
    if (code.includes("popup-blocked")) {
      return "Popup blocked by browser. Please allow popups and try again.";
    }
    if (code.includes("network-request-failed")) {
      return `Firebase auth is blocked for this site (${window.location.hostname}). In Firebase Console: Authentication → Settings → Authorized domains, add this exact domain. Then in Authentication → Sign-in method, enable Email/Password and Google.`;
    }
    if (code.includes("unauthorized-domain")) {
      return `Domain not authorized: ${window.location.hostname}. Fix: Firebase Console → Authentication → Settings → Authorized domains → Add domain. Then save and redeploy.`;
    }
    if (code.includes("operation-not-supported-in-this-environment")) {
      return "This browser blocked popup sign-in. Retrying with Google redirect...";
    }
    return err?.message || "Authentication failed. Please try again.";
  };

  const withRetry = async (fn, retries = 2) => {
    let lastError;
    for (let i = 0; i <= retries; i += 1) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (!(err?.code || "").includes("network-request-failed") || i === retries) {
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, 350 * (i + 1)));
      }
    }
    throw lastError;
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
        const uc = await withRetry(() => createUserWithEmailAndPassword(auth, email, password));

        await setDoc(doc(db, "users", uc.user.uid), {
          name,
          email,
          createdAt: serverTimestamp()
        });

        await updateProfile(uc.user, { displayName: name });

        showMessage(signUpMessage, "Account created", "green");
        setTimeout(() => window.location.href = "profile.html", 800);
      } catch (err) {
        showMessage(signUpMessage, normalizeAuthError(err));
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
        await withRetry(() => signInWithEmailAndPassword(auth, email, password));
        showMessage(signInMessage, "Signed in successfully.", "green");
        if (authModal) authModal.style.display = "none";
      } catch (err) {
        console.error("Login error:", err);
        showMessage(signInMessage, normalizeAuthError(err));
      }
    });
  }

  /* ===========================
     GOOGLE SIGN-IN (USER ONLY)
     =========================== */
   const ensureUserProfileDoc = async (user) => {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await setDoc(userRef, {
        name: user.displayName || "",
        email: user.email || "",
        createdAt: serverTimestamp()
      });
    }
  };
  const googleLogin = async () => {
    showMessage(signInMessage, "");
    showMessage(signUpMessage, "");

    try {
      const result = await withRetry(() => signInWithPopup(auth, provider), 1);
      await ensureUserProfileDoc(result.user);
      if (authModal) authModal.style.display = "none";
      showMessage(signInMessage, "Google sign-in successful.", "green");
    } catch (err) {
      const code = err?.code || "";
      const shouldUseRedirect =
        code.includes("popup-blocked") ||
        code.includes("cancelled-popup-request") ||
        code.includes("operation-not-supported-in-this-environment");

      if (shouldUseRedirect) {
        try {
          showMessage(signInMessage, "Opening Google sign-in...", "#003366");
          showMessage(signUpMessage, "Opening Google sign-in...", "#003366");
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectError) {
          console.error("Google redirect sign-in error:", redirectError);
          const redirectMsg = normalizeAuthError(redirectError);
          showMessage(signInMessage, redirectMsg);
          showMessage(signUpMessage, redirectMsg);
          return;
        }
      }

      console.error("Google sign-in error:", err);
      const msg = normalizeAuthError(err);
      showMessage(signInMessage, msg);
      showMessage(signUpMessage, msg);
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
        const uc = await withRetry(() => signInWithEmailAndPassword(auth, email, password));
        const adminDoc = await getDoc(doc(db, "admins", uc.user.uid));

        if (adminDoc.exists()) {
          window.location.href = "admin.html";
        } else {
          await signOut(auth);
          showMessage(signInMessage, "Not an admin");
        }
      } catch (err) {
        showMessage(signInMessage, normalizeAuthError(err));
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

    getRedirectResult(auth)
    .then(async (result) => {
      if (!result?.user) return;
      await ensureUserProfileDoc(result.user);
      if (authModal) authModal.style.display = "none";
    })
    .catch((err) => {
      const msg = normalizeAuthError(err);
      showMessage(signInMessage, msg);
      showMessage(signUpMessage, msg);
    }); 

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
  onAuthStateChanged(auth, async user => {
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

    let name = user.displayName || user.email?.split("@")[0] || "User";

    try {
      const profileSnap = await getDoc(doc(db, "users", user.uid));
      const profileName = profileSnap.data()?.name?.trim();
      if (profileName) {
        name = profileName;
      }
    } catch (error) {
      console.warn("Unable to read profile name from Firestore", error);
    }

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

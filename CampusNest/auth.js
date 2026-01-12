// auth.js – FIXED FOR ADMIN LOGIN (Firebase v10+)
import { auth, db } from "./firebase.js";
import {
  collection,
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

document.addEventListener("DOMContentLoaded", () => {

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
  const authContainer = document.getElementById("authContainer");
  const userDropdown = document.getElementById("userDropdown");

  // DEMO ADMIN
  const DEMO_ADMIN_EMAIL = "s.kumalo0115@gmail.com";
  const DEMO_ADMIN_UID = "FNuuI6aWggbSmBeAeG5XpuIbFPg1";
  const DEMO_ADMIN_PASSWORD = "Admin123!";

  const showMessage = (el, text, color = "red") => {
    if (!el) return;
    el.textContent = text || "";
    el.style.color = color;
  };

  // Modal open/close
  if (authBtn && authModal) authBtn.addEventListener("click", () => {
    authModal.style.display = "flex";
    showMessage(signInMessage, "");
    showMessage(signUpMessage, "");
  });
  if (authClose && authModal) authClose.addEventListener("click", () => authModal.style.display = "none");
  window.addEventListener("click", e => { if (e.target === authModal) authModal.style.display = "none"; });

  // Tab switching
  const signInTab = document.getElementById("signInTab");
  const signUpTab = document.getElementById("signUpTab");
  if (signInTab && signUpTab && signInForm && signUpForm) {
    signInTab.addEventListener("click", () => {
      signInForm.style.display = "block";
      signUpForm.style.display = "none";
      signInTab.classList.add("active");
      signUpTab.classList.remove("active");
    });
    signUpTab.addEventListener("click", () => {
      signInForm.style.display = "none";
      signUpForm.style.display = "block";
      signInTab.classList.remove("active");
      signUpTab.classList.add("active");
    });
  }

  // SIGN UP
  if (signUpForm) {
    signUpForm.addEventListener("submit", async e => {
      e.preventDefault();
      const name = document.getElementById("signUpName")?.value || "";
      const email = document.getElementById("signUpEmail")?.value || "";
      const password = document.getElementById("signUpPassword")?.value || "";
      if (!name || !email || !password) { showMessage(signUpMessage, "Fill all fields"); return; }

      try {
        const uc = await createUserWithEmailAndPassword(auth, email, password);
        const user = uc.user;
        await setDoc(doc(db, "users", user.uid), {
          name, email, phone: "", campus: "", createdAt: serverTimestamp()
        });
        await updateProfile(user, { displayName: name }).catch(() => {});
        showMessage(signUpMessage, "Account created — redirecting", "green");
        setTimeout(() => window.location.href = "profile.html", 900);
      } catch (err) {
        console.error(err);
        if (err.code === "auth/email-already-in-use") showMessage(signUpMessage, "Email in use");
        else if (err.code === "auth/weak-password") showMessage(signUpMessage, "Weak password");
        else showMessage(signUpMessage, "Sign up failed");
      }
    });
  }

  // SIGN IN
  if (signInForm) {
    signInForm.addEventListener("submit", async e => {
      e.preventDefault();
      const email = document.getElementById("signInEmail")?.value || "";
      const password = document.getElementById("signInPassword")?.value || "";
      if (!email || !password) { showMessage(signInMessage, "Enter email & password"); return; }

      try {
        const uc = await signInWithEmailAndPassword(auth, email, password);
        const uid = uc.user.uid;
        // Check admin collection
        const admDoc = await getDoc(doc(db, "admins", uid));
        if (admDoc.exists()) {
          showMessage(signInMessage, "Admin logged in — redirecting", "green");
          setTimeout(() => window.location.href = "admin.html", 700);
        } else {
          showMessage(signInMessage, "User logged in — redirecting", "green");
          setTimeout(() => window.location.href = "profile.html", 700);
        }
      } catch (err) {
        console.error(err);
        if (err.code === "auth/user-not-found") showMessage(signInMessage, "No account");
        else if (err.code === "auth/wrong-password") showMessage(signInMessage, "Wrong password");
        else showMessage(signInMessage, "Login failed");
      }
    });
  }

  // GOOGLE AUTH
  const provider = new GoogleAuthProvider();
  const handleGoogleAuth = async msgEl => {
    try {
      const res = await signInWithPopup(auth, provider);
      const user = res.user;
      const uref = doc(db, "users", user.uid);
      const docSnap = await getDoc(uref);
      if (!docSnap.exists()) {
        await setDoc(uref, {
          name: user.displayName || "Google User",
          email: user.email,
          phone: "",
          campus: "",
          createdAt: serverTimestamp()
        });
      }
      showMessage(msgEl, "Welcome — redirecting", "green");
      setTimeout(() => window.location.href = "profile.html", 700);
    } catch (err) {
      console.error(err);
      showMessage(msgEl, "Google sign-in failed");
    }
  };
  if (googleSignInBtn) googleSignInBtn.addEventListener("click", () => handleGoogleAuth(signInMessage));
  if (googleSignUpBtn) googleSignUpBtn.addEventListener("click", () => handleGoogleAuth(signUpMessage));

  // ADMIN DEMO LOGIN
  if (adminSignInBtn) {
    adminSignInBtn.addEventListener("click", async () => {
      const email = document.getElementById("signInEmail")?.value || "";
      const password = document.getElementById("signInPassword")?.value || "";
      if (!email || !password) { showMessage(signInMessage, "Enter admin credentials"); return; }

      if (email === DEMO_ADMIN_EMAIL && password === DEMO_ADMIN_PASSWORD) {
        sessionStorage.setItem("demoAdmin", "true");
        window.demoAdmin = { email: DEMO_ADMIN_EMAIL, uid: DEMO_ADMIN_UID };
        showMessage(signInMessage, "Demo admin — redirecting", "green");
        setTimeout(() => window.location.href = "admin.html", 700);
        return;
      }

      try {
        const uc = await signInWithEmailAndPassword(auth, email, password);
        const uid = uc.user.uid;
        const admDoc = await getDoc(doc(db, "admins", uid));
        if (admDoc.exists()) {
          showMessage(signInMessage, "Admin logged in — redirecting", "green");
          setTimeout(() => window.location.href = "admin.html", 700);
        } else {
          showMessage(signInMessage, "This account is not an admin");
          await signOut(auth);
        }
      } catch (err) {
        console.error(err);
        showMessage(signInMessage, "Admin login failed");
      }
    });
  }

  // LOGOUT
  const attachLogout = () => {
    const logoutBtns = [document.getElementById("logoutBtn"), ...document.querySelectorAll(".logout-btn")];
    logoutBtns.forEach(btn => {
      if (!btn) return;
      btn.addEventListener("click", async () => {
        sessionStorage.removeItem("demoAdmin");
        await signOut(auth);
        window.location.href = "index.html";
      });
    });
  };
  attachLogout();

  // UPDATE UI ON AUTH CHANGE
  onAuthStateChanged(auth, async user => {
    if (!authContainer || !userDropdown) return;

    if (!user) {
      authContainer.style.display = "block";
      userDropdown.style.display = "none";
      return;
    }

    authContainer.style.display = "none";
    userDropdown.style.display = "block";

    let displayName = user.displayName || "";
    if (!displayName) {
      try {
        const udoc = await getDoc(doc(db, "users", user.uid));
        if (udoc.exists()) displayName = udoc.data().name || "";
      } catch (e) { console.warn(e); }
    }
    if (!displayName && user.email) displayName = user.email.split("@")[0];

    const usernameEl = document.getElementById("username");
    const userNameTopEl = document.getElementById("userNameTop");
    if (usernameEl) usernameEl.textContent = "👤 " + displayName;
    if (userNameTopEl) userNameTopEl.textContent = displayName;
  });

});

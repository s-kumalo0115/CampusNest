// ===========================
// script.js - Global Site Functions (SAFE + FIXED)
// ===========================

let app = null;
let db = null;
let auth = null;

// 🔹 SAFE Firebase Init (DOES NOT CRASH SITE)
try {
  if (typeof firebaseConfig !== "undefined") {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.15.0/firebase-app.js");
    const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.15.0/firebase-firestore.js");
    const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.15.0/firebase-auth.js");

    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } else {
    console.warn("Firebase config not found — running site without Firebase.");
  }
} catch (err) {
  console.warn("Firebase failed to initialize:", err);
}

// ===========================
// SITE LOGIC
// ===========================

const MySite = {
  slideIndex: 0,

  // 🔹 HERO SLIDESHOW (GUARANTEED TO RUN)
  showSlides: function () {
    const slides = document.querySelectorAll(".slide");
    if (!slides.length) return;

    slides.forEach(slide => {
      slide.style.display = "none";
    });

    this.slideIndex++;
    if (this.slideIndex > slides.length) {
      this.slideIndex = 1;
    }

    slides[this.slideIndex - 1].style.display = "block";

    setTimeout(() => {
      MySite.showSlides();
    }, 5000);
  },

  // 🔹 STATS ANIMATION (FIXED + FALLBACK)
animateStats: function () {
  const boxes = document.querySelectorAll(".stat-box");
  if (!boxes.length) return;

  const runCounter = (box) => {
    box.classList.add("visible");

    const counter = box.querySelector(".count");
    const target = Number(counter.dataset.target);
    let current = 0;
    const increment = Math.max(1, Math.ceil(target / 120));

    const update = () => {
      current += increment;
      if (current >= target) {
        counter.textContent = target.toLocaleString();
        return;
      }
      counter.textContent = current.toLocaleString();
      requestAnimationFrame(update);
    };

    update();
  };

  // ✅ IntersectionObserver supported
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    boxes.forEach(box => observer.observe(box));
  } 
  // ✅ Fallback (OLDER / FAILED BROWSERS)
  else {
    boxes.forEach(box => runCounter(box));
  }
},

  init: function () {
    this.showSlides();
    this.animateStats();
  }
};

// ===========================
// START SITE
// ===========================
document.addEventListener("DOMContentLoaded", () => {
  MySite.init();
});



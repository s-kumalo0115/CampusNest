// ===========================
// script.js - Global Site Functions (CLEAN + SAFE)
// ===========================

// ❌ REMOVE Firebase init entirely from this file
// Firebase is initialized ONCE in firebase.js

const MySite = {
  slideIndex: 0,

  showSlides() {
    const slides = document.querySelectorAll(".slide");
    if (!slides.length) return;

    slides.forEach(slide => slide.style.display = "none");

    this.slideIndex++;
    if (this.slideIndex > slides.length) this.slideIndex = 1;

    slides[this.slideIndex - 1].style.display = "block";

    setTimeout(() => this.showSlides(), 5000);
  },

  animateStats() {
    const boxes = document.querySelectorAll(".stat-box");
    if (!boxes.length) return;

    const runCounter = (box) => {
      box.classList.add("visible");

      const counter = box.querySelector(".count");
      const target = Number(counter?.dataset?.target || 0);
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

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });

      boxes.forEach(box => observer.observe(box));
    } else {
      boxes.forEach(box => runCounter(box));
    }
  },

  init() {
    this.showSlides();
    this.animateStats();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  MySite.init();
});

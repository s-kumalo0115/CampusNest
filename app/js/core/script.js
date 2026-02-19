// ===========================
// script.js - Global Site Functions (CLEAN + SAFE)
// ===========================

const MySite = {
  slideIndex: 0,

  showSlides() {
    const slides = document.querySelectorAll(".slide");
    if (!slides.length) return;

    slides.forEach((slide) => {
      slide.style.display = "none";
    });

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
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });

      boxes.forEach((box) => observer.observe(box));
    } else {
      boxes.forEach((box) => runCounter(box));
    }
  },

    initScrollReveal() {
    const revealTargets = document.querySelectorAll(
      "section, .card, .listing-card, .listing-info, .landlord-info, .enquiry-card, .profile-card, .profile-details, .about-card, .feature-card, .form-card"
    );

    if (!revealTargets.length) return;

    const directions = ["reveal-left", "reveal-right", "reveal-up"];

    revealTargets.forEach((element, index) => {
      if (element.classList.contains("hero") || element.classList.contains("slides")) return;
      element.classList.add("reveal-base", directions[index % directions.length]);
    });

    if (!("IntersectionObserver" in window)) {
      revealTargets.forEach((element) => element.classList.add("revealed"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

    revealTargets.forEach((element) => observer.observe(element));
  },

  init() {
    this.showSlides();
    this.animateStats();
    this.initScrollReveal();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  MySite.init();
});

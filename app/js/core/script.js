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

  initHomeReviews() {
    const reviewsGrid = document.getElementById("reviewsGrid");
    const viewMoreBtn = document.getElementById("viewMoreReviewsBtn");
    const viewLessBtn = document.getElementById("viewLessReviewsBtn");
    const addViewBtn = document.getElementById("addViewBtn");
    const reviewModal = document.getElementById("reviewModal");
    const closeReviewModal = document.getElementById("closeReviewModal");
    const reviewForm = document.getElementById("reviewForm");
    const reviewProfileInput = document.getElementById("reviewProfile");
    const reviewProfilePreview = document.getElementById("reviewProfilePreview");
    const reviewFormStatus = document.getElementById("reviewFormStatus");

    if (!reviewsGrid || !viewMoreBtn || !viewLessBtn || !addViewBtn || !reviewModal || !reviewForm) return;

    // Put your local images in app/assets/images/reviews/ and reference them below.
    const reviews = [
      {
        name: "Lerato Mokoena",
        campus: "University of Johannesburg",
        text: "CampusNest helped me find a secure place close to classes in just a few days.",
        image: "../assets/images/reviews/lerato.jpg"
      },
      {
        name: "Thabo Ndlovu",
        campus: "University of Pretoria",
        text: "The listings were clear and the landlord was exactly as advertised.",
        image: "../assets/images/reviews/thabo.jpg"
      },
      {
        name: "Anele Dlamini",
        campus: "Wits University",
        text: "I loved how easy it was to compare prices and contact landlords.",
        image: "../assets/images/reviews/anele.jpg"
      },
      {
        name: "Kayla Petersen",
        campus: "Nelson Mandela University",
        text: "The enquiry process was fast and I got responses the same day.",
        image: "../assets/images/reviews/kayla.jpg"
      },
      {
        name: "Sibusiso Khumalo",
        campus: "UKZN",
        text: "I felt safer choosing a verified listing from the platform.",
        image: "../assets/images/reviews/sibusiso.jpg"
      },
      {
        name: "Naledi Seabi",
        campus: "Tshwane University of Technology",
        text: "Great platform for students, especially when moving to a new city.",
        image: "../assets/images/reviews/naledi.jpg"
      }
    ];

    let expanded = false;

    const reviewCardTemplate = (review) => `
      <article class="review-card">
        <div class="review-top">
          <img class="review-profile" src="${review.image}" alt="${review.name}" onerror="this.onerror=null;this.src='https://via.placeholder.com/200x200?text=Student';">
          <div>
            <p class="review-name">${review.name}</p>
            <p class="review-campus">${review.campus}</p>
          </div>
        </div>
        <p class="review-text">${review.text}</p>
      </article>
    `;

    const renderReviews = () => {
      const reviewsToShow = expanded ? reviews : reviews.slice(0, 3);
      reviewsGrid.innerHTML = reviewsToShow.map(reviewCardTemplate).join("");
      viewMoreBtn.style.display = expanded ? "none" : "inline-flex";
      viewLessBtn.style.display = expanded ? "inline-flex" : "none";
      addViewBtn.style.display = expanded ? "inline-flex" : "none";
    };

    viewMoreBtn.addEventListener("click", () => {
      expanded = true;
      renderReviews();
    });

    viewLessBtn.addEventListener("click", () => {
      expanded = false;
      renderReviews();
    });

    addViewBtn.addEventListener("click", () => {
      reviewModal.style.display = "flex";
    });

    closeReviewModal?.addEventListener("click", () => {
      reviewModal.style.display = "none";
    });

    reviewModal.addEventListener("click", (event) => {
      if (event.target === reviewModal) reviewModal.style.display = "none";
    });

    reviewProfileInput?.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        reviewProfilePreview.src = reader.result;
        reviewProfilePreview.style.display = "block";
      };
      reader.readAsDataURL(file);
    });

    reviewForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = document.getElementById("reviewName")?.value.trim();
      const campus = document.getElementById("reviewUniversity")?.value.trim();
      const text = document.getElementById("reviewText")?.value.trim();
      const image = reviewProfilePreview?.src || "https://via.placeholder.com/200x200?text=Student";

      if (!name || !campus || !text) {
        if (reviewFormStatus) reviewFormStatus.textContent = "Please complete all fields.";
        return;
      }

      reviews.push({ name, campus, text, image });
      expanded = true;
      renderReviews();

      reviewForm.reset();
      if (reviewProfilePreview) {
        reviewProfilePreview.style.display = "none";
        reviewProfilePreview.removeAttribute("src");
      }
      if (reviewFormStatus) reviewFormStatus.textContent = "Review added successfully!";

      setTimeout(() => {
        reviewModal.style.display = "none";
        if (reviewFormStatus) reviewFormStatus.textContent = "";
      }, 700);
    });

    renderReviews();
  },

  init() {
    this.showSlides();
    this.animateStats();
    this.initScrollReveal();
    this.initHomeReviews();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  MySite.init();
});

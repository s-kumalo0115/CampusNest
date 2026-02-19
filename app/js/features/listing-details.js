// listing-details.js
import { db, auth } from '../core/firebase.js';
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {

  const galleryImageFallback = "https://via.placeholder.com/1000x620?text=Gallery+Image";

  const urlParams = new URLSearchParams(window.location.search);
  let listingId = urlParams.get("id");
  const landlordIdFromUrl = urlParams.get("landlordId");

  const mainImageDiv = document.getElementById("main-image");
  const listingInfoDiv = document.getElementById("listing-info");
  const landlordInfoDiv = document.getElementById("landlord-info");
  const enquiryForm = document.getElementById("enquiryForm");
  const enquiryStatus = document.getElementById("enquiryStatus");
  const mapDiv = document.getElementById("listing-map");
  const galleryImg = document.getElementById("galleryImage");

  let currentIndex = 0;
  let galleryImages = [galleryImageFallback];
  let imageErrorCount = 0;

  const sanitizeImageUrl = (url) => {
    if (typeof url !== "string") return "";
    return url.trim().replace(/^"+|"+$/g, "");
  };

  const getListingGalleryImages = (listingData) => {
    if (!Array.isArray(listingData?.images)) return [];

    return listingData.images
      .map(sanitizeImageUrl)
      .filter((imageUrl) => imageUrl.length > 0);
  };

  async function getSharedFallbackImages(excludeListingId = "") {
    try {
      const listingsSnap = await getDocs(collection(db, "listings"));

      for (const docSnap of listingsSnap.docs) {
        if (docSnap.id === excludeListingId) continue;

        const donorImages = getListingGalleryImages(docSnap.data());
        if (donorImages.length) {
          return donorImages;
        }
      }

      return [];
    } catch (err) {
      console.error("Failed to fetch shared fallback gallery images:", err);
      return [];
    }
  }

    const getPrimaryListingImage = (listingData) => {
    const directImage = sanitizeImageUrl(listingData?.imageUrl || "");
    if (directImage) return directImage;

    const gallery = getListingGalleryImages(listingData);
    if (gallery.length) return gallery[0];

    return "https://via.placeholder.com/900x500?text=Listing+Image";
  };

  function bindGallery() {
    if (!galleryImg) return;

    const activeImage = galleryImages[currentIndex] || galleryImageFallback;
    galleryImg.src = activeImage;

    galleryImg.onerror = () => {
      imageErrorCount += 1;
      if (imageErrorCount < galleryImages.length) {
        currentIndex = (currentIndex + 1) % galleryImages.length;
        bindGallery();
        return;
      }

      galleryImg.onerror = null;
      galleryImg.src = galleryImageFallback;
    };
  }

  window.prevImage = () => {
    imageErrorCount = 0;
    currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    bindGallery();
  };

  window.nextImage = () => {
    imageErrorCount = 0;
    currentIndex = (currentIndex + 1) % galleryImages.length;
    bindGallery();
  };

  bindGallery();

  try {
    if (!listingId && landlordIdFromUrl) {
      const landlordListingsSnap = await getDocs(
        query(
          collection(db, "listings"),
          where("landlordId", "==", landlordIdFromUrl),
          orderBy("createdAt", "desc"),
          limit(1)
        )
      );

      if (!landlordListingsSnap.empty) {
        listingId = landlordListingsSnap.docs[0].id;
      }
    }

    if (!listingId) {
      listingInfoDiv.innerHTML = "<p>No listing specified.</p>";
      return;
    }

    // Get listing
    const listingSnap = await getDoc(doc(db, "listings", listingId));
    if (!listingSnap.exists()) {
      listingInfoDiv.innerHTML = "<p>Listing not found.</p>";
      return;
    }
    const listing = listingSnap.data();

    // Main Image
    const mainImgUrl = getPrimaryListingImage(listing);
    mainImageDiv.innerHTML = `<img src="${mainImgUrl}" alt="${listing.title || ""}" class="main-listing-image">`;

    // Listing Info
    listingInfoDiv.innerHTML = `
      <h1>${listing.title || ""}</h1>
      <p>${listing.description || "No description provided."}</p>
      <p>💰 Price: R${listing.price || ""} pm</p>
      <p>🏠 Type: ${listing.type || ""}</p>
      <p>🛏 Bedrooms: ${listing.bedrooms || ""}</p>
      <p>🎓 University: ${listing.university || ""}</p>
      <p>📍 Location: ${listing.location || ""}</p>
      <p>${listing.verified ? "✔ Verified" : ""}</p>
    `;

    // Image Gallery
    const listingImages = getListingGalleryImages(listing);
    if (listingImages.length) {
      galleryImages = listingImages;
    } else {
      const sharedFallbackImages = await getSharedFallbackImages(listingId);
      galleryImages = sharedFallbackImages.length ? sharedFallbackImages : [galleryImageFallback];
    }
    
    currentIndex = 0;
    imageErrorCount = 0;
    bindGallery();

    // Landlord Info
    if (listing.landlordId) {
      const landlordSnap = await getDoc(doc(db, "landlords", listing.landlordId));
      if (landlordSnap.exists()) {
        const landlord = landlordSnap.data();
        const landlordPhoto = landlord.photoUrl || "https://via.placeholder.com/300x300?text=Landlord";
        landlordInfoDiv.innerHTML = `
          <img src="${landlordPhoto}" alt="${landlord.name || ""}" class="landlord-photo">
          <h3>${landlord.name || ""}</h3>
          <p>${landlord.city || ""}</p>
          <div class="landlord-contact">
            <a href="tel:${landlord.phone || "#"}"><i class="fas fa-phone"></i> Call</a>
            <a href="mailto:${landlord.email || "#"}"><i class="fas fa-envelope"></i> Email</a>
            <a href="https://wa.me/${landlord.phone || "000"}" target="_blank"><i class="fab fa-whatsapp"></i> WhatsApp</a>
          </div>
        `;
      } else {
        landlordInfoDiv.innerHTML = "<p>Landlord information not available.</p>";
      }
    }

    // Enquiry Form
      if (enquiryForm && enquiryStatus) {
      enquiryForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!auth.currentUser) {
        enquiryStatus.textContent = "Please sign in to send an enquiry.";
        return;
      }
      const fromDateRaw = document.getElementById("fromDate").value;
      const toDateRaw = document.getElementById("toDate").value;
      const message = document.getElementById("message").value || "";

      if (!fromDateRaw || !toDateRaw) {
        enquiryStatus.textContent = "Please select dates.";
        return;
      }

      try {
        await addDoc(collection(db, "enquiries"), {
          listingId,
          listingTitle: listing.title || "",
          listingImageUrl: mainImgUrl,
          landlordId: listing.landlordId || "",
          fromDate: Timestamp.fromDate(new Date(fromDateRaw)),
          toDate: Timestamp.fromDate(new Date(toDateRaw)),
          message,
          status: "pending",
          createdAt: serverTimestamp(),
          userName: auth.currentUser.displayName || "Anonymous",
          userEmail: auth.currentUser.email,
          userId: auth.currentUser.uid
        });
        enquiryStatus.textContent = "✅ Enquiry sent successfully!";
        enquiryForm.reset();
      } catch (err) {
        enquiryStatus.textContent = "❌ Failed to send enquiry.";
        console.error(err);
      }
      });
    }

    // Map Buttons
    if (mapDiv) {
      const getDirectionsBtn = document.getElementById("getDirectionsBtn");
      const findLocationBtn = document.getElementById("findLocationBtn");
      const propertyAddress = listing.location || "University of Johannesburg, Auckland Park";

      getDirectionsBtn.addEventListener("click", () => {
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(propertyAddress)}`;
        window.open(mapsUrl, "_blank");
      });

      findLocationBtn.addEventListener("click", () => {
        if (!navigator.geolocation) {
          alert("Geolocation not supported.");
          return;
        }
        navigator.geolocation.getCurrentPosition((pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${encodeURIComponent(propertyAddress)}`;
          window.open(mapsUrl, "_blank");
        }, (err) => {
          alert("Unable to fetch location.");
          console.error(err);
        });
      });
    }

  } catch (err) {
    console.error(err);
    listingInfoDiv.innerHTML = "<p style='color:red;'>Failed to load listing details.</p>";
  }
});
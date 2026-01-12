// add-listing.js
import { db, storage, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const form = document.getElementById("listingForm");
const formMessage = document.getElementById("formMessage");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMessage.textContent = "";
  formMessage.style.color = "green";

  // Gather form values
  const title = document.getElementById("title").value.trim();
  const price = parseInt(document.getElementById("price").value);
  const location = document.getElementById("location").value.trim();
  const university = document.getElementById("university").value.trim();
  const type = document.getElementById("type").value;
  const bedrooms = parseInt(document.getElementById("bedrooms").value) || 0;
  const description = document.getElementById("description").value.trim();
  const latitude = parseFloat(document.getElementById("latitude").value) || null;
  const longitude = parseFloat(document.getElementById("longitude").value) || null;
  const images = document.getElementById("images").files;

  if (!title || !price || !location) {
    alert("Please fill in all required fields (*).");
    return;
  }

  const listingData = {
    title,
    price,
    location,
    university: university || "",
    type: type || "",
    bedrooms,
    description: description || "",
    coordinates: latitude && longitude ? { latitude, longitude } : null,
    createdAt: serverTimestamp(),
    verified: false
  };

  // Attach current user if logged in
  const currentUser = auth.currentUser;
  if (currentUser) listingData.landlordId = currentUser.uid;

  try {
    const docRef = await addDoc(collection(db, "listings"), listingData);
    const listingId = docRef.id;

    // Upload images
    if (images.length > 0) {
      const imageUrls = [];
      for (const file of images) {
        const storageRef = ref(storage, `listings/${listingId}/${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
      }
      await updateDoc(doc(db, "listings", listingId), { images: imageUrls });
    }

    formMessage.textContent = "✅ Listing added successfully!";
    form.reset();
  } catch (err) {
    console.error(err);
    formMessage.style.color = "red";
    formMessage.textContent = "❌ Failed to add listing. Try again.";
  }
});

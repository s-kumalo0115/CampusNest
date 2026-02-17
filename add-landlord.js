// add-landlord.js
import { db, storage } from "./firebase.js"; // import Firestore & Storage from modular firebase.js
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

const form = document.getElementById("landlordForm");
const formMessage = document.getElementById("formMessage");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMessage.textContent = "";
  formMessage.style.color = "green";

  // Get form values
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();
  const city = document.getElementById("city").value.trim();
  const photoFile = document.getElementById("photo").files[0];

  if (!name || !phone || !email) {
    alert("Please fill in all required fields (*).");
    return;
  }

  try {
    // Add landlord to Firestore
    const landlordData = {
      name,
      phone,
      email,
      city: city || "",
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "landlords"), landlordData);
    const landlordId = docRef.id;

    // Upload profile image if selected
    if (photoFile) {
      const storageRef = ref(storage, `landlords/${landlordId}/${photoFile.name}`);
      await uploadBytes(storageRef, photoFile);
      const photoURL = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "landlords", landlordId), { photoUrl: photoURL });
    }

    formMessage.textContent = "✅ Landlord added successfully!";
    form.reset();
  } catch (err) {
    console.error(err);
    formMessage.style.color = "red";
    formMessage.textContent = "❌ Failed to add landlord. Try again.";
  }
});

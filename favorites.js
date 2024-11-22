import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";

// Firebase Configuration
require('dotenv').config(); // Load environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY, // Use environment variable
  authDomain: "filmscope-915fb.firebaseapp.com",
  projectId: "filmscope-915fb",
  storageBucket: "filmscope-915fb.firebasestorage.app",
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const favoriteMoviesContainer = document.getElementById("favoriteMoviesContainer");

async function fetchFavorites() {
  const user = auth.currentUser;

  if (user) {
    const userRef = doc(db, "favorites", user.uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const favoriteIds = docSnap.data().movieIds || [];

      // Fetch movie details and render them
      favoriteIds.forEach((movieId) => {
        fetch(`https://www.omdbapi.com/?apikey=231a6a00&i=${movieId}`)
          .then((response) => response.json())
          .then((data) => {
            const movieCard = document.createElement("div");
            movieCard.className = "movie-card";
            movieCard.innerHTML = `
              <img src="${data.Poster}" alt="${data.Title}">
              <h2>${data.Title}</h2>
            `;
            favoriteMoviesContainer.appendChild(movieCard);
          });
      });
    }
  }
}

// Fetch favorites on page load
fetchFavorites();

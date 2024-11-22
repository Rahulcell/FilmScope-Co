import {
    getAuth,
    signOut,
    onAuthStateChanged,
  } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
  import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
  } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
  
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
  const movieContainer = document.getElementById("movieCardContainer");
  const loadMoreButton = document.getElementById("loadMore");
  const searchInput = document.getElementById("search");
  const searchButton = document.getElementById("submit");
  
  let allMovies = [];
  let favorites = [];
  let currentIndex = 0;
  
  // Fetch and display movies
  async function fetchMovies() {
    const response = await fetch(
      `https://rahulcell.github.io/IMDB-project/db.json`
    );
    allMovies = await response.json();
    displayMovies();
  }
  
  function displayMovies() {
    const moviesToShow = allMovies.slice(currentIndex, currentIndex + 10);
  
    moviesToShow.forEach((movie) => {
      const movieCard = document.createElement("div");
      movieCard.className = "movie-card";
      movieCard.innerHTML = `
              <img src="${movie.image}" alt="${movie.title}">
              <h2>${movie.title}</h2>
              <button class="bookmark-btn" data-movie-id="${
                movie.id
              }" title="Add to Favorites">
                  <i class="bi ${
                    favorites.includes(movie.id)
                      ? "bi-bookmark-fill"
                      : "bi-bookmark"
                  }"></i>
              </button>
          `;
  
      // Add bookmark event listener
      movieCard
        .querySelector(".bookmark-btn")
        .addEventListener("click", () => toggleFavorite(movie.id));
      movieContainer.appendChild(movieCard);
    });
  
    currentIndex += 10;
    if (currentIndex >= allMovies.length) loadMoreButton.style.display = "none";
  }
  
  // Bookmark toggle logic
  async function toggleFavorite(movieId) {
    const user = auth.currentUser;
  
    if (!user) {
      alert("Please log in to bookmark movies.");
      return;
    }
  
    if (favorites.includes(movieId)) {
      await removeFavorite(user.uid, movieId);
      favorites = favorites.filter((id) => id !== movieId);
    } else {
      await addFavorite(user.uid, movieId);
      favorites.push(movieId);
    }
  
    renderFavorites();
  }
  
  async function addFavorite(userId, movieId) {
    const userRef = doc(db, "favorites", userId);
    await setDoc(userRef, {}, { merge: true }); // Ensure the document exists
    await updateDoc(userRef, { movieIds: arrayUnion(movieId) });
  }
  
  async function removeFavorite(userId, movieId) {
    const userRef = doc(db, "favorites", userId);
    await updateDoc(userRef, { movieIds: arrayRemove(movieId) });
  }
  
  async function getFavorites(userId) {
    const userRef = doc(db, "favorites", userId);
    const docSnap = await getDoc(userRef);
    return docSnap.exists() ? docSnap.data().movieIds : [];
  }
  
  function renderFavorites() {
    document.querySelectorAll(".movie-card").forEach((card) => {
      const movieId = card.querySelector(".bookmark-btn").dataset.movieId;
      const icon = card.querySelector(".bookmark-btn i");
  
      if (favorites.includes(movieId)) {
        icon.classList.remove("bi-bookmark");
        icon.classList.add("bi-bookmark-fill");
      } else {
        icon.classList.remove("bi-bookmark-fill");
        icon.classList.add("bi-bookmark");
      }
    });
  }
  
  // Authentication state observer
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      favorites = await getFavorites(user.uid);
      renderFavorites();
    } else {
      favorites = [];
      renderFavorites();
    }
  });
  
  // Search movies
  searchButton.addEventListener("click", async (event) => {
    event.preventDefault();
    const query = searchInput.value.trim();
  
    if (query) {
      const url = `https://www.omdbapi.com/?apikey=231a6a00&s=${query}`;
      const response = await fetch(url);
      const data = await response.json();
  
      if (data.Response === "True") {
        movieContainer.innerHTML = "";
        allMovies = data.Search.map((movie) => ({
          id: movie.imdbID,
          title: movie.Title,
          image: movie.Poster,
        }));
        currentIndex = 0;
        displayMovies();
      } else {
        alert("No movies found.");
      }
    }
  });
  
  // Logout functionality
  document.getElementById("confirmLogout").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });
  
  // Load initial movies
  fetchMovies();
  loadMoreButton.addEventListener("click", displayMovies);
  
// No API key here anymore — all TMDB calls go through /api/tmdb,
// which injects the key server-side. See api/tmdb.js.

const PROXY_BASE = "/api/tmdb";

/* =========================
   DOM ELEMENTS
========================= */
const buttons = document.querySelectorAll(".mood-buttons button");
const movieContainer = document.getElementById("movie-container");
const searchBtn = document.getElementById("search-btn");
const searchInput = document.getElementById("search-input");

/* =========================
   MOOD GENRES
========================= */

const moodGenres = {
    comedy: 35,
    drama: 18,
    action: 28,
    romance: 10749,
    horror: 27
};

/* =========================
   MOOD BUTTON EVENTS
========================= */

buttons.forEach(button => {

    button.addEventListener("click", () => {

        const mood = button.dataset.mood;

        fetchMovies(mood);

        document
            .getElementById("movies")
            .scrollIntoView({
                behavior: "smooth"
            });

    });

});

/* =========================
   SEARCH EVENTS
========================= */

if (searchBtn) {

    searchBtn.addEventListener("click", () => {

        const query = searchInput.value.trim();

        if (query) {
            searchMovies(query);
        }

    });

}

if (searchInput) {

    searchInput.addEventListener("keydown", (e) => {

        if (e.key === "Enter") {
            e.preventDefault();

            const query = searchInput.value.trim();

            if (query) {
                searchMovies(query);
            }

        }

    });

}

/* =========================
   DISPLAY MOVIES
========================= */

function displayMovies(movies, container) {

    container.innerHTML = "";

    const cardsHtml = movies.map(movie => {

        const posterUrl = movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : "https://placehold.co/500x750?text=No+Poster";

        const rating = (movie.vote_average ?? 0).toFixed(1);

        return `
            <div class="movie-card">

                <img
                    src="${posterUrl}"
                    alt="${movie.title} poster"
                    loading="lazy"
                >

                <div class="movie-content">

                    <h2>${movie.title}</h2>

                    <div class="rating">
                        ⭐ ${rating}
                    </div>

                    <p>
                        <strong>Release Date:</strong>
                        ${movie.release_date || "N/A"}
                    </p>

                    <p>
                        <strong>Language:</strong>
                        ${movie.original_language
                            ? movie.original_language.toUpperCase()
                            : "N/A"}
                    </p>

                    <p>
                        <strong>Popularity:</strong>
                        ${Math.round(movie.popularity)}
                    </p>

                    <p>
                        ${movie.overview
                            ? movie.overview.substring(0, 120) + "..."
                            : "No description available."}
                    </p>

                    <button
                        class="trailer-btn"
                        onclick="watchTrailer(${movie.id})"
                    >
                        ▶ Watch Trailer
                    </button>

                </div>

            </div>
        `;

    }).join("");

    container.innerHTML = cardsHtml;

}

/* =========================
   FETCH MOOD MOVIES
========================= */

async function fetchMovies(mood) {

    const genreId = moodGenres[mood];

    if (!genreId) {
        movieContainer.innerHTML = `
            <div class="loading">
                ❌ Invalid mood selected.
            </div>
        `;
        return;
    }

    movieContainer.innerHTML = `
        <div class="loading">
            🎬 Finding movies for you...
        </div>
    `;

    try {

        const response = await fetch(
            `${PROXY_BASE}?endpoint=discover/movie&with_genres=${genreId}&sort_by=popularity.desc`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch movies");
        }

        const data = await response.json();

        const movies = data.results
            .sort(() => 0.5 - Math.random())
            .slice(0, 6);

        displayMovies(movies, movieContainer);

    }
    catch (error) {

        console.error(error);

        movieContainer.innerHTML = `
            <div class="loading">
                ❌ Failed to load movies.
            </div>
        `;
    }

}

/* =========================
   SEARCH MOVIES
========================= */

async function searchMovies(query) {

    movieContainer.innerHTML = `
        <div class="loading">
            🔍 Searching movies...
        </div>
    `;

    try {

        const response = await fetch(
            `${PROXY_BASE}?endpoint=search/movie&query=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
            throw new Error("Search failed");
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            movieContainer.innerHTML = `
                <div class="loading">
                    🔍 No results found for "${query}".
                </div>
            `;
            return;
        }

        displayMovies(
            data.results.slice(0, 6),
            movieContainer
        );

        document
            .getElementById("movies")
            .scrollIntoView({
                behavior: "smooth"
            });

    }
    catch (error) {

        console.error(error);

        movieContainer.innerHTML = `
            <div class="loading">
                ❌ Search failed.
            </div>
        `;
    }

}

/* =========================
   TRENDING MOVIES
========================= */

async function loadTrendingMovies() {

    const trendingContainer =
        document.getElementById("trending-container");

    if (!trendingContainer) return;

    trendingContainer.innerHTML = `
        <div class="loading">
            🔥 Loading Trending Movies...
        </div>
    `;

    try {

        const response = await fetch(
            `${PROXY_BASE}?endpoint=trending/movie/week`
        );

        if (!response.ok) {
            throw new Error("Failed to load trending movies");
        }

        const data = await response.json();

        displayMovies(
            data.results.slice(0, 6),
            trendingContainer
        );

    }
    catch (error) {

        console.error(error);

        trendingContainer.innerHTML = `
            <div class="loading">
                ❌ Failed to load trending movies.
            </div>
        `;
    }

}

/* =========================
   WATCH TRAILER
========================= */
async function watchTrailer(movieId) {

    try {

        const response = await fetch(
            `${PROXY_BASE}?endpoint=movie/${movieId}/videos`
        );

        if (!response.ok) {
            throw new Error("Failed to load trailer");
        }

        const data = await response.json();

        const video = data.results.find(
            v => v.site === "YouTube" && v.type === "Trailer"
        ) || data.results.find(
            v => v.site === "YouTube"
        );

        if (!video) {

            alert("Trailer not available.");
            return;
        }

        const iframe =
            document.getElementById("trailer-frame");

        iframe.src =
            `https://www.youtube.com/embed/${video.key}?autoplay=1`;

        document
            .getElementById("trailer-modal")
            .style.display = "flex";

    }
    catch (error) {

        console.error(error);

        alert("Failed to load trailer.");
    }
}
window.watchTrailer = watchTrailer;
/* =========================
   INITIAL LOAD
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        loadTrendingMovies();
    }
);
/* =========================
   MODAL CLOSE EVENTS
========================= */

document.addEventListener("DOMContentLoaded", () => {

    const modal =
        document.getElementById("trailer-modal");

    const iframe =
        document.getElementById("trailer-frame");

    const closeBtn =
        document.getElementById("close-modal");

    if (closeBtn) {

        closeBtn.addEventListener("click", () => {

            modal.style.display = "none";

            iframe.src = "";

        });

    }

    modal.addEventListener("click", (e) => {

        if (e.target === modal) {

            modal.style.display = "none";

            iframe.src = "";

        }

    });

    document.addEventListener("keydown", (e) => {

        if (e.key === "Escape") {

            modal.style.display = "none";

            iframe.src = "";

        }

    });

});
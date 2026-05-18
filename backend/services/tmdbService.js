const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

const searchMovies = async (query) => {
  const res = await fetch(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US`);
  const data = await res.json();
  return data.results.slice(0, 8).map(m => ({
    tmdb_id: m.id,
    title: m.title,
    type: "film",
    description: m.overview,
    release_year: m.release_date ? parseInt(m.release_date.split("-")[0]) : null,
    cover_url: m.poster_path ? `${TMDB_IMAGE_BASE}${m.poster_path}` : "",
    genre: null
  }));
};

const searchSeries = async (query) => {
  const res = await fetch(`${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US`);
  const data = await res.json();
  return data.results.slice(0, 8).map(s => ({
    tmdb_id: s.id,
    title: s.name,
    type: "series",
    description: s.overview,
    release_year: s.first_air_date ? parseInt(s.first_air_date.split("-")[0]) : null,
    cover_url: s.poster_path ? `${TMDB_IMAGE_BASE}${s.poster_path}` : "",
    genre: null
  }));
};

const searchAll = async (query) => {
  const [movies, series] = await Promise.all([searchMovies(query), searchSeries(query)]);
  return [...movies, ...series];
};

module.exports = { searchMovies, searchSeries, searchAll, TMDB_IMAGE_BASE };
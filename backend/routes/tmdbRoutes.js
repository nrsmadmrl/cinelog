const express = require("express");
const router = express.Router();
const tmdbService = require("../services/tmdbService");
const contentService = require("../services/contentService");
const { authenticate } = require("../middleware/auth");

/**
 * @swagger
 * /api/tmdb/search:
 *   get:
 *     summary: Search movies and series from TMDB
 *     tags: [TMDB]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [film, series, all]
 *     responses:
 *       200:
 *         description: Search results from TMDB
 */
router.get("/search", async (req, res) => {
  try {
    const { q, type } = req.query;
    if (!q) return res.status(400).json({ error: "Query is required" });

    let results;
    if (type === "film") results = await tmdbService.searchMovies(q);
    else if (type === "series") results = await tmdbService.searchSeries(q);
    else results = await tmdbService.searchAll(q);

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/tmdb/import:
 *   post:
 *     summary: Import a TMDB result into the database (admin only)
 *     tags: [TMDB]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Content imported
 */
router.post("/import", authenticate, async (req, res) => {
  try {
    if (!req.user.is_admin) return res.status(403).json({ error: "Admins only" });
    const { title, type, description, release_year, cover_url, genre } = req.body;
    const content = contentService.createContent({ title, type, description, release_year, cover_url, genre }, req.user.id);
    res.status(201).json(content);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
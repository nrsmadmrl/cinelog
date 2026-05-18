const express = require("express");
const router = express.Router();
const reviewService = require("../services/reviewService");
const { authenticate } = require("../middleware/auth");

/**
 * @swagger
 * /api/reviews/content/{contentId}:
 *   get:
 *     summary: Get all reviews for a content
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of reviews
 */
router.get("/content/:contentId", (req, res) => {
  try {
    const reviews = reviewService.getReviewsByContent(parseInt(req.params.contentId));
    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/reviews/content/{contentId}/average:
 *   get:
 *     summary: Get average rating for a content
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Average rating
 */
router.get("/content/:contentId/average", (req, res) => {
  try {
    const avg = reviewService.getAverageRating(parseInt(req.params.contentId));
    res.status(200).json(avg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/reviews/user/{userId}:
 *   get:
 *     summary: Get all reviews by a user
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of reviews
 */
router.get("/user/:userId", (req, res) => {
  try {
    const reviews = reviewService.getReviewsByUser(parseInt(req.params.userId));
    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content_id:
 *                 type: integer
 *               rating:
 *                 type: integer
 *               opinion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created
 */
router.post("/", authenticate, (req, res) => {
  try {
    const { content_id, rating, opinion } = req.body;
    const review = reviewService.createReview(req.user.id, content_id, rating, opinion);
    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     summary: Update a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Review updated
 */
router.put("/:id", authenticate, (req, res) => {
  try {
    const { rating, opinion } = req.body;
    const review = reviewService.updateReview(parseInt(req.params.id), req.user.id, rating, opinion);
    res.status(200).json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Review deleted
 */
router.delete("/:id", authenticate, (req, res) => {
  try {
    const result = reviewService.deleteReview(parseInt(req.params.id), req.user.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
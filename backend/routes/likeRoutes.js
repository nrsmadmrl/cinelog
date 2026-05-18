const express = require("express");
const router = express.Router();
const likeService = require("../services/likeService");
const { authenticate } = require("../middleware/auth");

/**
 * @swagger
 * /api/likes/post/{postId}:
 *   get:
 *     summary: Get all likes for a post
 *     tags: [Likes]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of likes
 */
router.get("/post/:postId", (req, res) => {
  try {
    const likes = likeService.getLikesByPost(parseInt(req.params.postId));
    res.status(200).json(likes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/likes/post/{postId}/toggle:
 *   post:
 *     summary: Toggle like on a post
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Like toggled
 */
router.post("/post/:postId/toggle", authenticate, (req, res) => {
  try {
    const result = likeService.toggleLike(req.user.id, parseInt(req.params.postId));
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/likes/post/{postId}/status:
 *   get:
 *     summary: Check if current user liked a post
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Like status
 */
router.get("/post/:postId/status", authenticate, (req, res) => {
  try {
    const result = likeService.isLiked(req.user.id, parseInt(req.params.postId));
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
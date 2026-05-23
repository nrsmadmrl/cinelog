const express = require("express");
const router = express.Router();
const contentService = require("../services/contentService");
const { authenticate } = require("../middleware/auth");

/**
 * @swagger
 * /api/content:
 *   get:
 *     summary: Get all content (filter by type or search)
 *     tags: [Content]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [film, series, music]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of content
 */
router.get("/", (req, res) => {
  try {
    const { type, search } = req.query;
    const content = contentService.getAllContent(type, search);
    res.status(200).json(content);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/content/{id}:
 *   get:
 *     summary: Get content by ID
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Content found
 *       404:
 *         description: Content not found
 */
router.get("/:id", (req, res) => {
  try {
    const content = contentService.getContentById(parseInt(req.params.id));
    res.status(200).json(content);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/content:
 *   post:
 *     summary: Create new content (admin only)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [film, series, music]
 *               genre:
 *                 type: string
 *               release_year:
 *                 type: integer
 *               description:
 *                 type: string
 *               cover_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Content created
 *       403:
 *         description: Forbidden - admins only
 */
router.post("/", authenticate, (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: "Forbidden: Only admins can add content" });
    }
    const content = contentService.createContent(req.body, req.user.id);
    res.status(201).json(content);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/content/{id}:
 *   put:
 *     summary: Update content (admin only)
 *     tags: [Content]
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
 *         description: Content updated
 *       403:
 *         description: Forbidden - admins only
 */
router.put("/:id", authenticate, (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: "Forbidden: Only admins can update content" });
    }
    const content = contentService.updateContent(
      parseInt(req.params.id),
      req.body,
      req.user.id,
      req.user.is_admin
    );
    res.status(200).json(content);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/content/{id}:
 *   delete:
 *     summary: Delete content (admin only)
 *     tags: [Content]
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
 *         description: Content deleted
 *       403:
 *         description: Forbidden - admins only
 */
router.delete("/:id", authenticate, (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: "Forbidden: Only admins can delete content" });
    }
    const result = contentService.deleteContent(
      parseInt(req.params.id),
      req.user.id,
      req.user.is_admin
    );
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
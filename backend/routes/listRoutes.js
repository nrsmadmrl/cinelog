const express = require("express");
const router = express.Router();
const listService = require("../services/listService");
const { authenticate } = require("../middleware/auth");

/**
 * @swagger
 * /api/lists/user/{userId}:
 *   get:
 *     summary: Get all lists for a user
 *     tags: [Lists]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of lists
 */
router.get("/user/:userId", (req, res) => {
  try {
    const lists = listService.getListsByUser(parseInt(req.params.userId));
    res.status(200).json(lists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/lists/{id}:
 *   get:
 *     summary: Get list with items
 *     tags: [Lists]
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
 *         description: List with items
 */
router.get("/:id", authenticate, (req, res) => {
  try {
    const list = listService.getListWithItems(parseInt(req.params.id), req.user.id);
    res.status(200).json(list);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/lists:
 *   post:
 *     summary: Create a list
 *     tags: [Lists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [watchlater, playlist, custom]
 *     responses:
 *       201:
 *         description: List created
 */
router.post("/", authenticate, (req, res) => {
  try {
    const { name, type } = req.body;
    const list = listService.createList(req.user.id, name, type);
    res.status(201).json(list);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/lists/{id}:
 *   put:
 *     summary: Update a list name
 *     tags: [Lists]
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
 *         description: List updated
 */
router.put("/:id", authenticate, (req, res) => {
  try {
    const list = listService.updateList(parseInt(req.params.id), req.user.id, req.body.name);
    res.status(200).json(list);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/lists/{id}:
 *   delete:
 *     summary: Delete a list
 *     tags: [Lists]
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
 *         description: List deleted
 */
router.delete("/:id", authenticate, (req, res) => {
  try {
    const result = listService.deleteList(parseInt(req.params.id), req.user.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/lists/{id}/items:
 *   post:
 *     summary: Add content to a list
 *     tags: [Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Item added
 */
router.post("/:id/items", authenticate, (req, res) => {
  try {
    const result = listService.addItemToList(parseInt(req.params.id), req.user.id, req.body.content_id);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/lists/{id}/items/{contentId}:
 *   delete:
 *     summary: Remove content from a list
 *     tags: [Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item removed
 */
router.delete("/:id/items/:contentId", authenticate, (req, res) => {
  try {
    const result = listService.removeItemFromList(parseInt(req.params.id), req.user.id, parseInt(req.params.contentId));
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
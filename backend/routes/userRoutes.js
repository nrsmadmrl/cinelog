const express = require("express");
const router = express.Router();
const userService = require("../services/userService");
const { authenticate } = require("../middleware/auth");

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 */
router.get("/", (req, res) => {
  try {
    const users = userService.getAllUsers();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 */
router.get("/:id", (req, res) => {
  try {
    const user = userService.getUserById(parseInt(req.params.id));
    res.status(200).json(user);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered
 *       400:
 *         description: Validation error
 */
router.post("/register", (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = userService.register(username, email, password);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;
    const result = userService.login(email, password);
    res.status(200).json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
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
 *         description: User updated
 *       403:
 *         description: Forbidden - can only update your own profile
 */
router.put("/:id", authenticate, (req, res) => {
  try {
    // kullanıcı sadece kendi profilini güncelleyebilir (admin hariç)
    if (req.user.id !== parseInt(req.params.id) && !req.user.is_admin) {
      return res.status(403).json({ error: "Forbidden: You can only update your own profile" });
    }
    const user = userService.updateUser(parseInt(req.params.id), req.body);
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
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
 *         description: User deleted
 *       403:
 *         description: Forbidden - can only delete your own account
 */
router.delete("/:id", authenticate, (req, res) => {
  try {
    // kullanıcı sadece kendi hesabını silebilir (admin hariç)
    if (req.user.id !== parseInt(req.params.id) && !req.user.is_admin) {
      return res.status(403).json({ error: "Forbidden: You can only delete your own account" });
    }
    const result = userService.deleteUser(parseInt(req.params.id));
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
const db = require("../db/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "cinelog_secret_key_2026";

const getAllUsers = () => {
  return db.prepare("SELECT id, username, email, bio, avatar_url, created_at FROM users").all();
};

const getUserById = (id) => {
  const user = db.prepare("SELECT id, username, email, bio, avatar_url, created_at FROM users WHERE id = ?").get(id);
  if (!user) throw new Error("User not found");
  return user;
};

const register = (username, email, password) => {
  if (!username || !email || !password) throw new Error("All fields are required");
  if (password.length < 6) throw new Error("Password must be at least 6 characters");
  if (!email.includes("@")) throw new Error("Invalid email format");

  const existing = db.prepare("SELECT id FROM users WHERE email = ? OR username = ?").get(email, username);
  if (existing) throw new Error("Username or email already exists");

  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)").run(username, email, hashed);
  return { id: result.lastInsertRowid, username, email };
};

const login = (email, password) => {
  if (!email || !password) throw new Error("All fields are required");

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) throw new Error("Invalid email or password");

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) throw new Error("Invalid email or password");

  const token = jwt.sign({ id: user.id, username: user.username, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: "7d" });
return { token, user: { id: user.id, username: user.username, email: user.email, is_admin: user.is_admin } };};

const updateUser = (id, data) => {
  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(id);
  if (!user) throw new Error("User not found");

  const { username, bio, avatar_url } = data;
  db.prepare("UPDATE users SET username = COALESCE(?, username), bio = COALESCE(?, bio), avatar_url = COALESCE(?, avatar_url) WHERE id = ?")
    .run(username, bio, avatar_url, id);

  return getUserById(id);
};

const deleteUser = (id) => {
  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(id);
  if (!user) throw new Error("User not found");
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
  return { message: "User deleted successfully" };
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    throw new Error("Invalid or expired token");
  }
};

module.exports = { getAllUsers, getUserById, register, login, updateUser, deleteUser, verifyToken };
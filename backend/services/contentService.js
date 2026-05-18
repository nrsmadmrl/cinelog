const db = require("../db/database");

const getAllContent = (type, search) => {
  let query = "SELECT * FROM content WHERE 1=1";
  const params = [];

  if (type) {
    query += " AND type = ?";
    params.push(type);
  }

  if (search) {
    query += " AND title LIKE ?";
    params.push(`%${search}%`);
  }

  query += " ORDER BY created_at DESC";
  return db.prepare(query).all(...params);
};

const getContentById = (id) => {
  const content = db.prepare("SELECT * FROM content WHERE id = ?").get(id);
  if (!content) throw new Error("Content not found");
  return content;
};

const createContent = (data, userId) => {
  const { title, type, genre, release_year, description, cover_url } = data;

  if (!title || !type) throw new Error("Title and type are required");
  if (!["film", "series", "music"].includes(type)) throw new Error("Type must be film, series or music");
  if (release_year && (release_year < 1800 || release_year > new Date().getFullYear() + 1)) {
    throw new Error("Invalid release year");
  }

  const result = db.prepare(
    "INSERT INTO content (title, type, genre, release_year, description, cover_url, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(title, type, genre, release_year, description, cover_url || "", userId);

  return getContentById(result.lastInsertRowid);
};

const updateContent = (id, data, userId) => {
  const content = db.prepare("SELECT * FROM content WHERE id = ?").get(id);
  if (!content) throw new Error("Content not found");
  if (content.created_by !== userId) throw new Error("Unauthorized");

  const { title, genre, release_year, description, cover_url } = data;

  db.prepare(
    "UPDATE content SET title = COALESCE(?, title), genre = COALESCE(?, genre), release_year = COALESCE(?, release_year), description = COALESCE(?, description), cover_url = COALESCE(?, cover_url) WHERE id = ?"
  ).run(title, genre, release_year, description, cover_url, id);

  return getContentById(id);
};

const deleteContent = (id, userId) => {
  const content = db.prepare("SELECT * FROM content WHERE id = ?").get(id);
  if (!content) throw new Error("Content not found");
  if (content.created_by !== userId) throw new Error("Unauthorized");

  db.prepare("DELETE FROM content WHERE id = ?").run(id);
  return { message: "Content deleted successfully" };
};

module.exports = { getAllContent, getContentById, createContent, updateContent, deleteContent };
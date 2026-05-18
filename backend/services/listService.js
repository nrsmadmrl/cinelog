const db = require("../db/database");

const getListsByUser = (userId) => {
  return db.prepare("SELECT * FROM lists WHERE user_id = ? ORDER BY created_at DESC").all(userId);
};

const getListById = (id) => {
  const list = db.prepare("SELECT * FROM lists WHERE id = ?").get(id);
  if (!list) throw new Error("List not found");
  return list;
};

const getListWithItems = (id, userId) => {
  const list = getListById(id);
  if (list.user_id !== userId) throw new Error("Unauthorized");

  const items = db.prepare(`
    SELECT li.*, c.title, c.type, c.genre, c.cover_url 
    FROM list_items li 
    JOIN content c ON li.content_id = c.id 
    WHERE li.list_id = ?
    ORDER BY li.added_at DESC
  `).all(id);

  return { ...list, items };
};

const createList = (userId, name, type) => {
  if (!name || name.trim() === "") throw new Error("List name is required");
  if (!["watchlater", "playlist", "custom"].includes(type)) throw new Error("Type must be watchlater, playlist or custom");

  const result = db.prepare(
    "INSERT INTO lists (user_id, name, type) VALUES (?, ?, ?)"
  ).run(userId, name.trim(), type);

  return getListById(result.lastInsertRowid);
};

const updateList = (id, userId, name) => {
  const list = db.prepare("SELECT * FROM lists WHERE id = ?").get(id);
  if (!list) throw new Error("List not found");
  if (list.user_id !== userId) throw new Error("Unauthorized");
  if (!name || name.trim() === "") throw new Error("List name is required");

  db.prepare("UPDATE lists SET name = ? WHERE id = ?").run(name.trim(), id);
  return getListById(id);
};

const deleteList = (id, userId) => {
  const list = db.prepare("SELECT * FROM lists WHERE id = ?").get(id);
  if (!list) throw new Error("List not found");
  if (list.user_id !== userId) throw new Error("Unauthorized");

  db.prepare("DELETE FROM list_items WHERE list_id = ?").run(id);
  db.prepare("DELETE FROM lists WHERE id = ?").run(id);
  return { message: "List deleted successfully" };
};

const addItemToList = (listId, userId, contentId) => {
  const list = db.prepare("SELECT * FROM lists WHERE id = ?").get(listId);
  if (!list) throw new Error("List not found");
  if (list.user_id !== userId) throw new Error("Unauthorized");

  const content = db.prepare("SELECT id FROM content WHERE id = ?").get(contentId);
  if (!content) throw new Error("Content not found");

  const existing = db.prepare("SELECT id FROM list_items WHERE list_id = ? AND content_id = ?").get(listId, contentId);
  if (existing) throw new Error("Content already in list");

  db.prepare("INSERT INTO list_items (list_id, content_id) VALUES (?, ?)").run(listId, contentId);
  return { message: "Content added to list" };
};

const removeItemFromList = (listId, userId, contentId) => {
  const list = db.prepare("SELECT * FROM lists WHERE id = ?").get(listId);
  if (!list) throw new Error("List not found");
  if (list.user_id !== userId) throw new Error("Unauthorized");

  db.prepare("DELETE FROM list_items WHERE list_id = ? AND content_id = ?").run(listId, contentId);
  return { message: "Content removed from list" };
};

module.exports = { getListsByUser, getListById, getListWithItems, createList, updateList, deleteList, addItemToList, removeItemFromList };
const db = require("../db/database");

const getAllPosts = () => {
  return db.prepare(`
    SELECT p.*, u.username, u.avatar_url, c.title as content_title, c.type as content_type,
    COUNT(DISTINCT l.id) as like_count,
    COUNT(DISTINCT cm.id) as comment_count
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN content c ON p.content_id = c.id
    LEFT JOIN likes l ON p.id = l.post_id
    LEFT JOIN comments cm ON p.id = cm.post_id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).all();
};

const getPostById = (id) => {
  const post = db.prepare(`
    SELECT p.*, u.username, u.avatar_url, c.title as content_title, c.type as content_type,
    COUNT(DISTINCT l.id) as like_count,
    COUNT(DISTINCT cm.id) as comment_count
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN content c ON p.content_id = c.id
    LEFT JOIN likes l ON p.id = l.post_id
    LEFT JOIN comments cm ON p.id = cm.post_id
    WHERE p.id = ?
    GROUP BY p.id
  `).get(id);
  if (!post) throw new Error("Post not found");
  return post;
};

const getPostsByUser = (userId) => {
  return db.prepare(`
    SELECT p.*, c.title as content_title, c.type as content_type,
    COUNT(DISTINCT l.id) as like_count,
    COUNT(DISTINCT cm.id) as comment_count
    FROM posts p
    LEFT JOIN content c ON p.content_id = c.id
    LEFT JOIN likes l ON p.id = l.post_id
    LEFT JOIN comments cm ON p.id = cm.post_id
    WHERE p.user_id = ?
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).all(userId);
};

const createPost = (userId, contentId, caption) => {
  if (!caption && !contentId) throw new Error("Post must have a caption or linked content");

  if (contentId) {
    const content = db.prepare("SELECT id FROM content WHERE id = ?").get(contentId);
    if (!content) throw new Error("Content not found");
  }

  const result = db.prepare(
    "INSERT INTO posts (user_id, content_id, caption) VALUES (?, ?, ?)"
  ).run(userId, contentId || null, caption || "");

  return getPostById(result.lastInsertRowid);
};

const updatePost = (id, userId, caption) => {
  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(id);
  if (!post) throw new Error("Post not found");
  if (post.user_id !== userId) throw new Error("Unauthorized");
  if (!caption) throw new Error("Caption is required");

  db.prepare("UPDATE posts SET caption = ? WHERE id = ?").run(caption, id);
  return getPostById(id);
};

const deletePost = (id, userId) => {
  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(id);
  if (!post) throw new Error("Post not found");
  if (post.user_id !== userId) throw new Error("Unauthorized");

  db.prepare("DELETE FROM posts WHERE id = ?").run(id);
  return { message: "Post deleted successfully" };
};

module.exports = { getAllPosts, getPostById, getPostsByUser, createPost, updatePost, deletePost };
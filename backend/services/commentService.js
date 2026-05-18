const db = require("../db/database");

const getCommentsByPost = (postId) => {
  return db.prepare(`
    SELECT c.*, u.username, u.avatar_url 
    FROM comments c 
    JOIN users u ON c.user_id = u.id 
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `).all(postId);
};

const getCommentById = (id) => {
  const comment = db.prepare("SELECT * FROM comments WHERE id = ?").get(id);
  if (!comment) throw new Error("Comment not found");
  return comment;
};

const createComment = (userId, postId, text) => {
  if (!text || text.trim() === "") throw new Error("Comment text is required");

  const post = db.prepare("SELECT id FROM posts WHERE id = ?").get(postId);
  if (!post) throw new Error("Post not found");

  const result = db.prepare(
    "INSERT INTO comments (user_id, post_id, text) VALUES (?, ?, ?)"
  ).run(userId, postId, text.trim());

  return getCommentById(result.lastInsertRowid);
};

const updateComment = (id, userId, text) => {
  const comment = db.prepare("SELECT * FROM comments WHERE id = ?").get(id);
  if (!comment) throw new Error("Comment not found");
  if (comment.user_id !== userId) throw new Error("Unauthorized");
  if (!text || text.trim() === "") throw new Error("Comment text is required");

  db.prepare("UPDATE comments SET text = ? WHERE id = ?").run(text.trim(), id);
  return getCommentById(id);
};

const deleteComment = (id, userId) => {
  const comment = db.prepare("SELECT * FROM comments WHERE id = ?").get(id);
  if (!comment) throw new Error("Comment not found");
  if (comment.user_id !== userId) throw new Error("Unauthorized");

  db.prepare("DELETE FROM comments WHERE id = ?").run(id);
  return { message: "Comment deleted successfully" };
};

module.exports = { getCommentsByPost, getCommentById, createComment, updateComment, deleteComment };
const db = require("../db/database");

const getLikesByPost = (postId) => {
  return db.prepare(`
    SELECT l.*, u.username 
    FROM likes l 
    JOIN users u ON l.user_id = u.id 
    WHERE l.post_id = ?
  `).all(postId);
};

const toggleLike = (userId, postId) => {
  const post = db.prepare("SELECT id FROM posts WHERE id = ?").get(postId);
  if (!post) throw new Error("Post not found");

  const existing = db.prepare("SELECT id FROM likes WHERE user_id = ? AND post_id = ?").get(userId, postId);

  if (existing) {
    db.prepare("DELETE FROM likes WHERE user_id = ? AND post_id = ?").run(userId, postId);
    return { liked: false, message: "Like removed" };
  } else {
    db.prepare("INSERT INTO likes (user_id, post_id) VALUES (?, ?)").run(userId, postId);
    return { liked: true, message: "Post liked" };
  }
};

const isLiked = (userId, postId) => {
  const existing = db.prepare("SELECT id FROM likes WHERE user_id = ? AND post_id = ?").get(userId, postId);
  return { liked: !!existing };
};

module.exports = { getLikesByPost, toggleLike, isLiked };
const db = require("../db/database");

const getReviewsByContent = (contentId) => {
  return db.prepare(`
    SELECT r.*, u.username, u.avatar_url 
    FROM reviews r 
    JOIN users u ON r.user_id = u.id 
    WHERE r.content_id = ?
    ORDER BY r.created_at DESC
  `).all(contentId);
};

const getReviewsByUser = (userId) => {
  return db.prepare(`
    SELECT r.*, c.title, c.type 
    FROM reviews r 
    JOIN content c ON r.content_id = c.id 
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
  `).all(userId);
};

const getReviewById = (id) => {
  const review = db.prepare("SELECT * FROM reviews WHERE id = ?").get(id);
  if (!review) throw new Error("Review not found");
  return review;
};

const createReview = (userId, contentId, rating, opinion) => {
  if (!rating) throw new Error("Rating is required");
  if (rating < 1 || rating > 10) throw new Error("Rating must be between 1 and 10");

  const content = db.prepare("SELECT id FROM content WHERE id = ?").get(contentId);
  if (!content) throw new Error("Content not found");

  const existing = db.prepare("SELECT id FROM reviews WHERE user_id = ? AND content_id = ?").get(userId, contentId);
  if (existing) throw new Error("You have already reviewed this content");

  const result = db.prepare(
    "INSERT INTO reviews (user_id, content_id, rating, opinion) VALUES (?, ?, ?, ?)"
  ).run(userId, contentId, rating, opinion || "");

  return getReviewById(result.lastInsertRowid);
};

const updateReview = (id, userId, rating, opinion) => {
  const review = db.prepare("SELECT * FROM reviews WHERE id = ?").get(id);
  if (!review) throw new Error("Review not found");
  if (review.user_id !== userId) throw new Error("Unauthorized");
  if (rating && (rating < 1 || rating > 10)) throw new Error("Rating must be between 1 and 10");

  db.prepare(
    "UPDATE reviews SET rating = COALESCE(?, rating), opinion = COALESCE(?, opinion) WHERE id = ?"
  ).run(rating, opinion, id);

  return getReviewById(id);
};

const deleteReview = (id, userId) => {
  const review = db.prepare("SELECT * FROM reviews WHERE id = ?").get(id);
  if (!review) throw new Error("Review not found");
  if (review.user_id !== userId) throw new Error("Unauthorized");

  db.prepare("DELETE FROM reviews WHERE id = ?").run(id);
  return { message: "Review deleted successfully" };
};

const getAverageRating = (contentId) => {
  const result = db.prepare(
    "SELECT AVG(rating) as average, COUNT(*) as total FROM reviews WHERE content_id = ?"
  ).get(contentId);
  return { average: result.average ? parseFloat(result.average.toFixed(1)) : 0, total: result.total };
};

module.exports = { getReviewsByContent, getReviewsByUser, getReviewById, createReview, updateReview, deleteReview, getAverageRating };
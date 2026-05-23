// tests/reviewService.test.js

const userService = require("../backend/services/userService");
const contentService = require("../backend/services/contentService");
const reviewService = require("../backend/services/reviewService");

let userId, contentId;

beforeAll(() => {
  const ts = Date.now();
  const db = require("../backend/db/database");

  const admin = userService.register(`rev_admin_${ts}`, `rev_admin_${ts}@test.com`, "pass123456");
  db.prepare("UPDATE users SET is_admin = 1 WHERE id = ?").run(admin.id);

  const user = userService.register(`rev_user_${ts}`, `rev_user_${ts}@test.com`, "pass123456");
  userId = user.id;

  const content = contentService.createContent(
    { title: `ReviewFilm_${ts}`, type: "film", genre: "Drama" },
    admin.id
  );
  contentId = content.id;
});

describe("reviewService", () => {

  describe("createReview()", () => {
    test("geçerli review oluşturur", () => {
      const review = reviewService.createReview(userId, contentId, 8, "Harika bir film");
      expect(review).toHaveProperty("id");
      expect(review.rating).toBe(8);
      expect(review.opinion).toBe("Harika bir film");
    });

    test("aynı kullanıcı aynı içeriğe iki kez review yapamaz", () => {
      const ts = Date.now();
      const db = require("../backend/db/database");
      const admin = userService.register(`rev2_admin_${ts}`, `rev2_admin_${ts}@test.com`, "pass123456");
      db.prepare("UPDATE users SET is_admin = 1 WHERE id = ?").run(admin.id);
      const u = userService.register(`rev2_user_${ts}`, `rev2_user_${ts}@test.com`, "pass123456");
      const c = contentService.createContent({ title: `DupFilm_${ts}`, type: "film" }, admin.id);

      reviewService.createReview(u.id, c.id, 7, "İlk review");
      expect(() => {
        reviewService.createReview(u.id, c.id, 9, "İkinci review");
      }).toThrow();
    });

    test("1-10 dışında rating hata fırlatır", () => {
      const ts = Date.now();
      const db = require("../backend/db/database");
      const admin = userService.register(`rev3_admin_${ts}`, `rev3_admin_${ts}@test.com`, "pass123456");
      db.prepare("UPDATE users SET is_admin = 1 WHERE id = ?").run(admin.id);
      const u = userService.register(`rev3_user_${ts}`, `rev3_user_${ts}@test.com`, "pass123456");
      const c = contentService.createContent({ title: `RatingFilm_${ts}`, type: "film" }, admin.id);

      expect(() => {
        reviewService.createReview(u.id, c.id, 11, "Geçersiz rating");
      }).toThrow();
    });
  });

  describe("getReviewsByContent()", () => {
    test("içeriğe ait review'ları getirir", () => {
      const reviews = reviewService.getReviewsByContent(contentId);
      expect(Array.isArray(reviews)).toBe(true);
    });
  });

  describe("getAverageRating()", () => {
    test("ortalama rating döner", () => {
      const avg = reviewService.getAverageRating(contentId);
      expect(avg).toHaveProperty("average");
    });
  });

  describe("updateReview()", () => {
    let reviewId;
    let ownerId;

    beforeAll(() => {
      const ts = Date.now();
      const db = require("../backend/db/database");
      const admin = userService.register(`uprev_admin_${ts}`, `uprev_admin_${ts}@test.com`, "pass123456");
      db.prepare("UPDATE users SET is_admin = 1 WHERE id = ?").run(admin.id);
      const u = userService.register(`uprev_user_${ts}`, `uprev_user_${ts}@test.com`, "pass123456");
      ownerId = u.id;
      const c = contentService.createContent({ title: `UpdFilm_${ts}`, type: "film" }, admin.id);
      const r = reviewService.createReview(u.id, c.id, 6, "Orta");
      reviewId = r.id;
    });

    test("rating ve opinion güncellenir", () => {
      const updated = reviewService.updateReview(reviewId, ownerId, 9, "Çok iyi aslında");
      expect(updated.rating).toBe(9);
      expect(updated.opinion).toBe("Çok iyi aslında");
    });

    test("başka kullanıcının review'ını güncelleyemez", () => {
      const ts = Date.now();
      const other = userService.register(`other_${ts}`, `other_${ts}@test.com`, "pass123456");
      expect(() => {
        reviewService.updateReview(reviewId, other.id, 1, "Hack");
      }).toThrow();
    });
  });

  describe("deleteReview()", () => {
    test("başka kullanıcının review'ını silemez", () => {
      const ts = Date.now();
      const db = require("../backend/db/database");
      const admin = userService.register(`delrev_admin_${ts}`, `delrev_admin_${ts}@test.com`, "pass123456");
      db.prepare("UPDATE users SET is_admin = 1 WHERE id = ?").run(admin.id);
      const u = userService.register(`delrev_u_${ts}`, `delrev_u_${ts}@test.com`, "pass123456");
      const attacker = userService.register(`attacker_${ts}`, `attacker_${ts}@test.com`, "pass123456");
      const c = contentService.createContent({ title: `DelFilm_${ts}`, type: "film" }, admin.id);
      const r = reviewService.createReview(u.id, c.id, 5, "Normal");

      expect(() => {
        reviewService.deleteReview(r.id, attacker.id);
      }).toThrow();
    });
  });
});
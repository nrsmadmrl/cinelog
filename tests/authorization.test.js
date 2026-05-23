// tests/authorization.test.js
// 🔐 GÜVENLİK TESTLERİ

const request = require("supertest");
const app = require("../backend/app");
const userService = require("../backend/services/userService");

let userA, userB, adminUser;
let tokenA, tokenB, tokenAdmin;

beforeAll(() => {
  const ts = Date.now();

  // Kullanıcı A
  const resultA = userService.register(`user_a_${ts}`, `user_a_${ts}@test.com`, "pass123456");
  userA = resultA; // { id, username, email }
  tokenA = userService.login(`user_a_${ts}@test.com`, "pass123456").token;

  // Kullanıcı B
  const resultB = userService.register(`user_b_${ts}`, `user_b_${ts}@test.com`, "pass123456");
  userB = resultB;
  tokenB = userService.login(`user_b_${ts}@test.com`, "pass123456").token;

  // Admin kullanıcısı
  const resultAdmin = userService.register(`admin_${ts}`, `admin_${ts}@test.com`, "adminpass123");
  adminUser = resultAdmin;

  // DB'de admin yap
  const db = require("../backend/db/database");
  db.prepare("UPDATE users SET is_admin = 1 WHERE id = ?").run(adminUser.id);

  // Admin token'ını yenile (is_admin: 1 ile)
  tokenAdmin = userService.login(`admin_${ts}@test.com`, "adminpass123").token;
});

// user authorization testleri

describe("PUT /api/users/:id — Sahiplik Kontrolü", () => {
  test("❌ Kullanıcı A, Kullanıcı B'nin profilini güncelleyemez (403)", async () => {
    const res = await request(app)
      .put(`/api/users/${userB.id}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ bio: "Hacked bio" });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  test("✅ Kullanıcı A, kendi profilini güncelleyebilir (200)", async () => {
    const res = await request(app)
      .put(`/api/users/${userA.id}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ bio: "Kendi bio" });

    expect(res.status).toBe(200);
  });

  test("✅ Admin, herhangi bir kullanıcıyı güncelleyebilir (200)", async () => {
    const res = await request(app)
      .put(`/api/users/${userB.id}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ bio: "Admin updated" });

    expect(res.status).toBe(200);
  });

  test("❌ Token olmadan profil güncellenemez (401)", async () => {
    const res = await request(app)
      .put(`/api/users/${userA.id}`)
      .send({ bio: "No token" });

    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/users/:id — Sahiplik Kontrolü", () => {
  test("❌ Kullanıcı A, Kullanıcı B'yi silemez (403)", async () => {
    const res = await request(app)
      .delete(`/api/users/${userB.id}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  test("❌ Token olmadan kullanıcı silinemez (401)", async () => {
    const res = await request(app)
      .delete(`/api/users/${userA.id}`);

    expect(res.status).toBe(401);
  });
});

//content authorization testleri

describe("POST /api/content — Sadece Admin İçerik Ekleyebilir", () => {
  const newContent = {
    title: "Test Film",
    type: "film",
    genre: "Drama",
    release_year: 2024,
    description: "Test açıklaması",
  };

  test("❌ Normal kullanıcı içerik ekleyemez (403)", async () => {
    const res = await request(app)
      .post("/api/content")
      .set("Authorization", `Bearer ${tokenA}`)
      .send(newContent);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  test("✅ Admin içerik ekleyebilir (201)", async () => {
    const res = await request(app)
      .post("/api/content")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send(newContent);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
  });

  test("❌ Token olmadan içerik eklenemez (401)", async () => {
    const res = await request(app)
      .post("/api/content")
      .send(newContent);

    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/content/:id — Sadece Admin Silebilir", () => {
  let contentId;

  beforeAll(async () => {
    const res = await request(app)
      .post("/api/content")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ title: "Silinecek Film", type: "film", genre: "Test", release_year: 2020 });
    contentId = res.body.id;
  });

  test("❌ Normal kullanıcı içerik silemez (403)", async () => {
    const res = await request(app)
      .delete(`/api/content/${contentId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(403);
  });

  test("✅ Admin içerik silebilir (200)", async () => {
    const res = await request(app)
      .delete(`/api/content/${contentId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
  });
});

afterAll((done) => {
  app.close ? app.close(done) : done();
});
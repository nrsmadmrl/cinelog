// tests/contentService.test.js

const userService = require("../backend/services/userService");
const contentService = require("../backend/services/contentService");

let adminId;

beforeAll(() => {
  const ts = Date.now();
  const db = require("../backend/db/database");

  const admin = userService.register(`cont_admin_${ts}`, `cont_admin_${ts}@test.com`, "pass123456");
  adminId = admin.id;
  db.prepare("UPDATE users SET is_admin = 1 WHERE id = ?").run(adminId);
});

describe("contentService", () => {

  describe("createContent()", () => {
    test("geçerli verilerle içerik oluşturur", () => {
      const content = contentService.createContent(
        { title: "Inception", type: "film", genre: "Sci-Fi", release_year: 2010 },
        adminId
      );
      expect(content).toHaveProperty("id");
      expect(content.title).toBe("Inception");
      expect(content.type).toBe("film");
    });

    test("title eksikse hata fırlatır", () => {
      expect(() => {
        contentService.createContent({ type: "film" }, adminId);
      }).toThrow("Title and type are required");
    });

    test("geçersiz type değeri hata fırlatır", () => {
      expect(() => {
        contentService.createContent({ title: "Test", type: "book" }, adminId);
      }).toThrow("Type must be film, series or music");
    });

    test("geçersiz release_year hata fırlatır", () => {
      expect(() => {
        contentService.createContent({ title: "Test", type: "film", release_year: 1700 }, adminId);
      }).toThrow("Invalid release year");
    });
  });

  describe("getAllContent()", () => {
    beforeAll(() => {
      const ts = Date.now();
      contentService.createContent({ title: `Film_${ts}`, type: "film", genre: "Action" }, adminId);
      contentService.createContent({ title: `Series_${ts}`, type: "series", genre: "Drama" }, adminId);
      contentService.createContent({ title: `Music_${ts}`, type: "music", genre: "Pop" }, adminId);
    });

    test("tüm içerikleri getirir", () => {
      const all = contentService.getAllContent();
      expect(Array.isArray(all)).toBe(true);
      expect(all.length).toBeGreaterThan(0);
    });

    test("type filtresi ile sadece filmleri getirir", () => {
      const films = contentService.getAllContent("film");
      films.forEach((c) => expect(c.type).toBe("film"));
    });

    test("search ile başlığa göre arama yapar", () => {
      const ts = Date.now();
      contentService.createContent({ title: `UniqueTitle_${ts}`, type: "film" }, adminId);
      const results = contentService.getAllContent(null, `UniqueTitle_${ts}`);
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].title).toContain(`UniqueTitle_${ts}`);
    });
  });

  describe("getContentById()", () => {
    let contentId;

    beforeAll(() => {
      const c = contentService.createContent({ title: "GetById Film", type: "film" }, adminId);
      contentId = c.id;
    });

    test("var olan içeriği getirir", () => {
      const content = contentService.getContentById(contentId);
      expect(content.id).toBe(contentId);
    });

    test("olmayan ID için hata fırlatır", () => {
      expect(() => contentService.getContentById(999999)).toThrow();
    });
  });

  describe("updateContent()", () => {
    let contentId;

    beforeAll(() => {
      const c = contentService.createContent({ title: "Update Test", type: "series" }, adminId);
      contentId = c.id;
    });

    test("başlığı günceller", () => {
      const updated = contentService.updateContent(contentId, { title: "Updated Title" }, adminId);
      expect(updated.title).toBe("Updated Title");
    });
  });

  describe("deleteContent()", () => {
    test("içeriği siler ve sonrasında bulunamaz", () => {
      const c = contentService.createContent({ title: "Delete Me", type: "music" }, adminId);
      contentService.deleteContent(c.id, adminId);
      expect(() => contentService.getContentById(c.id)).toThrow();
    });
  });
});
// tests/userService.test.js

const userService = require("../backend/services/userService");

describe("userService", () => {

  // ─── REGISTER ───────────────────────────────────────────────────────────────

  describe("register()", () => {
    const ts = Date.now();

    test("geçerli bilgilerle kullanıcı kaydeder ve id döner", () => {
      const result = userService.register(
        `testuser_${ts}`,
        `test_${ts}@example.com`,
        "password123"
      );
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("username", `testuser_${ts}`);
      expect(result).toHaveProperty("email", `test_${ts}@example.com`);
      expect(result).not.toHaveProperty("password");
    });

    test("aynı email ile tekrar kayıt yapılırsa hata fırlatır", () => {
      const email = `dup_${ts}@example.com`;
      userService.register(`user_a_${ts}`, email, "pass123456");
      expect(() => {
        userService.register(`user_b_${ts}`, email, "pass123456");
      }).toThrow("Username or email already exists");
    });

    test("aynı username ile tekrar kayıt yapılırsa hata fırlatır", () => {
      const username = `sameuser_${ts}`;
      userService.register(username, `email_a_${ts}@example.com`, "pass123456");
      expect(() => {
        userService.register(username, `email_b_${ts}@example.com`, "pass123456");
      }).toThrow("Username or email already exists");
    });

    test("username eksikse hata fırlatır", () => {
      expect(() => {
        userService.register("", `empty_${ts}@example.com`, "pass123456");
      }).toThrow("All fields are required");
    });

    test("email eksikse hata fırlatır", () => {
      expect(() => {
        userService.register(`nomail_${ts}`, "", "pass123456");
      }).toThrow("All fields are required");
    });

    test("şifre 6 karakterden kısaysa hata fırlatır", () => {
      expect(() => {
        userService.register(`shortpass_${ts}`, `shortpass_${ts}@example.com`, "abc");
      }).toThrow("Password must be at least 6 characters");
    });

    test("geçersiz email formatı hata fırlatır", () => {
      expect(() => {
        userService.register(`bademail_${ts}`, "notanemail", "pass123456");
      }).toThrow("Invalid email format");
    });
  });

  // ─── LOGIN ───────────────────────────────────────────────────────────────────

  describe("login()", () => {
    const ts = Date.now() + 1;
    const email = `login_${ts}@example.com`;
    const password = "securepass123";

    beforeAll(() => {
      userService.register(`loginuser_${ts}`, email, password);
    });

    test("doğru bilgilerle giriş yapınca token ve user döner", () => {
      const result = userService.login(email, password);
      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("user");
      expect(result.user).toHaveProperty("id");
      expect(result.user.email).toBe(email);
      expect(result.user).not.toHaveProperty("password");
    });

    test("yanlış şifre ile giriş yapınca hata fırlatır", () => {
      expect(() => {
        userService.login(email, "wrong_password");
      }).toThrow("Invalid email or password");
    });

    test("kayıtlı olmayan email ile giriş yapınca hata fırlatır", () => {
      expect(() => {
        userService.login("nobody@example.com", "anypass123");
      }).toThrow("Invalid email or password");
    });
  });

  // ─── GET USER ────────────────────────────────────────────────────────────────

  describe("getUserById()", () => {
    let userId;
    const ts = Date.now() + 2;

    beforeAll(() => {
      const result = userService.register(
        `getuser_${ts}`,
        `getuser_${ts}@example.com`,
        "pass123456"
      );
      userId = result.id;
    });

    test("var olan kullanıcıyı ID ile getirir", () => {
      const user = userService.getUserById(userId);
      expect(user).toHaveProperty("id", userId);
      expect(user).not.toHaveProperty("password");
    });

    test("olmayan ID için hata fırlatır", () => {
      expect(() => {
        userService.getUserById(999999);
      }).toThrow();
    });
  });

  // ─── UPDATE USER ─────────────────────────────────────────────────────────────

  describe("updateUser()", () => {
    let userId;
    const ts = Date.now() + 3;

    beforeAll(() => {
      const result = userService.register(
        `updateme_${ts}`,
        `updateme_${ts}@example.com`,
        "pass123456"
      );
      userId = result.id;
    });

    test("bio güncellenir", () => {
      const updated = userService.updateUser(userId, { bio: "Yeni bio" });
      expect(updated.bio).toBe("Yeni bio");
    });

    test("olmayan kullanıcı güncellenince hata fırlatır", () => {
      expect(() => {
        userService.updateUser(999999, { bio: "test" });
      }).toThrow();
    });
  });

});
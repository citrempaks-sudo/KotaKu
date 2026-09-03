/**
 * Test dasar untuk endpoint autentikasi (/api/auth/*).
 *
 * Sebelum meng-import server.js, kita salin kotaku.db ke file sementara
 * dan arahkan DB_PATH ke situ, supaya:
 *  - tes tidak menulis/mengotori database asli di repo
 *  - tiap kali test suite dijalankan mulai dari kondisi bersih
 */
const path = require("path");
const fs = require("fs");
const os = require("os");

const ORIGINAL_DB = path.join(__dirname, "..", "kotaku.db");
const TEST_DB_PATH = path.join(
  os.tmpdir(),
  `kotaku-test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`
);
fs.copyFileSync(ORIGINAL_DB, TEST_DB_PATH);

process.env.DB_PATH = TEST_DB_PATH;
process.env.JWT_SECRET = process.env.JWT_SECRET || "ci-test-secret-key-not-for-production";
process.env.ADMIN_USERNAME = process.env.ADMIN_USERNAME || "ci-test-admin";

const request = require("supertest");
const app = require("../server");

afterAll(() => {
  for (const suffix of ["", "-shm", "-wal"]) {
    try {
      fs.unlinkSync(TEST_DB_PATH + suffix);
    } catch (err) {
      // file mungkin memang tidak ada, aman diabaikan
    }
  }
});

describe("POST /api/auth/register", () => {
  const newUser = {
    username: `testuser_${Date.now()}`,
    password: "password123",
    email: "testuser@example.com",
  };

  it("berhasil membuat akun baru dan mengembalikan token", async () => {
    const res = await request(app).post("/api/auth/register").send(newUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toMatchObject({
      username: newUser.username,
      email: newUser.email,
    });
  });

  it("menolak jika username sudah dipakai (409)", async () => {
    const res = await request(app).post("/api/auth/register").send(newUser);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/sudah dipakai/i);
  });

  it("menolak jika password kurang dari 6 karakter (400)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: `shortpw_${Date.now()}`, password: "123" });

    expect(res.status).toBe(400);
  });

  it("menolak jika username kurang dari 3 karakter (400)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "ab", password: "password123" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  const existingUser = {
    username: `logintest_${Date.now()}`,
    password: "password123",
  };

  beforeAll(async () => {
    await request(app).post("/api/auth/register").send(existingUser);
  });

  it("berhasil login dengan kredensial yang benar", async () => {
    const res = await request(app).post("/api/auth/login").send(existingUser);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.username).toBe(existingUser.username);
  });

  it("menolak login dengan password salah (401)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: existingUser.username, password: "passwordsalah" });

    expect(res.status).toBe(401);
  });

  it("menolak login dengan username yang tidak terdaftar (401)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "user_tidak_ada_xyz", password: "apapun123" });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  const user = {
    username: `metest_${Date.now()}`,
    password: "password123",
  };
  let token;

  beforeAll(async () => {
    const res = await request(app).post("/api/auth/register").send(user);
    token = res.body.token;
  });

  it("menolak tanpa token (401)", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("menolak dengan token acak/tidak valid (401)", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer token-ngasal-tidak-valid");
    expect(res.status).toBe(401);
  });

  it("berhasil mengembalikan data user dengan token valid", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe(user.username);
  });
});

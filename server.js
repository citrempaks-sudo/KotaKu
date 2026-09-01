require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const PORT = process.env.PORT || 3000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "";
const JWT_SECRET = process.env.JWT_SECRET || "";
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "kotaku.db");
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000")
  .split(",")
  .map((s) => s.trim());

if (!ADMIN_USERNAME) {
  console.warn(
    "[PERINGATAN] ADMIN_USERNAME belum diset di .env — belum ada akun admin sampai kamu mengisinya. Isi dengan username SATU akun yang boleh jadi admin (akun itu harus sudah/nanti didaftarkan)."
  );
}
if (!JWT_SECRET) {
  console.warn(
    "[PERINGATAN] JWT_SECRET belum diset di .env — login/daftar akun tidak akan bisa dipakai sampai kamu mengisinya."
  );
}

if (!fs.existsSync(DB_PATH)) {
  console.error(`[ERROR] Database tidak ditemukan di: ${DB_PATH}`);
  console.error("Jalankan 'python create_database.py' dulu untuk membuat kotaku.db.");
  process.exit(1);
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    email         TEXT,
    password_hash TEXT NOT NULL,
    created_at    TEXT DEFAULT (datetime('now', 'localtime'))
  )
`);

const userColumns = db.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
if (!userColumns.includes("display_name")) {
  db.exec("ALTER TABLE users ADD COLUMN display_name TEXT");
}
if (!userColumns.includes("avatar")) {
  db.exec("ALTER TABLE users ADD COLUMN avatar TEXT");
}
if (!userColumns.includes("bio")) {
  db.exec("ALTER TABLE users ADD COLUMN bio TEXT");
}

const reportColumns = db.prepare("PRAGMA table_info(reports)").all().map((c) => c.name);
if (!reportColumns.includes("user_id")) {
  db.exec("ALTER TABLE reports ADD COLUMN user_id INTEGER REFERENCES users(id)");
}

const app = express();
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://cdn.tailwindcss.com",
          "https://cdn.jsdelivr.net",
          "https://unpkg.com",
          "https://cdnjs.cloudflare.com",
        ],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdnjs.cloudflare.com",
          "https://unpkg.com",
          "https://fonts.googleapis.com",
        ],
        imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https:"],
        fontSrc: [
          "'self'",
          "data:",
          "https://cdnjs.cloudflare.com",
          "https://fonts.gstatic.com",
        ],
        connectSrc: [
          "'self'",
          "https://cdn.jsdelivr.net",
          "https://unpkg.com",
          "https://storage.googleapis.com",
          "https://tfhub.dev",
          "https://www.kaggle.com",
          "https://kaggle.com",
        ],
      },
    },
  })
);
app.disable("x-powered-by");

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error("Origin tidak diizinkan oleh CORS"));
    },
  })
);

app.use(express.json({ limit: "2mb" }));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak permintaan, coba lagi nanti." },
});
app.use(generalLimiter);

const createReportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 jam
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak laporan dikirim, coba lagi nanti." },
});

function requireAdmin(req, res, next) {
  if (!JWT_SECRET) return res.status(503).json({ error: "Server belum siap: JWT_SECRET belum diset." });
  if (!ADMIN_USERNAME) return res.status(401).json({ error: "Tidak diizinkan. ADMIN_USERNAME belum diset di server." });

  const header = req.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Tidak diizinkan. Masuk dulu dengan akun admin." });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.username !== ADMIN_USERNAME) {
      return res.status(403).json({ error: "Akun ini bukan admin." });
    }
    req.userId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Sesi tidak valid atau kedaluwarsa, silakan masuk kembali." });
  }
}

app.get("/api/admin/verify", requireAdmin, (req, res) => {
  res.json({ ok: true });
});

const all = (sql, ...params) => db.prepare(sql).all(...params);
const get = (sql, ...params) => db.prepare(sql).get(...params);
const run = (sql, ...params) => db.prepare(sql).run(...params);

const MAX_TEXT = 500;
const MAX_DESC = 3000;

function cleanText(value, maxLen) {
  if (typeof value !== "string") return "";
  const stripped = value.replace(/<[^>]*>/g, "").trim();
  return stripped.slice(0, maxLen);
}

function isFiniteNumber(n) {
  return typeof n === "number" && Number.isFinite(n);
}

function validateReportPayload(body, { partial = false } = {}) {
  const errors = [];
  const out = {};

  if (!partial || body.lat !== undefined) {
    const lat = Number(body.lat);
    if (!isFiniteNumber(lat) || lat < -90 || lat > 90) errors.push("lat tidak valid");
    out.lat = lat;
  }
  if (!partial || body.lng !== undefined) {
    const lng = Number(body.lng);
    if (!isFiniteNumber(lng) || lng < -180 || lng > 180) errors.push("lng tidak valid");
    out.lng = lng;
  }
  if (!partial || body.title !== undefined) {
    const title = cleanText(body.title, MAX_TEXT);
    if (!title) errors.push("title wajib diisi");
    out.title = title;
  }
  if (!partial || body.description !== undefined) {
    out.description = cleanText(body.description, MAX_DESC);
  }
  if (!partial || body.date !== undefined) {
    const date = cleanText(body.date, 50);
    if (!date) errors.push("date wajib diisi");
    out.date = date;
  }
  if (body.image !== undefined) {
    const image = typeof body.image === "string" ? body.image.trim() : "";
    if (image === "") {
      out.image = "";
    } else if (/^data:image\/(png|jpe?g|webp|gif);base64,[a-zA-Z0-9+/=]+$/.test(image)) {
      if (image.length > 1_500_000) {
        errors.push("Ukuran foto laporan terlalu besar, coba unggah foto lain.");
      } else {
        out.image = image;
      }
    } else if (/^https?:\/\//i.test(image)) {
      out.image = image.slice(0, 1000);
    } else {
      errors.push("image harus berupa URL http/https atau foto yang diunggah");
    }
  }
  if (body.status !== undefined) {
    const allowedStatus = ["Laporan Baru", "Belum Ditangani", "Proses Perbaikan", "Selesai"];
    out.status = allowedStatus.includes(body.status) ? body.status : "Laporan Baru";
  }

  return { errors, data: out };
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak percobaan, coba lagi nanti." },
});

function cleanUsername(value) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 50);
}

app.post("/api/auth/register", authLimiter, async (req, res) => {
  if (!JWT_SECRET) return res.status(503).json({ error: "Server belum siap: JWT_SECRET belum diset." });

  const username = cleanUsername(req.body?.username);
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const email = cleanText(req.body?.email, 200);

  if (username.length < 3) return res.status(400).json({ error: "Username minimal 3 karakter" });
  if (password.length < 6) return res.status(400).json({ error: "Password minimal 6 karakter" });

  const existing = get("SELECT id FROM users WHERE username = ?", username);
  if (existing) return res.status(409).json({ error: "Username sudah dipakai" });

  const passwordHash = await bcrypt.hash(password, 10);
  const info = run(
    "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
    username,
    email || null,
    passwordHash
  );

  const token = jwt.sign({ sub: info.lastInsertRowid, username }, JWT_SECRET, { expiresIn: "7d" });
  res.status(201).json({
    token,
    user: { id: info.lastInsertRowid, username, email: email || null, display_name: null, avatar: null, bio: null },
  });
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  if (!JWT_SECRET) return res.status(503).json({ error: "Server belum siap: JWT_SECRET belum diset." });

  const username = cleanUsername(req.body?.username);
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  const user = get("SELECT * FROM users WHERE username = ?", username);
  if (!user) return res.status(401).json({ error: "Username atau password salah" });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: "Username atau password salah" });

  const token = jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.display_name,
      avatar: user.avatar,
      bio: user.bio,
    },
  });
});

function authenticateToken(req, res, next) {
  if (!JWT_SECRET) return res.status(503).json({ error: "Server belum siap: JWT_SECRET belum diset." });

  const header = req.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Token tidak ditemukan, silakan masuk kembali." });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Sesi tidak valid atau kedaluwarsa, silakan masuk kembali." });
  }
}

function authenticateOptional(req, res, next) {
  const header = req.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token && JWT_SECRET) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.userId = payload.sub;
    } catch (err) {
      // Token tidak valid/kedaluwarsa -> anggap tamu, jangan blokir laporan
    }
  }
  next();
}

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    display_name: row.display_name,
    avatar: row.avatar,
    bio: row.bio,
    created_at: row.created_at,
  };
}

app.get("/api/auth/me", authenticateToken, (req, res) => {
  const user = get("SELECT * FROM users WHERE id = ?", req.userId);
  if (!user) return res.status(404).json({ error: "Akun tidak ditemukan." });
  res.json({ user: publicUser(user) });
});

app.put("/api/auth/profile", authenticateToken, (req, res) => {
  const user = get("SELECT * FROM users WHERE id = ?", req.userId);
  if (!user) return res.status(404).json({ error: "Akun tidak ditemukan." });

  const errors = [];
  const updates = {};

  if (req.body?.display_name !== undefined) {
    const displayName = cleanText(req.body.display_name, 50);
    updates.display_name = displayName || null;
  }

  if (req.body?.bio !== undefined) {
    updates.bio = cleanText(req.body.bio, 160) || null;
  }

  if (req.body?.email !== undefined) {
    updates.email = cleanText(req.body.email, 200) || null;
  }

  if (req.body?.avatar !== undefined) {
    const avatar = typeof req.body.avatar === "string" ? req.body.avatar.trim() : "";
    if (avatar === "") {
      updates.avatar = null; 
    } else if (/^avatar-preset:[a-z0-9-]{1,30}$/i.test(avatar)) {
      updates.avatar = avatar;
    } else if (/^data:image\/(png|jpe?g|webp);base64,[a-zA-Z0-9+/=]+$/.test(avatar)) {
      if (avatar.length > 900 * 1024) {
        errors.push("Ukuran foto profil terlalu besar. Coba unggah foto lain.");
      } else {
        updates.avatar = avatar;
      }
    } else {
      errors.push("Format foto profil tidak valid.");
    }
  }

  if (errors.length) return res.status(400).json({ error: errors.join(", ") });
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "Tidak ada perubahan untuk disimpan." });
  }

  const fields = Object.keys(updates);
  const setClause = fields.map((f) => `${f} = ?`).join(", ");
  const values = fields.map((f) => updates[f]);
  run(`UPDATE users SET ${setClause} WHERE id = ?`, ...values, req.userId);

  const updated = get("SELECT * FROM users WHERE id = ?", req.userId);
  res.json({ user: publicUser(updated) });
});

app.put("/api/auth/password", authLimiter, authenticateToken, async (req, res) => {
  const user = get("SELECT * FROM users WHERE id = ?", req.userId);
  if (!user) return res.status(404).json({ error: "Akun tidak ditemukan." });

  const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
  const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) return res.status(401).json({ error: "Password saat ini salah." });
  if (newPassword.length < 6) return res.status(400).json({ error: "Password baru minimal 6 karakter." });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  run("UPDATE users SET password_hash = ? WHERE id = ?", passwordHash, req.userId);
  res.json({ ok: true });
});

app.get("/api/reports", (req, res) => {
  res.json(all("SELECT * FROM reports ORDER BY id DESC"));
});

app.get("/api/reports/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "ID tidak valid" });
  const row = get("SELECT * FROM reports WHERE id = ?", id);
  if (!row) return res.status(404).json({ error: "Laporan tidak ditemukan" });
  res.json(row);
});

app.post("/api/reports", createReportLimiter, authenticateOptional, (req, res) => {
  const { errors, data } = validateReportPayload(req.body || {});
  if (errors.length) return res.status(400).json({ error: errors.join(", ") });

  const info = run(
    `INSERT INTO reports (lat, lng, title, description, image, status, date, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    data.lat,
    data.lng,
    data.title,
    data.description || "",
    data.image || "",
    data.status || "Laporan Baru",
    data.date,
    req.userId || null
  );
  res.status(201).json({ id: info.lastInsertRowid, message: "Laporan berhasil dibuat" });
});

app.put("/api/reports/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "ID tidak valid" });

  const existing = get("SELECT * FROM reports WHERE id = ?", id);
  if (!existing) return res.status(404).json({ error: "Laporan tidak ditemukan" });

  const { errors, data } = validateReportPayload(req.body || {}, { partial: true });
  if (errors.length) return res.status(400).json({ error: errors.join(", ") });

  run(
    `UPDATE reports SET lat=?, lng=?, title=?, description=?, image=?, status=?, date=?
     WHERE id=?`,
    data.lat ?? existing.lat,
    data.lng ?? existing.lng,
    data.title ?? existing.title,
    data.description ?? existing.description,
    data.image ?? existing.image,
    data.status ?? existing.status,
    data.date ?? existing.date,
    id
  );
  res.json({ message: "Laporan diperbarui" });
});

app.delete("/api/reports/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "ID tidak valid" });

  const existing = get("SELECT * FROM reports WHERE id = ?", id);
  if (!existing) return res.status(404).json({ error: "Laporan tidak ditemukan" });

  const header = req.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token || !JWT_SECRET) {
    return res.status(401).json({ error: "Tidak diizinkan. Masuk dulu untuk menghapus laporan." });
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: "Sesi tidak valid atau kedaluwarsa, silakan masuk kembali." });
  }

  const isAdmin = Boolean(ADMIN_USERNAME) && payload.username === ADMIN_USERNAME;
  const isOwner = Boolean(existing.user_id) && existing.user_id === payload.sub;

  if (!isAdmin && !isOwner) {
    return res.status(403).json({ error: "Kamu hanya bisa menghapus laporan milikmu sendiri." });
  }

  const info = run("DELETE FROM reports WHERE id = ?", id);
  if (info.changes === 0) return res.status(404).json({ error: "Laporan tidak ditemukan" });
  res.json({ message: "Laporan dihapus" });
});

app.get("/api/waste", (req, res) => {
  res.json(all("SELECT * FROM waste_materials"));
});

app.get("/api/waste/:code", (req, res) => {
  const code = cleanText(req.params.code, 50);
  const row = get("SELECT * FROM waste_materials WHERE code = ?", code);
  if (!row) return res.status(404).json({ error: "Material tidak ditemukan" });
  res.json(row);
});

app.get("/api/ai-library", (req, res) => {
  res.json(
    all(
      `SELECT l.id, l.name, l.description, l.unit,
              w.code AS material_code, w.price_per_kg,
              w.co2_per_kg, w.energy_per_kg, w.weight_per_item,
              w.is_weight_input
       FROM ai_waste_library l
       LEFT JOIN waste_materials w ON l.material_id = w.id`
    )
  );
});

app.get("/api/schedules", (req, res) => {
  res.json(all("SELECT * FROM repair_schedules"));
});

app.get("/api/schedules/:date", (req, res) => {
  const date = cleanText(req.params.date, 50);
  const rows = all("SELECT * FROM repair_schedules WHERE schedule_date = ?", date);
  if (rows.length === 0) return res.status(404).json({ error: "Jadwal tidak ditemukan" });
  res.json(rows);
});

app.get("/api/stats", (req, res) => {
  res.json({
    total_reports: db.prepare("SELECT COUNT(*) AS c FROM reports").get().c,
    total_reports_pending: db.prepare("SELECT COUNT(*) AS c FROM reports WHERE status != 'Selesai'").get().c,
    total_schedules: db.prepare("SELECT COUNT(*) AS c FROM repair_schedules").get().c,
    total_materials: db.prepare("SELECT COUNT(*) AS c FROM waste_materials").get().c,
  });
});

const PUBLIC_DIR = path.join(__dirname, "public");
const INDEX_FILE = path.join(PUBLIC_DIR, "index.html");
const HAS_PUBLIC = fs.existsSync(PUBLIC_DIR);
const HAS_INDEX = fs.existsSync(INDEX_FILE);

console.log(`[INFO] Folder public ditemukan: ${HAS_PUBLIC ? "YA (" + PUBLIC_DIR + ")" : "TIDAK"}`);
console.log(`[INFO] index.html ditemukan: ${HAS_INDEX ? "YA" : "TIDAK"}`);

app.get("/", (req, res) => {
  if (HAS_INDEX) return res.sendFile(INDEX_FILE);
  res.json({
    app: "EcoHub API",
    status: "running",
    catatan: HAS_PUBLIC
      ? "Folder public ada tapi index.html tidak ditemukan di dalamnya."
      : "Folder public belum ada di samping server.js.",
    endpoints: [
      "GET /api/admin/verify  (butuh login sebagai akun admin)",
      "GET /api/reports",
      "POST /api/reports",
      "GET /api/reports/:id",
      "PUT /api/reports/:id  (butuh login sebagai akun admin)",
      "DELETE /api/reports/:id  (admin, atau pembuat laporan sendiri)",
      "GET /api/waste",
      "GET /api/waste/:code",
      "GET /api/ai-library",
      "GET /api/schedules",
      "GET /api/schedules/:date",
      "GET /api/stats",
    ],
  });
});

if (HAS_PUBLIC) {
  app.use(express.static(PUBLIC_DIR));
}

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ error: "Terjadi kesalahan pada server" });
});

if (require.main === module) {

  app.listen(PORT, () => {
    console.log("=".repeat(50));
    console.log(`EcoHub API berjalan di http://localhost:${PORT}`);
    console.log(`Database: ${DB_PATH}`);
    console.log("=".repeat(50));
  });
}

module.exports = app;
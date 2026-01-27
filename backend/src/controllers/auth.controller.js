const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../services/mysql");

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-prod";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "12h";

async function ensureUserSchema() {
  await db.query(`CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(64) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin','ministry') NOT NULL DEFAULT 'ministry',
    status ENUM('active','disabled') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);
}

async function seedDefaultAdmin() {
  await ensureUserSchema();
  const existing = await db.query(
    "SELECT id FROM users WHERE role = ? LIMIT 1",
    ["admin"],
  );
  if (existing.length) return;

  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const hash = await bcrypt.hash(password, 10);
  await db.query(
    "INSERT INTO users (username, password_hash, role, status) VALUES (?, ?, ?, ?)",
    [username, hash, "admin", "active"],
  );
  console.log(`Seeded default admin user: ${username}`);
}

async function login(req, res) {
  try {
    await seedDefaultAdmin();
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res
        .status(400)
        .json({ success: false, error: "username and password are required" });
    }

    const users = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (!users.length) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const user = users[0];
    if (user.status !== "active") {
      return res
        .status(403)
        .json({ success: false, error: "User is disabled" });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { sub: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
      },
      token,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, error: "Failed to login", message: err.message });
  }
}

module.exports = { login, ensureUserSchema, seedDefaultAdmin };

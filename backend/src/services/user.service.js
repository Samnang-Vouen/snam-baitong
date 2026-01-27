const bcrypt = require('bcryptjs');
const { query, getConnection } = require('./mysql');

const ROLES = {
  ADMIN: 'admin',
  MINISTRY: 'ministry',
};

async function initSchema() {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin','ministry') NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS jwt_blacklist (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        jti VARCHAR(64) NOT NULL UNIQUE,
        user_id INT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_expires_at (expires_at),
        CONSTRAINT fk_jwt_blacklist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function getByEmail(email) {
  const rows = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  return rows[0] || null;
}

async function getById(id) {
  const rows = await query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function listUsers() {
  return query('SELECT id, email, role, is_active, created_at, updated_at FROM users ORDER BY id DESC');
}

async function createUser({ email, password, role }) {
  if (!email || !password || !role) {
    const err = new Error('Missing required fields');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  if (![ROLES.ADMIN, ROLES.MINISTRY].includes(role)) {
    const err = new Error('Invalid role');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  const existing = await getByEmail(email);
  if (existing) {
    const err = new Error('Email already in use');
    err.code = 'CONFLICT';
    throw err;
  }
  const password_hash = await bcrypt.hash(password, 10);
  const result = await query(
    'INSERT INTO users (email, password_hash, role) VALUES (?,?,?)',
    [email, password_hash, role]
  );
  return { id: result.insertId, email, role };
}

async function ensureInitialAdminFromEnv() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) return false;
  const existing = await getByEmail(adminEmail);
  if (existing) return false;
  await createUser({ email: adminEmail, password: adminPassword, role: ROLES.ADMIN });
  return true;
}

module.exports = {
  ROLES,
  initSchema,
  getByEmail,
  getById,
  listUsers,
  createUser,
  ensureInitialAdminFromEnv,
};

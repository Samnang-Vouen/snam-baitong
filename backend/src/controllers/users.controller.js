const bcrypt = require("bcryptjs");
const db = require("../services/mysql");
const { ensureUserSchema } = require("./auth.controller");

const ALLOWED_ROLES = ["admin", "ministry"];
const ALLOWED_STATUS = ["active", "disabled"];

function mapUser(row) {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listUsers(req, res) {
  try {
    await ensureUserSchema();
    const rows = await db.query("SELECT * FROM users ORDER BY created_at DESC");
    res.json({ success: true, data: rows.map(mapUser) });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Failed to list users",
      message: err.message,
    });
  }
}

async function createUser(req, res) {
  try {
    await ensureUserSchema();
    const { username, password, role } = req.body || {};
    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        error: "username, password and role are required",
      });
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `role must be one of: ${ALLOWED_ROLES.join(", ")}`,
      });
    }

    const existing = await db.query(
      "SELECT id FROM users WHERE username = ? LIMIT 1",
      [username],
    );
    if (existing.length) {
      return res
        .status(409)
        .json({ success: false, error: "Username already exists" });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
      [username, hash, role],
    );
    const inserted = await db.query("SELECT * FROM users WHERE id = ?", [
      result.insertId,
    ]);
    res.status(201).json({ success: true, data: mapUser(inserted[0]) });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Failed to create user",
      message: err.message,
    });
  }
}

async function updateUser(req, res) {
  try {
    await ensureUserSchema();
    const { id } = req.params;
    const { password, role, status } = req.body || {};

    const users = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    if (!users.length) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    if (role && !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `role must be one of: ${ALLOWED_ROLES.join(", ")}`,
      });
    }
    if (status && !ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `status must be one of: ${ALLOWED_STATUS.join(", ")}`,
      });
    }

    const updates = [];
    const params = [];
    if (role) {
      updates.push("role = ?");
      params.push(role);
    }
    if (status) {
      updates.push("status = ?");
      params.push(status);
    }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updates.push("password_hash = ?");
      params.push(hash);
    }

    if (!updates.length) {
      return res
        .status(400)
        .json({ success: false, error: "No fields to update" });
    }

    params.push(id);
    await db.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );

    const updated = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    res.json({ success: true, data: mapUser(updated[0]) });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Failed to update user",
      message: err.message,
    });
  }
}

async function deleteUser(req, res) {
  try {
    await ensureUserSchema();
    const { id } = req.params;
    const users = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    if (!users.length) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    await db.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Failed to delete user",
      message: err.message,
    });
  }
}

module.exports = { listUsers, createUser, updateUser, deleteUser };

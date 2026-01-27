const { ROLES, listUsers, createUser } = require('../services/user.service');

async function getUsers(req, res, next) {
  try {
    const users = await listUsers();
    return res.json({ success: true, users });
  } catch (e) {
    return next(e);
  }
}

async function postUser(req, res, next) {
  try {
    const { email, password, role } = req.body || {};
    const user = await createUser({ email, password, role });
    return res.status(201).json({ success: true, user });
  } catch (e) {
    if (e.code === 'CONFLICT') {
      return res.status(409).json({ success: false, error: e.message });
    }
    if (e.code === 'VALIDATION_ERROR') {
      return res.status(400).json({ success: false, error: e.message });
    }
    return next(e);
  }
}

module.exports = { getUsers, postUser, ROLES };

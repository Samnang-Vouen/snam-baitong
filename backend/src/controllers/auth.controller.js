const jwt = require('jsonwebtoken');
const { login, logout } = require('../services/auth.service');

async function postLogin(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'email and password are required' });
    }
    const result = await login(email, password);
    return res.json({ success: true, ...result });
  } catch (e) {
    if (e.code === 'AUTH_FAILED') {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    return next(e);
  }
}

async function postLogout(req, res, next) {
  try {
    // req.user exists from authenticate middleware; decode again to fetch exp
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1];
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.jti) {
      return res.status(400).json({ success: false, error: 'Invalid token' });
    }
    await logout(decoded);
    return res.json({ success: true });
  } catch (e) {
    return next(e);
  }
}

module.exports = { postLogin, postLogout };

const jwt = require('jsonwebtoken');
const { getJwtConfig } = require('../services/auth.service');
const { isBlacklisted } = require('../services/jwtBlacklist.service');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { secret } = getJwtConfig();
    const decoded = jwt.verify(token, secret);
    if (!decoded || !decoded.jti) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const blacklisted = await isBlacklisted(decoded.jti);
    if (blacklisted) {
      return res.status(401).json({ success: false, error: 'Token revoked' });
    }
    req.user = {
      id: Number(decoded.sub),
      email: decoded.email,
      role: decoded.role,
      jti: decoded.jti,
      token,
    };
    next();
  } catch (e) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
}

module.exports = authenticate;

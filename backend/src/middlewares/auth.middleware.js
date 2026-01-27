const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-prod";

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.substring("Bearer ".length)
    : null;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, error: "Missing authorization token" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
    };
    next();
  } catch (err) {
    res
      .status(401)
      .json({
        success: false,
        error: "Invalid or expired token",
        message: err.message,
      });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    if (roles.length === 0 || roles.includes(req.user.role)) {
      return next();
    }
    return res
      .status(403)
      .json({ success: false, error: "Forbidden for this role" });
  };
}

module.exports = { authenticate, requireRole };

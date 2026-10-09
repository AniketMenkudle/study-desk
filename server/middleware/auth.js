const { COOKIE_NAME, verifyToken } = require("../utils/token");

// Protects a route: requires a valid login cookie and sets req.userId.
function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "Please log in to continue." });
  try {
    req.userId = verifyToken(token).sub;
    next();
  } catch {
    res.status(401).json({ error: "Your session has expired. Please log in again." });
  }
}

module.exports = requireAuth;

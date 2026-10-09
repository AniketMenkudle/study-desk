const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { setAuthCookie, clearAuthCookie } = require("../utils/token");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const BCRYPT_ROUNDS = 12;
// Compared against when the email doesn't exist, so login takes the same time
// either way (stops attackers discovering which emails are registered).
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", BCRYPT_ROUNDS);

const publicUser = (u) => ({ id: String(u._id), name: u.name, email: u.email });
const cleanEmail = (v) => String(v || "").trim().toLowerCase();

// POST /api/auth/register
exports.register = async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = cleanEmail(req.body.email);
  const password = String(req.body.password || "");

  if (name.length < 2 || name.length > 60) {
    return res.status(400).json({ error: "Please enter your name (2-60 characters)." });
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }
  if (Buffer.byteLength(password) > 72) {
    return res.status(400).json({ error: "Password is too long (72 bytes maximum)." }); // bcrypt limit
  }

  if (await User.findOne({ email })) {
    return res.status(409).json({ error: "An account with this email already exists. Try logging in." });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  let user;
  try {
    user = await User.create({ name, email, passwordHash });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: "An account with this email already exists. Try logging in." });
    }
    throw err;
  }

  setAuthCookie(res, user._id);
  res.status(201).json({ user: publicUser(user) });
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const email = cleanEmail(req.body.email);
  const password = String(req.body.password || "");
  if (!email || !password) {
    return res.status(400).json({ error: "Please enter your email and password." });
  }

  const user = await User.findOne({ email }).select("+passwordHash");
  const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !ok) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  setAuthCookie(res, user._id);
  res.json({ user: publicUser(user) });
};

// POST /api/auth/logout
exports.logout = (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
};

// GET /api/auth/me  (requires login)
exports.me = async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    clearAuthCookie(res);
    return res.status(401).json({ error: "Account not found. Please log in again." });
  }
  res.json({ user: publicUser(user) });
};

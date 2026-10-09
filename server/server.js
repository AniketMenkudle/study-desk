require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const { rateLimit } = require("express-rate-limit");

const connectDB = require("./config/db");
const { getSecret } = require("./utils/token");
const requireAuth = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const aiRoutes = require("./routes/ai");
const quizRoutes = require("./routes/quizzes");
const reminderRoutes = require("./routes/reminders");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true, // lets the browser send the login cookie
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

// Slow down password guessing and protect your Gemini quota.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many attempts. Please wait a few minutes and try again." },
});
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "You're sending requests too quickly. Please wait a moment." },
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth", authRoutes);

// Everything below needs a logged-in user.
app.use("/api/ai", requireAuth, aiLimiter, aiRoutes);
app.use("/api/quizzes", requireAuth, quizRoutes);
app.use("/api/reminders", requireAuth, reminderRoutes);

// Catch-all error handler — any thrown/rejected error in a route lands here
// instead of crashing the process or leaking a raw stack trace to the client.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  try {
    getSecret(); // fail fast with a clear message if JWT_SECRET is missing
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  connectDB()
    .then(() => {
      app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
    })
    .catch((err) => {
      console.error("Failed to connect to MongoDB:", err.message);
      process.exit(1);
    });
}

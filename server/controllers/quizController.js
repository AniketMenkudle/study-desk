const mongoose = require("mongoose");
const Quiz = require("../models/Quiz");

const MAX_ATTEMPTS_KEPT = 50;

const validId = (id) => mongoose.isValidObjectId(id);

// Score on the SERVER from the stored questions, so a tampered browser can't
// fake a result. Returns clean answers + the totals.
function scoreAttempt(questions, raw) {
  const input = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const answers = {};
  let correct = 0, wrong = 0, skipped = 0, mcqTotal = 0;

  questions.forEach((q, i) => {
    const a = input[i];
    if (q.type === "mcq") {
      mcqTotal++;
      if (Number.isInteger(a) && a >= 0 && a < q.options.length) {
        answers[i] = a;
        a === q.correctIndex ? correct++ : wrong++;
      } else {
        skipped++;
      }
    } else if (typeof a === "string" && a.trim()) {
      answers[i] = a.trim().slice(0, 2000);
    }
  });

  const percent = mcqTotal ? Math.round((correct / mcqTotal) * 100) : 0;
  return { answers, correct, wrong, skipped, mcqTotal, percent };
}

// GET /api/quizzes  -> lightweight list for the library page
exports.listQuizzes = async (req, res) => {
  const docs = await Quiz.find({ user: req.userId })
    .select("title topic difficulty quizType createdAt questions.type attempts.percent attempts.takenAt")
    .sort({ createdAt: -1 })
    .limit(300)
    .lean();

  const quizzes = docs.map((q) => {
    const scored = (q.attempts || []).map((a) => a.percent).filter((p) => typeof p === "number");
    return {
      _id: q._id,
      title: q.title,
      topic: q.topic,
      difficulty: q.difficulty,
      quizType: q.quizType,
      createdAt: q.createdAt,
      questionCount: (q.questions || []).length,
      attemptCount: (q.attempts || []).length,
      bestPercent: scored.length ? Math.max(...scored) : null,
      lastPercent: scored.length ? scored[scored.length - 1] : null,
    };
  });
  res.json({ quizzes });
};

// GET /api/quizzes/:id  -> full quiz with questions and attempt history
exports.getQuiz = async (req, res) => {
  if (!validId(req.params.id)) return res.status(404).json({ error: "Quiz not found." });
  const quiz = await Quiz.findOne({ _id: req.params.id, user: req.userId }).lean();
  if (!quiz) return res.status(404).json({ error: "Quiz not found." });
  res.json({ quiz });
};

// POST /api/quizzes/:id/attempts  { answers, mode }
exports.addAttempt = async (req, res) => {
  if (!validId(req.params.id)) return res.status(404).json({ error: "Quiz not found." });
  const quiz = await Quiz.findOne({ _id: req.params.id, user: req.userId });
  if (!quiz) return res.status(404).json({ error: "Quiz not found." });

  const mode = req.body.mode === "exam" ? "exam" : "practice";
  const result = scoreAttempt(quiz.questions, req.body.answers);

  quiz.attempts.push({ mode, ...result, takenAt: new Date() });
  if (quiz.attempts.length > MAX_ATTEMPTS_KEPT) {
    quiz.attempts.splice(0, quiz.attempts.length - MAX_ATTEMPTS_KEPT);
  }
  await quiz.save();

  res.status(201).json({ attempt: quiz.attempts[quiz.attempts.length - 1], attemptCount: quiz.attempts.length });
};

// PATCH /api/quizzes/:id  { title }
exports.renameQuiz = async (req, res) => {
  if (!validId(req.params.id)) return res.status(404).json({ error: "Quiz not found." });
  const title = String(req.body.title || "").trim();
  if (!title || title.length > 140) {
    return res.status(400).json({ error: "Please enter a title (up to 140 characters)." });
  }
  const quiz = await Quiz.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { title },
    { new: true }
  ).select("title");
  if (!quiz) return res.status(404).json({ error: "Quiz not found." });
  res.json({ title: quiz.title });
};

// DELETE /api/quizzes/:id
exports.deleteQuiz = async (req, res) => {
  if (!validId(req.params.id)) return res.status(404).json({ error: "Quiz not found." });
  const deleted = await Quiz.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!deleted) return res.status(404).json({ error: "Quiz not found." });
  res.json({ deleted: true });
};

exports.scoreAttempt = scoreAttempt;

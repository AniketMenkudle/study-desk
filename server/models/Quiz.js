const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["mcq", "short"], required: true },
    question: { type: String, required: true },
    options: { type: [String], default: undefined }, // mcq only
    correctIndex: { type: Number }, // mcq only
    answer: { type: String }, // short only
    explanation: { type: String, default: "" },
  },
  { _id: false }
);

// One attempt = one time the user took the quiz. `answers` maps question
// index -> chosen option index (mcq) or typed text (short answer).
const attemptSchema = new mongoose.Schema(
  {
    mode: { type: String, enum: ["practice", "exam"], default: "practice" },
    answers: { type: Object, default: {} },
    correct: Number,
    wrong: Number,
    skipped: Number,
    mcqTotal: Number,
    percent: Number,
    takenAt: { type: Date, default: Date.now },
  },
  { minimize: false }
);

const quizSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    topic: { type: String, required: true, trim: true, maxlength: 200 },
    difficulty: { type: String, default: "Medium" },
    quizType: { type: String, default: "Multiple choice" },
    questions: { type: [questionSchema], validate: (v) => v.length > 0 },
    attempts: { type: [attemptSchema], default: [] },
  },
  { timestamps: true, minimize: false }
);

module.exports = mongoose.model("Quiz", quizSchema);

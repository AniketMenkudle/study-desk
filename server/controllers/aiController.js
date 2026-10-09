const Quiz = require("../models/Quiz");
const callGemini = require("../utils/geminiClient");

// Wraps a Gemini call with shared error handling so every route returns the
// same shape on failure instead of leaking stack traces to the client.
async function run(res, systemPrompt, userPrompt, opts, key) {
  try {
    const text = await callGemini(systemPrompt, userPrompt, opts);
    res.json({ [key]: text });
  } catch (err) {
    console.error(`Gemini call failed (${key}):`, err.message);
    res.status(502).json({ error: "The AI request failed. Please try again." });
  }
}

// ---------- Ask a question ----------
// Mirrors Tab 1 ("Ask Questions") in app.py.
exports.askQuestion = async (req, res) => {
  const { subject = "", question = "", level = "School", style = "Step-by-step", model, temperature, studyMode = "Balanced" } = req.body;

  if (!question.trim()) {
    return res.status(400).json({ error: "Please enter a question." });
  }

  const systemPrompt =
    "You are a helpful personal study assistant for students. " +
    "Explain concepts clearly, with examples. Adapt your explanation " +
    `to a ${level} student and keep the tone encouraging. ` +
    `Explanation style: ${style}. ` +
    `Overall study mode: ${studyMode}.`;

  const userPrompt = `Subject: ${subject}\nQuestion: ${question}`;

  await run(res, systemPrompt, userPrompt, { model, temperature, maxOutputTokens: 4096 }, "answer");
};

// ---------- Notes & summaries ----------
// Mirrors Tab 2, "Summarize my text" mode.
exports.summarizeText = async (req, res) => {
  const { text = "", summaryLength = "Short", highlight = true, model, temperature, studyMode = "Balanced" } = req.body;

  if (!text.trim()) {
    return res.status(400).json({ error: "Please paste some text to summarize." });
  }

  const systemPrompt =
    "You are an AI note-taker. Summarize the input text into clear study notes.\n" +
    `- Summary length: ${summaryLength}.\n` +
    `- Highlight key terms: ${highlight ? "yes" : "no"}.\n` +
    `- Overall study mode: ${studyMode}.\n` +
    "- Use headings and bullet points where helpful.";

  await run(res, systemPrompt, text, { model, temperature }, "summary");
};

// Mirrors Tab 2, "Turn topic into structured notes" mode.
exports.generateNotes = async (req, res) => {
  const { topic = "", depth = "Standard", model, temperature, studyMode = "Balanced" } = req.body;

  if (!topic.trim()) {
    return res.status(400).json({ error: "Please enter a topic." });
  }

  const systemPrompt =
    "You are an expert tutor. Create structured study notes on the given topic.\n" +
    "- Use headings and bullet points.\n" +
    "- Include definitions, key formulas or dates, and simple examples.\n" +
    `- Depth: ${depth}.\n` +
    `- Overall study mode: ${studyMode}.`;

  const userPrompt = `Create study notes on: ${topic}`;

  await run(res, systemPrompt, userPrompt, { model, temperature }, "notes");
};

// ---------- Quiz generator ----------
// Returns STRUCTURED JSON (not Markdown) so the React app can render clickable
// options, score the attempt and build a detailed PDF report.

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const stripLabel = (s) => String(s).replace(/^\s*(?:[A-Da-d][\).:]|\d+[\).:])\s+/, "").trim();

function parseJson(raw) {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const a = cleaned.indexOf("{");
    const b = cleaned.lastIndexOf("}");
    if (a >= 0 && b > a) return JSON.parse(cleaned.slice(a, b + 1));
    throw new Error("Model did not return valid JSON");
  }
}

function normalizeQuestions(data) {
  const list = Array.isArray(data) ? data : data?.questions;
  if (!Array.isArray(list)) return [];

  return list
    .map((q) => {
      const question = String(q?.question || "").trim();
      const explanation = String(q?.explanation || "").trim();
      if (!question) return null;

      const opts = Array.isArray(q.options) ? q.options.map(stripLabel).filter(Boolean) : [];
      const ci = Number(q.correctIndex);

      if (opts.length >= 2 && Number.isInteger(ci) && ci >= 0 && ci < opts.length) {
        // LLMs love putting the right answer at position A/B — shuffle fairly.
        const tagged = opts.map((text, i) => ({ text, correct: i === ci }));
        const mixed = shuffle(tagged);
        return {
          type: "mcq",
          question,
          options: mixed.map((o) => o.text),
          correctIndex: mixed.findIndex((o) => o.correct),
          explanation,
        };
      }

      const answer = String(q.answer || "").trim();
      if (answer) return { type: "short", question, answer, explanation };
      return null;
    })
    .filter(Boolean);
}

exports.generateQuiz = async (req, res) => {
  const { quizTopic = "", quizType = "Multiple choice", difficulty = "Medium", model, temperature, studyMode = "Balanced" } = req.body;
  const numQuestions = Math.min(30, Math.max(1, parseInt(req.body.numQuestions, 10) || 5));

  if (!quizTopic.trim()) {
    return res.status(400).json({ error: "Please enter a quiz topic." });
  }

  const typeRule =
    quizType === "Short answer"
      ? 'Every question must have "type": "short".'
      : quizType === "Mixed"
      ? 'Mix about 60% "mcq" and 40% "short" questions.'
      : 'Every question must have "type": "mcq".';

  const systemPrompt =
    "You are an AI quiz generator for students. Respond with ONLY valid JSON, no Markdown fences, no commentary.\n" +
    `- Difficulty: ${difficulty}.\n` +
    `- Overall study mode: ${studyMode}.\n` +
    `- ${typeRule}\n` +
    "- JSON shape: {\"title\": string, \"questions\": [ ... ]}\n" +
    "- mcq question: {\"type\":\"mcq\",\"question\":string,\"options\":[4 plain strings WITHOUT A/B/C/D prefixes],\"correctIndex\":0-3,\"explanation\":string}\n" +
    "- short question: {\"type\":\"short\",\"question\":string,\"answer\":string,\"explanation\":string}\n" +
    "- Exactly ONE option must be correct; distractors must be plausible.\n" +
    "- explanation: 2-4 sentences saying why the answer is right and, for mcq, why the other options are wrong.";

  const userPrompt = `Create a ${numQuestions}-question quiz on the topic: ${quizTopic}. Use friendly wording appropriate for students.`;

  try {
    const raw = await callGemini(systemPrompt, userPrompt, {
      model,
      temperature,
      json: true,
      maxOutputTokens: 8192,
    });
    const data = parseJson(raw);
    const questions = normalizeQuestions(data).slice(0, numQuestions);
    if (!questions.length) throw new Error("No valid questions in model output");

    const quiz = {
      title: String(data?.title || `${quizTopic} quiz`).trim().slice(0, 140),
      topic: quizTopic.trim().slice(0, 200),
      difficulty,
      quizType,
      questions,
    };

    // Save to the user's library. If saving fails the quiz is still returned
    // so the student can take it; it just won't be in the library.
    try {
      const saved = await Quiz.create({ user: req.userId, ...quiz });
      return res.json({ quiz: { ...quiz, _id: saved._id, attempts: [] }, saved: true });
    } catch (saveErr) {
      console.error("Could not save quiz:", saveErr.message);
      return res.json({ quiz, saved: false });
    }
  } catch (err) {
    console.error("Gemini call failed (quiz):", err.message);
    res.status(502).json({ error: "The quiz could not be generated. Please try again." });
  }
};

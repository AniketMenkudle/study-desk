const { GoogleGenerativeAI } = require("@google/generative-ai");

// gemini-2.0-* was shut down by Google on 1 June 2026, so the default now
// comes from the environment (GEMINI_MODEL) and falls back to a current model.
const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

let genAI = null;
function getClient() {
  if (!process.env.GOOGLE_API_KEY) return null;
  if (!genAI) genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  return genAI;
}

// Only accept sane-looking model ids from the browser; otherwise use default.
function resolveModel(model) {
  return typeof model === "string" && /^gemini-[\w.\-]+$/.test(model) ? model : DEFAULT_MODEL;
}

/**
 * Generic helper for every study-assistant feature.
 *  - systemPrompt is sent as a real systemInstruction (not glued into the user text)
 *  - json: true asks Gemini for a JSON response (used by the quiz generator)
 *  - maxOutputTokens was 1024 before, which cut long answers/quizzes off mid-way
 */
async function callGemini(
  systemPrompt,
  userPrompt,
  { model, temperature = 0.7, json = false, maxOutputTokens = 4096 } = {}
) {
  const client = getClient();
  if (!client) {
    throw new Error("GOOGLE_API_KEY is not set. Please configure your .env file.");
  }

  const genModel = client.getGenerativeModel({
    model: resolveModel(model),
    systemInstruction: systemPrompt,
  });

  const generationConfig = {
    temperature: Number.isFinite(temperature) ? temperature : 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens,
  };
  if (json) generationConfig.responseMimeType = "application/json";

  const result = await genModel.generateContent({
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig,
  });

  return (result.response.text() || "").trim();
}

module.exports = callGemini;
module.exports.DEFAULT_MODEL = DEFAULT_MODEL;

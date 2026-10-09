const express = require("express");
const router = express.Router();
const { askQuestion, summarizeText, generateNotes, generateQuiz } = require("../controllers/aiController");

router.post("/ask", askQuestion);
router.post("/summarize", summarizeText);
router.post("/notes", generateNotes);
router.post("/quiz", generateQuiz);

module.exports = router;

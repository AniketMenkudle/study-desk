const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const { listQuizzes, getQuiz, addAttempt, renameQuiz, deleteQuiz } = require("../controllers/quizController");

// (requireAuth is applied in server.js for this whole router)
router.get("/", asyncHandler(listQuizzes));
router.get("/:id", asyncHandler(getQuiz));
router.post("/:id/attempts", asyncHandler(addAttempt));
router.patch("/:id", asyncHandler(renameQuiz));
router.delete("/:id", asyncHandler(deleteQuiz));

module.exports = router;

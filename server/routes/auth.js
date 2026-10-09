const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const requireAuth = require("../middleware/auth");
const { register, login, logout, me } = require("../controllers/authController");

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/logout", logout);
router.get("/me", requireAuth, asyncHandler(me));

module.exports = router;

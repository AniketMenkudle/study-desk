const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const {
  getReminders,
  addReminder,
  toggleReminder,
  deleteReminder,
  clearReminders,
} = require("../controllers/reminderController");

router.get("/", asyncHandler(getReminders));
router.post("/", asyncHandler(addReminder));
router.patch("/:id/toggle", asyncHandler(toggleReminder));
router.delete("/:id", asyncHandler(deleteReminder));
router.delete("/", asyncHandler(clearReminders));

module.exports = router;

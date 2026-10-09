const mongoose = require("mongoose");
const Reminder = require("../models/Reminder");

const validId = (id) => mongoose.isValidObjectId(id);

// Every query is scoped to the logged-in user (req.userId).

// GET /api/reminders
exports.getReminders = async (req, res) => {
  const reminders = await Reminder.find({ user: req.userId }).sort({ date: 1, time: 1 });
  res.json(reminders);
};

// POST /api/reminders
exports.addReminder = async (req, res) => {
  const { text, date, time } = req.body;

  if (!text || !String(text).trim()) {
    return res.status(400).json({ error: "Please enter a reminder." });
  }
  if (!date || !time) {
    return res.status(400).json({ error: "Please provide both a date and a time." });
  }

  const reminder = await Reminder.create({ user: req.userId, text: String(text).trim().slice(0, 300), date, time });
  res.status(201).json(reminder);
};

// PATCH /api/reminders/:id/toggle
exports.toggleReminder = async (req, res) => {
  if (!validId(req.params.id)) return res.status(404).json({ error: "Reminder not found." });
  const reminder = await Reminder.findOne({ _id: req.params.id, user: req.userId });
  if (!reminder) {
    return res.status(404).json({ error: "Reminder not found." });
  }

  reminder.completed = !reminder.completed;
  await reminder.save();
  res.json(reminder);
};

// DELETE /api/reminders/:id
exports.deleteReminder = async (req, res) => {
  if (!validId(req.params.id)) return res.status(404).json({ error: "Reminder not found." });
  const deleted = await Reminder.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!deleted) {
    return res.status(404).json({ error: "Reminder not found." });
  }
  res.json({ deleted: true });
};

// DELETE /api/reminders  (clear all of THIS user's reminders)
exports.clearReminders = async (req, res) => {
  await Reminder.deleteMany({ user: req.userId });
  res.json({ cleared: true });
};

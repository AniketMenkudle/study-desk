const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, required: true, trim: true },
    date: { type: String, required: true }, // stored as "YYYY-MM-DD" to match the <input type="date"> value
    time: { type: String, required: true }, // stored as "HH:MM" to match <input type="time">
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reminder", reminderSchema);

const mongoose = require("mongoose");

const LifafaSchema = new mongoose.Schema({
  title: String,
  amount: Number,
  code: String, // optional
  numbers: [String],
  claimedBy: [String],
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Lifafa", LifafaSchema);

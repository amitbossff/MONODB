const mongoose = require("mongoose");

const AdminLogSchema = new mongoose.Schema({
  admin: String,
  action: String,
  target: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("AdminLog", AdminLogSchema);

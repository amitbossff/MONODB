const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  number: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  telegramUid: { type: String, required: true },

  balance: { type: Number, default: 0 },

  otp: String,
otpExpire: Date,
  isVerified: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);

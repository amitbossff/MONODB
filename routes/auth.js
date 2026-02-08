const bot = require("../config/telegramBot");
const generateOTP = require("../utils/otp");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

/**
 * REGISTER
 */

router.post("/register", async (req, res) => {
  try {
    const { username, number, password, telegramUid } = req.body;

    if (!username || !number || !password || !telegramUid) {
      return res.status(400).json({ msg: "All fields required" });
    }

    const userExists = await User.findOne({ number });
    if (userExists) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();

    const user = new User({
      username,
      number,
      password: hashedPassword,
      telegramUid,
      otp,
      otpExpire: Date.now() + 5 * 60 * 1000 // 5 min
    });

    await user.save();

    // Send OTP via Telegram
    await bot.sendMessage(
      telegramUid,
      `🔐 Lifafa OTP Verification\n\nYour OTP is: ${otp}\nValid for 5 minutes`
    );

    res.json({ msg: "OTP sent to Telegram. Please verify." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * LOGIN
 */
router.post("/login", async (req, res) => {
  try {
    const { number, password } = req.body;

    const user = await User.findOne({ number });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid password" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, msg: "Login successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

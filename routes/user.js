const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * USER DASHBOARD
 */
router.get("/dashboard", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({
      username: user.username,
      number: user.number,
      balance: user.balance,
      createdAt: user.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

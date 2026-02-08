const Lifafa = require("../models/Lifafa");
const Code = require("../models/Code");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const User = require("../models/User");
const Withdrawal = require("../models/Withdrawal");
const Transaction = require("../models/Transaction");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

/**
 * ADMIN LOGIN
 */
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ username });
  if (!admin) return res.status(400).json({ msg: "Admin not found" });

  const match = await bcrypt.compare(password, admin.password);
  if (!match) return res.status(400).json({ msg: "Wrong password" });

  const token = jwt.sign(
    { admin: true, id: admin._id },
    process.env.JWT_SECRET
  );

  res.json({ token });
});

/**
 * ALL WITHDRAWAL REQUESTS
 */
router.get("/withdrawals", adminAuth, async (req, res) => {
  const list = await Withdrawal.find().populate("user", "username number");
  res.json(list);
});

/**
 * APPROVE / REJECT WITHDRAWAL
 */
router.post("/withdrawal/:id", adminAuth, async (req, res) => {
  const { status } = req.body;

  const wd = await Withdrawal.findById(req.params.id).populate("user");
  if (!wd) return res.status(404).json({ msg: "Not found" });

  if (wd.status !== "pending") {
    return res.status(400).json({ msg: "Already processed" });
  }

  if (status === "rejected") {
    wd.user.balance += wd.amount;
    await wd.user.save();
  }

  wd.status = status;
  await wd.save();

  if (status === "approved") {
    await Transaction.create({
      user: wd.user._id,
      type: "debit",
      amount: wd.amount,
      description: "Withdrawal approved"
    });
  }

  res.json({ msg: "Updated successfully" });
});

module.exports = router;

/**
 * CREATE LIFAFA
 */
router.post("/create-lifafa", adminAuth, async (req, res) => {
  const { title, amount, code, channel } = req.body;

  let numbers = [];

  if (code) {
    const codeData = await Code.findOne({ code, used: false });
    if (!codeData) return res.status(400).json({ msg: "Invalid code" });

    numbers = codeData.numbers;
    codeData.used = true;
    await codeData.save();
  }

  const lifafa = await Lifafa.create({
  title,
  amount,
  code,
  numbers,
  channel
});

  res.json({ msg: "Lifafa created", lifafaId: lifafa._id });
});

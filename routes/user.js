const checkJoin = require("../utils/checkJoin");
const Lifafa = require("../models/Lifafa");
const Code = require("../models/Code");
const generateCode = require("../utils/codeGen");
const Withdrawal = require("../models/Withdrawal");
const Transaction = require("../models/Transaction");
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


/**
 * PAY TO USER
 */
router.post("/pay", auth, async (req, res) => {
  try {
    const { receiverNumber, amount } = req.body;

    if (!receiverNumber || !amount || amount <= 0) {
      return res.status(400).json({ msg: "Invalid data" });
    }

    const sender = await User.findById(req.user.id);
    const receiver = await User.findOne({ number: receiverNumber });

    if (!receiver) {
      return res.status(404).json({ msg: "Receiver not found" });
    }

    if (sender.balance < amount) {
      return res.status(400).json({ msg: "Insufficient balance" });
    }

    // Update balances
    sender.balance -= amount;
    receiver.balance += amount;

    await sender.save();
    await receiver.save();

    // Transactions
    await Transaction.create({
      user: sender._id,
      type: "debit",
      amount,
      description: `Paid to ${receiver.number}`
    });

    await Transaction.create({
      user: receiver._id,
      type: "credit",
      amount,
      description: `Received from ${sender.number}`
    });

    res.json({ msg: "Payment successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * TRANSACTION HISTORY
 */
router.get("/transactions", auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * WITHDRAWAL REQUEST
 */
router.post("/withdraw", auth, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ msg: "Invalid amount" });
    }

    const user = await User.findById(req.user.id);

    if (user.balance < amount) {
      return res.status(400).json({ msg: "Insufficient balance" });
    }

    user.balance -= amount;
    await user.save();

    await Withdrawal.create({
      user: user._id,
      amount
    });

    res.json({ msg: "Withdrawal request submitted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * CREATE CODE
 */
router.post("/create-code", auth, async (req, res) => {
  try {
    let { numbers } = req.body;

    if (!Array.isArray(numbers) || numbers.length === 0) {
      return res.status(400).json({ msg: "Numbers required" });
    }

    // clean numbers
    numbers = [...new Set(numbers)]
      .filter(n => n.length === 10 && /^\d+$/.test(n));

    if (numbers.length === 0) {
      return res.status(400).json({ msg: "No valid numbers" });
    }

    const code = generateCode();

    await Code.create({
      user: req.user.id,
      code,
      numbers
    });

    res.json({ msg: "Code created", code, total: numbers.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * CLAIM LIFAFA
 */
router.post("/claim-lifafa", auth, async (req, res) => {
  const { lifafaId } = req.body;

  const lifafa = await Lifafa.findById(lifafaId);
  if (!lifafa || !lifafa.active) {
    return res.status(400).json({ msg: "Invalid lifafa" });
  }

  const user = await User.findById(req.user.id);

  if (lifafa.claimedBy.includes(user.number)) {
    return res.status(400).json({ msg: "Already claimed" });
  }

  if (lifafa.numbers.length && !lifafa.numbers.includes(user.number)) {
    return res.status(403).json({ msg: "Not eligible" });
  }

  if (lifafa.channel) {
  const joined = await checkJoin(lifafa.channel, user.telegramUid);
  if (!joined) {
    return res.status(403).json({ msg: "Join Telegram channel first" });
  }
  }

  user.balance += lifafa.amount;
  lifafa.claimedBy.push(user.number);

  await user.save();
  await lifafa.save();

  res.json({ msg: "Lifafa claimed", amount: lifafa.amount });
});

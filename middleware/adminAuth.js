const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ msg: "No admin token" });
  }

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    if (!decoded.admin) throw new Error();
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ msg: "Invalid admin token" });
  }
};

const express = require("express");
const Board = require("../models/Board");
const authenticateJWT = require("../middlewares/auth");
const router = express.Router();
router.get("/", authenticateJWT, async (req, res) => {
  const { page = 1, size = 6, category } = req.query;
  const skip = (page - 1) * size;
  const limit = parseInt(size);
  const filter = {};
  if (category && category !== "all") {
    filter.category = category;
  }
  try {
    const boards = await Board.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const totalCount = await Board.countDocuments(filter);
    res.json({ boards, totalCount });
  } catch (err) {
    res.status(500).json({ message: "서버 오류" });
  }
});
module.exports = router;

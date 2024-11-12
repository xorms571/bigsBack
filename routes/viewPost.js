const express = require("express");
const Board = require("../models/Board");
const authenticateJWT = require("../middlewares/auth");
const router = express.Router()
router.get("/", authenticateJWT, async (req, res) => {
  const { id } = req.params;

  try {
    const board = await Board.findById(id);
    if (!board) {
      return res.status(404).json({ message: "없는 게시물" });
    }
    res.json(board);
  } catch (err) {
    res.status(500).json({ message: "서버 오류" });
  }
});
module.exports = router;
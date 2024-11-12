const express = require("express");
const authenticateJWT = require("../middlewares/auth");
const Board = require("../models/Board");
const router = express.Router();
router.delete("/:id", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const authorId = req.user.userId;

  try {
    const board = await Board.findById(id);
    if (!board) {
      return res.status(404).json({ message: "해당 게시물 없음" });
    }

    if (board.authorId.toString() !== authorId.toString()) {
      return res.status(403).json({ message: "해당 게시물 작성자가 아님" });
    }

    await Board.findByIdAndDelete(id);
    res.json({ message: "게시물 삭제 완료" });
  } catch (err) {
    console.error("게시물 삭제 중 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});
module.exports = router;
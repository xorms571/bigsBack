const express = require("express");
const authenticateJWT = require("../middlewares/auth");
const Board = require("../models/Board");
const router = express.Router()
router.post("/", authenticateJWT, async (req, res) => {
  const { title, content, category } = req.body;
  const authorId = req.user.userId;

  if (!title || !content || !category) {
    return res.status(400).json({ message: "제목, 내용 및 카테고리 필요" });
  }

  try {
    const newBoard = new Board({ title, content, authorId, category });
    await newBoard.save();
    res.status(201).json(newBoard);
  } catch (err) {
    res.status(500).json({ message: "서버 오류" });
  }
});
module.exports = router;
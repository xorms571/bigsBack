const express = require("express");
const router = express.Router()
router.post("/", (req, res) => {
  res.clearCookie("refreshToken");
  res.json({ message: "로그아웃 완료" });
});
module.exports = router;
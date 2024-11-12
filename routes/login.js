const {
  generateAccessToken,
  generateRefreshToken,
} = require("../middlewares/generateToken");
const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const router = express.Router();
router.post("/", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      code: "MISSING_FIELDS",
      message: "사용자 이름 및 비밀번호 필요",
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({
        code: "EMAIL_PASSWORD_MISMATCH",
        message: "이메일 혹은 비밀번호를 확인해주세요.",
      });
    }

    const accessToken = generateAccessToken({
      userId: user._id,
      username: user.username,
    });
    const refreshToken = generateRefreshToken({
      userId: user._id,
      username: user.username,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
    });
    res.json({
      accessToken: accessToken,
      username: user.username,
      userId: user._id,
    });
  } catch (err) {
    res.status(500).json({ message: "서버 오류" });
  }
});
module.exports = router;

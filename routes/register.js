const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { generateAccessToken, generateRefreshToken } = require("../middlewares/generateToken");
const router = express.Router()
router.post("/", async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (!username || !email || !password || !confirmPassword)
    return res.status(400).json({
      code: "MISSING_FIELDS",
      message: "사용자 이름, 이메일, 비밀번호 및 비밀번호 확인 필요",
    });

  if (password !== confirmPassword)
    return res.status(400).json({
      code: "PASSWORD_MISMATCH",
      message: "비밀번호가 일치하지 않습니다",
    });

  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!%*#?&])[A-Za-z\d!%*#?&]{8,}$/;
  if (!passwordRegex.test(password))
    return res.status(400).json({
      code: "INVALID_PASSWORD",
      message:
        "비밀번호는 8자 이상이어야 하며, 숫자, 영문자 및 특수문자(!%*#?&)를 포함해야 합니다",
    });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res
        .status(400)
        .json({ code: "EMAIL_EXISTS", message: "이미 등록된 이메일" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      confirmPassword: hashedPassword,
    });
    await newUser.save();

    const accessToken = generateAccessToken({
      userId: newUser._id,
      username: newUser.username,
    });
    const refreshToken = generateRefreshToken({
      userId: newUser._id,
      username: newUser.username,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    res.status(201).json({ accessToken });
  } catch (err) {
    console.error("회원가입 중 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});
module.exports = router;
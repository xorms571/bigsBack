const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

const User = require("./models/User");
const Board = require("./models/Board");
const authenticateJWT = require("./middlewares/auth");

dotenv.config();
const port = process.env.PORT || 3000;
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "https://bigs-front.vercel.app", credentials: true }));

// MongoDB 연결
mongoose
  .connect(process.env.MONGODB_URI, {})
  .then(() => console.log("MongoDB 연결"))
  .catch((err) => console.log(err));

// 토큰 생성 함수
const generateAccessToken = (user) =>
  jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: "1m" }); //테스트 1분
const generateRefreshToken = (user) =>
  jwt.sign(user, process.env.REFRESH_TOKEN, { expiresIn: "10m" }); //테스트 10분

// ------------------------- 회원가입 API -------------------------

app.post("/auth/register", async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  // 필수 값 확인
  if (!username || !email || !password || !confirmPassword)
    return res

      .status(400)
      .json({
        code: "MISSING_FIELDS",
        message: "사용자 이름, 이메일, 비밀번호 및 비밀번호 확인 필요",
      });

  // 비밀번호와 확인 비밀번호가 일치하는지 확인
  if (password !== confirmPassword)
    return res
      .status(400)
      .json({
        code: "PASSWORD_MISMATCH",
        message: "비밀번호가 일치하지 않습니다",
      });

  // 비밀번호 유효성 검사 (8자 이상, 숫자, 영문자, 특수문자 포함)
  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!%*#?&])[A-Za-z\d!%*#?&]{8,}$/;
  if (!passwordRegex.test(password))
    return res
      .status(400)
      .json({
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
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    // JWT 토큰 생성
    const accessToken = generateAccessToken({
      userId: newUser._id,
      username: newUser.username,
    });
    const refreshToken = generateRefreshToken({
      userId: newUser._id,
      username: newUser.username,
    });

    // refreshToken 쿠키 설정
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

// ------------------------- 로그인 API -------------------------

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "사용자 이름 및 비밀번호 필요" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "없는 이메일 혹은 비밀번호" });
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
      secure: true,
      sameSite: "strict",
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

// ------------------------- 토큰 갱신 API -------------------------

app.post("/auth/token", (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) return res.sendStatus(401);

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, user) => {
    if (err) return res.sendStatus(403);

    const accessToken = generateAccessToken({
      userId: user.userId,
      username: user.username,
    });
    res.json({ accessToken });
  });
});

// ------------------------- 로그아웃 API -------------------------

app.post("/auth/logout", (req, res) => {
  //refreshToken 쿠키 초기화
  res.clearCookie("refreshToken");
  res.json({ message: "로그아웃 완료" });
});

// ------------------------- 글 작성 API -------------------------

app.post("/boards", authenticateJWT, async (req, res) => {
  const { title, content, category } = req.body;
  const authorId = req.user.userId;

  if (!title || !content || !category) {
    // 카테고리 유효성 검사 추가
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

// ------------------------- 글 목록 조회 API -------------------------

app.get("/boards", authenticateJWT, async (req, res) => {
  const { page = 1, size = 10 } = req.query;

  try {
    const boards = await Board.find()
      .skip((page - 1) * size)
      .limit(Number(size));
    res.json(boards);
  } catch (err) {
    res.status(500).json({ message: "서버 오류" });
  }
});

// ------------------------- 글 조회 API -------------------------

app.get("/boards/:id", authenticateJWT, async (req, res) => {
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

// ------------------------- 글 수정 API -------------------------

app.put("/boards/:id", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { title, content, category } = req.body;
  const authorId = req.user.userId;

  try {
    const board = await Board.findById(id);
    if (!board) {
      return res.status(404).json({ message: "해당 게시물 없음" });
    }

    // 게시물 작성자와 로그인한 사용자가 일치하는지 확인
    if (board.authorId.toString() !== authorId.toString()) {
      return res.status(403).json({ message: "해당 게시물 작성자가 아님" });
    }

    // 게시물 업데이트
    board.title = title || board.title;
    board.content = content || board.content;
    board.category = category || board.category;
    await board.save();

    res.json({ message: "게시물 수정 완료", board });
  } catch (err) {
    console.error("게시물 수정 중 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ------------------------- 글 삭제 API -------------------------

app.delete("/boards/:id", authenticateJWT, async (req, res) => {
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

    await Board.findByIdAndDelete(id); // 변경 사항
    res.json({ message: "게시물 삭제 완료" });
  } catch (err) {
    console.error("게시물 삭제 중 오류:", err); // 에러 로그 추가
    res.status(500).json({ message: "서버 오류" });
  }
});

// ------------------------- 서버 시작 -------------------------

app.listen(port, () => {
  console.log(`서버 연결: http://localhost:${port}`);
});

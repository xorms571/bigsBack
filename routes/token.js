const express = require("express");
const router = express.Router()
const { generateAccessToken } = require("../middlewares/generateToken");
router.post("/", (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) return res.sendStatus(401);

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, user) => {
    if (err) {
      console.error("JWT verification failed:", err); // 오류 메시지 출력
      return res.sendStatus(403);
    }

    const accessToken = generateAccessToken({
      userId: user.userId,
      username: user.username,
    });
    res.json({ accessToken });
  });
});
module.exports = router;
const jwt = require("jsonwebtoken");

function authenticateJWT(req, res, next) {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(403).json({ message: "토큰 없음 오류" });
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) return res.status(403).json({ message: "리프레시 토큰 없음 오류" });
      jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, user) => {
        if (err) return res.status(403).json({ message: "잘못된 리프레시 토큰" });
        const newAccessToken = jwt.sign({ userId: user.userId, username: user.username }, process.env.ACCESS_TOKEN, { expiresIn: "1m" });
        res.setHeader("Authorization", `Bearer ${newAccessToken}`);
        req.user = user;
        return next();
      });
    } else {
      res.status(401).json({ message: "잘못된 토큰" });
    }
  }
}

module.exports = authenticateJWT;

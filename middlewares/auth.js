const jwt = require("jsonwebtoken");

function authenticateJWT(req, res, next) {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(403).json({ message: "토큰 없음 오류" });
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN); // Access Token 검증
    req.user = decoded; // 사용자 정보를 요청 객체에 추가
    next();
  } catch (err) {
    // Access Token 만료 시 처리
    if (err.name === "TokenExpiredError") {
      const refreshToken = req.cookies.refreshToken;  // 쿠키에서 Refresh Token을 가져오기
      if (!refreshToken) return res.status(403).json({ message: "리프레시 토큰 없음 오류" });
      // Refresh Token 검증
      jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, user) => {
        if (err) return res.status(403).json({ message: "잘못된 리프레시 토큰" });
        // 새로 Access Token을 발급 테스트 1분
        const newAccessToken = jwt.sign({ userId: user.userId, username: user.username }, process.env.ACCESS_TOKEN, { expiresIn: "1m" });
        res.setHeader("Authorization", `Bearer ${newAccessToken}`); // 헤더에 새 Access Token을 추가
        req.user = user; // 사용자 정보 추가
        return next();
      });
    } else {
      res.status(401).json({ message: "잘못된 토큰" });
    }
  }
}

module.exports = authenticateJWT;

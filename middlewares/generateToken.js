const jwt = require("jsonwebtoken");
const generateAccessToken = (user) =>
  jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: "1m" }); //테스트 1분
const generateRefreshToken = (user) =>
  jwt.sign(user, process.env.REFRESH_TOKEN, { expiresIn: "1h" }); //테스트 1시간
module.exports = { generateAccessToken, generateRefreshToken };
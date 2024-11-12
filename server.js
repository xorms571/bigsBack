const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

dotenv.config();
const port = process.env.PORT || 5000;
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "https://bigs-front.vercel.app", credentials: true }));

mongoose
  .connect(process.env.MONGODB_URI, {})
  .then(() => console.log("MongoDB 연결"))
  .catch((err) => console.log(err));

const register = require("./routes/register");
app.use("/auth/register", register);
const login = require("./routes/login");
app.use("/auth/login", login);
const token = require("./routes/token");
app.use("/auth/token", token);
const logout = require("./routes/logout");
app.use("/auth/logout", logout);
const write = require("./routes/write");
app.use("/boards", write);
const viewBoards = require('./routes/viewBoards')
app.use("/boards", viewBoards);
const viewPost = require('./routes/viewPost')
app.use("/boards/:id", viewPost);
const editPost = require('./routes/edit')
app.use("/boards", editPost);
const deletePost = require('./routes/delete')
app.use("/boards", deletePost);

app.listen(port, () => {
  console.log(`서버 연결: http://localhost:${port}`);
});

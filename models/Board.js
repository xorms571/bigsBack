const mongoose = require("mongoose");

const boardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
}, { timestamps: true });

const Board = mongoose.model("Board", boardSchema);

module.exports = Board;

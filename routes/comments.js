// routes/comments.js - CRUD de comentários

const express = require("express");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const commentsRouter = express.Router();

// Criar um comentário em um post
commentsRouter.post("/:postId", async (req, res) => {
  try {
    const { content } = req.body;
    const newComment = new Comment({
      postId: req.params.postId,
      userId: req.user.id,
      content,
    });
    const savedComment = await newComment.save();
    res.status(201).json(savedComment);
  } catch (err) {
    res.status(500).json({ message: "Erro ao criar comentário." });
  }
});

// Buscar comentários de um post
commentsRouter.get("/:postId", async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId }).sort({ createdAt: -1 });
    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ message: "Erro ao buscar comentários." });
  }
});

// Deletar um comentário
commentsRouter.delete("/:id", async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comentário não encontrado." });
    if (comment.userId.toString() !== req.user.id) return res.status(403).json({ message: "Apenas o autor pode deletar este comentário." });

    await comment.deleteOne();
    res.status(200).json({ message: "Comentário deletado com sucesso." });
  } catch (err) {
    res.status(500).json({ message: "Erro ao deletar comentário." });
  }
});

module.exports = commentsRouter;

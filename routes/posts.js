// routes/posts.js - CRUD de postagens

const express = require("express");
const Post = require("../models/Post");
const authMiddleware = require("../middleware/authMiddleware"); // Middleware de autenticação
const postsRouter = express.Router();

// Criar um novo post (com autenticação)
postsRouter.post("/", authMiddleware, async (req, res) => {
  try {
    const newPost = new Post({
      userId: req.user.id, // Agora req.user estará preenchido
      content: req.body.content,
    });
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(500).json({ message: "Erro ao criar post." });
  }
});

// Obter todos os posts de um usuário
postsRouter.get("/user/:userId", async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: "Erro ao buscar posts do usuário." });
  }
});

// Obter post por ID
postsRouter.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post não encontrado." });
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ message: "Erro ao buscar post." });
  }
});

// Deletar post
postsRouter.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post não encontrado." });
    if (post.userId.toString() !== req.user.id) return res.status(403).json({ message: "Apenas o autor pode deletar este post." });

    await post.deleteOne();
    res.status(200).json({ message: "Post deletado com sucesso." });
  } catch (err) {
    res.status(500).json({ message: "Erro ao deletar post." });
  }
});

module.exports = postsRouter;

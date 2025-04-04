// routes/posts.js

const express = require("express");
const Post = require("../models/Post");
const { authenticateToken } = require("../middleware/authMiddleware"); // CORRIGIDO!

const postsRouter = express.Router();

// Criar um novo post (Usuário precisa estar autenticado)
postsRouter.post("/", authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: "O conteúdo do post é obrigatório." });
    }

    const newPost = new Post({
      userId: req.user.id,
      content,
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ error: "Erro ao criar post." });
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

// Curtir post (somente uma vez por usuário)
postsRouter.post("/:id/like", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post não encontrado." });

    const userId = req.user.id;
    if (post.likes.includes(userId)) {
      return res.status(400).json({ message: "Você já curtiu este post." });
    }

    post.likes.push(userId);
    await post.save();
    res.status(200).json({ message: "Post curtido com sucesso." });
  } catch (err) {
    res.status(500).json({ message: "Erro ao curtir post." });
  }
});

// Deletar post (apenas o autor pode deletar)
postsRouter.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post não encontrado." });
    if (post.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Apenas o autor pode deletar este post." });
    }

    await post.deleteOne();
    res.status(200).json({ message: "Post deletado com sucesso." });
  } catch (err) {
    res.status(500).json({ message: "Erro ao deletar post." });
  }
});

module.exports = postsRouter;

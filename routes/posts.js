// 📄 Caminho: /routes/posts.js

const express = require("express");
const Post = require("../models/Post");
const User = require("../models/User");
const { authenticateToken } = require("../middleware/authMiddleware");

const postsRouter = express.Router();

/**
 * @route   POST /api/posts/
 * @desc    Criar novo post (autenticado)
 */
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

    const postComUsuario = await Post.findById(newPost._id).populate("userId", "nome avatar");
    res.status(201).json(postComUsuario);
  } catch (err) {
    console.error("Erro ao criar post:", err);
    res.status(500).json({ error: "Erro ao criar post." });
  }
});

/**
 * @route   GET /api/posts/feed
 * @desc    Retorna posts do usuário logado
 */
postsRouter.get("/feed", authenticateToken, async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate("userId", "nome avatar");

    res.status(200).json(posts);
  } catch (err) {
    console.error("Erro ao buscar feed:", err);
    res.status(500).json({ message: "Erro ao buscar feed do usuário." });
  }
});

/**
 * @route   GET /api/posts/user/:userId
 * @desc    Posts por ID do usuário
 */
postsRouter.get("/user/:userId", async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .populate("userId", "nome avatar");

    res.status(200).json(posts);
  } catch (err) {
    console.error("Erro ao buscar posts:", err);
    res.status(500).json({ message: "Erro ao buscar posts do usuário." });
  }
});

/**
 * @route   GET /api/posts/username/:username
 * @desc    Posts por username
 */
postsRouter.get("/username/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const posts = await Post.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .populate("userId", "nome avatar");

    res.status(200).json(posts);
  } catch (err) {
    console.error("Erro ao buscar posts por username:", err);
    res.status(500).json({ message: "Erro ao buscar posts do usuário." });
  }
});

/**
 * @route   GET /api/posts/:id
 * @desc    Post por ID
 */
postsRouter.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("userId", "nome avatar");
    if (!post) return res.status(404).json({ message: "Post não encontrado." });

    res.status(200).json(post);
  } catch (err) {
    console.error("Erro ao buscar post:", err);
    res.status(500).json({ message: "Erro ao buscar post." });
  }
});

/**
 * @route   PUT /api/posts/:id/like
 * @desc    Curtir ou remover curtida (toggle)
 */
postsRouter.put("/:id/like", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post não encontrado." });
    }

    // Garante que post.likes seja sempre um array válido
    post.likes = Array.isArray(post.likes) ? post.likes : [];

    const userId = req.user.id;
    const hasLiked = post.likes.includes(userId);

    // Toggle da curtida
    if (hasLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    // Recupera post atualizado com usuário populado
    const updatedPost = await Post.findById(post._id).populate("userId", "nome avatar");

    // 🚨 LOG para debug: ver likes atualizados
    console.log("✅ Curtida atualizada com sucesso:");
    console.log(updatedPost);

    // Retorna também o array `likes` para o frontend exibir corretamente
    res.status(200).json({
      ...updatedPost._doc,
      likes: post.likes,
    });
  } catch (err) {
    console.error("❌ Erro ao curtir post:", err);
    res.status(500).json({ message: "Erro ao curtir post.", error: err.message });
  }
});

/**
 * @route   DELETE /api/posts/:id
 * @desc    Deletar post (somente autor)
 */
postsRouter.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post não encontrado." });

    if (post.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Você não pode deletar este post." });
    }

    await post.deleteOne();
    res.status(200).json({ message: "Post deletado com sucesso." });
  } catch (err) {
    console.error("Erro ao deletar post:", err);
    res.status(500).json({ message: "Erro ao deletar post." });
  }
});

module.exports = postsRouter;

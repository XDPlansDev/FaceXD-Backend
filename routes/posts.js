// Caminho: /routes/posts.js
// Atualização para incluir endpoint que busca posts de um usuário pelo username.
// Para isso, importamos o modelo User para converter o username no _id do usuário.
const express = require("express");
const Post = require("../models/Post");
const User = require("../models/User"); // Importando o modelo User para usar na conversão
const { authenticateToken } = require("../middleware/authMiddleware"); // ⚡ Certifique-se que este caminho está correto!

const postsRouter = express.Router();

/**
 * @route   POST /api/posts/
 * @desc    Criar um novo post (Usuário precisa estar autenticado)
 * @access  Privado
 */
postsRouter.post("/", authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: "O conteúdo do post é obrigatório." });
    }
    
    const newPost = new Post({
      userId: req.user?.id, // ⚠️ Confirme que `req.user` está sendo corretamente definido no `authenticateToken`
      content,
    });
    
    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    console.error("Erro ao criar post:", err);
    res.status(500).json({ error: "Erro ao criar post." });
  }
});

/**
 * @route   GET /api/posts/user/:userId
 * @desc    Obter todos os posts de um usuário pelo ID
 * @access  Público
 */
postsRouter.get("/user/:userId", async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    console.error("Erro ao buscar posts:", err);
    res.status(500).json({ message: "Erro ao buscar posts do usuário." });
  }
});

/**
 * @route   GET /api/posts/username/:username
 * @desc    Obter todos os posts de um usuário pelo username
 * @access  Público
 */
postsRouter.get("/username/:username", async (req, res) => {
  try {
    // Busca o usuário pelo username para obter o _id
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }
    
    // Busca os posts utilizando o _id do usuário encontrado
    const posts = await Post.find({ userId: user._id }).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    console.error("Erro ao buscar posts por username:", err);
    res.status(500).json({ message: "Erro ao buscar posts do usuário." });
  }
});

/**
 * @route   GET /api/posts/:id
 * @desc    Obter post por ID
 * @access  Público
 */
postsRouter.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post não encontrado." });
    
    res.status(200).json(post);
  } catch (err) {
    console.error("Erro ao buscar post:", err);
    res.status(500).json({ message: "Erro ao buscar post." });
  }
});

/**
 * @route   POST /api/posts/:id/like
 * @desc    Curtir post (somente uma vez por usuário)
 * @access  Privado
 */
postsRouter.post("/:id/like", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post não encontrado." });
    
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Usuário não autenticado." });
    
    if (post.likes.includes(userId)) {
      return res.status(400).json({ message: "Você já curtiu este post." });
    }
    
    post.likes.push(userId);
    await post.save();
    res.status(200).json({ message: "Post curtido com sucesso." });
  } catch (err) {
    console.error("Erro ao curtir post:", err);
    res.status(500).json({ message: "Erro ao curtir post." });
  }
});

/**
 * @route   DELETE /api/posts/:id
 * @desc    Deletar post (apenas o autor pode deletar)
 * @access  Privado
 */
postsRouter.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post não encontrado." });
    
    if (post.userId.toString() !== req.user?.id) {
      return res.status(403).json({ message: "Apenas o autor pode deletar este post." });
    }
    
    await post.deleteOne();
    res.status(200).json({ message: "Post deletado com sucesso." });
  } catch (err) {
    console.error("Erro ao deletar post:", err);
    res.status(500).json({ message: "Erro ao deletar post." });
  }
});

module.exports = postsRouter;
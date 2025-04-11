const express = require("express");
const Post = require("../models/Post");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { authenticateToken } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");

const postsRouter = express.Router();

/**
 * @route   POST /api/posts/
 * @desc    Criar novo post (autenticado)
 */
postsRouter.post("/", authenticateToken, upload.single("image"), async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim() && !req.file) {
      return res.status(400).json({ error: "O conteúdo do post ou uma imagem é obrigatório." });
    }

    let imageUrl = null;

    // Se houver uma imagem, faz upload para o Cloudinary
    if (req.file) {
      try {
        // Upload para o Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "facexd/posts",
          resource_type: "auto",
        });

        imageUrl = result.secure_url;

        // Remove o arquivo temporário
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error("❌ Erro ao fazer upload da imagem:", uploadError);
        return res.status(500).json({ error: "Erro ao fazer upload da imagem." });
      }
    }

    const newPost = new Post({
      userId: req.user.id,
      content,
      image: imageUrl,
    });

    await newPost.save();

    const post = await Post.findById(newPost._id).populate("userId", "nome avatar");

    res.status(201).json(post);
  } catch (err) {
    console.error("❌ Erro ao criar post:", err);
    res.status(500).json({ error: "Erro ao criar post." });
  }
});

/**
 * @route   GET /api/posts/feed
 * @desc    Retorna posts do usuário logado + de quem ele segue
 */
postsRouter.get("/feed", authenticateToken, async (req, res) => {
  try {
    // 🧠 Pega o usuário logado com a lista de quem ele segue
    const currentUser = await User.findById(req.user.id);
    const followingIds = currentUser.following || [];

    console.log("👤 Usuário logado:", req.user.id);
    console.log("📍 Seguindo:", followingIds);

    // 🧲 Inclui o próprio ID para ver também os próprios posts
    const userIdsToFetch = [req.user.id, ...followingIds];

    // 🔍 Busca posts dessas pessoas
    const posts = await Post.find({ userId: { $in: userIdsToFetch } })
      .sort({ createdAt: -1 })
      .populate("userId", "nome avatar");

    res.status(200).json(posts);
  } catch (err) {
    console.error("❌ Erro ao buscar feed:", err);
    res.status(500).json({ message: "Erro ao buscar feed do usuário." });
  }
});

/**
 * @route   GET /api/posts/user/:userId
 * @desc    Retorna posts por ID de usuário
 */
postsRouter.get("/user/:userId", async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .populate("userId", "nome avatar");

    res.status(200).json(posts);
  } catch (err) {
    console.error("❌ Erro ao buscar posts do usuário:", err);
    res.status(500).json({ message: "Erro ao buscar posts do usuário." });
  }
});

/**
 * @route   GET /api/posts/username/:username
 * @desc    Retorna posts por username
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
    console.error("❌ Erro ao buscar posts por username:", err);
    res.status(500).json({ message: "Erro ao buscar posts do usuário." });
  }
});

/**
 * @route   GET /api/posts/:id
 * @desc    Retorna post por ID
 */
postsRouter.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("userId", "nome avatar");

    if (!post) {
      return res.status(404).json({ message: "Post não encontrado." });
    }

    res.status(200).json(post);
  } catch (err) {
    console.error("❌ Erro ao buscar post:", err);
    res.status(500).json({ message: "Erro ao buscar post." });
  }
});

/**
 * @route   PUT /api/posts/:id/like
 * @desc    Curtir/Descurtir um post
 * @access  Privado
 */
postsRouter.put("/:id/like", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.user.id;

    if (!post) {
      return res.status(404).json({ message: "Post não encontrado." });
    }

    // Inicializa o array de likes se não existir
    post.likes = Array.isArray(post.likes) ? post.likes : [];

    // Verifica se o usuário já curtiu o post
    const hasLiked = post.likes.includes(userId);

    if (hasLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(userId);

      // Criar notificação apenas quando o usuário curte (não quando descurte)
      // E apenas se o autor do post não for o próprio usuário que curtiu
      if (post.userId.toString() !== userId) {
        const currentUser = await User.findById(userId);

        const notification = new Notification({
          recipient: post.userId,
          sender: userId,
          type: "post_like",
          content: `${currentUser.nome} ${currentUser.sobrenome} curtiu sua publicação.`,
          relatedId: post._id,
          onModel: "Post"
        });

        await notification.save();
        console.log(`🔔 Notificação de curtida criada para o post ${post._id}`);
      }
    }

    await post.save();

    res.status(200).json({
      likes: post.likes,
      totalLikes: post.likes.length,
      likedByUser: !hasLiked,
    });
  } catch (err) {
    console.error("❌ Erro ao curtir/descurtir post:", err);
    res.status(500).json({ message: "Erro ao curtir/descurtir post." });
  }
});

/**
 * @route   POST /api/posts/:id/comment
 * @desc    Adicionar um comentário a um post
 * @access  Privado
 */
postsRouter.post("/:id/comment", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.user.id;
    const { content } = req.body;

    if (!post) {
      return res.status(404).json({ message: "Post não encontrado." });
    }

    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Conteúdo do comentário é obrigatório." });
    }

    const comment = {
      userId,
      content,
      createdAt: new Date()
    };

    // Inicializa o array de comentários se não existir
    post.comments = Array.isArray(post.comments) ? post.comments : [];
    post.comments.push(comment);

    await post.save();

    // Criar notificação apenas se o autor do post não for o próprio usuário que comentou
    if (post.userId.toString() !== userId) {
      const currentUser = await User.findById(userId);

      const notification = new Notification({
        recipient: post.userId,
        sender: userId,
        type: "post_comment",
        content: `${currentUser.nome} ${currentUser.sobrenome} comentou em sua publicação: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
        relatedId: post._id,
        onModel: "Post"
      });

      await notification.save();
      console.log(`🔔 Notificação de comentário criada para o post ${post._id}`);
    }

    res.status(201).json(comment);
  } catch (err) {
    console.error("❌ Erro ao adicionar comentário:", err);
    res.status(500).json({ message: "Erro ao adicionar comentário." });
  }
});

/**
 * @route   DELETE /api/posts/:id
 * @desc    Deleta post (somente autor)
 */
postsRouter.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post não encontrado." });
    }

    if (post.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Você não tem permissão para deletar este post." });
    }

    await post.deleteOne();

    res.status(200).json({ message: "Post deletado com sucesso." });
  } catch (err) {
    console.error("❌ Erro ao deletar post:", err);
    res.status(500).json({ message: "Erro ao deletar post." });
  }
});

module.exports = postsRouter;

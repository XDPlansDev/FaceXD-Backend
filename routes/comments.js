// routes/comments.js - CRUD de comentários

const express = require("express");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const Notification = require("../models/Notification");
const { authenticateToken } = require("../middleware/authMiddleware");
const commentsRouter = express.Router();

/**
 * @route   POST /api/comments/:postId
 * @desc    Criar um comentário em um post
 * @access  Privado
 */
commentsRouter.post("/:postId", authenticateToken, async (req, res) => {
  try {
    const { content, parentCommentId } = req.body;
    const postId = req.params.postId;
    const userId = req.user.id;

    // Verificar se o post existe
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post não encontrado." });
    }

    // Verificar se é uma resposta a outro comentário
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ message: "Comentário pai não encontrado." });
      }
    }

    // Criar o comentário
    const newComment = new Comment({
      postId,
      userId,
      content,
      parentComment: parentCommentId || null,
    });

    const savedComment = await newComment.save();

    // Se for uma resposta, atualizar o comentário pai
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, {
        $push: { replies: savedComment._id }
      });
    }

    // Adicionar o comentário ao post
    await Post.findByIdAndUpdate(postId, {
      $push: { comments: savedComment._id }
    });

    // Criar notificação para o autor do post (se não for o próprio usuário)
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
    }

    // Popular os dados do usuário para retornar
    const populatedComment = await Comment.findById(savedComment._id)
      .populate("userId", "nome username avatar")
      .populate("parentComment", "content userId");

    res.status(201).json(populatedComment);
  } catch (err) {
    console.error("❌ Erro ao criar comentário:", err);
    res.status(500).json({ message: "Erro ao criar comentário." });
  }
});

/**
 * @route   GET /api/comments/:postId
 * @desc    Buscar comentários de um post
 * @access  Público
 */
commentsRouter.get("/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 10, sort = "newest" } = req.query;

    // Verificar se o post existe
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post não encontrado." });
    }

    // Configurar a ordenação
    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      mostLiked: { "likes.length": -1 }
    };

    // Buscar comentários principais (não são respostas)
    const comments = await Comment.find({
      postId,
      parentComment: null,
      status: "active"
    })
      .sort(sortOptions[sort] || sortOptions.newest)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("userId", "nome username avatar")
      .populate({
        path: "replies",
        populate: {
          path: "userId",
          select: "nome username avatar"
        }
      });

    // Contar total de comentários para paginação
    const total = await Comment.countDocuments({
      postId,
      parentComment: null,
      status: "active"
    });

    res.status(200).json({
      comments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalComments: total
    });
  } catch (err) {
    console.error("❌ Erro ao buscar comentários:", err);
    res.status(500).json({ message: "Erro ao buscar comentários." });
  }
});

/**
 * @route   PUT /api/comments/:id
 * @desc    Atualizar um comentário
 * @access  Privado (apenas autor)
 */
commentsRouter.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    const commentId = req.params.id;
    const userId = req.user.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comentário não encontrado." });
    }

    // Verificar se o usuário é o autor do comentário
    if (comment.userId.toString() !== userId) {
      return res.status(403).json({ message: "Você não tem permissão para editar este comentário." });
    }

    // Atualizar o comentário
    comment.content = content;
    await comment.save();

    // Retornar o comentário atualizado com dados do usuário
    const updatedComment = await Comment.findById(commentId)
      .populate("userId", "nome username avatar")
      .populate("parentComment", "content userId");

    res.status(200).json(updatedComment);
  } catch (err) {
    console.error("❌ Erro ao atualizar comentário:", err);
    res.status(500).json({ message: "Erro ao atualizar comentário." });
  }
});

/**
 * @route   DELETE /api/comments/:id
 * @desc    Deletar um comentário
 * @access  Privado (apenas autor ou admin)
 */
commentsRouter.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comentário não encontrado." });
    }

    // Verificar se o usuário é o autor do comentário
    if (comment.userId.toString() !== userId) {
      return res.status(403).json({ message: "Você não tem permissão para deletar este comentário." });
    }

    // Remover o comentário do post
    await Post.findByIdAndUpdate(comment.postId, {
      $pull: { comments: commentId }
    });

    // Se for uma resposta, remover do comentário pai
    if (comment.parentComment) {
      await Comment.findByIdAndUpdate(comment.parentComment, {
        $pull: { replies: commentId }
      });
    }

    // Deletar o comentário
    await comment.deleteOne();

    res.status(200).json({ message: "Comentário deletado com sucesso." });
  } catch (err) {
    console.error("❌ Erro ao deletar comentário:", err);
    res.status(500).json({ message: "Erro ao deletar comentário." });
  }
});

/**
 * @route   PUT /api/comments/:id/like
 * @desc    Curtir/Descurtir um comentário
 * @access  Privado
 */
commentsRouter.put("/:id/like", authenticateToken, async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comentário não encontrado." });
    }

    // Verificar se o usuário já curtiu o comentário
    const hasLiked = comment.likes.includes(userId);

    if (hasLiked) {
      // Remover curtida
      comment.likes = comment.likes.filter(id => id.toString() !== userId);
    } else {
      // Adicionar curtida
      comment.likes.push(userId);

      // Criar notificação para o autor do comentário (se não for o próprio usuário)
      if (comment.userId.toString() !== userId) {
        const currentUser = await User.findById(userId);
        const notification = new Notification({
          recipient: comment.userId,
          sender: userId,
          type: "comment_like",
          content: `${currentUser.nome} ${currentUser.sobrenome} curtiu seu comentário.`,
          relatedId: comment._id,
          onModel: "Comment"
        });
        await notification.save();
      }
    }

    await comment.save();

    res.status(200).json({
      likes: comment.likes,
      totalLikes: comment.likes.length,
      likedByUser: !hasLiked
    });
  } catch (err) {
    console.error("❌ Erro ao curtir/descurtir comentário:", err);
    res.status(500).json({ message: "Erro ao curtir/descurtir comentário." });
  }
});

module.exports = commentsRouter;

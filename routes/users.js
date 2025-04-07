// Caminho: /routes/users.js
// Atualização para incluir endpoint que busca usuário pelo username,
// permitindo que o perfil seja acessado via URL com o username escolhido.
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { authenticateToken } = require("../middleware/authMiddleware");

/**
 * @route   GET /api/users/:id
 * @desc    Obter perfil público de um usuário pelo ID
 * @access  Público
 */
router.get("/:id", async (req, res) => {
  try {
    // Busca o usuário pelo ID fornecido, excluindo o campo de senha
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error("Erro ao buscar usuário:", err);
    res.status(500).json({ message: "Erro ao buscar usuário." });
  }
});

/**
 * @route   GET /api/users/username/:username
 * @desc    Obter perfil público de um usuário pelo username
 * @access  Público
 */
router.get("/username/:username", async (req, res) => {
  try {
    // Busca o usuário pelo username e exclui o campo de senha
    const user = await User.findOne({ username: req.params.username }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error("Erro ao buscar usuário por username:", err);
    res.status(500).json({ message: "Erro ao buscar usuário." });
  }
});

/**
 * @route   PUT /api/users/:id/follow
 * @desc    Seguir um usuário
 * @access  Privado
 */
router.put("/:id/follow", authenticateToken, async (req, res) => {
  try {
    const userIdToFollow = req.params.id;
    
    // Impede que o usuário siga a si mesmo
    if (req.user.id === userIdToFollow) {
      return res.status(400).json({ message: "Você não pode se seguir." });
    }
    
    const userToFollow = await User.findById(userIdToFollow);
    const currentUser = await User.findById(req.user.id);
    
    // Verifica se o usuário já está seguindo o outro usuário
    if (!userToFollow.followers.includes(req.user.id)) {
      userToFollow.followers.push(req.user.id);
      currentUser.following.push(userIdToFollow);
      
      await userToFollow.save();
      await currentUser.save();
      
      res.status(200).json({ message: "Usuário seguido com sucesso." });
    } else {
      res.status(400).json({ message: "Você já segue este usuário." });
    }
  } catch (err) {
    console.error("Erro ao seguir usuário:", err);
    res.status(500).json({ message: "Erro ao seguir usuário." });
  }
});

/**
 * @route   PUT /api/users/:id/unfollow
 * @desc    Deixar de seguir um usuário
 * @access  Privado
 */
router.put("/:id/unfollow", authenticateToken, async (req, res) => {
  try {
    const userIdToUnfollow = req.params.id;
    
    // Impede que o usuário deixe de se seguir
    if (req.user.id === userIdToUnfollow) {
      return res.status(400).json({ message: "Você não pode deixar de se seguir." });
    }
    
    const userToUnfollow = await User.findById(userIdToUnfollow);
    const currentUser = await User.findById(req.user.id);
    
    // Verifica se o usuário está seguindo o outro usuário
    if (userToUnfollow.followers.includes(req.user.id)) {
      userToUnfollow.followers.pull(req.user.id);
      currentUser.following.pull(userIdToUnfollow);
      
      await userToUnfollow.save();
      await currentUser.save();
      
      res.status(200).json({ message: "Você deixou de seguir este usuário." });
    } else {
      res.status(400).json({ message: "Você não segue este usuário." });
    }
  } catch (err) {
    console.error("Erro ao deixar de seguir usuário:", err);
    res.status(500).json({ message: "Erro ao deixar de seguir usuário." });
  }
});

module.exports = router;
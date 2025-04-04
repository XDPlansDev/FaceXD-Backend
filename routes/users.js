// routes/users.js - Rotas relacionadas a usuários

const express = require("express");
const User = require("../models/User");
const router = express.Router();

// Obter perfil do usuário por ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "Usuário não encontrado." });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Erro ao buscar usuário." });
  }
});

// Seguir usuário
router.put("/:id/follow", async (req, res) => {
  try {
    if (req.user.id === req.params.id) return res.status(400).json({ message: "Você não pode se seguir." });

    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow.followers.includes(req.user.id)) {
      userToFollow.followers.push(req.user.id);
      currentUser.following.push(req.params.id);
      await userToFollow.save();
      await currentUser.save();
      res.status(200).json({ message: "Usuário seguido com sucesso." });
    } else {
      res.status(400).json({ message: "Você já segue este usuário." });
    }
  } catch (err) {
    res.status(500).json({ message: "Erro ao seguir usuário." });
  }
});

// Deixar de seguir usuário
router.put("/:id/unfollow", async (req, res) => {
  try {
    if (req.user.id === req.params.id) return res.status(400).json({ message: "Você não pode deixar de se seguir." });

    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (userToUnfollow.followers.includes(req.user.id)) {
      userToUnfollow.followers.pull(req.user.id);
      currentUser.following.pull(req.params.id);
      await userToUnfollow.save();
      await currentUser.save();
      res.status(200).json({ message: "Você deixou de seguir este usuário." });
    } else {
      res.status(400).json({ message: "Você não segue este usuário." });
    }
  } catch (err) {
    res.status(500).json({ message: "Erro ao deixar de seguir usuário." });
  }
});

module.exports = router;

// Caminho: /routes/users.js
// Atualização: rota GET /me, busca por username, seguir/deixar de seguir e busca por nome/username

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { authenticateToken } = require("../middleware/authMiddleware");

/**
 * @route   GET /api/users/search?query=valor
 * @desc    Buscar usuários por nome, username ou email
 * @access  Público
 */
router.get("/search", async (req, res) => {
  const query = req.query.query;

  console.log("🔍 Rota de busca acionada. Termo:", query);

  if (!query || query.trim() === "") {
    return res.status(400).json({ error: "Query de busca não informada." });
  }

  try {
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } }, // Adicionado suporte a email
      ],
    })
      .limit(10)
      .select("name username avatar");

    console.log(`🔎 ${users.length} usuários encontrados.`);
    res.json(users);
  } catch (err) {
    console.error("❌ Erro ao buscar usuários:", err);
    res.status(500).json({ error: "Erro ao buscar usuários." });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Obter perfil público de um usuário pelo ID
 * @access  Público
 */
router.get("/:id", async (req, res) => {
  try {
    console.log(`🔍 Buscando usuário pelo ID: ${req.params.id}`);
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      console.warn("⚠️ Usuário não encontrado por ID.");
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("❌ Erro ao buscar usuário por ID:", err);
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
    console.log(`🔍 Buscando usuário pelo username: ${req.params.username}`);
    const user = await User.findOne({ username: req.params.username }).select("-password");

    if (!user) {
      console.warn("⚠️ Usuário não encontrado por username.");
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("❌ Erro ao buscar usuário por username:", err);
    res.status(500).json({ message: "Erro ao buscar usuário." });
  }
});

/**
 * @route   GET /api/users/me
 * @desc    Obter perfil do usuário autenticado
 * @access  Privado
 */
router.get("/me", authenticateToken, async (req, res) => {
  try {
    console.log(`👤 Obtendo dados do usuário autenticado: ID ${req.user.id}`);

    let user = await User.findById(req.user.id).select("-password");

    if (!user) {
      console.warn("⚠️ Usuário autenticado não encontrado.");
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    // 🛡️ Previne erros no frontend garantindo campos opcionais
    if (!user.usernameChangedAt) user.usernameChangedAt = user.createdAt;
    if (!user.sexo) user.sexo = '';
    if (!user.dataNascimento) user.dataNascimento = '';

    res.status(200).json(user);
  } catch (err) {
    console.error("❌ Erro ao buscar perfil do usuário logado:", err);
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

    if (req.user.id === userIdToFollow) {
      return res.status(400).json({ message: "Você não pode se seguir." });
    }

    const userToFollow = await User.findById(userIdToFollow);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow) {
      return res.status(404).json({ message: "Usuário a ser seguido não encontrado." });
    }

    if (!currentUser) {
      return res.status(404).json({ message: "Usuário logado não encontrado." });
    }

    // Verifica se já está seguindo
    if (!userToFollow.followers.includes(req.user.id)) {
      userToFollow.followers.push(req.user.id);
      currentUser.following.push(userIdToFollow);

      await userToFollow.save();
      await currentUser.save();

      console.log(`✅ ${currentUser.username} começou a seguir ${userToFollow.username}`);
      res.status(200).json({ message: "Usuário seguido com sucesso." });
    } else {
      console.warn("⚠️ Tentativa de seguir um usuário já seguido.");
      res.status(400).json({ message: "Você já segue este usuário." });
    }
  } catch (err) {
    console.error("❌ Erro ao seguir usuário:", err);
    res.status(500).json({ message: "Erro ao seguir usuário." });
  }
});

/**
 * @route   PUT /api/users/:id/follow
 * @desc    Seguir um usuário
 * @access  Privado
 */

router.put("/:id/follow", authenticateToken, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    if (userToFollow.followers.includes(req.user.id)) {
      return res.status(400).json({ message: "Você já segue este usuário." });
    }

    userToFollow.followers.push(req.user.id);
    currentUser.following.push(req.params.id);

    await userToFollow.save();
    await currentUser.save();

    res.status(200).json({ message: "Usuário seguido com sucesso." });
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

    if (req.user.id === userIdToUnfollow) {
      return res.status(400).json({ message: "Você não pode deixar de se seguir." });
    }

    const userToUnfollow = await User.findById(userIdToUnfollow);
    const currentUser = await User.findById(req.user.id);

    if (!userToUnfollow) {
      return res.status(404).json({ message: "Usuário a ser deixado de seguir não encontrado." });
    }

    if (!currentUser) {
      return res.status(404).json({ message: "Usuário logado não encontrado." });
    }

    if (userToUnfollow.followers.includes(req.user.id)) {
      userToUnfollow.followers.pull(req.user.id);
      currentUser.following.pull(userIdToUnfollow);

      await userToUnfollow.save();
      await currentUser.save();

      console.log(`⚠️ ${currentUser.username} deixou de seguir ${userToUnfollow.username}`);
      res.status(200).json({ message: "Você deixou de seguir este usuário." });
    } else {
      console.warn("⚠️ Tentativa de deixar de seguir um usuário que não é seguido.");
      res.status(400).json({ message: "Você não segue este usuário." });
    }
  } catch (err) {
    console.error("❌ Erro ao deixar de seguir usuário:", err);
    res.status(500).json({ message: "Erro ao deixar de seguir usuário." });
  }
});

/**
 * @route   PUT /api/users/:id/favorite
 * @desc    Favoritar um usuário
 * @access  Privado
 */
router.put("/:id/favorite", authenticateToken, async (req, res) => {
  try {
    const userIdToFavorite = req.params.id;

    if (req.user.id === userIdToFavorite) {
      return res.status(400).json({ message: "Você não pode se favoritar." });
    }

    const currentUser = await User.findById(req.user.id);

    if (!currentUser) {
      return res.status(404).json({ message: "Usuário logado não encontrado." });
    }

    // Verifica se já está favoritado
    if (!currentUser.favoritos.includes(userIdToFavorite)) {
      currentUser.favoritos.push(userIdToFavorite);
      await currentUser.save();

      console.log(`⭐ ${currentUser.username} favoritou o usuário ${userIdToFavorite}`);
      res.status(200).json({ message: "Usuário favoritado com sucesso." });
    } else {
      console.warn("⚠️ Tentativa de favoritar um usuário já favoritado.");
      res.status(400).json({ message: "Você já favoritou este usuário." });
    }
  } catch (err) {
    console.error("❌ Erro ao favoritar usuário:", err);
    res.status(500).json({ message: "Erro ao favoritar usuário." });
  }
});

/**
 * @route   PUT /api/users/:id/unfavorite
 * @desc    Desfavoritar um usuário
 * @access  Privado
 */
router.put("/:id/unfavorite", authenticateToken, async (req, res) => {
  try {
    const userIdToUnfavorite = req.params.id;

    if (req.user.id === userIdToUnfavorite) {
      return res.status(400).json({ message: "Você não pode se desfavoritar." });
    }

    const currentUser = await User.findById(req.user.id);

    if (!currentUser) {
      return res.status(404).json({ message: "Usuário logado não encontrado." });
    }

    if (currentUser.favoritos.includes(userIdToUnfavorite)) {
      currentUser.favoritos.pull(userIdToUnfavorite);
      await currentUser.save();

      console.log(`⚠️ ${currentUser.username} desfavoritou o usuário ${userIdToUnfavorite}`);
      res.status(200).json({ message: "Usuário desfavoritado com sucesso." });
    } else {
      console.warn("⚠️ Tentativa de desfavoritar um usuário que não está favoritado.");
      res.status(400).json({ message: "Você não favoritou este usuário." });
    }
  } catch (err) {
    console.error("❌ Erro ao desfavoritar usuário:", err);
    res.status(500).json({ message: "Erro ao desfavoritar usuário." });
  }
});

module.exports = router;

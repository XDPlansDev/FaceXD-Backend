// Caminho: /routes/users.js
// Atualização: rota GET /me, busca por username, seguir/deixar de seguir e busca por nome/username

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Notification = require("../models/Notification");
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

      // Criar notificação para o usuário seguido
      const notification = new Notification({
        recipient: userToFollow._id,
        sender: currentUser._id,
        type: "follow",
        content: `${currentUser.nome} ${currentUser.sobrenome} começou a seguir você.`,
        relatedId: currentUser._id,
        onModel: "User"
      });

      await notification.save();
      console.log(`🔔 Notificação de seguidor criada para ${userToFollow.username}`);

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

// Enviar solicitação de amizade
router.post("/:id/friend-request", authenticateToken, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    // Verifica se já existe uma solicitação pendente
    if (targetUser.friendRequests.includes(req.user.id)) {
      return res.status(400).json({ message: "Solicitação de amizade já enviada" });
    }

    // Verifica se já são amigos
    if (targetUser.friends.includes(req.user.id)) {
      return res.status(400).json({ message: "Usuários já são amigos" });
    }

    // Adiciona a solicitação de amizade
    targetUser.friendRequests.push(req.user.id);
    await targetUser.save();

    // Criar notificação para o usuário alvo
    const notification = new Notification({
      recipient: targetUser._id,
      sender: currentUser._id,
      type: "friend_request",
      content: `${currentUser.nome} ${currentUser.sobrenome} enviou uma solicitação de amizade para você.`,
      relatedId: currentUser._id,
      onModel: "User"
    });

    await notification.save();
    console.log(`🔔 Notificação de solicitação de amizade criada para ${targetUser.username}`);

    res.json({ message: "Solicitação de amizade enviada" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Aceitar solicitação de amizade
router.put("/:id/accept-friend", authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const requestingUser = await User.findById(req.params.id);

    if (!currentUser || !requestingUser) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    // Verifica se existe uma solicitação pendente
    if (!currentUser.friendRequests.includes(req.params.id)) {
      return res.status(400).json({ message: "Solicitação de amizade não encontrada" });
    }

    // Remove a solicitação e adiciona aos amigos
    currentUser.friendRequests = currentUser.friendRequests.filter(id => id.toString() !== req.params.id);
    currentUser.friends.push(req.params.id);
    requestingUser.friends.push(req.user.id);

    await currentUser.save();
    await requestingUser.save();

    // Criar notificação para o usuário que enviou a solicitação
    const notification = new Notification({
      recipient: requestingUser._id,
      sender: currentUser._id,
      type: "friend_accepted",
      content: `${currentUser.nome} ${currentUser.sobrenome} aceitou sua solicitação de amizade.`,
      relatedId: currentUser._id,
      onModel: "User"
    });

    await notification.save();
    console.log(`🔔 Notificação de amizade aceita criada para ${requestingUser.username}`);

    res.json({ message: "Solicitação de amizade aceita" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Rejeitar solicitação de amizade
router.put("/:id/reject-friend", authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);

    if (!currentUser) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    // Remove a solicitação
    currentUser.friendRequests = currentUser.friendRequests.filter(id => id.toString() !== req.params.id);
    await currentUser.save();

    res.json({ message: "Solicitação de amizade rejeitada" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

// Caminho: /routes/notifications.js
// Atualização: Rotas para gerenciar notificações

const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const { authenticateToken } = require("../middleware/authMiddleware");

/**
 * @route   GET /api/notifications
 * @desc    Obter todas as notificações do usuário autenticado
 * @access  Privado
 */
router.get("/", authenticateToken, async (req, res) => {
    try {
        console.log(`🔔 Obtendo notificações para o usuário: ${req.user.id}`);

        const notifications = await Notification.find({ recipient: req.user.id })
            .populate("sender", "nome sobrenome username avatar")
            .sort({ createdAt: -1 })
            .limit(50);

        console.log(`📬 ${notifications.length} notificações encontradas`);
        res.status(200).json(notifications);
    } catch (err) {
        console.error("❌ Erro ao buscar notificações:", err);
        res.status(500).json({ message: "Erro ao buscar notificações." });
    }
});

/**
 * @route   GET /api/notifications/unread
 * @desc    Obter contagem de notificações não lidas
 * @access  Privado
 */
router.get("/unread", authenticateToken, async (req, res) => {
    try {
        console.log(`🔔 Contando notificações não lidas para o usuário: ${req.user.id}`);

        const count = await Notification.countDocuments({
            recipient: req.user.id,
            read: false
        });

        console.log(`📬 ${count} notificações não lidas`);
        res.status(200).json({ count });
    } catch (err) {
        console.error("❌ Erro ao contar notificações não lidas:", err);
        res.status(500).json({ message: "Erro ao contar notificações não lidas." });
    }
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Marcar uma notificação como lida
 * @access  Privado
 */
router.put("/:id/read", authenticateToken, async (req, res) => {
    try {
        console.log(`🔔 Marcando notificação como lida: ${req.params.id}`);

        const notification = await Notification.findOne({
            _id: req.params.id,
            recipient: req.user.id
        });

        if (!notification) {
            console.warn("⚠️ Notificação não encontrada");
            return res.status(404).json({ message: "Notificação não encontrada." });
        }

        notification.read = true;
        await notification.save();

        console.log("✅ Notificação marcada como lida");
        res.status(200).json({ message: "Notificação marcada como lida." });
    } catch (err) {
        console.error("❌ Erro ao marcar notificação como lida:", err);
        res.status(500).json({ message: "Erro ao marcar notificação como lida." });
    }
});

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Marcar todas as notificações como lidas
 * @access  Privado
 */
router.put("/read-all", authenticateToken, async (req, res) => {
    try {
        console.log(`🔔 Marcando todas as notificações como lidas para o usuário: ${req.user.id}`);

        await Notification.updateMany(
            { recipient: req.user.id, read: false },
            { read: true }
        );

        console.log("✅ Todas as notificações foram marcadas como lidas");
        res.status(200).json({ message: "Todas as notificações foram marcadas como lidas." });
    } catch (err) {
        console.error("❌ Erro ao marcar todas as notificações como lidas:", err);
        res.status(500).json({ message: "Erro ao marcar todas as notificações como lidas." });
    }
});

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Excluir uma notificação
 * @access  Privado
 */
router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        console.log(`🔔 Excluindo notificação: ${req.params.id}`);

        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            recipient: req.user.id
        });

        if (!notification) {
            console.warn("⚠️ Notificação não encontrada");
            return res.status(404).json({ message: "Notificação não encontrada." });
        }

        console.log("✅ Notificação excluída");
        res.status(200).json({ message: "Notificação excluída com sucesso." });
    } catch (err) {
        console.error("❌ Erro ao excluir notificação:", err);
        res.status(500).json({ message: "Erro ao excluir notificação." });
    }
});

module.exports = router; 
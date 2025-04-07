const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

// Função para gerar username aleatório e único
function generateUsername(nome) {
  const random = Math.random().toString(36).substring(2, 7); // Ex: abc12
  const base = nome.toLowerCase().replace(/\s+/g, "").substring(0, 10); // Ex: david
  return `${base}${random}`.substring(0, 15); // Limita a 15 caracteres
}

// 📌 Rota: Obter dados do usuário logado
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error("Erro ao buscar perfil:", err);
    res.status(500).json({ message: "Erro ao buscar perfil do usuário." });
  }
});

// 📌 Rota: Registrar novo usuário
router.post("/register", async (req, res) => {
  try {
    const { nome, sobrenome, telefone, email, cep, password } = req.body;

    if (!nome || !sobrenome || !email || !cep || !password) {
      return res.status(400).json({ message: "Preencha todos os campos obrigatórios!" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email já cadastrado." });
    }

    // Geração de username único
    let username = generateUsername(nome);
    let usernameExists = await User.findOne({ username });
    while (usernameExists) {
      username = generateUsername(nome);
      usernameExists = await User.findOne({ username });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      nome,
      sobrenome,
      telefone,
      email,
      username,
      cep,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ message: "Usuário registrado com sucesso!", username });
  } catch (err) {
    console.error("Erro no registro:", err);
    res.status(500).json({ message: "Erro ao registrar usuário." });
  }
});

// 📌 Rota: Login do usuário (com email ou username)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      $or: [{ email }, { username: email }],
    });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Senha incorreta." });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        nome: user.nome,
        sobrenome: user.sobrenome,
        email: user.email,
        username: user.username,
        cep: user.cep,
        telefone: user.telefone,
      },
    });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ message: "Erro ao fazer login." });
  }
});

module.exports = router;

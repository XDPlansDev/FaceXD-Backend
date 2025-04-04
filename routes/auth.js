// routes/auth.js - Rotas de autenticação (registro e login)

const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const router = express.Router();

// Registrar novo usuário
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Verifica se já existe usuário com mesmo e-mail
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email já cadastrado." });

    // Criptografa a senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(500).json({ message: "Erro ao registrar usuário." });
  }
});

// Login do usuário
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Usuário não encontrado." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Senha incorreta." });

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: "Erro ao fazer login." });
  }
});

module.exports = router;
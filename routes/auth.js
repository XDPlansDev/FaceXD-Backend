// 📄 Caminho: /routes/auth.js

const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

// 🔧 Função utilitária para gerar username aleatório e único
function generateUsername(nome) {
  const random = Math.random().toString(36).substring(2, 7); // Ex: abc12
  const base = nome.toLowerCase().replace(/\s+/g, "").substring(0, 10); // Ex: david
  return `${base}${random}`.substring(0, 15); // Limita a 15 caracteres
}

// 📌 Rota protegida: Obter dados do usuário logado
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

// 📌 Rota pública: Registrar novo usuário
router.post("/register", async (req, res) => {
  try {
    const {
      nome,
      sobrenome,
      telefone,
      email,
      username: providedUsername,
      cep,
      password,
      sexo,
      dataNascimento,
    } = req.body;

    // 🧪 Validação de campos obrigatórios
    if (!nome || !sobrenome || !email || !cep || !password || !sexo || !dataNascimento) {
      return res.status(400).json({ message: "Preencha todos os campos obrigatórios!" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email já cadastrado." });
    }

    // Verifica se o username fornecido está disponível
    let username = providedUsername;
    if (!username) {
      // Se não foi fornecido username, gera um aleatório
      username = generateUsername(nome);
      let usernameExists = await User.findOne({ username });
      while (usernameExists) {
        username = generateUsername(nome);
        usernameExists = await User.findOne({ username });
      }
    } else {
      // Verifica se o username fornecido já existe
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        return res.status(400).json({ message: "Username já está em uso." });
      }
    }

    // 🔒 Criptografando a senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 🧾 Criação do novo usuário
    const newUser = new User({
      nome,
      sobrenome,
      telefone,
      email,
      username,
      cep,
      sexo,
      dataNascimento,
      password: hashedPassword,
    });

    await newUser.save();

    // 🪪 Gera token válido por 7 dias
    const token = jwt.sign(
      { id: newUser._id, username: newUser.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Usuário registrado com sucesso!",
      token,
      user: {
        id: newUser._id,
        nome: newUser.nome,
        sobrenome: newUser.sobrenome,
        email: newUser.email,
        username: newUser.username,
        cep: newUser.cep,
        telefone: newUser.telefone,
        sexo: newUser.sexo,
        dataNascimento: newUser.dataNascimento,
      }
    });
  } catch (err) {
    console.error("Erro no registro:", err);
    res.status(500).json({ message: "Erro ao registrar usuário." });
  }
});

// 📌 Rota pública: Login com email ou username
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔍 Busca por email ou username
    const user = await User.findOne({
      $or: [{ email }, { username: email }],
    });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    // 🔐 Verifica a senha
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Senha incorreta." });
    }

    // 🪪 Gera token válido por 7 dias
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // ← Aqui está a validade do token
    );

    // ✅ Retorna dados do usuário (sem senha)
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
        sexo: user.sexo,
        dataNascimento: user.dataNascimento,
      },
    });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ message: "Erro ao fazer login." });
  }
});

// 📌 Rota pública: Verificar disponibilidade de username
router.get("/check-username/:username", async (req, res) => {
  try {
    const username = req.params.username;
    console.log("Verificando disponibilidade do username:", username);

    // Verificando se o username está vazio
    if (!username || username.trim() === "") {
      console.log("Username vazio");
      return res.status(400).json({
        available: false,
        message: "Username não pode estar vazio"
      });
    }

    const existingUser = await User.findOne({ username });
    console.log("Usuário existente:", existingUser ? "Sim" : "Não");

    if (existingUser) {
      // Gera sugestões de username disponíveis
      const suggestions = [
        `${username}${Math.floor(Math.random() * 1000)}`,
        `${username}_${Math.floor(Math.random() * 1000)}`,
        `${username}${Math.floor(Math.random() * 100)}`
      ];

      console.log("Username indisponível, sugestões:", suggestions);
      return res.status(200).json({
        available: false,
        suggestions
      });
    }

    console.log("Username disponível");
    res.status(200).json({ available: true });
  } catch (err) {
    console.error("Erro ao verificar username:", err);
    res.status(500).json({ message: "Erro ao verificar disponibilidade do username." });
  }
});

// 📌 Rota pública: Teste de conexão
router.get("/test", (req, res) => {
  console.log("Teste de conexão recebido");
  res.status(200).json({ message: "Conexão com o backend estabelecida com sucesso!" });
});

// 📌 Rota pública: Teste de verificação de username
router.get("/test-username/:username", async (req, res) => {
  try {
    const username = req.params.username;
    console.log("Teste de verificação de username:", username);

    const existingUser = await User.findOne({ username });
    console.log("Usuário existente:", existingUser ? "Sim" : "Não");

    res.status(200).json({
      username,
      exists: !!existingUser,
      available: !existingUser
    });
  } catch (err) {
    console.error("Erro ao testar username:", err);
    res.status(500).json({ message: "Erro ao testar username." });
  }
});

module.exports = router;

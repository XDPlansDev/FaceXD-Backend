// routes/auth.js
// Atualização do endpoint de registro para incluir e validar o campo único "username"
// Alterações:
// 1. Adicionamos o campo "username" à desestruturação do corpo da requisição.
// 2. Realizamos uma verificação para garantir que o "username" não exista no banco de dados.
// 3. Utilizamos o "username" fornecido na criação do novo usuário, em vez de usar o email.
// 4. Comentários foram adicionados para destacar as mudanças.

const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { authenticateToken } = require("../middleware/authMiddleware"); // Correção aqui 👈

const router = express.Router();

// Obter dados do usuário logado
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

// Registrar novo usuário
router.post("/register", async (req, res) => {
  try {
    // Adicionamos o campo "username" à desestruturação
    const { nome, sobrenome, username, telefone, email, cep, password } = req.body;

    // Validação dos campos obrigatórios (incluindo o username)
    if (!nome || !sobrenome || !username || !email || !cep || !password) {
      return res.status(400).json({ message: "Preencha todos os campos obrigatórios!" });
    }

    // Verifica se o email já está cadastrado
    const existingUserEmail = await User.findOne({ email });
    if (existingUserEmail) return res.status(400).json({ message: "Email já cadastrado." });

    // Verifica se o username já existe no banco de dados para garantir que seja único
    const existingUserUsername = await User.findOne({ username });
    if (existingUserUsername) return res.status(400).json({ message: "Nome de usuário já existe. Por favor, escolha outro." });

    // Criptografa a senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Cria o novo usuário com o username fornecido
    const newUser = new User({
      nome,
      sobrenome,
      username, // Utiliza o username do corpo da requisição
      telefone,
      email,
      cep,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ message: "Usuário registrado com sucesso!" });
  } catch (err) {
    console.error("Erro no registro:", err);
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

    // Incluímos o username no token, caso seja necessário para futuras validações
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
        username: user.username, // Retornamos o username também
        email: user.email,
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
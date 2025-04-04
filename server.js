// BACK-END COMPLETO (Express + MongoDB + JWT)

// 1. Importações básicas e setup inicial
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");
const commentRoutes = require("./routes/comments");
const { authenticateToken } = require("./middleware/authMiddleware");

dotenv.config();
const app = express();

// 2. Middlewares globais
app.use(cors());
app.use(express.json());

// 3. Conexão com MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB conectado!"))
  .catch(err => console.error("Erro ao conectar MongoDB:", err));

// 4. Rotas
app.use("/api/auth", authRoutes);
app.use("/api/users", authenticateToken, userRoutes);
app.use("/api/posts", authenticateToken, postRoutes);
app.use("/api/comments", authenticateToken, commentRoutes);

// 5. Rota default
app.get("/", (req, res) => res.send("API da rede social rodando..."));

// 6. Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

/*
ESTRUTURA DE PASTAS SUGERIDA:

X /backend
X  /routes
X   auth.js        // Registro e login
X   users.js       // Perfil, seguir, etc.
X    posts.js       // CRUD de posts
X    comments.js    // CRUD de comentários
X  /models
    User.js
    Post.js
    Comment.js
X  /middleware
    authMiddleware.js // Verificação do token JWT
  .env             // Variáveis de ambiente
X  server.js        // Arquivo principal (este)
*/

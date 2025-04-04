// BACK-END COMPLETO (Express + MongoDB + JWT)

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

// Middlewares globais
app.use(cors());
app.use(express.json());

// Conexão MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB conectado!"))
.catch(err => console.error("Erro ao conectar MongoDB:", err));

// Rotas públicas
app.use("/api/auth", authRoutes);

// Rotas privadas com token
app.use("/api/users", authenticateToken, userRoutes);
app.use("/api/posts", authenticateToken, postRoutes);
app.use("/api/comments", authenticateToken, commentRoutes);

// Rota default
app.get("/", (req, res) => res.send("🚀 API da rede social rodando..."));

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));

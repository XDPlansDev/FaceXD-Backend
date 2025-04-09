// BACK-END COMPLETO (Express + MongoDB + JWT)

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");
const commentRoutes = require("./routes/comments");

// 🔧 Carrega o .env certo com base no ambiente
dotenv.config({
  path: path.resolve(__dirname, `.env.${process.env.NODE_ENV || "development"}`),
});

const app = express();

// 🌐 Middlewares globais
app.use(cors());
app.use(express.json());

// 🔌 Conexão com MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log(`✅ MongoDB conectado! [${process.env.NODE_ENV}]`))
.catch(err => console.error("❌ Erro ao conectar MongoDB:", err));

// 🛣️ Rotas públicas
app.use("/api/auth", authRoutes);

// 🔒 Rotas protegidas (com middleware nos próprios arquivos)
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);

// 🌍 Rota padrão
app.get("/", (req, res) => res.send("🚀 API da rede social rodando..."));

// 🚀 Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));

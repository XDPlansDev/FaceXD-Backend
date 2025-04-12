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
const notificationRoutes = require("./routes/notifications");

// 🔧 Carrega o .env certo com base no ambiente
dotenv.config({
  path: path.resolve(__dirname, `.env.${process.env.NODE_ENV || "development"}`),
});

const app = express();

// 🌐 Middlewares globais
app.use(cors());
app.use(express.json());

// 📝 Middleware para logar todas as requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  // Loga o corpo da requisição se for POST ou PUT
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log(`[${new Date().toISOString()}] Corpo da requisição:`, req.body);
  }

  // Loga os parâmetros da URL se houver
  if (Object.keys(req.params).length > 0) {
    console.log(`[${new Date().toISOString()}] Parâmetros da URL:`, req.params);
  }

  // Intercepta a resposta para logar o status e o corpo
  const originalSend = res.send;
  res.send = function (body) {
    console.log(`[${new Date().toISOString()}] Resposta: ${res.statusCode} ${req.method} ${req.url}`);

    // Tenta logar o corpo da resposta se for JSON
    try {
      if (typeof body === 'string') {
        const jsonBody = JSON.parse(body);
        console.log(`[${new Date().toISOString()}] Corpo da resposta:`, jsonBody);
      }
    } catch (e) {
      // Ignora erros de parsing
    }

    return originalSend.call(this, body);
  };

  next();
});

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
app.use("/api/notifications", notificationRoutes);

// 🌍 Rota padrão
app.get("/", (req, res) => res.send("🚀 API da rede social rodando..."));

// 🚀 Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));

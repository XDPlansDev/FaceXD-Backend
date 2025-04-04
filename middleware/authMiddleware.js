const jwt = require("jsonwebtoken");

// Middleware para autenticar o token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token não fornecido ou formato inválido." });
  }

  const token = authHeader.split(" ")[1]; // Obtém o token após "Bearer"

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Adiciona os dados do usuário na requisição
    next(); // Continua para a próxima função
  } catch (err) {
    return res.status(403).json({ message: "Token inválido ou expirado." });
  }
}

module.exports = { authenticateToken };

const jwt = require("jsonwebtoken");

// Middleware para autenticar o token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Espera "Bearer TOKEN_AQUI"

  if (!token) {
    return res.status(401).json({ message: "Token não fornecido." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Coloca os dados do token (id, username) em req.user
    next(); // Continua para a rota
  } catch (err) {
    return res.status(403).json({ message: "Token inválido ou expirado." });
  }
}

module.exports = { authenticateToken };

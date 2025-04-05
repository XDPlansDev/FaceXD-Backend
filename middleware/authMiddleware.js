const jwt = require("jsonwebtoken");

/**
 * Middleware para autenticar o token JWT.
 * Verifica se o token está presente e válido.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  // Verifica se o cabeçalho de autorização está presente e no formato correto
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token não fornecido." });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verifica e decodifica o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id }; // Garante que o payload contém `id`
    next();
  } catch (err) {
    console.error("Erro ao verificar token:", err);
    res.status(403).json({ message: "Token inválido." });
  }
}

module.exports = { authenticateToken };

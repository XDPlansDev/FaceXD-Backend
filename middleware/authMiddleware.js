const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token não fornecido." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id }; // ⚠️ Certifique-se que o payload contém `id`
    next();
  } catch (err) {
    console.error("Erro ao verificar token:", err);
    res.status(403).json({ message: "Token inválido." });
  }
}

module.exports = { authenticateToken };

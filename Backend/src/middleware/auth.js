const jwt = require("jsonwebtoken");
const prisma = require("../prismaClient");

async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "Token ausente" });

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    next();
  } catch {
    return res.status(403).json({ message: "Token inválido" });
  }
}

module.exports = auth;

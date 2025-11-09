const jwt = require("jsonwebtoken");
const prisma = require("../prismaClient");

async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "Token ausente" });

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decodificado:', decoded);
    
    const user = await prisma.user.findUnique({ 
      where: { id: decoded.sub },
      select: { id: true }  // Verificar se o usuário existe
    });
    
    if (!user) {
      console.log('Usuário não encontrado:', decoded.sub);
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(403).json({ message: "Token inválido" });
  }
}

module.exports = auth;

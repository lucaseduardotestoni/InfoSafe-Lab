const jwt = require("jsonwebtoken");
const prisma = require("../prismaClient");

async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "Token ausente" });

  // Extract token from header. Support both "Bearer <token>" and raw tokens.
  let token;
  if (header.startsWith("Bearer ")) {
    token = header.slice(7).trim();
  } else {
    token = header.trim();
  }

  // Remove possible surrounding quotes
  token = token.replace(/^"|"$/g, "");

  if (!token) return res.status(401).json({ message: "Token ausente" });

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set in environment');
    return res.status(500).json({ message: 'Server misconfiguration' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({ 
      where: { id: decoded.sub },
      select: { 
        id: true, 
        name: true,
        email: true,
        role: true,
        isLocked: true
      }
    });
    
    if (!user) {
      console.log('Usuário não encontrado:', decoded.sub);
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    // Verifica se o usuário está bloqueado
    if (user.isLocked) {
      return res.status(403).json({ 
        message: "Conta bloqueada. Entre em contato com o administrador.",
        code: "ACCOUNT_LOCKED"
      });
    }

    req.user = {
      ...decoded,
      ...user // Usa todos os dados atuais do banco
    };
    next();
  } catch (error) {
    // Handle JWT-specific errors with clearer HTTP statuses
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado' });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token inválido' });
    }

    // Unknown error - log and return generic 500
    console.error('Erro na autenticação:', error);
    return res.status(500).json({ message: 'Erro interno de autenticação' });
  }
}

module.exports = auth;

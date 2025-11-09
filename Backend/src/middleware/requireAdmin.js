const prisma = require("../prismaClient");

async function requireAdmin(req, res, next) {
  try {
    // O role já está disponível em req.user após as alterações no middleware auth
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: "Acesso negado. Necessário privilégios de administrador." 
      });
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar permissões:', error);
    return res.status(500).json({ message: "Erro ao verificar permissões" });
  }
}

module.exports = requireAdmin;
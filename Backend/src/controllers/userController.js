const prisma = require("../prismaClient");

async function listUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return res.json(users);
  } catch (error) {
    console.error("❌ Erro ao listar usuários:", error);
    return res.status(500).json({ message: "Erro interno ao listar usuários" });
  }
}

module.exports = {
  listUsers
};
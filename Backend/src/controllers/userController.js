const prisma = require("../prismaClient");
const { logAction } = require("../services/auditLogService");

async function listUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isLocked: true
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

async function blockUser(req, res) {
  try {
    const { id } = req.params;
    
    // Impede que o usuário bloqueie a si mesmo
    if (Number(id) === req.user.id) {
      return res.status(400).json({ message: "Você não pode bloquear seu próprio usuário" });
    }

    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { 
        isLocked: !user.isLocked,
        lockedAt: !user.isLocked ? new Date() : null
      }
    });

    // Log da ação
    await logAction(
      user.isLocked ? "USER_UNBLOCKED" : "USER_BLOCKED",
      req.user.id,
      req.ip,
      JSON.stringify({
        targetUser: { id: user.id, email: user.email },
        action: user.isLocked ? "unblock" : "block"
      })
    );

    return res.json(updatedUser);
  } catch (error) {
    console.error("❌ Erro ao alternar bloqueio do usuário:", error);
    return res.status(500).json({ message: "Erro interno ao alternar bloqueio do usuário" });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    
    // Impede que o usuário exclua a si mesmo
    if (Number(id) === req.user.id) {
      return res.status(400).json({ message: "Você não pode excluir seu próprio usuário" });
    }

    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    await prisma.user.delete({ where: { id: Number(id) } });

    // Log da ação
    await logAction(
      "USER_DELETED",
      req.user.id,
      req.ip,
      JSON.stringify({
        deletedUser: { id: user.id, email: user.email }
      })
    );

    return res.json({ message: "Usuário excluído com sucesso" });
  } catch (error) {
    console.error("❌ Erro ao excluir usuário:", error);
    return res.status(500).json({ message: "Erro interno ao excluir usuário" });
  }
}

async function changeRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validar role
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: "Função inválida" });
    }

    // Impede que o usuário altere sua própria role
    if (Number(id) === req.user.id) {
      return res.status(400).json({ message: "Você não pode alterar sua própria função" });
    }

    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { role }
    });

    // Log da ação
    await logAction(
      "USER_ROLE_CHANGED",
      req.user.id,
      req.ip,
      JSON.stringify({
        targetUser: { id: user.id, email: user.email },
        oldRole: user.role,
        newRole: role
      })
    );

    return res.json(updatedUser);
  } catch (error) {
    console.error("❌ Erro ao alterar função do usuário:", error);
    return res.status(500).json({ message: "Erro interno ao alterar função do usuário" });
  }
}

module.exports = {
  listUsers,
  blockUser,
  deleteUser,
  changeRole
};
const prisma = require("../prismaClient");

async function getAuditLogsAdmin(req, res) {
  try {
    const { 
      userId, 
      dataInicial, 
      dataFinal, 
      tipo, 
      limit = 50,
      page = 1
    } = req.query;

    const where = {};
    const skip = (page - 1) * Number(limit);

    // Filtro por usuário
    if (userId && !isNaN(Number(userId))) {
      where.userId = Number(userId);
    }

    // Filtro por tipo de ação
    if (tipo) {
      where.action = {
        contains: tipo
      };
    }

    // Filtro por período
    if (dataInicial || dataFinal) {
      where.createdAt = {};

      if (dataInicial && !isNaN(Date.parse(dataInicial))) {
        where.createdAt.gte = new Date(dataInicial);
      }

      if (dataFinal && !isNaN(Date.parse(dataFinal))) {
        where.createdAt.lte = new Date(dataFinal);
      }
    }

    // Busca logs com informações do usuário
    const logs = await prisma.auditLog.findMany({
      where,
      take: Number(limit),
      skip: skip,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    // Conta total de registros para paginação
    const total = await prisma.auditLog.count({ where });

    return res.json({
      logs,
      pagination: {
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        perPage: Number(limit)
      }
    });

  } catch (error) {
    console.error("❌ Erro ao buscar logs administrativos:", error);
    return res.status(500).json({ message: "Erro interno ao buscar logs" });
  }
}

// Função para obter estatísticas de auditoria
async function getAuditStats(req, res) {
  try {
    const stats = await prisma.$transaction([
      // Total de ações por tipo
      prisma.auditLog.groupBy({
        by: ['action'],
        _count: true,
        orderBy: {
          _count: {
            _all: 'desc'
          }
        },
        take: 5
      }),

      // Total de ações por usuário
      prisma.auditLog.groupBy({
        by: ['userId'],
        _count: true,
        orderBy: {
          _count: {
            _all: 'desc'
          }
        },
        take: 5
      }),

      // Total de erros nas últimas 24h
      prisma.auditLog.count({
        where: {
          action: {
            contains: '_FAILED'
          },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // Busca informações dos usuários para os top 5
    const userIds = stats[1].map(s => s.userId).filter(id => id != null);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true }
    });

    return res.json({
      topActions: stats[0],
      topUsers: stats[1].map(stat => ({
        ...stat,
        user: users.find(u => u.id === stat.userId)
      })),
      errorsLast24h: stats[2]
    });

  } catch (error) {
    console.error("❌ Erro ao buscar estatísticas:", error);
    return res.status(500).json({ message: "Erro ao buscar estatísticas" });
  }
}

module.exports = { 
  getAuditLogsAdmin,
  getAuditStats
};
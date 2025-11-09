const prisma = require("../prismaClient");

async function getAuditLogs(req, res) {
  try {
    const { dataInicial, dataFinal, limit = 50, errorsOnly = false } = req.query;

    // Sempre filtra pelos logs do usuário atual
    const where = {
      userId: req.user.sub
    };

    // Filtra apenas ações de erro se solicitado
    if (errorsOnly === 'true') {
      where.action = {
        contains: '_FAILED'
      };
    }

    // Se usou datas, valida e converte
    if (dataInicial || dataFinal) {
      where.createdAt = {};

      if (dataInicial && !isNaN(Date.parse(dataInicial))) {
        where.createdAt.gte = new Date(dataInicial);
      }

      if (dataFinal && !isNaN(Date.parse(dataFinal))) {
        where.createdAt.lte = new Date(dataFinal);
      }
    }

    console.log("🔍 Filtro aplicado:", where);

    const logs = await prisma.auditLog.findMany({
      where,
      take: Number(limit),
      orderBy: { createdAt: "desc" }
    });

    console.log(`📦 Logs retornados: ${logs.length}`);
    return res.json(logs);

  } catch (error) {
    console.error("❌ Erro ao buscar auditoria:", error);
    return res.status(500).json({ message: "Erro interno ao buscar logs" });
  }
}

module.exports = { getAuditLogs };

const prisma = require("../prismaClient");

async function logAction(action, userId = null, ip = null) {
  return prisma.auditLog.create({
    data: { action, userId, ip }
  });
}

module.exports = { logAction };

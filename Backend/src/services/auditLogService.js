const prisma = require("../prismaClient");

async function logAction(action, userId = null, ip = null, command = null) {
  // Só salva o comando se a ação contiver "_FAILED" no nome
  const shouldLogCommand = action.includes("_FAILED");
  
  // Obtém o IP real considerando proxies
  const realIp = ip || "unknown";
  
  // Se o comando não for JSON, converte para JSON
  let commandJSON = null;
  if (shouldLogCommand && command) {
    if (typeof command === 'string') {
      try {
        // Tenta fazer parse para ver se já é JSON
        JSON.parse(command);
        commandJSON = command;
      } catch {
        // Se não for JSON, converte para JSON
        commandJSON = JSON.stringify({
          command: command
        });
      }
    } else {
      // Se não for string, converte o objeto para JSON
      commandJSON = JSON.stringify(command);
    }
  }
  
  return prisma.auditLog.create({
    data: { 
      action, 
      userId, 
      ip: realIp,
      executedCommand: commandJSON
    }
  });
}

module.exports = { logAction };

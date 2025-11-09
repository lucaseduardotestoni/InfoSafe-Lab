const router = require("express").Router();
const { getAuditLogs } = require("../controllers/auditController");
const auth = require("../middleware/auth"); // garante usuário autenticado

// Apenas usuários logados podem ver logs
router.get("/", auth, getAuditLogs);

module.exports = router;

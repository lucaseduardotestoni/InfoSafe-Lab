const router = require("express").Router();
const { getAuditLogsAdmin, getAuditStats } = require("../controllers/auditAdminController");
const auth = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");

// Todas as rotas requerem autenticação e privilégios de admin
router.use(auth, requireAdmin);

// Rota para buscar logs com filtros avançados
router.get("/logs", getAuditLogsAdmin);

// Rota para estatísticas
router.get("/stats", getAuditStats);

module.exports = router;
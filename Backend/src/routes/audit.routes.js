const router = require("express").Router();
const { getAuditLogs } = require("../controllers/auditController");
const auth = require("../middleware/auth");

router.get("/", auth, getAuditLogs);

module.exports = router;

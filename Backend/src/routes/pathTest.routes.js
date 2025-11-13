const express = require("express");
const router = express.Router();
const { testPathTraversal, saveTestFile } = require("../controllers/pathTest.controller");
const auth = require("../middleware/auth");
const pathLimit = require('../middleware/pathLimit');

// POST /tests/path-traversal/save-file
// exigir autenticação para as rotas de teste (usuário deve estar logado)
router.use(auth);

// Aplica o limitador específico para a rota de salvar arquivo — evita que o body-parser lance PayloadTooLarge
// Aqui usamos 5MB como exemplo; ajuste conforme `pathTest.service.js` ou suas necessidades.
// Aplica pathLimit primeiro; se passar, usamos express.json() somente para esta rota
// (assim o body-parser local roda depois do limitador, evitando PayloadTooLarge global).
router.post(
	"/path-traversal/save-file",
	pathLimit(1 * 1024 * 1024),
	express.json(),
	saveTestFile
);

// GET /tests/path-traversal/test?file=
router.get("/path-traversal/test", testPathTraversal);

module.exports = router;

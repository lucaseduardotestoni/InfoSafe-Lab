const express = require("express");
const router = express.Router();
const { testPathTraversal, saveTestFile } = require("../controllers/pathTest.controller");
const auth = require("../middleware/auth");

// POST /tests/path-traversal/save-file
// exigir autenticação para as rotas de teste (usuário deve estar logado)
router.use(auth);

router.post("/path-traversal/save-file", saveTestFile);

// GET /tests/path-traversal/test?file=
router.get("/path-traversal/test", testPathTraversal);

module.exports = router;

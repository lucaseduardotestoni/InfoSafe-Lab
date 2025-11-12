const express = require("express");
const router = express.Router();
const { testPathTraversal, saveTestFile } = require("../controllers/pathTest.controller");

// POST /tests/path-traversal/save-file
router.post("/path-traversal/save-file", saveTestFile);

// GET /tests/path-traversal/test?file=
router.get("/path-traversal/test", testPathTraversal);

module.exports = router;

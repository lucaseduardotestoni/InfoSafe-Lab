const testsService = require("../services/pathTest.service");

async function saveTestFile(req, res) {
  try {
    const { userId, filename, content } = req.body;

    if (!userId || !filename || typeof content === "undefined") {
      return res.status(400).json({ message: "userId, filename e content são obrigatórios" });
    }

    const savedPath = await testsService.saveFile(userId, filename, content);
    return res.json({ ok: true, path: savedPath });

  } catch (err) {
    console.error("saveTestFile error:", err);
    return res.status(500).json({ message: "Erro ao salvar arquivo", detail: err.message });
  }
}

async function testPathTraversal(req, res) {
  try {
    const { file } = req.query;

    if (!file) {
      return res.status(400).json({ message: "Parâmetro 'file' é obrigatório." });
    }

  const options = { userId: req.user?.id ?? null, ip: req.ip };
  const result = await testsService.testPathTraversal(file, options);

    const httpStatus = result && typeof result.status === 'number' ? result.status : 200;
    return res.status(httpStatus).json(result);

  } catch (err) {
    console.error("testPathTraversal error:", err);
    return res.status(500).json({ message: "Erro interno", detail: err.message });
  }
}

module.exports = { saveTestFile, testPathTraversal };

const testsService = require("../services/pathTest.service");

async function saveTestFile(req, res) {
  try {
    // Preferir userId derivado do token (req.user) quando disponível.
    const body = req.body || {};
    const filename = body.filename;
    const content = body.content;
    const userId = req.user?.id ?? body.userId ?? null;

    if (!userId || !filename || typeof content === "undefined") {
      return res.status(400).json({ message: "userId, filename e content são obrigatórios" });
    }

    const savedPath = await testsService.saveFile(userId, filename, content);
    return res.json({ ok: true, path: savedPath });

  } catch (err) {
    console.error("saveTestFile error:", err);
    if (err && err.status) {
      return res.status(err.status).json({ message: err.message || 'Erro', detail: err.detail || null });
    }
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

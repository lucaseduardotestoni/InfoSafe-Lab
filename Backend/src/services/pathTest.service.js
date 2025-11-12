// src/services/tests.service.js  (snippet do testPathTraversal aprimorado)
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const { resolveSafePath } = require("../utils/fileHelpers"); // assume implementação segura

const MAX_DECODE_ROUNDS = 5;
const MAX_BYTES = 1024 * 1024; // 1MB
const ALLOWED_EXT = new Set(['.txt', '.log', '.json', '.md']);

function safeDecode(input) {
  // Decodifica iterativamente até estabilizar ou atingir limite
  let last = input;
  for (let i = 0; i < MAX_DECODE_ROUNDS; i++) {
    try {
      const dec = decodeURIComponent(last);
      if (dec === last) break;
      last = dec;
    } catch (e) {
      // se falhar no decode (malformed), mantemos o último e paramos
      break;
    }
  }
  return last;
}

async function testPathTraversal(file, options = {}) {
  // options: { saveResultFn, userId, ip }
  try {
    if (!file) return { status: 400, message: "Parâmetro 'file' é obrigatório." };

    // 1) decodifica de forma segura (tratando double-encoding)
    let decoded = safeDecode(String(file));

    // 2) normaliza separadores Windows -> POSIX
    decoded = decoded.replace(/\\/g, '/');

    // 3) proibi caracteres NUL ou control
    if (decoded.includes('\0') || /[\x00-\x1f]/.test(decoded)) {
      return { status: 400, message: 'Caminho inválido' };
    }

    // 4) não permite caminhos absolutos (inclui C:\ e /)
    if (path.isAbsolute(decoded) || /^[a-zA-Z]:\//.test(decoded)) {
      return { status: 400, message: 'Caminhos absolutos não são permitidos' };
    }

    // 5) não permite patterns suspeitos simples (opcional, defesa em profundidade)
    //    Ex.: '/../', '/..', '../', '../' já serão pegos na resolução, mas é ok checar aqui
    if (/(^|\/)\.\.($|\/)/.test(decoded)) {
      // ainda não é fim — vamos resolver e usar realpath pra confirmar — mas já avisamos
      // podemos continuar e deixar que a validação a seguir trate a detecção final.
    }

    const baseDir = path.resolve(__dirname, "../../safe-files");

    // 6) resolve de forma segura — usa helper que concatena e normaliza
    let resolved;
    try {
      resolved = resolveSafePath(baseDir, decoded); // deve lançar/retornar erro se sair do base
    } catch (err) {
      return { status: 400, message: "Tentativa de Path Traversal detectada!" };
    }

    // 7) normaliza real paths (follow symlinks)
    const realBase = await fsp.realpath(baseDir);
    const realResolved = await fsp.realpath(resolved).catch(() => null);
    if (!realResolved) return { status: 404, message: 'Arquivo não encontrado.' };

    // 8) garante que realResolved está dentro do realBase
    const sep = path.sep;
    const allowedPrefix = realBase.endsWith(sep) ? realBase : realBase + sep;
    if (!(realResolved === realBase || realResolved.startsWith(allowedPrefix))) {
      return { status: 400, message: "Tentativa de Path Traversal detectada!" };
    }

    // 9) whitelist de extensões
    const ext = path.extname(realResolved).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return { status: 403, message: 'Tipo de arquivo não permitido.' };
    }

    // 10) estatísticas e tamanho
    const stat = await fsp.stat(realResolved);
    if (stat.isDirectory()) return { status: 400, message: 'É um diretório' };
    if (stat.size > MAX_BYTES) return { status: 413, message: 'Arquivo muito grande.' };

    // 11) leitura segura
    const content = await fsp.readFile(realResolved, 'utf8');

    // opcional: grava o resultado do teste (audit) se passado saveResultFn
    if (typeof options.saveResultFn === 'function') {
      // exemplo de objeto de log
      const log = {
        userId: options.userId ?? null,
        ip: options.ip ?? null,
        payload: file,
        decoded,
        path: realResolved,
        result: 'allowed',
        timestamp: new Date().toISOString()
      };
      try { await options.saveResultFn(log); } catch (e) { /* não falha a resposta por causa do log */ }
    }

    return { status: 200, message: "Arquivo lido com sucesso", content };

  } catch (err) {
    console.error('testPathTraversal error:', err);
    return { status: 500, message: 'Erro interno', detail: err.message };
  }
}

module.exports = { testPathTraversal, safeDecode };

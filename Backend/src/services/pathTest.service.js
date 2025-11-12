// src/services/tests.service.js  (snippet do testPathTraversal aprimorado)
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const { resolveSafePath } = require("../utils/fileHelpers"); // assume implementação segura
const prisma = require('../prismaClient');

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
  async function makeResult(status, message, extra = {}) {
    const res = { status, message, ...extra };
    // Log to DB for blocked attempts (400/403) — não bloqueamos a resposta se o log falhar
    try {
      if ([400, 403].includes(status)) {
        const payloadText = String(file).slice(0, 2000); // limita tamanho
        await prisma.auditLog.create({
          data: {
            userId: options.userId ?? null,
            action: 'path_traversal_attempt',
            ip: options.ip ?? null,
            executedCommand: payloadText
          }
        });
      }
    } catch (e) {
      // não falha a resposta por causa do log — apenas registra no console
      console.error('Failed to save audit log for path traversal attempt:', e && e.message);
    }

    return res;
  }
  try {
  if (!file) return await makeResult(400, "Parâmetro 'file' é obrigatório.");

    // 1) decodifica de forma segura (tratando double-encoding)
    let decoded = safeDecode(String(file));

    // 2) normaliza separadores Windows -> POSIX
    decoded = decoded.replace(/\\/g, '/');

    // 3) proibi caracteres NUL ou control
    if (decoded.includes('\0') || /[\x00-\x1f]/.test(decoded)) {
      return await makeResult(400, 'Caminho inválido');
    }

    // 4) não permite caminhos absolutos (inclui C:\ e /)
    if (path.isAbsolute(decoded) || /^[a-zA-Z]:\//.test(decoded)) {
      return await makeResult(400, 'Caminhos absolutos não são permitidos');
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
      return await makeResult(400, "Tentativa de Path Traversal detectada!");
    }

    // 7) normaliza real paths (follow symlinks)
    const realBase = await fsp.realpath(baseDir);
    const realResolved = await fsp.realpath(resolved).catch(() => null);
  if (!realResolved) return await makeResult(404, 'Arquivo não encontrado.');

    // 8) garante que realResolved está dentro do realBase
    const sep = path.sep;
    const allowedPrefix = realBase.endsWith(sep) ? realBase : realBase + sep;
    if (!(realResolved === realBase || realResolved.startsWith(allowedPrefix))) {
      return await makeResult(400, "Tentativa de Path Traversal detectada!");
    }

    // 9) whitelist de extensões
    const ext = path.extname(realResolved).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return await makeResult(403, 'Tipo de arquivo não permitido.');
    }

    // 10) estatísticas e tamanho
    const stat = await fsp.stat(realResolved);
  if (stat.isDirectory()) return await makeResult(400, 'É um diretório');
  if (stat.size > MAX_BYTES) return await makeResult(413, 'Arquivo muito grande.');

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

  return await makeResult(200, "Arquivo lido com sucesso", { content });

  } catch (err) {
    console.error('testPathTraversal error:', err);
    return await makeResult(500, 'Erro interno', { detail: err.message });
  }
}

module.exports = { testPathTraversal, safeDecode };

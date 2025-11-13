/**
 * Middleware que detecta potenciais payloads XSS em req.body, req.query e req.params
 * e grava um registro de auditoria usando auditLogService.logAction quando encontrados.
 */
const { logAction } = require('../services/auditLogService');
const jwt = require('jsonwebtoken');

const DEFAULT_PATTERNS = [
  /<script\b[^>]*>([\s\S]*?)<\/script>/i,
  /on\w+\s*=\s*['\"]?/i, // onerror=, onclick=, onmouseover=, etc.
  /javascript:\s*/i,
  /<img\b[^>]*src\s*=\s*['\"][^'\"]*onerror/i,
  /alert\s*\(/i,
  /eval\s*\(/i
];

function collectStrings(obj, maxPerField = 1000) {
  const results = [];
  const seen = new Set();

  function walk(value, path = '') {
    if (value == null) return;
    if (typeof value === 'string') {
      const key = `${path}:${value}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({ path, value: value.slice(0, maxPerField) });
      }
      return;
    }
    if (typeof value === 'number' || typeof value === 'boolean') return;
    if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, `${path}[${i}]`));
      return;
    }
    if (typeof value === 'object') {
      for (const k of Object.keys(value)) walk(value[k], path ? `${path}.${k}` : k);
    }
  }

  walk(obj);
  return results;
}

module.exports = function xssLogger(options = {}) {
  const patterns = options.patterns || DEFAULT_PATTERNS;
  const maxPerField = options.maxPerField || 2000;

  return async function (req, res, next) {
    try {
      const candidates = [];

      // collect strings from body, query and params
      if (req.body) candidates.push(...collectStrings(req.body, maxPerField));
      if (req.query) candidates.push(...collectStrings(req.query, maxPerField));
      if (req.params) candidates.push(...collectStrings(req.params, maxPerField));

      const matches = [];
      for (const c of candidates) {
        for (const re of patterns) {
          if (re.test(c.value)) {
            matches.push({ path: c.path, snippet: c.value });
            break;
          }
        }
      }

      if (matches.length > 0) {
        // tenta obter userId se o auth middleware já tenha populado req.user
        let userId = req.user?.id ?? null;

        // Se não houver req.user, tenta decodificar o JWT presente no header Authorization
        // (somente para extrair o sub/user id sem verificar assinatura)
        if (!userId) {
          try {
            const header = req.headers.authorization;
            if (header) {
              let token = header.startsWith('Bearer ') ? header.slice(7).trim() : header.trim();
              token = token.replace(/^"|"$/g, '');
              const decoded = jwt.decode(token);
              if (decoded && decoded.sub) {
                // sub pode ser string/number; deixamos como veio
                userId = decoded.sub;
              }
            }
          } catch (e) {
            // não bloquear por falha na decodificação
            userId = userId ?? null;
          }
        }
        const ip = req.ip || req.headers['x-forwarded-for'] || null;

        // chama o serviço de auditoria — ação inclui _FAILED para que executedCommand seja salvo
        try {
          await logAction('XSS_ATTEMPT_FAILED', userId, ip, {
            path: req.path,
            method: req.method,
            matches: matches.slice(0, 20)
          });
        } catch (e) {
          // não bloquear a requisição se o log falhar
          console.error('Falha ao salvar audit log para XSS:', e && e.message);
        }
      }

      return next();
    } catch (err) {
      // Se algo der errado no middleware, apenas registra e segue
      console.error('xssLogger middleware error:', err && err.message);
      return next();
    }
  };
};

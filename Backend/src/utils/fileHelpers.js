const fs = require('fs').promises;
const path = require('path');

/**
 * Resolve um caminho relativo a baseDir e garante que o resultado permaneça dentro da base.
 * Lança erro se for detectado path traversal.
 */
function resolveSafePath(baseDir, requestedPath) {
  const base = path.resolve(baseDir);
  const resolved = path.resolve(base, requestedPath);

  // Usa path.relative para detectar se resolved "sai" de base
  const rel = path.relative(base, resolved);
  if (rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))) {
    return resolved;
  }

  throw new Error('Invalid path (path traversal detected)');
}

/**
 * Garante que o diretório exista (recursivo)
 */
async function ensureDirExists(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

module.exports = { resolveSafePath, ensureDirExists };

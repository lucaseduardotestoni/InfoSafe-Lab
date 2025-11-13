/**
 * Middleware para rejeitar requisições com Content-Length maior que um limite configurado.
 * Isso permite responder com JSON antes do body-parser ler todo o corpo e lançar PayloadTooLarge.
 * Uso: app.use('/tests/path-traversal/save-file', pathLimit(5 * 1024 * 1024));
 */
module.exports = function pathLimit(limitBytes) {
  if (!limitBytes || typeof limitBytes !== 'number') {
    throw new Error('pathLimit precisa de um limite em bytes (number)');
  }

  return function (req, res, next) {
    try {
      const cl = req.headers['content-length'];
      if (cl) {
        const len = Number(cl);
        if (!Number.isNaN(len) && len > limitBytes) {
          console.warn(`Requisição bloqueada por pathLimit: Content-Length ${len} > ${limitBytes}`);
          return res.status(413).json({ message: 'Arquivo muito grande', detail: `Content-Length ${len} maior que limite ${limitBytes}` });
        }
      }

      // Se não houver Content-Length, não podemos garantir o tamanho sem consumir o stream.
      // Neste caso deixamos passar e confiamos no body-parser global para tratar o resto.
      return next();
    } catch (err) {
      return next(err);
    }
  };
};

const getClientIp = (req) => {
  // Tenta obter o IP de vários headers comuns
  const ip = 
    req.headers['x-forwarded-for']?.split(',')[0] || // Header comum em proxies
    req.headers['x-real-ip'] || // Usado por alguns proxies reversos
    req.connection.remoteAddress || // IP direto da conexão
    req.socket.remoteAddress || // Socket IP
    req.ip; // IP do Express (pode ser IPv6)

  // Se for um IPv6 local (::1), converte para IPv4 localhost
  if (ip === '::1') {
    return '127.0.0.1';
  }

  // Se for um IPv6 com IPv4 embutido (ex: ::ffff:192.168.1.1)
  if (ip?.includes('::ffff:')) {
    return ip.split('::ffff:')[1];
  }

  return ip || 'unknown';
};

module.exports = { getClientIp };
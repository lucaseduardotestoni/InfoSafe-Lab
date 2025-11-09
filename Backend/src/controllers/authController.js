const { register: registerService, login: loginService } = require("../services/authService");
const prisma = require("../prismaClient");
const { getClientIp } = require("../utils/ipUtils");

async function register(req, res) {
  const result = await registerService({ ...req.body, ip: getClientIp(req) });
  return res.status(result.status).json(result);
}

async function login(req, res) {
  const { email, password } = req.body;
  const result = await loginService({ email, password, ip: getClientIp(req) });

  return res.status(result.status).json(
    result.token ? { token: result.token } : { message: result.message }
  );
}

async function me(req, res) {
  try {
    console.log('Dados do usuário na requisição:', req.user);
    
    const userData = {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isLocked: req.user.isLocked
    };

    return res.json(userData);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return res.status(500).json({ message: "Erro interno do servidor", error: error.message });
  }
}

module.exports = {
  register,
  login,
  me
};

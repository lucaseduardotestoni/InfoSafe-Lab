const { register: registerService, login: loginService } = require("../services/authService");
const prisma = require("../prismaClient");

async function register(req, res) {
  const result = await registerService({ ...req.body, ip: req.ip });
  return res.status(result.status).json(result);
}

async function login(req, res) {
  const { email, password } = req.body;
  const result = await loginService({ email, password, ip: req.ip });

  return res.status(result.status).json(
    result.token ? { token: result.token } : { message: result.message }
  );
}

async function me(req, res) {
  try {
    console.log('Dados do usuário na requisição:', req.user);
    
    const user = await prisma.user.findUnique({
      where: { 
        id: parseInt(req.user.sub) // Garantir que o ID seja um número
      },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true, 
        isLocked: true 
      }
    });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    return res.json(user);
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

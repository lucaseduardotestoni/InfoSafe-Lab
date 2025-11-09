const prisma = require("../prismaClient");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

async function register(req, res) {
  const { email, password, name } = req.body;

  // Verifica se o email já existe
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ message: "Email já cadastrado" });

  // Criptografa senha
  const passwordHash = await bcrypt.hash(password, 10);

  // Cria usuário
  await prisma.user.create({
    data: { email, passwordHash, name, role: "user", isLocked: false, failedLogin: 0 }
  });

  return res.status(201).json({ message: "Usuário registrado com sucesso" });
}

async function login(req, res) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: "Credenciais inválidas" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: "Credenciais inválidas" });

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  res.json({ token });
}

module.exports = { register, login };

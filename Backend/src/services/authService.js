const prisma = require("../prismaClient");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { logAction } = require("./auditLogService");

async function register({ email, password, name, ip }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await logAction("REGISTER_FAILED_EMAIL_EXISTS", null, ip);
    return { status: 409, message: "Email já cadastrado" };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: { email, passwordHash, name, role: "user", isLocked: false, failedLogin: 0 }
  });

  await logAction("REGISTER_SUCCESS", newUser.id, ip);
  return { status: 201, message: "Usuário registrado com sucesso" };
}

async function login({ email, password, ip }) {
  const LOCK_TIME_MINUTES = 15;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    await prisma.auditLog.create({ data: { action: "LOGIN_FAILED_USER_NOT_FOUND", ip } });
    return { status: 401, message: "Credenciais inválidas" };
  }

  if (user.isLocked) {
    const diffMinutes = (Date.now() - new Date(user.lockedAt).getTime()) / 1000 / 60;

    if (diffMinutes < LOCK_TIME_MINUTES) {
      return { 
        status: 403, 
        message: `Conta bloqueada. Tente novamente em ${Math.ceil(LOCK_TIME_MINUTES - diffMinutes)} minutos.` 
      };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isLocked: false, failedLogin: 0, lockedAt: null }
    });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    const attempts = user.failedLogin + 1;

    if (attempts >= 5) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isLocked: true, failedLogin: attempts, lockedAt: new Date() }
      });

      await prisma.auditLog.create({ data: { action: "ACCOUNT_LOCKED", userId: user.id, ip } });
      return { status: 403, message: "Conta bloqueada por tentativas excessivas" };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLogin: attempts }
    });

    await prisma.auditLog.create({ data: { action: "LOGIN_FAILED_WRONG_PASSWORD", userId: user.id, ip } });
    return { status: 401, message: `Senha incorreta. Tentativas restantes: ${5 - attempts}` };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLogin: 0, lockedAt: null }
  });

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  await prisma.auditLog.create({ data: { action: "LOGIN_SUCCESS", userId: user.id, ip } });

  return { status: 200, token };
}

module.exports = { register, login };


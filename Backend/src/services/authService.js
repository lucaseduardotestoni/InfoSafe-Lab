const prisma = require("../prismaClient");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { logAction } = require("./auditLogService");

async function register({ email, password, name, ip }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await logAction("REGISTER_FAILED_EMAIL_EXISTS", null, ip, JSON.stringify({
      action: "REGISTER_ATTEMPT",
      email: email,
      name: name
    }));
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
  
    if (!email) {
    return { status: 400, message: "O campo email é obrigatório." };
  }

  if (!password) {
    return { status: 400, message: "O campo senha é obrigatório." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Captura a tentativa de login com o email usado
  const commandExecuted = JSON.stringify({
    action: "LOGIN_ATTEMPT",
    email: email
    // Nunca incluir a senha aqui!
  });

  if (!user) {
    await logAction("LOGIN_FAILED_USER_NOT_FOUND", null, ip, commandExecuted);
    return { status: 401, message: "Credenciais inválidas" };
  }

  // Verifica se o usuário está bloqueado
  if (user.isLocked) {
    // Se o usuário tem falhas de login zeradas mas está bloqueado, é bloqueio administrativo
    if (user.failedLogin === 0) {
      await logAction("LOGIN_ATTEMPT_ADMIN_LOCKED", user.id, ip, JSON.stringify({
        action: "LOGIN_ATTEMPT_ADMIN_LOCKED",
        email: email
      }));
      return { 
        status: 403, 
        message: "Esta conta está bloqueada. Entre em contato com o administrador." 
      };
    }

    // Verifica se tem lockedAt e failedLogin > 0 (indica bloqueio por força bruta)
    if (user.lockedAt && user.failedLogin > 0) {
      const diffMinutes = (Date.now() - new Date(user.lockedAt).getTime()) / 1000 / 60;
      const currentLockTime = user.failedLogin >= 5 ? LOCK_TIME_MINUTES * 2 : LOCK_TIME_MINUTES;

      if (diffMinutes < currentLockTime) {
        // Se tentar login durante o bloqueio, aumenta o tempo
        const newLockTime = currentLockTime + LOCK_TIME_MINUTES;
        
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            lockedAt: new Date(), // Reseta o timer
            failedLogin: user.failedLogin + 1
          }
        });

        await logAction("LOGIN_ATTEMPT_DURING_LOCKOUT", user.id, ip, JSON.stringify({
          action: "LOGIN_ATTEMPT_DURING_LOCKOUT",
          email: email,
          lockTimeExtended: newLockTime
        }));

        return { 
          status: 403, 
          message: `Conta bloqueada. Devido a tentativas durante o bloqueio, o tempo foi estendido para ${Math.ceil(newLockTime)} minutos.` 
        };
      }

      // Se passou o tempo de bloqueio por força bruta, desbloqueia
      await prisma.user.update({
        where: { id: user.id },
        data: { isLocked: false, failedLogin: 0, lockedAt: null }
      });

      await logAction("ACCOUNT_UNLOCKED_TIMEOUT", user.id, ip, JSON.stringify({
        action: "ACCOUNT_UNLOCKED_TIMEOUT",
        email: email
      }));
    }
  }

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    const attempts = user.failedLogin + 1;

    if (attempts >= 5) {
      // Verifica se o usuário já está bloqueado administrativamente
      if (user.isLocked && user.failedLogin === 0) {
        await logAction("LOGIN_ATTEMPT_ADMIN_LOCKED", user.id, ip, JSON.stringify({
          action: "LOGIN_ATTEMPT_ADMIN_LOCKED",
          email: email
        }));
        return { 
          status: 403, 
          message: "Esta conta está bloqueada. Entre em contato com o administrador." 
        };
      }

      // Aplica o bloqueio por força bruta
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          isLocked: true, 
          failedLogin: attempts,
          lockedAt: new Date() // Marca o momento do bloqueio
        }
      });

      await logAction("ACCOUNT_LOCKED_BRUTE_FORCE", user.id, ip, JSON.stringify({
        action: "ACCOUNT_LOCKED_BRUTE_FORCE",
        email: email,
        attempts: attempts,
        lockTime: LOCK_TIME_MINUTES
      }));

      return { 
        status: 403, 
        message: `Conta bloqueada por tentativas excessivas. Tente novamente em ${LOCK_TIME_MINUTES} minutos. Novas tentativas durante o bloqueio aumentarão o tempo.` 
      };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLogin: attempts }
    });

    await logAction("LOGIN_FAILED_WRONG_PASSWORD", user.id, ip, commandExecuted);
    return { status: 401, message: `Senha incorreta. Tentativas restantes: ${5 - attempts}` };
  }

  // Se o login for bem sucedido e o usuário não estiver bloqueado administrativamente
  if (!user.isLocked) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLogin: 0, lockedAt: null }
    });
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  await logAction("LOGIN_SUCCESS", user.id, ip);

  return { status: 200, token };
}

module.exports = { register, login };

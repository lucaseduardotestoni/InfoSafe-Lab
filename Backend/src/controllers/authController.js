const { register, login } = require("../services/authService");

async function registerController(req, res) {
  const result = await register({ ...req.body, ip: req.ip });
  return res.status(result.status).json(result);
}

async function loginController(req, res) {
  const result = await login({ ...req.body, ip: req.ip });

  if (result.token)
    return res.json({ token: result.token });

  return res.status(result.status).json(result);
}

module.exports = { register: registerController, login: loginController };

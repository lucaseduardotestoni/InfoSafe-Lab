const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');

// Lista todos os usuários (apenas para admin)
router.get('/', auth, async (req, res) => {
  // Verifica se o usuário é admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Acesso negado" });
  }
  
  return userController.listUsers(req, res);
});

module.exports = router;
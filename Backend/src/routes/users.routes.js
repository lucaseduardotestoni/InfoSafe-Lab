const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');

// Middleware para verificar se é admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Acesso negado" });
  }
  next();
};

// Lista todos os usuários (apenas para admin)
router.get('/', auth, isAdmin, userController.listUsers);

// Bloquear/Desbloquear usuário
router.post('/:id/block', auth, isAdmin, userController.blockUser);

// Excluir usuário
router.delete('/:id', auth, isAdmin, userController.deleteUser);

// Alterar função do usuário
router.patch('/:id/role', auth, isAdmin, userController.changeRole);

module.exports = router;
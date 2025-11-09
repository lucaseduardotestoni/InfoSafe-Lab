const router = require("express").Router();
const auth = require("../middleware/auth");

router.get("/me", auth, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role
  });
});

module.exports = router;

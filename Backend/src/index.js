require("dotenv/config");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const auditRoutes = require("./routes/audit.routes");
const auditAdminRoutes = require("./routes/auditAdmin.routes");
const userRoutes = require("./routes/users.routes");
const testsRoutes = require("./routes/pathTest.routes");


const app = express();

// Configuração para obter o IP real do cliente
app.set('trust proxy', true);

const sanitizeInputs = require('./middleware/sanitizeInputs');
const helmet = require('helmet');
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
      "object-src": ["'none'"],
      "img-src": ["'self'", "data:"],
      "style-src": ["'self'", "'unsafe-inline'"],
    },
  })
);
app.use(cors());
app.use(express.json());
app.use("/tests", testsRoutes);
app.use("/auth", authRoutes);
app.use("/audit", auditRoutes);
app.use("/admin/audit", auditAdminRoutes);
app.use("/users", userRoutes);
app.use(sanitizeInputs);
app.listen(port = 3001, () => {
  console.log(`Backend rodando em http://localhost:${port}`);
});

require("dotenv/config");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const auditRoutes = require("./routes/audit.routes");
const auditAdminRoutes = require("./routes/auditAdmin.routes");
const userRoutes = require("./routes/users.routes");

const app = express();

// Configuração para obter o IP real do cliente
app.set('trust proxy', true);

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/audit", auditRoutes);
app.use("/admin/audit", auditAdminRoutes);
app.use("/users", userRoutes);
app.listen(port = 3001, () => {
  console.log(`Backend rodando em http://localhost:${port}`);
});

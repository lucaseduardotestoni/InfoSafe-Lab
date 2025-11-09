require("dotenv/config");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const auditRoutes = require("./routes/audit.routes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/audit", auditRoutes);
app.listen(port = 3001, () => {
  console.log(`Backend rodando em http://localhost:${port}`);
});

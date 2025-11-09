require("dotenv/config");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);

app.listen(port = 3001, () => {
  console.log(`Backend rodando em http://localhost:${port}`);
});

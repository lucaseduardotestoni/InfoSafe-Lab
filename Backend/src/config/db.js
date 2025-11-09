const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "infosafe",
  password: "SENHA_DO_BANCO",
  port: 5432,
});

module.exports = pool;

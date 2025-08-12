const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config(".env");

const { testConnection } = require("./src/config/database");
const userRoutes = require("./src/routes/userRoutes");

console.log("INITALIZATION APPLICATION, WELCOME TO THE DJANGO");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use("/api/users", userRoutes);

// Rota de health check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Servidor funcionando corretamente",
    timestamp: new Date().toISOString(),
  });
});

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Erro interno do servidor",
  });
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Rota não encontrada",
  });
});

// Inicializar servidor
async function startServer() {
  try {
    // Testar conexão com banco
    await testConnection();

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(` Servidor rodando na porta ${PORT}`);
      console.log(` Ambiente: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error(" Erro ao iniciar servidor:", error);
    process.exit(1);
  }
}

startServer();

module.exports = app;

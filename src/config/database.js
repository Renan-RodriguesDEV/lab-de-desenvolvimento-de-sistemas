// Importa o pacote mysql2 para conectar com o banco de dados
const mysql = require("mysql2");

// Carrega variáveis de ambiente do arquivo .env
require("dotenv").config();

// Configurações de conexão com o banco de dados MySQL
const dbConfig = {
  host: process.env.DB_HOST || "localhost", // Endereço do banco
  port: process.env.DB_PORT || 3306, // Porta padrão do MySQL
  user: process.env.DB_USER || "root", // Usuário do banco
  password: process.env.DB_PASSWORD || "", // Senha do banco
  database: process.env.DB_NAME || "mvc_nodejs", // Nome do banco
  waitForConnections: true, // Espera por conexões quando o limite for atingido
  connectionLimit: 10, // Máximo de conexões simultâneas
  queueLimit: 0, // Sem limite de requisições na fila
};

// Cria um pool (grupo) de conexões reutilizáveis
const pool = mysql.createPool(dbConfig);

// Transforma o pool em versão "promessa" para usar async/await
const promisePool = pool.promise();

// Função para testar se a conexão com o banco está funcionando
async function testConnection() {
  try {
    const connection = await promisePool.getConnection(); // Tenta conectar
    console.log(" Conectado ao MySQL com sucesso!");
    connection.release(); // Libera a conexão para o pool
  } catch (error) {
    console.error(" Erro ao conectar com MySQL:", error.message);
    process.exit(1); // Encerra o app se não conseguir conectar
  }
}

// Exporta para usar em outros arquivos (como server.js)
module.exports = {
  pool: promisePool,
  testConnection,
};
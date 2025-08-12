const express = require("express");
const userController = require("../controllers/userController");

const router = express.Router();

// Rotas CRUD para usuários
router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.post("/", userController.createUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

// Rota de autenticação
router.post("/login", userController.loginUser);

module.exports = router;

const validateUserCreation = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  // Validações básicas
  if (!name || name.trim().length < 2) {
    errors.push("Nome é obrigatório e deve ter pelo menos 2 caracteres");
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Email deve ter um formato válido");
  }

  if (!password || password.length < 6) {
    errors.push("Senha deve ter pelo menos 6 caracteres");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Dados de entrada inválidos",
      errors,
    });
  }

  next();
};

const validateUserUpdate = (req, res, next) => {
  const { name, email, age } = req.body;
  const errors = [];

  // Validações opcionais (apenas se fornecidos)
  if (name !== undefined && (!name || name.trim().length < 2)) {
    errors.push("Nome deve ter pelo menos 2 caracteres");
  }

  if (
    email !== undefined &&
    (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  ) {
    errors.push("Email deve ter um formato válido");
  }

  if (age !== undefined && (age < 0 || age > 150)) {
    errors.push("Idade deve estar entre 0 e 150 anos");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Dados de entrada inválidos",
      errors,
    });
  }

  next();
};

module.exports = {
  validateUserCreation,
  validateUserUpdate,
};

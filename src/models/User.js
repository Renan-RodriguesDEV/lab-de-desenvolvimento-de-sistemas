const { pool } = require("../config/database");
const bcrypt = require("bcryptjs");

class User {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.age = data.age;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Buscar todos os usuários
  static async findAll(limit = 50, offset = 0) {
    try {
      const [rows] = await pool.execute(
        "SELECT id, name, email, age, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?",
        [limit, offset]
      );
      return rows.map((row) => new User(row));
    } catch (error) {
      throw new Error(`Erro ao buscar usuários: ${error.message}`);
    }
  }

  // Contar total de usuários
  static async count() {
    try {
      const [rows] = await pool.execute("SELECT COUNT(*) as total FROM users");
      return rows[0].total;
    } catch (error) {
      throw new Error(`Erro ao contar usuários: ${error.message}`);
    }
  }

  // Buscar usuário por ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        "SELECT id, name, email, age, created_at, updated_at FROM users WHERE id = ?",
        [id]
      );
      return rows.length > 0 ? new User(rows[0]) : null;
    } catch (error) {
      throw new Error(`Erro ao buscar usuário: ${error.message}`);
    }
  }

  // Buscar usuário por email (incluindo senha para autenticação)
  static async findByEmail(email, includePassword = false) {
    try {
      const fields = includePassword
        ? "id, name, email, password, age, created_at, updated_at"
        : "id, name, email, age, created_at, updated_at";

      const [rows] = await pool.execute(
        `SELECT ${fields} FROM users WHERE email = ?`,
        [email]
      );
      return rows.length > 0 ? new User(rows[0]) : null;
    } catch (error) {
      throw new Error(`Erro ao buscar usuário por email: ${error.message}`);
    }
  }

  // Criar novo usuário
  static async create(userData) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Validar dados
      const validationErrors = User.validate(userData);
      if (validationErrors.length > 0) {
        throw new Error(`Dados inválidos: ${validationErrors.join(", ")}`);
      }

      // Verificar se email já existe
      const existingUser = await User.findByEmail(userData.email);
      if (existingUser) {
        throw new Error("Email já está em uso");
      }

      // Hash da senha
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Inserir usuário
      const [result] = await connection.execute(
        "INSERT INTO users (name, email, password, age) VALUES (?, ?, ?, ?)",
        [userData.name, userData.email, hashedPassword, userData.age || null]
      );

      await connection.commit();

      // Buscar usuário criado
      const newUser = await User.findById(result.insertId);
      return newUser;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Atualizar usuário
  static async update(id, userData) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verificar se usuário existe
      const existingUser = await User.findById(id);
      if (!existingUser) {
        throw new Error("Usuário não encontrado");
      }

      // Validar dados (apenas campos fornecidos)
      const validationErrors = User.validate(userData, false);
      if (validationErrors.length > 0) {
        throw new Error(`Dados inválidos: ${validationErrors.join(", ")}`);
      }

      // Verificar email único se fornecido
      if (userData.email) {
        const emailUser = await User.findByEmail(userData.email);
        if (emailUser && emailUser.id !== parseInt(id)) {
          throw new Error("Email já está em uso");
        }
      }

      // Construir query de update dinamicamente
      const updateFields = [];
      const updateValues = [];

      if (userData.name) {
        updateFields.push("name = ?");
        updateValues.push(userData.name);
      }
      if (userData.email) {
        updateFields.push("email = ?");
        updateValues.push(userData.email);
      }
      if (userData.password) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        updateFields.push("password = ?");
        updateValues.push(hashedPassword);
      }
      if (userData.age !== undefined) {
        updateFields.push("age = ?");
        updateValues.push(userData.age);
      }

      if (updateFields.length === 0) {
        throw new Error("Nenhum campo para atualizar");
      }

      updateValues.push(id);

      await connection.execute(
        `UPDATE users SET ${updateFields.join(
          ", "
        )}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        updateValues
      );

      await connection.commit();

      // Retornar usuário atualizado
      const updatedUser = await User.findById(id);
      return updatedUser;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Deletar usuário
  static async delete(id) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verificar se usuário existe
      const user = await User.findById(id);
      if (!user) {
        throw new Error("Usuário não encontrado");
      }

      // Deletar usuário
      await connection.execute("DELETE FROM users WHERE id = ?", [id]);

      await connection.commit();
      return user;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Verificar senha
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Buscar usuários com filtros
  static async findWithFilters(filters = {}) {
    try {
      let query =
        "SELECT id, name, email, age, created_at, updated_at FROM users WHERE 1=1";
      const params = [];

      if (filters.name) {
        query += " AND name LIKE ?";
        params.push(`%${filters.name}%`);
      }

      if (filters.email) {
        query += " AND email LIKE ?";
        params.push(`%${filters.email}%`);
      }

      if (filters.minAge) {
        query += " AND age >= ?";
        params.push(filters.minAge);
      }

      if (filters.maxAge) {
        query += " AND age <= ?";
        params.push(filters.maxAge);
      }

      query += " ORDER BY created_at DESC";

      if (filters.limit) {
        query += " LIMIT ?";
        params.push(parseInt(filters.limit));
      }

      const [rows] = await pool.execute(query, params);
      return rows.map((row) => new User(row));
    } catch (error) {
      throw new Error(`Erro ao buscar usuários com filtros: ${error.message}`);
    }
  }

  // Validar dados do usuário
  static validate(userData, requireAll = true) {
    const errors = [];

    // Validação de nome
    if (requireAll || userData.name !== undefined) {
      if (!userData.name || userData.name.trim().length < 2) {
        errors.push("Nome deve ter pelo menos 2 caracteres");
      }
      if (userData.name && userData.name.length > 100) {
        errors.push("Nome deve ter no máximo 100 caracteres");
      }
    }

    // Validação de email
    if (requireAll || userData.email !== undefined) {
      if (!userData.email || !User.isValidEmail(userData.email)) {
        errors.push("Email deve ter um formato válido");
      }
      if (userData.email && userData.email.length > 150) {
        errors.push("Email deve ter no máximo 150 caracteres");
      }
    }

    // Validação de senha
    if (requireAll || userData.password !== undefined) {
      if (!userData.password || userData.password.length < 6) {
        errors.push("Senha deve ter pelo menos 6 caracteres");
      }
    }

    // Validação de idade
    if (userData.age !== undefined && userData.age !== null) {
      if (userData.age < 0 || userData.age > 150) {
        errors.push("Idade deve estar entre 0 e 150 anos");
      }
    }

    return errors;
  }

  // Validar formato de email
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Converter para JSON (sem senha)
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}

module.exports = User;

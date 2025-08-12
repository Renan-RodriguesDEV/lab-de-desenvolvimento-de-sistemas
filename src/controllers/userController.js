// Importa o Model User que conversa com o banco de dados
const User = require('../models/User');

// Classe que agrupa todas as funções relacionadas a usuários
class UserController {

  // FUNÇÃO 1: Buscar todos os usuários
  // Quando alguém acessa GET /api/users
  async getAllUsers(req, res) {
    try {
      //  PEGANDO PARÂMETROS DA URL
      // Exemplo: /api/users?page=2&limit=5&name=João
      const {
        page = 1,           // Qual página? (padrão: primeira)
        limit = 10,         // Quantos por página? (padrão: 10)
        name,              // Filtrar por nome?
        email,             // Filtrar por email?
        minAge,            // Idade mínima?
        maxAge             // Idade máxima?
      } = req.query;

      // CALCULANDO ONDE COMEÇAR A BUSCA
      // Se página 2 com limite 10, pula os primeiros 10 registros
      const offset = (page - 1) * limit;

      let users;  // Onde vamos guardar os usuários encontrados
      let total;  // Quantos usuários existem no total

      // DECIDINDO COMO BUSCAR
      // Se tem filtros (nome, email, idade), usa busca com filtros
      if (name || email || minAge || maxAge) {

        // Monta um objeto com todos os filtros
        const filters = {
          name,
          email,
          minAge: minAge ? parseInt(minAge) : undefined,  // Converte texto em número
          maxAge: maxAge ? parseInt(maxAge) : undefined,
          limit: parseInt(limit)
        };

        // Chama o Model para buscar com filtros
        users = await User.findWithFilters(filters);
        total = users.length;

      } else {
        // Se não tem filtros, busca todos normalmente
        users = await User.findAll(parseInt(limit), offset);
        total = await User.count();  // Conta quantos existem
      }

      //
      const totalPages = Math.ceil(total / limit);  // Quantas páginas no total?

      //  ENVIANDO RESPOSTA PARA O USUÁRIO
      res.status(200).json({
        success: true,           // Deu certo!
        data: users,            // Os usuários encontrados
        pagination: {           // Informações sobre as páginas
          currentPage: parseInt(page),    // Página atual
          totalPages,                     // Total de páginas
          totalItems: total,              // Total de usuários
          itemsPerPage: parseInt(limit),  // Quantos por página
          hasNextPage: page < totalPages, // Tem próxima página?
          hasPrevPage: page > 1          // Tem página anterior?
        }
      });

    } catch (error) {
      //  SE DEU ERRO
      console.error('Erro em getAllUsers:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar usuários',
        error: error.message
      });
    }
  }

  // GET /api/users/:id
  async getUserById(req, res) {
    try {
      const { id } = req.params;

      // Validar se ID é um número
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID do usuário deve ser um número válido'
        });
      }

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Erro em getUserById:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar usuário',
        error: error.message
      });
    }
  }

  // POST /api/users
  async createUser(req, res) {
    try {
      const userData = req.body;

      const user = await User.create(userData);

      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        data: user
      });
    } catch (error) {
      console.error('Erro em createUser:', error);

      // Tratamento específico para erros de validação
      if (error.message.includes('Dados inválidos') ||
          error.message.includes('Email já está em uso')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro ao criar usuário',
        error: error.message
      });
    }
  }

  // PUT /api/users/:id
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const userData = req.body;

      // Validar se ID é um número
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID do usuário deve ser um número válido'
        });
      }

      const user = await User.update(id, userData);

      res.status(200).json({
        success: true,
        message: 'Usuário atualizado com sucesso',
        data: user
      });
    } catch (error) {
      console.error('Erro em updateUser:', error);

      // Tratamento específico para diferentes tipos de erro
      if (error.message === 'Usuário não encontrado') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('Dados inválidos') ||
          error.message.includes('Email já está em uso') ||
          error.message.includes('Nenhum campo para atualizar')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar usuário',
        error: error.message
      });
    }
  }

  // DELETE /api/users/:id
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Validar se ID é um número
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID do usuário deve ser um número válido'
        });
      }

      const user = await User.delete(id);

      res.status(200).json({
        success: true,
        message: 'Usuário deletado com sucesso',
        data: user
      });
    } catch (error) {
      console.error('Erro em deleteUser:', error);

      if (error.message === 'Usuário não encontrado') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro ao deletar usuário',
        error: error.message
      });
    }
  }

  // POST /api/users/login
  async loginUser(req, res) {
    try {
      const { email, password } = req.body;

      // Validar dados de entrada
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email e senha são obrigatórios'
        });
      }

      // Buscar usuário com senha
      const user = await User.findByEmail(email, true);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
      }

      // Verificar senha
      const isValidPassword = await User.verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
      }

      // Remover senha do objeto de resposta
      const { password: _, ...userWithoutPassword } = user;

      res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso',
        data: userWithoutPassword
      });
    } catch (error) {
      console.error('Erro em loginUser:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao fazer login',
        error: error.message
      });
    }
  }
}

module.exports = new UserController();

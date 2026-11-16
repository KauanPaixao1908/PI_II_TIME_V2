// Autor: Kauan Paixão
// Rota de login: confere e-mail e senha no MySQL e devolve um token JWT.
// Fica em servidor/src/routes/login.ts e é registrada no server.ts com:
//   app.use('/api', loginRouter);

import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';
import pool from '../db';

const router = Router();

// Formato da linha que vem da tabela de usuários.
// Ajuste os nomes das colunas se no Banco_PI_II.sql estiverem diferentes.
interface UsuarioBanco extends RowDataPacket {
  id: number;
  nome: string;
  email: string;
  senha: string; // hash do bcrypt
  perfil: string;
}

// POST /api/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, senha } = req.body;

  // 400: faltou e-mail ou senha
  if (
    typeof email !== 'string' ||
    typeof senha !== 'string' ||
    email.trim() === '' ||
    senha === ''
  ) {
    res.status(400).json({ mensagem: 'Informe o e-mail e a senha.' });
    return;
  }

  try {
    const [linhas] = await pool.query<UsuarioBanco[]>(
      'SELECT id, nome, email, senha, perfil FROM usuario WHERE email = ? LIMIT 1',
      [email.trim()]
    );

    const usuario = linhas[0];

    // Confere a senha digitada com o hash guardado no banco.
    const senhaConfere = usuario
      ? await bcrypt.compare(senha, usuario.senha)
      : false;

    // 401: mesma mensagem para e-mail inexistente ou senha errada,
    // para não revelar quais e-mails existem no sistema.
    if (!usuario || !senhaConfere) {
      res.status(401).json({ mensagem: 'E-mail ou senha inválidos.' });
      return;
    }

    const segredo = process.env.JWT_SECRET;
    if (!segredo) {
      console.error('JWT_SECRET não está definido no .env');
      res.status(500).json({ mensagem: 'Erro de configuração do servidor.' });
      return;
    }

    // O verificarLogin lê esses dados do token nas próximas requisições.
    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil },
      segredo,
      { expiresIn: '8h' }
    );

    // 200: o front grava token e usuario no sessionStorage.
    res.status(200).json({
      token,
      usuario: { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil }
    });
  } catch (erro) {
    console.error('Erro no login:', erro);
    res.status(500).json({ mensagem: 'Erro interno ao fazer login.' });
  }
});

export default router;

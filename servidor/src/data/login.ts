// Autor: <PREENCHER NOME DO AUTOR>
// Arquivo: login.ts
// Função: rota de login. Confere e-mail e senha no MySQL e devolve o token e o perfil.

import { Router } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../data/db'; // ajuste o caminho para o seu arquivo de conexão
import { gerarToken } from '../centro/autentificacao';

const router = Router();

// POST /api/login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ mensagem: 'Informe e-mail e senha.' });
  }

  // 1. Procura o usuário pelo e-mail
  const [linhas]: any = await pool.query(
    'SELECT * FROM usuario WHERE email = ?', [email]);
  const usuario = linhas[0];

  // 2. Compara a senha digitada com o hash salvo no banco
  if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
    return res.status(401).json({ mensagem: 'E-mail ou senha incorretos.' });
  }

  // 3. Devolve o token e o perfil para a tela decidir o que mostrar
  const token = gerarToken(usuario);
  res.json({ token, nome: usuario.nome, perfil: usuario.perfil });
});

export default router;

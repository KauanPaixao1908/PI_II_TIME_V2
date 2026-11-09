// Autor: Kauan Paixão
// Arquivo: cadastroUsuario.ts (fica em servidor/src/routes/)
// Função: criar a conta de um novo usuário pela tela "Criar conta".
//   POST /api/cadastro -> recebe { nome, email, senha } e grava no banco
// A senha NUNCA é gravada como foi digitada: o bcrypt transforma em hash.
// Quem cria a conta pela tela entra sempre como 'Membro da Equipe'.

import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { RowDataPacket } from 'mysql2';
import pool from '../db';

const router = Router();

// Quantas "rodadas" o bcrypt usa para embaralhar a senha (10 é o padrão).
const RODADAS_BCRYPT = 10;

// Mesmas regras da tela (cadastro.js). Conferimos de novo aqui porque
// alguém pode chamar a API direto, sem passar pela tela.
function verificarRegrasSenha(valor: string): string {
  if (valor.length < 8) {
    return 'A senha deve ter pelo menos 8 caracteres.';
  }
  if (!/\p{Lu}/u.test(valor)) {
    return 'A senha deve ter pelo menos 1 letra maiúscula.';
  }
  if (!/[^\p{L}\p{N}\s]/u.test(valor)) {
    return 'A senha deve ter pelo menos 1 caractere especial (ex.: ! @ # $ %).';
  }
  return '';
}

// POST /api/cadastro
router.post('/cadastro', async (req: Request, res: Response) => {
  const nome = typeof req.body?.nome === 'string' ? req.body.nome.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  const senha = typeof req.body?.senha === 'string' ? req.body.senha : '';

  // 400: dados faltando ou fora das regras
  if (nome === '' || nome.length > 100) {
    res.status(400).json({ mensagem: 'Informe um nome de até 100 caracteres.' });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) {
    res.status(400).json({ mensagem: 'Informe um e-mail em formato válido.' });
    return;
  }

  const erroSenha = verificarRegrasSenha(senha);
  if (erroSenha !== '') {
    res.status(400).json({ mensagem: erroSenha });
    return;
  }

  try {
    // 409: e-mail já usado por outra conta
    const [existentes] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM usuario WHERE email = ?',
      [email]
    );

    if (existentes.length > 0) {
      res.status(409).json({ mensagem: 'Já existe uma conta com este e-mail.' });
      return;
    }

    // Aqui o bcrypt transforma a senha em hash (ex.: "$2b$10$Kx8f...").
    const senhaHash = await bcrypt.hash(senha, RODADAS_BCRYPT);

    await pool.query(
      "INSERT INTO usuario (nome, email, senha, perfil) VALUES (?, ?, ?, 'Membro da Equipe')",
      [nome, email, senhaHash]
    );

    // 201: conta criada. O front mostra a mensagem e volta para o login.
    res.status(201).json({ mensagem: 'Conta criada com sucesso!' });
  } catch (erro: any) {
    // Se duas pessoas cadastrarem o mesmo e-mail ao mesmo tempo,
    // o UNIQUE da coluna email barra o segundo.
    if (erro?.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ mensagem: 'Já existe uma conta com este e-mail.' });
      return;
    }

    console.error('Erro ao criar conta:', erro);
    res.status(500).json({ mensagem: 'Erro interno ao criar a conta.' });
  }
});

export default router;

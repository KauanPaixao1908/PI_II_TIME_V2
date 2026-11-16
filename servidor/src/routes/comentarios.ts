// Autor: Kauan Paixão
// Arquivo: comentarios.ts (fica em servidor/src/routes/)
// Função: listar e criar comentários de uma demanda, direto no MySQL.
//   GET  /api/demandas/:id/comentarios  -> lista os comentários (mais antigo primeiro)
//   POST /api/demandas/:id/comentarios  -> cria um comentário do usuário logado

import { Router, Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../db';
import { verificarLogin } from './autentificacao';
import { checarDemanda } from '../acessoDemanda';

const router = Router();

// Os apelidos (AS) deixam os nomes iguais aos que o front já usava.
const SELECT_COMENTARIO = `
  SELECT c.id,
         c.demanda_id AS demandaId,
         c.usuario_id AS autorId,
         u.nome       AS autorNome,
         c.texto,
         c.data_hora  AS criadoEm
    FROM comentario c
    JOIN usuario u ON u.id = c.usuario_id`;

// GET /api/demandas/:id/comentarios
router.get('/demandas/:id/comentarios', verificarLogin, async (req: Request, res: Response) => {
  try {
    const acesso = await checarDemanda(req, res);
    if (!acesso) return; // já respondeu 400, 404 ou 403

    const [comentarios] = await pool.query<RowDataPacket[]>(
      `${SELECT_COMENTARIO} WHERE c.demanda_id = ? ORDER BY c.data_hora, c.id`,
      [acesso.demandaId]
    );

    res.status(200).json(comentarios);
  } catch (erro) {
    console.error('Erro ao listar comentários:', erro);
    res.status(500).json({ mensagem: 'Erro interno ao buscar os comentários.' });
  }
});

// POST /api/demandas/:id/comentarios
router.post('/demandas/:id/comentarios', verificarLogin, async (req: Request, res: Response) => {
  try {
    const acesso = await checarDemanda(req, res);
    if (!acesso) return;

    const texto = typeof req.body?.texto === 'string' ? req.body.texto.trim() : '';

    if (texto === '') {
      res.status(400).json({ mensagem: 'Escreva o comentário antes de enviar.' });
      return;
    }

    if (texto.length > 2000) {
      res.status(400).json({ mensagem: 'O comentário pode ter no máximo 2000 caracteres.' });
      return;
    }

    // O autor é sempre quem está logado (vem do token, não do corpo da requisição).
    const [resultado] = await pool.query<ResultSetHeader>(
      'INSERT INTO comentario (demanda_id, usuario_id, texto) VALUES (?, ?, ?)',
      [acesso.demandaId, acesso.usuario.id, texto]
    );

    // Devolve o comentário criado já com o nome do autor e o horário do banco.
    const [novo] = await pool.query<RowDataPacket[]>(
      `${SELECT_COMENTARIO} WHERE c.id = ?`,
      [resultado.insertId]
    );

    res.status(201).json(novo[0]);
  } catch (erro) {
    console.error('Erro ao criar comentário:', erro);
    res.status(500).json({ mensagem: 'Erro interno ao salvar o comentário.' });
  }
});

export default router;

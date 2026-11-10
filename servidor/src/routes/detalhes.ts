// Autor: Kauan Paixão
// Arquivo: detalhes.ts (fica em servidor/src/routes/)
// Função: rota da tela de Detalhes da Demanda, buscando no MySQL.
//   GET /api/demandas/:id -> dados da demanda, com o nome do projeto e do responsável
// Os comentários e o histórico ficam em routes/comentarios.ts e routes/historico.ts.
// No server.ts esta rota é registrada assim:  app.use('/api', detalhesRouter);
//
// Respostas:
//   200 demanda encontrada
//   400 id inválido (ex.: /api/demandas/abc)
//   401 sem login (verificarLogin)
//   403 Líder ou Membro que não participa do projeto da demanda
//   404 demanda não existe

import { Router, Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import pool from '../db';
import { verificarLogin } from './autentificacao';
import { checarDemanda } from '../acessoDemanda';

const router = Router();

// GET /api/demandas/:id
router.get('/demandas/:id', verificarLogin, async (req: Request, res: Response) => {
  try {
    // Confere id, se a demanda existe e se o usuário pode vê-la.
    const acesso = await checarDemanda(req, res);
    if (!acesso) return; // já respondeu 400, 401, 403 ou 404

    // Os apelidos (AS) deixam os nomes no mesmo formato que o front já usava.
    // LEFT JOIN no usuário porque a demanda pode estar sem responsável.
    const [linhas] = await pool.query<RowDataPacket[]>(
      `SELECT d.id,
              d.titulo,
              d.descricao,
              d.tipo,
              d.prioridade,
              d.status,
              d.projeto_id        AS projetoId,
              p.nome              AS projetoNome,
              d.responsavel_id    AS responsavelId,
              COALESCE(u.nome, '') AS responsavelNome,
              d.data_criacao      AS criadaEm,
              d.data_atualizacao  AS atualizadaEm,
              d.prazo_finalizacao AS prazo
         FROM demanda d
         JOIN projeto p      ON p.id = d.projeto_id
         LEFT JOIN usuario u ON u.id = d.responsavel_id
        WHERE d.id = ?`,
      [acesso.demandaId]
    );

    res.status(200).json(linhas[0]);
  } catch (erro) {
    console.error('Erro ao buscar a demanda:', erro);
    res.status(500).json({ mensagem: 'Erro interno ao buscar a demanda.' });
  }
});

export default router;

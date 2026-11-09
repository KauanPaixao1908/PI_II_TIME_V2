// Autor: Kauan Paixão
// Arquivo: historico.ts (fica em servidor/src/routes/)
// Função: mostrar o histórico de alterações de uma demanda, direto no MySQL.
//   GET /api/demandas/:id/historico -> lista as alterações (mais antiga primeiro)
// O histórico nunca é apagado, nem quando a demanda é cancelada.

import { Router, Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import pool from '../db';
import { verificarLogin } from './autentificacao';
import { checarDemanda } from '../acessoDemanda';

const router = Router();

// GET /api/demandas/:id/historico
router.get('/demandas/:id/historico', verificarLogin, async (req: Request, res: Response) => {
  try {
    const acesso = await checarDemanda(req, res);
    if (!acesso) return; // já respondeu 400, 404 ou 403

    const [registros] = await pool.query<RowDataPacket[]>(
      `SELECT h.id,
              h.demanda_id AS demandaId,
              h.usuario_id AS usuarioId,
              u.nome       AS usuarioNome,
              h.descricao,
              h.data_hora  AS criadoEm
         FROM historico h
         JOIN usuario u ON u.id = h.usuario_id
        WHERE h.demanda_id = ?
        ORDER BY h.data_hora, h.id`,
      [acesso.demandaId]
    );

    res.status(200).json(registros);
  } catch (erro) {
    console.error('Erro ao listar histórico:', erro);
    res.status(500).json({ mensagem: 'Erro interno ao buscar o histórico.' });
  }
});

// Usada pelas outras rotas para gravar no histórico, por exemplo:
//   await registrarHistorico(demandaId, usuario.id,
//     `${usuario.nome} alterou o status da demanda de Aberta para Em andamento.`);
// (cadastro de demanda, edição e mudança de status)
export async function registrarHistorico(
  demandaId: number,
  usuarioId: number,
  descricao: string
): Promise<void> {
  await pool.query(
    'INSERT INTO historico (demanda_id, usuario_id, descricao) VALUES (?, ?, ?)',
    [demandaId, usuarioId, descricao.slice(0, 255)] // a coluna aceita até 255 caracteres
  );
}

export default router;

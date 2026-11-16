// Autor: Kauan Paixão
// Arquivo: acessoDemanda.ts (fica em servidor/src/)
// Função: conferir se a demanda existe e se quem está logado pode vê-la.
// Usado pelas rotas de comentários e histórico (e pode ser usado pelos detalhes).
// Regra: Administrador vê tudo; Líder e Membro só veem demandas dos projetos
// em que estão vinculados (tabela projeto_usuario).

import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import pool from './db';
import { UsuarioToken } from './routes/autentificacao';

// Confere o ?id da rota, se a demanda existe e se o usuário tem acesso.
// Se algo estiver errado, já responde (401, 400, 404 ou 403) e devolve null.
// Deve ser usado em rotas que passam pelo verificarLogin.
export async function checarDemanda(
  req: Request,
  res: Response
): Promise<{ demandaId: number; usuario: UsuarioToken } | null> {
  // O verificarLogin coloca { id, nome, perfil } em req.usuario.
  const usuario = req.usuario;
  if (!usuario) {
    res.status(401).json({ mensagem: 'Faça login para continuar.' });
    return null;
  }

  const demandaId = Number(req.params.id);

  if (!Number.isInteger(demandaId) || demandaId <= 0) {
    res.status(400).json({ mensagem: 'Id de demanda inválido.' });
    return null;
  }

  const [demandas] = await pool.query<RowDataPacket[]>(
    'SELECT projeto_id FROM demanda WHERE id = ?',
    [demandaId]
  );

  if (demandas.length === 0) {
    res.status(404).json({ mensagem: 'Demanda não encontrada.' });
    return null;
  }

  if (usuario.perfil !== 'Administrador') {
    const [vinculo] = await pool.query<RowDataPacket[]>(
      'SELECT 1 FROM projeto_usuario WHERE projeto_id = ? AND usuario_id = ?',
      [demandas[0].projeto_id, usuario.id]
    );

    if (vinculo.length === 0) {
      res.status(403).json({ mensagem: 'Você não participa do projeto desta demanda.' });
      return null;
    }
  }

  return { demandaId, usuario };
}

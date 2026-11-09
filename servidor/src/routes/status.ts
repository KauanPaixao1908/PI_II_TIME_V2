// Autor: Bruno Mareto
// Rota de alteração de status de uma demanda.
//
// PATCH /api/demandas/:id/status   corpo: { "status": "Em andamento" }
//
// Fluxo de status (Documento de Visão 2.2.4 e Reunião 6, item 4.2):
//   Aberta -> Em andamento -> Em revisão -> Concluída
//   Em revisão -> Em andamento (devolve para ajustes)
//   Aberta, Em andamento ou Em revisão -> Cancelada
//   Concluída e Cancelada são status finais: não mudam mais.
//
// Permissões por perfil:
//   Administrador: qualquer demanda.
//   Líder de Projeto: demandas dos projetos em que está vinculado.
//   Membro da Equipe: só demandas atribuídas a ele, e só de Aberta para
//   Em andamento e de Em andamento para Em revisão.
//
// Toda mudança é gravada no histórico da demanda.
// Respostas: 200 (alterado), 400 (dado inválido ou transição proibida),
// 401 (sem login), 403 (sem permissão), 404 (demanda não existe).

import { Router, Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import pool from '../db';
import { verificarLogin } from './autentificacao';
import { registrarHistorico } from './historico';

const router = Router();

// Para cada status, a lista de status para onde a demanda pode ir.
const TRANSICOES: { [status: string]: string[] } = {
    'Aberta': ['Em andamento', 'Cancelada'],
    'Em andamento': ['Em revisão', 'Cancelada'],
    'Em revisão': ['Concluída', 'Em andamento', 'Cancelada'],
    'Concluída': [],
    'Cancelada': []
};

// Confere se o Membro da Equipe pode fazer essa mudança.
// Ele só pode: Aberta -> Em andamento e Em andamento -> Em revisão.
function membroPodeMudar(statusAtual: string, novoStatus: string): boolean {
    if (statusAtual === 'Aberta' && novoStatus === 'Em andamento') {
        return true;
    }
    if (statusAtual === 'Em andamento' && novoStatus === 'Em revisão') {
        return true;
    }
    return false;
}

router.patch('/demandas/:id/status', verificarLogin, async (req: Request, res: Response) => {
    try {
        // O verificarLogin coloca em req.usuario quem está logado (id, nome, perfil).
        const usuario = req.usuario;
        if (usuario === undefined) {
            res.status(401).json({ erro: 'Faça login para continuar.' });
            return;
        }

        const demandaId = Number(req.params.id);
        const novoStatus = req.body.status;

        // 400: id que não é um número inteiro positivo.
        if (!Number.isInteger(demandaId) || demandaId <= 0) {
            res.status(400).json({ erro: 'Id de demanda inválido.' });
            return;
        }

        // 400: status que não existe no Documento de Visão.
        if (TRANSICOES[novoStatus] === undefined) {
            res.status(400).json({ erro: 'Status inválido. Use: Aberta, Em andamento, Em revisão, Concluída ou Cancelada.' });
            return;
        }

        // Busca a demanda no banco.
        const [demandas] = await pool.query<RowDataPacket[]>(
            'SELECT status, projeto_id, responsavel_id FROM demanda WHERE id = ?',
            [demandaId]
        );

        // 404: nenhuma demanda com esse id.
        if (demandas.length === 0) {
            res.status(404).json({ erro: 'Demanda não encontrada.' });
            return;
        }

        const demanda = demandas[0];
        const statusAtual = demanda.status;

        // 403: Líder e Membro só mexem em demandas dos projetos em que estão vinculados.
        if (usuario.perfil !== 'Administrador') {
            const [vinculos] = await pool.query<RowDataPacket[]>(
                'SELECT * FROM projeto_usuario WHERE projeto_id = ? AND usuario_id = ?',
                [demanda.projeto_id, usuario.id]
            );
            if (vinculos.length === 0) {
                res.status(403).json({ erro: 'Você não participa do projeto desta demanda.' });
                return;
            }
        }

        // 400: mudança fora do fluxo de status.
        const permitidos = TRANSICOES[statusAtual];
        if (!permitidos.includes(novoStatus)) {
            res.status(400).json({
                erro: 'Transição não permitida: de ' + statusAtual + ' para ' + novoStatus + '.'
            });
            return;
        }

        // 403: regras do Membro da Equipe.
        if (usuario.perfil === 'Membro da Equipe') {
            if (demanda.responsavel_id !== usuario.id) {
                res.status(403).json({ erro: 'O Membro da Equipe só altera demandas atribuídas a ele.' });
                return;
            }
            if (!membroPodeMudar(statusAtual, novoStatus)) {
                res.status(403).json({ erro: 'O Membro da Equipe não pode concluir nem cancelar demandas.' });
                return;
            }
        }

        // Grava o novo status. A data de atualização muda sozinha
        // (coluna data_atualizacao com ON UPDATE CURRENT_TIMESTAMP).
        await pool.query('UPDATE demanda SET status = ? WHERE id = ?', [novoStatus, demandaId]);

        // Grava a mudança no histórico.
        await registrarHistorico(
            demandaId,
            usuario.id,
            usuario.nome + ' alterou o status da demanda de ' + statusAtual + ' para ' + novoStatus + '.'
        );

        res.status(200).json({
            mensagem: 'Status alterado de ' + statusAtual + ' para ' + novoStatus + '.'
        });
    } catch (erro) {
        console.error('Erro ao alterar status:', erro);
        res.status(500).json({ erro: 'Erro interno ao alterar o status.' });
    }
});

export default router;
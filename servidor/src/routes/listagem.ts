// Autor: Bruno Mareto
// Rotas da tela de Listagem de Demandas, com dados do MySQL.
//
// GET /api/demandas
//   Lista as demandas com os campos exigidos no Documento de Visão (2.2.9),
//   com filtros, busca textual e ordenação (2.3).
//   Parâmetros aceitos na URL (todos opcionais):
//     status, prioridade, tipo       -> filtros por valor (ex.: ?prioridade=Alta)
//     responsavelId, projetoId       -> filtros por id (ex.: ?projetoId=2)
//     busca                          -> texto procurado no título ou na descrição
//     ordenar                        -> prioridade | criadaEm | prazo | status
//     ordem                          -> asc (padrão) | desc
//
// GET /api/demandas/filtros
//   Devolve os projetos e os responsáveis que o usuário pode usar nos filtros.
//
// Regras de acesso (2.1), aplicadas no servidor a partir do token do login:
//   Administrador vê todas as demandas; Líder de Projeto e Membro da Equipe
//   veem só as demandas dos projetos aos quais estão vinculados (projeto_usuario).
//
// Respostas: 200 (lista), 400 (parâmetro inválido), 401 (sem login), 500 (erro no banco).

import { Router, Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import pool from '../db';
import { verificarLogin } from './autentificacao';

const router = Router();

// Valores aceitos nos filtros, conforme o Documento de Visão (2.2.1 a 2.2.3).
// A ordem das listas é a usada na ordenação: prioridade da mais urgente para a
// menos urgente e status conforme o ciclo de vida (2.2.4).
const PRIORIDADES = ['Crítica', 'Alta', 'Média', 'Baixa'];
const STATUS = ['Aberta', 'Em andamento', 'Em revisão', 'Concluída', 'Cancelada'];
const TIPOS = ['Tarefa', 'Defeito', 'Melhoria', 'Documentação'];
const ORDENS = ['asc', 'desc'];

// Expressão SQL usada para cada campo de ordenação. FIELD() devolve a posição do
// valor na lista, para ordenar por urgência e pelo ciclo de vida, e não pelo alfabeto.
const ORDENACAO_SQL: Record<string, string> = {
    prioridade: "FIELD(d.prioridade, 'Crítica', 'Alta', 'Média', 'Baixa')",
    status: "FIELD(d.status, 'Aberta', 'Em andamento', 'Em revisão', 'Concluída', 'Cancelada')",
    criadaEm: 'd.data_criacao',
    prazo: 'd.prazo_finalizacao',
};

// Erro de validação dos parâmetros da URL, respondido com 400.
class ParametroInvalido extends Error {}

// Remove acentos e diferença entre maiúsculas e minúsculas,
// para que "em revisao" seja aceito como "Em revisão".
function normalizar(texto: string): string {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

// Lê um parâmetro de texto da URL. Parâmetro repetido (ex.: ?status=a&status=b) é recusado.
function lerTexto(req: Request, nome: string): string | undefined {
    const valor = req.query[nome];
    if (valor === undefined || valor === '') {
        return undefined;
    }
    if (typeof valor !== 'string') {
        throw new ParametroInvalido(`Informe apenas um valor para "${nome}".`);
    }
    return valor.trim();
}

// Lê um filtro de lista fechada e devolve o valor oficial (com acento e maiúscula).
function lerOpcao(req: Request, nome: string, opcoes: string[]): string | undefined {
    const valor = lerTexto(req, nome);
    if (valor === undefined) {
        return undefined;
    }
    const encontrado = opcoes.find((opcao) => normalizar(opcao) === normalizar(valor));
    if (!encontrado) {
        throw new ParametroInvalido(`Valor inválido para "${nome}": "${valor}". Valores aceitos: ${opcoes.join(', ')}.`);
    }
    return encontrado;
}

// Lê um filtro de id, que deve ser um número inteiro positivo.
function lerId(req: Request, nome: string): number | undefined {
    const valor = lerTexto(req, nome);
    if (valor === undefined) {
        return undefined;
    }
    const id = Number(valor);
    if (!Number.isInteger(id) || id <= 0) {
        throw new ParametroInvalido(`"${nome}" deve ser um número inteiro positivo.`);
    }
    return id;
}

// Condição SQL que limita as demandas aos projetos do usuário logado.
// O Administrador não tem restrição.
function condicaoDePerfil(req: Request): { sql: string; valores: number[] } {
    const usuario = req.usuario!;
    if (usuario.perfil === 'Administrador') {
        return { sql: '', valores: [] };
    }
    return {
        sql: 'd.projeto_id IN (SELECT pu.projeto_id FROM projeto_usuario pu WHERE pu.usuario_id = ?)',
        valores: [usuario.id],
    };
}

// GET /api/demandas
router.get('/demandas', verificarLogin, async (req: Request, res: Response) => {
    try {
        const status = lerOpcao(req, 'status', STATUS);
        const prioridade = lerOpcao(req, 'prioridade', PRIORIDADES);
        const tipo = lerOpcao(req, 'tipo', TIPOS);
        const responsavelId = lerId(req, 'responsavelId');
        const projetoId = lerId(req, 'projetoId');
        const busca = lerTexto(req, 'busca');
        const ordenar = lerOpcao(req, 'ordenar', Object.keys(ORDENACAO_SQL)) ?? 'criadaEm';
        const ordem = lerOpcao(req, 'ordem', ORDENS) ?? 'asc';

        // Cada filtro preenchido acrescenta uma condição; os valores vão em
        // "?" separados, para o MySQL tratar como dado e não como comando SQL.
        const condicoes: string[] = [];
        const valores: (string | number)[] = [];

        const perfil = condicaoDePerfil(req);
        if (perfil.sql !== '') {
            condicoes.push(perfil.sql);
            valores.push(...perfil.valores);
        }
        if (status !== undefined) {
            condicoes.push('d.status = ?');
            valores.push(status);
        }
        if (prioridade !== undefined) {
            condicoes.push('d.prioridade = ?');
            valores.push(prioridade);
        }
        if (tipo !== undefined) {
            condicoes.push('d.tipo = ?');
            valores.push(tipo);
        }
        if (responsavelId !== undefined) {
            condicoes.push('d.responsavel_id = ?');
            valores.push(responsavelId);
        }
        if (projetoId !== undefined) {
            condicoes.push('d.projeto_id = ?');
            valores.push(projetoId);
        }
        if (busca !== undefined) {
            // A collation utf8mb4 do banco já ignora acentos e maiúsculas no LIKE.
            condicoes.push('(d.titulo LIKE ? OR d.descricao LIKE ?)');
            valores.push(`%${busca}%`, `%${busca}%`);
        }

        const where = condicoes.length > 0 ? 'WHERE ' + condicoes.join(' AND ') : '';
        const direcao = ordem === 'desc' ? 'DESC' : 'ASC';

        // Na ordenação por prazo, demandas sem prazo ficam sempre no final.
        const semPrazoNoFim = ordenar === 'prazo' ? 'd.prazo_finalizacao IS NULL, ' : '';
        const orderBy = `ORDER BY ${semPrazoNoFim}${ORDENACAO_SQL[ordenar]} ${direcao}, d.id ${direcao}`;

        const [linhas] = await pool.query<RowDataPacket[]>(
            `SELECT d.id, d.titulo, d.tipo, d.prioridade, d.status,
                    d.data_criacao AS criadaEm, d.prazo_finalizacao AS prazo,
                    d.responsavel_id AS responsavelId,
                    p.id AS projetoId, p.nome AS projetoNome,
                    u.nome AS responsavelNome
               FROM demanda d
               JOIN projeto p ON p.id = d.projeto_id
               LEFT JOIN usuario u ON u.id = d.responsavel_id
               ${where}
               ${orderBy}`,
            valores
        );

        // Monta cada item com o projeto e o responsável como { id, nome }.
        const demandas = linhas.map((linha) => ({
            id: linha.id,
            titulo: linha.titulo,
            tipo: linha.tipo,
            prioridade: linha.prioridade,
            status: linha.status,
            projeto: { id: linha.projetoId, nome: linha.projetoNome },
            responsavel: linha.responsavelId === null
                ? null
                : { id: linha.responsavelId, nome: linha.responsavelNome },
            criadaEm: linha.criadaEm,
            prazo: linha.prazo,
        }));

        res.status(200).json({ total: demandas.length, demandas });
    } catch (erro) {
        if (erro instanceof ParametroInvalido) {
            res.status(400).json({ erro: erro.message });
            return;
        }
        console.error('Erro ao listar demandas:', erro);
        res.status(500).json({ erro: 'Erro interno ao listar as demandas.' });
    }
});

// GET /api/demandas/filtros
// Projetos e responsáveis visíveis para o usuário, usados nos <select> da tela.
router.get('/demandas/filtros', verificarLogin, async (req: Request, res: Response) => {
    try {
        const usuario = req.usuario!;
        const ehAdmin = usuario.perfil === 'Administrador';

        const [projetos] = await pool.query<RowDataPacket[]>(
            ehAdmin
                ? 'SELECT id, nome FROM projeto ORDER BY nome'
                : `SELECT p.id, p.nome FROM projeto p
                     JOIN projeto_usuario pu ON pu.projeto_id = p.id
                    WHERE pu.usuario_id = ? ORDER BY p.nome`,
            ehAdmin ? [] : [usuario.id]
        );

        // Responsáveis: usuários vinculados aos mesmos projetos (todos, para o Administrador).
        const [responsaveis] = await pool.query<RowDataPacket[]>(
            ehAdmin
                ? 'SELECT id, nome FROM usuario ORDER BY nome'
                : `SELECT DISTINCT u.id, u.nome FROM usuario u
                     JOIN projeto_usuario pu ON pu.usuario_id = u.id
                    WHERE pu.projeto_id IN (SELECT projeto_id FROM projeto_usuario WHERE usuario_id = ?)
                    ORDER BY u.nome`,
            ehAdmin ? [] : [usuario.id]
        );

        res.status(200).json({ projetos, responsaveis });
    } catch (erro) {
        console.error('Erro ao carregar filtros:', erro);
        res.status(500).json({ erro: 'Erro interno ao carregar os filtros.' });
    }
});

export default router;
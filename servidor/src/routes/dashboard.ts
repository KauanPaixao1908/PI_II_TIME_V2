// Autor: Miguel Bueno
// Ligação com o banco de dados: Kauan Paixão
// Arquivo: dashboard.ts (fica em servidor/src/routes/)
// Função: calcular no MySQL os números do Dashboard.
//   GET /api/dashboard?projeto=1&responsavel=2&periodo=30
//   Filtros opcionais:
//     projeto      id do projeto
//     responsavel  id do usuário, ou "sem" para demandas sem responsável
//     periodo      0 (todo o período), 7, 30 ou 90 dias, pela data de criação
// Perfil: o Administrador vê tudo; Líder e Membro só os projetos em que estão
// vinculados (tabela projeto_usuario). Essa regra é aplicada aqui no servidor.
// No server.ts:  app.use('/api', dashboardRouter);
//
// Respostas: 200 com os números | 400 filtro inválido | 401 sem login | 500 erro interno

import { Router, Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import pool from '../db';
import { verificarLogin } from './autentificacao';

const router = Router();

// Valores possíveis (os mesmos ENUM do Banco_PI_II.sql).
// Servem para a tela mostrar também os que estão com 0.
const STATUS = ['Aberta', 'Em andamento', 'Em revisão', 'Concluída', 'Cancelada'];
const PRIORIDADES = ['Crítica', 'Alta', 'Média', 'Baixa'];
const TIPOS = ['Tarefa', 'Defeito', 'Melhoria', 'Documentação'];
const PERIODOS = [0, 7, 30, 90];

// Demanda "em aberto" = ainda não foi concluída nem cancelada.
const EM_ABERTO = "d.status NOT IN ('Concluída', 'Cancelada')";

// Transforma o resultado de um GROUP BY numa lista com todos os valores,
// colocando 0 nos que não apareceram no banco.
function contarPor(linhas: RowDataPacket[], campo: string, valores: string[]) {
  return valores.map(function (valor) {
    const linha = linhas.find(function (l) { return l[campo] === valor; });
    return { nome: valor, quantidade: linha ? Number(linha.quantidade) : 0 };
  });
}

// GET /api/dashboard
router.get('/dashboard', verificarLogin, async (req: Request, res: Response) => {
  const usuario = req.usuario!;

  // Condições do WHERE e os valores dos "?" (sempre na mesma ordem).
  const condicoes: string[] = [];
  const valores: number[] = [];

  // Regra de perfil: quem não é Administrador só vê os próprios projetos.
  const condicaoPerfil = 'd.projeto_id IN (SELECT projeto_id FROM projeto_usuario WHERE usuario_id = ?)';
  const ehAdmin = usuario.perfil === 'Administrador';
  if (!ehAdmin) {
    condicoes.push(condicaoPerfil);
    valores.push(usuario.id);
  }

  const projeto = req.query.projeto;
  const responsavel = req.query.responsavel;
  const periodo = req.query.periodo;

  // Filtro de projeto
  if (projeto !== undefined && projeto !== '') {
    const id = Number(projeto);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ mensagem: 'Projeto inválido no filtro.' });
      return;
    }
    condicoes.push('d.projeto_id = ?');
    valores.push(id);
  }

  // Filtro de responsável ("sem" = demandas sem responsável)
  if (responsavel !== undefined && responsavel !== '') {
    if (responsavel === 'sem') {
      condicoes.push('d.responsavel_id IS NULL');
    } else {
      const id = Number(responsavel);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ mensagem: 'Responsável inválido no filtro.' });
        return;
      }
      condicoes.push('d.responsavel_id = ?');
      valores.push(id);
    }
  }

  // Filtro de período (pela data de criação da demanda)
  if (periodo !== undefined && periodo !== '') {
    const dias = Number(periodo);
    if (!PERIODOS.includes(dias)) {
      res.status(400).json({ mensagem: 'Período inválido no filtro.' });
      return;
    }
    if (dias > 0) {
      condicoes.push('d.data_criacao >= DATE_SUB(NOW(), INTERVAL ? DAY)');
      valores.push(dias);
    }
  }

  // Monta o WHERE com os filtros acima e, se precisar, condições extras
  // (as extras não usam "?", então os valores continuam na mesma ordem).
  function montarWhere(extras: string[] = []): string {
    const todas = condicoes.concat(extras);
    return todas.length > 0 ? 'WHERE ' + todas.join(' AND ') : '';
  }

  try {
    // As consultas são independentes, então rodam ao mesmo tempo.
    const [
      [totais],
      [porStatus],
      [porPrioridade],
      [porTipo],
      [carga],
      [prazos],
      [projetos],
      [responsaveis]
    ] = await Promise.all([
      // Total, críticas em aberto e atrasadas
      pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS total,
                SUM(d.status = 'Cancelada') AS canceladas,
                SUM(d.prioridade = 'Crítica' AND ${EM_ABERTO}) AS criticasAbertas,
                SUM(d.prazo_finalizacao < CURDATE() AND ${EM_ABERTO}) AS atrasadas
           FROM demanda d
           ${montarWhere()}`,
        valores
      ),

      // Quantidade por status, prioridade e tipo
      pool.query<RowDataPacket[]>(
        `SELECT d.status, COUNT(*) AS quantidade FROM demanda d ${montarWhere()} GROUP BY d.status`,
        valores
      ),
      pool.query<RowDataPacket[]>(
        `SELECT d.prioridade, COUNT(*) AS quantidade FROM demanda d ${montarWhere()} GROUP BY d.prioridade`,
        valores
      ),
      pool.query<RowDataPacket[]>(
        `SELECT d.tipo, COUNT(*) AS quantidade FROM demanda d ${montarWhere()} GROUP BY d.tipo`,
        valores
      ),

      // Carga por responsável (as canceladas não contam como carga)
      pool.query<RowDataPacket[]>(
        `SELECT COALESCE(u.nome, 'Sem responsável') AS nome,
                SUM(d.status = 'Aberta')       AS abertas,
                SUM(d.status = 'Em andamento') AS emAndamento,
                SUM(d.status = 'Em revisão')   AS emRevisao,
                SUM(d.status = 'Concluída')    AS concluidas,
                COUNT(*)                       AS total
           FROM demanda d
           LEFT JOIN usuario u ON u.id = d.responsavel_id
           ${montarWhere(["d.status <> 'Cancelada'"])}
          GROUP BY d.responsavel_id, u.nome
          ORDER BY total DESC, nome`,
        valores
      ),

      // Prazos mais próximos: em aberto e com prazo, do mais urgente para o menos
      // (as atrasadas aparecem primeiro, com diasRestantes negativo)
      pool.query<RowDataPacket[]>(
        `SELECT d.id, d.titulo, d.tipo, d.prioridade, d.status,
                COALESCE(u.nome, '') AS responsavelNome,
                d.prazo_finalizacao AS prazo,
                DATEDIFF(d.prazo_finalizacao, CURDATE()) AS diasRestantes
           FROM demanda d
           LEFT JOIN usuario u ON u.id = d.responsavel_id
           ${montarWhere(['d.prazo_finalizacao IS NOT NULL', EM_ABERTO])}
          ORDER BY d.prazo_finalizacao, d.id
          LIMIT 8`,
        valores
      ),

      // Opções do filtro de projeto (só os projetos que o usuário pode ver)
      ehAdmin
        ? pool.query<RowDataPacket[]>('SELECT id, nome FROM projeto ORDER BY nome')
        : pool.query<RowDataPacket[]>(
            `SELECT p.id, p.nome
               FROM projeto p
               JOIN projeto_usuario pu ON pu.projeto_id = p.id
              WHERE pu.usuario_id = ?
              ORDER BY p.nome`,
            [usuario.id]
          ),

      // Opções do filtro de responsável (quem é responsável por alguma demanda visível)
      pool.query<RowDataPacket[]>(
        `SELECT DISTINCT u.id, u.nome
           FROM demanda d
           JOIN usuario u ON u.id = d.responsavel_id
           ${ehAdmin ? '' : 'WHERE ' + condicaoPerfil}
          ORDER BY u.nome`,
        ehAdmin ? [] : [usuario.id]
      )
    ]);

    // O MySQL devolve SUM como texto ("3"), por isso o Number().
    res.status(200).json({
      total: Number(totais[0].total),
      canceladas: Number(totais[0].canceladas) || 0,
      criticasAbertas: Number(totais[0].criticasAbertas) || 0,
      atrasadas: Number(totais[0].atrasadas) || 0,
      porStatus: contarPor(porStatus, 'status', STATUS),
      porPrioridade: contarPor(porPrioridade, 'prioridade', PRIORIDADES),
      porTipo: contarPor(porTipo, 'tipo', TIPOS),
      cargaPorResponsavel: carga.map(function (l) {
        return {
          nome: l.nome,
          abertas: Number(l.abertas),
          emAndamento: Number(l.emAndamento),
          emRevisao: Number(l.emRevisao),
          concluidas: Number(l.concluidas),
          total: Number(l.total)
        };
      }),
      prazosProximos: prazos.map(function (l) {
        return {
          id: l.id,
          titulo: l.titulo,
          tipo: l.tipo,
          prioridade: l.prioridade,
          status: l.status,
          responsavelNome: l.responsavelNome,
          prazo: l.prazo,
          diasRestantes: Number(l.diasRestantes)
        };
      }),
      filtros: { projetos: projetos, responsaveis: responsaveis }
    });
  } catch (erro) {
    console.error('Erro ao montar o dashboard:', erro);
    res.status(500).json({ mensagem: 'Erro interno ao carregar o dashboard.' });
  }
});

export default router;

// Autor: Leonardo Miziara
// Função: cadastrar e editar demandas direto no MySQL (cards #14, #17, #24).
//   POST /api/demandas       -> cadastra uma demanda (nasce sempre como 'Aberta')
//   PUT  /api/demandas/:id   -> edita título, descrição, tipo, prioridade, responsável e prazo
//
// Regras (Documento de Visão 2.1, 2.2 e 2.2.5):
//   - Só Administrador e Líder de Projeto cadastram e editam. O Líder só nos
//     projetos em que está vinculado. Membro da Equipe recebe 403.
//   - O prazo é opcional, mas não pode ser data passada nem feriado nacional
//     (consulta à BrasilAPI em ../feriados.ts).
//   - Demandas Concluídas ou Canceladas não podem ser editadas.
//   - O status NÃO muda aqui (só pelo PATCH /api/demandas/:id/status) e o
//     projeto da demanda não muda na edição.
//   - Toda criação e edição é gravada no histórico.
//
// Erros respondem no formato { mensagem, erros: [...] }, que a tela lê.
// O autor da ação e o perfil vêm sempre do token, nunca do corpo da requisição.

import { Router, Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../db';
import { verificarLogin, somentePerfis, UsuarioToken } from './autentificacao';
import { registrarHistorico } from './historico';
import { checarDemanda } from '../acessoDemanda';
import { dataEhReal, nomeDoFeriadoNacional } from '../feriados';

const router = Router();

// Valores aceitos, iguais aos ENUMs do banco (Documento de Visão 2.2.1 e 2.2.2).
const TIPOS = ['Tarefa', 'Defeito', 'Melhoria', 'Documentação'];
const PRIORIDADES = ['Crítica', 'Alta', 'Média', 'Baixa'];

// Dados já validados, prontos para gravar.
interface DadosDemanda {
    titulo: string;
    descricao: string;
    tipo: string;
    prioridade: string;
    responsavelId: number | null;
    prazo: string | null;
}

// Data de hoje (do servidor) em texto AAAA-MM-DD. Datas são comparadas como
// texto para não ter problema de fuso horário.
function hojeEmTexto(): string {
    const agora = new Date();
    let mes = String(agora.getMonth() + 1);
    let dia = String(agora.getDate());

    if (mes.length === 1) {
        mes = '0' + mes;
    }
    if (dia.length === 1) {
        dia = '0' + dia;
    }

    return agora.getFullYear() + '-' + mes + '-' + dia;
}

// "2026-12-10" -> "10/12/2026"
function formatarData(texto: string): string {
    return texto.slice(8, 10) + '/' + texto.slice(5, 7) + '/' + texto.slice(0, 4);
}

// Valida o formato dos campos do corpo (sem consultar o banco).
// Devolve a lista de erros e os dados já limpos.
function validarCampos(corpo: any): { erros: string[]; dados: DadosDemanda } {
    const erros: string[] = [];
    let c = corpo;
    if (c === null || c === undefined) {
        c = {};
    }

    let titulo = '';
    if (typeof c.titulo === 'string') {
        titulo = c.titulo.trim();
    }
    if (titulo === '' || titulo.length > 150) {
        erros.push('O título é obrigatório (até 150 caracteres).');
    }

    let descricao = '';
    if (typeof c.descricao === 'string') {
        descricao = c.descricao.trim();
    }
    if (descricao === '') {
        erros.push('A descrição é obrigatória.');
    }

    if (c.tipo !== 'Tarefa' && c.tipo !== 'Defeito' && c.tipo !== 'Melhoria' && c.tipo !== 'Documentação') {
        erros.push('Tipo inválido. Use: ' + TIPOS.join(', ') + '.');
    }

    if (c.prioridade !== 'Crítica' && c.prioridade !== 'Alta' && c.prioridade !== 'Média' && c.prioridade !== 'Baixa') {
        erros.push('Prioridade inválida. Use: ' + PRIORIDADES.join(', ') + '.');
    }

    // Responsável é opcional (pode ficar em branco, Documento de Visão 2.2.5).
    let responsavelId: number | null = null;
    if (c.responsavelId !== undefined && c.responsavelId !== null && c.responsavelId !== '') {
        responsavelId = Number(c.responsavelId);
        if (!Number.isInteger(responsavelId) || responsavelId <= 0) {
            erros.push('Responsável inválido para este projeto.');
            responsavelId = null;
        }
    }

    // Prazo é opcional, mas se vier precisa ser uma data real.
    let prazo: string | null = null;
    if (c.prazo !== undefined && c.prazo !== null && c.prazo !== '') {
        if (typeof c.prazo === 'string' && dataEhReal(c.prazo)) {
            prazo = c.prazo;
        } else {
            erros.push('O prazo deve ser uma data válida (AAAA-MM-DD).');
        }
    }

    return { erros, dados: { titulo, descricao, tipo: c.tipo, prioridade: c.prioridade, responsavelId, prazo } };
}

// Confere se o usuário escolhido como responsável existe e participa do projeto
// (o Administrador é aceito em qualquer projeto).
async function responsavelValido(responsavelId: number, projetoId: number): Promise<boolean> {
    const [usuarios] = await pool.query<RowDataPacket[]>(
        'SELECT perfil FROM usuario WHERE id = ?',
        [responsavelId]
    );
    if (usuarios.length === 0) {
        return false;
    }
    if (usuarios[0].perfil === 'Administrador') {
        return true;
    }
    const [vinculo] = await pool.query<RowDataPacket[]>(
        'SELECT 1 FROM projeto_usuario WHERE projeto_id = ? AND usuario_id = ?',
        [projetoId, responsavelId]
    );
    return vinculo.length > 0;
}

// Valida o prazo: não pode ser anterior a hoje nem feriado nacional.
// Devolve a mensagem de erro ou null se estiver tudo certo.
async function erroDoPrazo(prazo: string): Promise<string | null> {
    if (prazo < hojeEmTexto()) {
        return 'O prazo não pode ser anterior a hoje.';
    }
    const feriado = await nomeDoFeriadoNacional(prazo);
    if (feriado !== null) {
        return 'O prazo não pode ser um feriado nacional (' + feriado + ').';
    }
    return null;
}

// Nome de um usuário pelo id (usado na frase do histórico).
async function nomeDoUsuario(id: number | null): Promise<string> {
    if (id === null) {
        return 'sem responsável';
    }
    const [linhas] = await pool.query<RowDataPacket[]>('SELECT nome FROM usuario WHERE id = ?', [id]);
    if (linhas.length > 0) {
        return linhas[0].nome;
    }
    return 'sem responsável';
}

// POST /api/demandas
router.post('/demandas', verificarLogin, somentePerfis('Administrador', 'Líder de Projeto'),
    async (req: Request, res: Response) => {
        try {
            const usuario = req.usuario as UsuarioToken;

            // 1. Campos básicos.
            const { erros, dados } = validarCampos(req.body);

            // 2. Projeto: precisa existir e o Líder precisa estar vinculado a ele.
            const projetoId = Number(req.body && req.body.projetoId);
            let projetoOk = false;
            if (!Number.isInteger(projetoId) || projetoId <= 0) {
                erros.push('Projeto inválido.');
            } else {
                const [projetos] = await pool.query<RowDataPacket[]>('SELECT id FROM projeto WHERE id = ?', [projetoId]);
                if (projetos.length === 0) {
                    erros.push('Projeto inválido.');
                } else {
                    if (usuario.perfil !== 'Administrador') {
                        const [vinculo] = await pool.query<RowDataPacket[]>(
                            'SELECT 1 FROM projeto_usuario WHERE projeto_id = ? AND usuario_id = ?',
                            [projetoId, usuario.id]
                        );
                        if (vinculo.length === 0) {
                            res.status(403).json({ mensagem: 'Você não participa deste projeto.', erros: ['Você não participa deste projeto.'] });
                            return;
                        }
                    }
                    projetoOk = true;
                }
            }

            // 3. Responsável (se informado).
            if (projetoOk && dados.responsavelId !== null) {
                if (!(await responsavelValido(dados.responsavelId, projetoId))) {
                    erros.push('Responsável inválido para este projeto.');
                }
            }

            // 4. Prazo (se informado e com formato correto).
            if (dados.prazo !== null) {
                const erroPrazo = await erroDoPrazo(dados.prazo);
                if (erroPrazo) {
                    erros.push(erroPrazo);
                }
            }

            if (erros.length > 0) {
                res.status(400).json({ mensagem: 'Não foi possível cadastrar a demanda.', erros });
                return;
            }

            // 5. Grava. Status 'Aberta' e as datas de criação/atualização vêm do padrão do banco.
            const [resultado] = await pool.query<ResultSetHeader>(
                `INSERT INTO demanda (titulo, descricao, tipo, prioridade, projeto_id, responsavel_id, prazo_finalizacao)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [dados.titulo, dados.descricao, dados.tipo, dados.prioridade, projetoId, dados.responsavelId, dados.prazo]
            );
            const id = resultado.insertId;

            // 6. Histórico.
            await registrarHistorico(id, usuario.id, usuario.nome + ' criou a demanda.');

            res.status(201).json({ id, mensagem: 'Demanda criada com sucesso.' });
        } catch (erro) {
            console.error('Erro ao cadastrar demanda:', erro);
            res.status(500).json({ mensagem: 'Erro interno ao cadastrar a demanda.', erros: [] });
        }
    });

// PUT /api/demandas/:id
router.put('/demandas/:id', verificarLogin, somentePerfis('Administrador', 'Líder de Projeto'),
    async (req: Request, res: Response) => {
        try {
            // Confere id, se a demanda existe e se o Líder participa do projeto (400, 404 ou 403).
            const acesso = await checarDemanda(req, res);
            if (!acesso) return;
            const { demandaId, usuario } = acesso;

            // Dados atuais da demanda.
            const [linhas] = await pool.query<RowDataPacket[]>(
                `SELECT titulo, descricao, tipo, prioridade, status, projeto_id,
                        responsavel_id, prazo_finalizacao
                   FROM demanda WHERE id = ?`,
                [demandaId]
            );
            const atual = linhas[0];

            // Demandas Concluídas ou Canceladas não mudam mais.
            if (atual.status === 'Concluída' || atual.status === 'Cancelada') {
                res.status(400).json({
                    mensagem: 'Demandas ' + atual.status.toLowerCase() + 's não podem ser editadas.',
                    erros: ['Demandas ' + atual.status.toLowerCase() + 's não podem ser editadas.']
                });
                return;
            }

            const { erros, dados } = validarCampos(req.body);

            // Responsável: só confere se foi trocado (o antigo pode ter saído do projeto).
            if (dados.responsavelId !== null && dados.responsavelId !== atual.responsavel_id) {
                if (!(await responsavelValido(dados.responsavelId, atual.projeto_id))) {
                    erros.push('Responsável inválido para este projeto.');
                }
            }

            // Prazo: só confere (passado e feriado) se mudou. Uma demanda antiga
            // com prazo já vencido continua podendo ser editada sem trocar a data.
            let prazoAtual: string | null = null;
            if (atual.prazo_finalizacao !== null && atual.prazo_finalizacao !== undefined) {
                prazoAtual = atual.prazo_finalizacao;
            }
            if (dados.prazo !== null && dados.prazo !== prazoAtual) {
                const erroPrazo = await erroDoPrazo(dados.prazo);
                if (erroPrazo) {
                    erros.push(erroPrazo);
                }
            }

            if (erros.length > 0) {
                res.status(400).json({ mensagem: 'Não foi possível atualizar a demanda.', erros });
                return;
            }

            // Descobre o que mudou, para a frase do histórico.
            const mudancas: string[] = [];
            if (dados.titulo !== atual.titulo) {
                mudancas.push('título alterado');
            }
            if (dados.descricao !== atual.descricao) {
                mudancas.push('descrição alterada');
            }
            if (dados.tipo !== atual.tipo) {
                mudancas.push('tipo de ' + atual.tipo + ' para ' + dados.tipo);
            }
            if (dados.prioridade !== atual.prioridade) {
                mudancas.push('prioridade de ' + atual.prioridade + ' para ' + dados.prioridade);
            }
            if (dados.responsavelId !== atual.responsavel_id) {
                mudancas.push('responsável de ' + await nomeDoUsuario(atual.responsavel_id)
                    + ' para ' + await nomeDoUsuario(dados.responsavelId));
            }
            if (dados.prazo !== prazoAtual) {
                mudancas.push('prazo de ' + (prazoAtual ? formatarData(prazoAtual) : 'sem prazo')
                    + ' para ' + (dados.prazo ? formatarData(dados.prazo) : 'sem prazo'));
            }

            // Nada mudou: responde 200 sem gravar nem registrar histórico.
            if (mudancas.length === 0) {
                res.status(200).json({ mensagem: 'Nenhuma alteração.' });
                return;
            }

            // A data de atualização muda sozinha (ON UPDATE CURRENT_TIMESTAMP). Projeto e status não mudam aqui.
            await pool.query(
                `UPDATE demanda
                    SET titulo = ?, descricao = ?, tipo = ?, prioridade = ?,
                        responsavel_id = ?, prazo_finalizacao = ?
                  WHERE id = ?`,
                [dados.titulo, dados.descricao, dados.tipo, dados.prioridade,
                 dados.responsavelId, dados.prazo, demandaId]
            );

            // Um único registro de histórico. A coluna aceita 255 caracteres:
            // se a frase ficar grande demais, resume.
            let frase = usuario.nome + ' editou a demanda: ' + mudancas.join('; ') + '.';
            if (frase.length > 255) {
                frase = usuario.nome + ' editou a demanda: alterou ' + mudancas.length + ' campos.';
            }
            await registrarHistorico(demandaId, usuario.id, frase);

            res.status(200).json({ mensagem: 'Demanda atualizada com sucesso.' });
        } catch (erro) {
            console.error('Erro ao editar demanda:', erro);
            res.status(500).json({ mensagem: 'Erro interno ao editar a demanda.', erros: [] });
        }
    });

export default router;

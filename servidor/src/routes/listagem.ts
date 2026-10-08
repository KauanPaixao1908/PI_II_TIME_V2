// Autor: Bruno Mareto
// Rota de listagem de demandas: GET /demandas (Reunião 4).
// Retorna as informações principais de cada demanda (Documento de Visão, 2.2.9)
// e permite filtros, busca textual e ordenação (2.3). Os dados vêm de src/data.
//
// Parâmetros aceitos na URL (todos opcionais):
//   status, prioridade, tipo       -> filtros por valor (ex.: ?prioridade=Alta)
//   responsavelId, projetoId       -> filtros por id (ex.: ?projetoId=2)
//   busca                          -> texto procurado no título ou na descrição
//   ordenar                        -> prioridade | criadaEm | prazo | status
//   ordem                          -> asc (padrão) | desc
// Valores inválidos retornam 400 com uma mensagem de erro.

import { Router, Request, Response } from 'express';
import { demandas } from '../data/demandas';
import { projetos } from '../data/projetos';
import { usuarios } from '../data/usuarios';
import { Demanda, Prioridade, StatusDemanda, TipoDemanda } from '../tipos';

const router = Router();

// Valores aceitos nos filtros, na ordem usada pela ordenação:
// prioridade da mais urgente para a menos urgente e status conforme o ciclo de vida (2.2.4).
const PRIORIDADES: Prioridade[] = ['Crítica', 'Alta', 'Média', 'Baixa'];
const STATUS: StatusDemanda[] = ['Aberta', 'Em andamento', 'Em revisão', 'Concluída', 'Cancelada'];
const TIPOS: TipoDemanda[] = ['Tarefa', 'Defeito', 'Melhoria', 'Documentação'];
const CAMPOS_ORDENACAO = ['prioridade', 'criadaEm', 'prazo', 'status'];

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
    return valor;
}

// Lê um filtro de lista fechada e devolve o valor oficial (com acento e maiúscula).
function lerOpcao<T extends string>(req: Request, nome: string, opcoes: T[]): T | undefined {
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

// Compara duas demandas pelo campo escolhido, em ordem crescente.
function comparar(a: Demanda, b: Demanda, campo: string): number {
    switch (campo) {
        case 'prioridade':
            return PRIORIDADES.indexOf(a.prioridade) - PRIORIDADES.indexOf(b.prioridade);
        case 'status':
            return STATUS.indexOf(a.status) - STATUS.indexOf(b.status);
        case 'criadaEm':
            return a.criadaEm.localeCompare(b.criadaEm);
        default:
            return (a.prazo ?? '').localeCompare(b.prazo ?? '');
    }
}

// Ordena a lista sem alterar o array original. Na ordenação por prazo,
// demandas sem prazo ficam sempre no final, tanto em asc quanto em desc.
function ordenarLista(lista: Demanda[], campo: string, ordem: string): Demanda[] {
    const sinal = ordem === 'desc' ? -1 : 1;
    return [...lista].sort((a, b) => {
        if (campo === 'prazo' && (a.prazo === null || b.prazo === null)) {
            return (a.prazo === null ? 1 : 0) - (b.prazo === null ? 1 : 0);
        }
        return sinal * comparar(a, b, campo);
    });
}

// Monta o item da listagem com os campos exigidos em 2.2.9,
// trocando os ids de projeto e responsável pelos nomes.
function paraListagem(demanda: Demanda) {
    const projeto = projetos.find((p) => p.id === demanda.projetoId);
    const responsavel = usuarios.find((u) => u.id === demanda.responsavelId);
    return {
        id: demanda.id,
        titulo: demanda.titulo,
        tipo: demanda.tipo,
        prioridade: demanda.prioridade,
        status: demanda.status,
        projeto: projeto ? { id: projeto.id, nome: projeto.nome } : null,
        responsavel: responsavel ? { id: responsavel.id, nome: responsavel.nome } : null,
        criadaEm: demanda.criadaEm,
        prazo: demanda.prazo,
    };
}

// GET /demandas
// 200: lista filtrada e ordenada, com o total de resultados.
// 400: algum parâmetro da URL com valor inválido.
router.get('/demandas', (req: Request, res: Response) => {
    try {
        const status = lerOpcao(req, 'status', STATUS);
        const prioridade = lerOpcao(req, 'prioridade', PRIORIDADES);
        const tipo = lerOpcao(req, 'tipo', TIPOS);
        const responsavelId = lerId(req, 'responsavelId');
        const projetoId = lerId(req, 'projetoId');
        const busca = lerTexto(req, 'busca');
        const ordenar = lerOpcao(req, 'ordenar', CAMPOS_ORDENACAO);
        const ordem = lerOpcao(req, 'ordem', ['asc', 'desc']) ?? 'asc';

        let resultado = demandas.filter((d) =>
            (status === undefined || d.status === status) &&
            (prioridade === undefined || d.prioridade === prioridade) &&
            (tipo === undefined || d.tipo === tipo) &&
            (responsavelId === undefined || d.responsavelId === responsavelId) &&
            (projetoId === undefined || d.projetoId === projetoId) &&
            (busca === undefined ||
                normalizar(d.titulo).includes(normalizar(busca)) ||
                normalizar(d.descricao).includes(normalizar(busca)))
        );

        if (ordenar !== undefined) {
            resultado = ordenarLista(resultado, ordenar, ordem);
        }

        res.status(200).json({
            total: resultado.length,
            demandas: resultado.map(paraListagem),
        });
    } catch (erro) {
        if (erro instanceof ParametroInvalido) {
            res.status(400).json({ erro: erro.message });
            return;
        }
        throw erro;
    }
});

export default router;
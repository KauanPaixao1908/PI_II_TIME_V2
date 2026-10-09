// Autor: Miguel
// src/routes/dashboard.ts
// GET /dashboard - Retorna totais por status, prioridade, tipo, demandas críticas abertas e próximas do prazo
// Baseado em Dashboard.java reescrito em TypeScript

import { Router } from 'express';

// Interfaces TypeScript para type safety
interface Indicador {
    tipo: string;
    valor: number;
    percentual: string;
    descricao: string;
}

interface DemandaProxima {
    id: number;
    titulo: string;
    tipo: string;
    prioridade: string;
    status: string;
    responsavel: string;
    prazo: string;
    diasRestantes: number;
    descricao?: string;
}

interface DadosBarra {
    categoria: string;
    quantidade: number;
    percentual: number;
}

interface RespostaDashboard {
    indicadores: Indicador[];
    demandasPorStatus: DadosBarra[];
    demandasPorPrioridade: DadosBarra[];
    demandasPorTipo: DadosBarra[];
    demandasCriticasAbertas: DemandaProxima[];
    prazosProximos: DemandaProxima[];
    timestamp: string;
}

const router = Router();

// Dados em memória (em produção viriam do banco de dados)
const demandas: DemandaProxima[] = [
    {
        id: 1,
        titulo: "Padronizar mensagens de erro",
        tipo: "Melhoria",
        prioridade: "Média",
        status: "Pendente",
        responsavel: "Sem responsável",
        prazo: "2026-09-03",
        diasRestantes: -5,
        descricao: "Unificar estilo de mensagens de erro em toda a aplicação"
    },
    {
        id: 2,
        titulo: "Revisar diagrama de classes",
        tipo: "Documentação",
        prioridade: "Alta",
        status: "Em andamento",
        responsavel: "Bruno Lima",
        prazo: "2026-09-06",
        diasRestantes: -2,
        descricao: "Revisar e atualizar diagrama UML do projeto"
    },
    {
        id: 3,
        titulo: "Ajustar contraste dos botões",
        tipo: "Melhoria",
        prioridade: "Baixa",
        status: "Pendente",
        responsavel: "Carla Souza",
        prazo: "2026-09-07",
        diasRestantes: -1,
        descricao: "Melhorar acessibilidade dos botões"
    },
    {
        id: 4,
        titulo: "Criar tela de login",
        tipo: "Funcionalidade",
        prioridade: "Alta",
        status: "Em andamento",
        responsavel: "Ana Martins",
        prazo: "2026-09-14",
        diasRestantes: 6,
        descricao: "Implementar tela de autenticação do usuário"
    },
    {
        id: 5,
        titulo: "Corrigir listagem de projetos",
        tipo: "Correção",
        prioridade: "Alta",
        status: "Pendente",
        responsavel: "Bruno Lima",
        prazo: "2026-09-16",
        diasRestantes: 8,
        descricao: "Corrigir bug na paginação e filtros"
    },
    {
        id: 6,
        titulo: "Criar cadastro de demandas",
        tipo: "Funcionalidade",
        prioridade: "Média",
        status: "Pendente",
        responsavel: "Diego Santos",
        prazo: "2026-09-20",
        diasRestantes: 12,
        descricao: "Implementar funcionalidade de criação de demandas"
    },
    {
        id: 7,
        titulo: "Implementar validação de formulários",
        tipo: "Funcionalidade",
        prioridade: "Alta",
        status: "Pendente",
        responsavel: "Sem responsável",
        prazo: "2026-09-10",
        diasRestantes: 2,
        descricao: "Adicionar validação cliente e servidor nos formulários"
    },
    {
        id: 8,
        titulo: "Testes de integração backend",
        tipo: "Funcionalidade",
        prioridade: "Alta",
        status: "Pendente",
        responsavel: "Bruno Lima",
        prazo: "2026-09-25",
        diasRestantes: 17,
        descricao: "Escrever testes de integração para as APIs"
    }
];

// Função auxiliar para calcular dias restantes
function calcularDiasRestantes(prazo: string): number {
    const dataPrazo = new Date(prazo);
    const dataHoje = new Date('2026-09-08'); // Data fixa para testes
    const differenceTime = dataPrazo.getTime() - dataHoje.getTime();
    const differenceDays = Math.ceil(differenceTime / (1000 * 60 * 60 * 24));
    return differenceDays;
}

// Função auxiliar para contar demandas por categoria
function contarPorCategoria(campo: keyof DemandaProxima): { [key: string]: number } {
    const contagem: { [key: string]: number } = {};

    demandas.forEach(demanda => {
        const valor = String(demanda[campo]);
        contagem[valor] = (contagem[valor] || 0) + 1;
    });

    return contagem;
}

// Rota GET /dashboard
router.get('/', (req, res) => {
    try {
        // Calcular totais
        const totalDemandas = demandas.length;
        const pendentes = demandas.filter(d => d.status === 'Pendente').length;
        const emAndamento = demandas.filter(d => d.status === 'Em andamento').length;
        const concluidas = demandas.filter(d => d.status === 'Concluída').length;
        const criticasAbertas = demandas.filter(d => d.prioridade === 'Alta' && (d.status === 'Pendente' || d.status === 'Em andamento')).length;

        // Indicadores gerais
        const indicadores: Indicador[] = [
            {
                tipo: "Total",
                valor: totalDemandas,
                percentual: "",
                descricao: "Demandas em 2 projetos ativos"
            },
            {
                tipo: "Pendentes",
                valor: pendentes,
                percentual: `${((pendentes / totalDemandas) * 100).toFixed(1)}%`,
                descricao: "Demandas aguardando ação"
            },
            {
                tipo: "Em andamento",
                valor: emAndamento,
                percentual: `${((emAndamento / totalDemandas) * 100).toFixed(1)}%`,
                descricao: "Demandas sendo executadas"
            },
            {
                tipo: "Concluídas",
                valor: concluidas,
                percentual: `${((concluidas / totalDemandas) * 100).toFixed(1)}%`,
                descricao: "Demandas finalizadas"
            },
            {
                tipo: "Críticas abertas",
                valor: criticasAbertas,
                percentual: "",
                descricao: "Demandas de alta prioridade não concluídas"
            }
        ];

        // Demandas por status
        const contagemStatus = contarPorCategoria('status');
        const demandasPorStatus: DadosBarra[] = Object.entries(contagemStatus).map(([status, qtd]) => ({
            categoria: status,
            quantidade: qtd,
            percentual: parseFloat(((qtd / totalDemandas) * 100).toFixed(1))
        }));

        // Demandas por prioridade
        const contagemPrioridade = contarPorCategoria('prioridade');
        const demandasPorPrioridade: DadosBarra[] = Object.entries(contagemPrioridade).map(([prioridade, qtd]) => ({
            categoria: prioridade,
            quantidade: qtd,
            percentual: parseFloat(((qtd / totalDemandas) * 100).toFixed(1))
        }));

        // Demandas por tipo
        const contagemTipo = contarPorCategoria('tipo');
        const demandasPorTipo: DadosBarra[] = Object.entries(contagemTipo).map(([tipo, qtd]) => ({
            categoria: tipo,
            quantidade: qtd,
            percentual: parseFloat(((qtd / totalDemandas) * 100).toFixed(1))
        }));

        // Demandas críticas abertas (Alta prioridade + Pendente ou Em andamento)
        const demandasCriticasAbertas = demandas
            .filter(d => d.prioridade === 'Alta' && (d.status === 'Pendente' || d.status === 'Em andamento'))
            .slice(0, 5);

        // Prazos próximos (próximos 14 dias)
        const prazosProximos = demandas
            .filter(d => d.diasRestantes >= -14 && d.diasRestantes <= 14)
            .sort((a, b) => a.diasRestantes - b.diasRestantes)
            .slice(0, 6);

        const resposta: RespostaDashboard = {
            indicadores,
            demandasPorStatus,
            demandasPorPrioridade,
            demandasPorTipo,
            demandasCriticasAbertas,
            prazosProximos,
            timestamp: new Date().toISOString()
        };

        res.status(200).json(resposta);
    } catch (erro) {
        console.error('Erro ao buscar dashboard:', erro);
        res.status(500).json({ erro: 'Erro ao buscar dados do dashboard' });
    }
});

// Rota GET /dashboard/:id (não encontrado)
router.get('/:id', (req, res) => {
    res.status(404).json({ erro: 'Rota não encontrada' });
});

export default router;

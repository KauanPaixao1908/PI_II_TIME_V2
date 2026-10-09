// Dashboard.js - Conversão de Dashboard.java para JavaScript (ES6)

class Indicador {
    constructor(tipo, valor, percentual, descricao) {
        this.tipo = tipo;
        this.valor = valor;
        this.percentual = percentual;
        this.descricao = descricao;
    }
}

class DemandaListagemPrazo {
    constructor(titulo, tipo, prioridade, status, responsavel, prazo, situacao) {
        this.titulo = titulo;
        this.tipo = tipo;
        this.prioridade = prioridade;
        this.status = status;
        this.responsavel = responsavel;
        this.prazo = prazo;
        this.situacao = situacao;
    }
}

class Responsavel {
    constructor(nome, pendentes, emAndamento, concluidas) {
        this.nome = nome;
        this.pendentes = pendentes;
        this.emAndamento = emAndamento;
        this.concluidas = concluidas;
        this.total = pendentes + emAndamento + concluidas;
    }
}

class DadosBarraPorStatus {
    constructor(status, quantidade, percentual) {
        this.status = status;
        this.quantidade = quantidade;
        this.percentual = percentual;
    }
}

class Dashboard {
    constructor() {
        this.totalDemandas = 0;
        this.demandaspendentes = 0;
        this.demandasEmAndamento = 0;
        this.demandasConcluidas = 0;
        this.demandasAtrasadas = 0;

        this.indicadores = [];
        this.demandasPorStatus = [];
        this.demandasPorPrioridade = [];
        this.demandasPorTipo = [];
        this.cargaPorResponsavel = [];
        this.prazosProximos = [];

        this.inicializarDados();
    }

    inicializarDados() {
        this.totalDemandas = 24;
        this.demandaspendentes = 9;
        this.demandasEmAndamento = 7;
        this.demandasConcluidas = 8;
        this.demandasAtrasadas = 3;

        this.carregarIndicadores();
        this.carregarDemandaPerStatus();
        this.carregarDemandaPerPrioridade();
        this.carregarDemandaPerTipo();
        this.carregarCargaPorResponsavel();
        this.carregarPrazosProximos();
    }

    carregarIndicadores() {
        this.indicadores.push(new Indicador("Total", this.totalDemandas, "", "Demandas em 2 projetos ativos"));
        this.indicadores.push(new Indicador("Pendentes", this.demandaspendentes, "37,5%", "Demandas aguardando ação"));
        this.indicadores.push(new Indicador("Em andamento", this.demandasEmAndamento, "29,2%", "Demandas sendo executadas"));
        this.indicadores.push(new Indicador("Concluídas", this.demandasConcluidas, "33,3%", "Demandas finalizadas"));
        this.indicadores.push(new Indicador("Atrasadas", this.demandasAtrasadas, "", "Prazo vencido e sem conclusão"));
    }

    carregarDemandaPerStatus() {
        this.demandasPorStatus.push(new DadosBarraPorStatus("Pendente", 9, 37.5));
        this.demandasPorStatus.push(new DadosBarraPorStatus("Concluída", 8, 33.3));
        this.demandasPorStatus.push(new DadosBarraPorStatus("Em andamento", 7, 29.2));
    }

    carregarDemandaPerPrioridade() {
        this.demandasPorPrioridade.push(new DadosBarraPorStatus("Média", 10, 41.7));
        this.demandasPorPrioridade.push(new DadosBarraPorStatus("Alta", 8, 33.3));
        this.demandasPorPrioridade.push(new DadosBarraPorStatus("Baixa", 6, 25.0));
    }

    carregarDemandaPerTipo() {
        this.demandasPorTipo.push(new DadosBarraPorStatus("Funcionalidade", 11, 45.8));
        this.demandasPorTipo.push(new DadosBarraPorStatus("Correção", 7, 29.2));
        this.demandasPorTipo.push(new DadosBarraPorStatus("Melhoria", 4, 16.7));
        this.demandasPorTipo.push(new DadosBarraPorStatus("Documentação", 2, 8.3));
    }

    carregarCargaPorResponsavel() {
        this.cargaPorResponsavel.push(new Responsavel("Ana Martins", 2, 2, 2));
        this.cargaPorResponsavel.push(new Responsavel("Bruno Lima", 2, 2, 1));
        this.cargaPorResponsavel.push(new Responsavel("Carla Souza", 1, 1, 3));
        this.cargaPorResponsavel.push(new Responsavel("Diego Santos", 2, 1, 1));
        this.cargaPorResponsavel.push(new Responsavel("Sem responsável", 2, 1, 1));
    }

    carregarPrazosProximos() {
        this.prazosProximos.push(new DemandaListagemPrazo(
            "Padronizar mensagens de erro",
            "Melhoria",
            "Média",
            "Pendente",
            "Sem responsável",
            new Date(2026, 8, 3),
            "Atrasada há 5 dias"
        ));

        this.prazosProximos.push(new DemandaListagemPrazo(
            "Revisar diagrama de classes",
            "Documentação",
            "Alta",
            "Em andamento",
            "Bruno Lima",
            new Date(2026, 8, 6),
            "Atrasada há 2 dias"
        ));

        this.prazosProximos.push(new DemandaListagemPrazo(
            "Ajustar contraste dos botões",
            "Melhoria",
            "Baixa",
            "Pendente",
            "Carla Souza",
            new Date(2026, 8, 7),
            "Atrasada há 1 dia"
        ));

        this.prazosProximos.push(new DemandaListagemPrazo(
            "Criar tela de login",
            "Funcionalidade",
            "Alta",
            "Em andamento",
            "Ana Martins",
            new Date(2026, 8, 14),
            "Faltam 6 dias"
        ));

        this.prazosProximos.push(new DemandaListagemPrazo(
            "Corrigir listagem de projetos",
            "Correção",
            "Alta",
            "Pendente",
            "Bruno Lima",
            new Date(2026, 8, 16),
            "Faltam 8 dias"
        ));

        this.prazosProximos.push(new DemandaListagemPrazo(
            "Criar cadastro de demandas",
            "Funcionalidade",
            "Média",
            "Pendente",
            "Diego Santos",
            new Date(2026, 8, 20),
            "Faltam 12 dias"
        ));
    }

    // Getters
    getIndicadores() {
        return this.indicadores;
    }

    getDemandasPorStatus() {
        return this.demandasPorStatus;
    }

    getDemandasPorPrioridade() {
        return this.demandasPorPrioridade;
    }

    getDemandasPorTipo() {
        return this.demandasPorTipo;
    }

    getCargaPorResponsavel() {
        return this.cargaPorResponsavel;
    }

    getPrazosProximos() {
        return this.prazosProximos;
    }

    getTotalDemandas() {
        return this.totalDemandas;
    }

    getDemandaspendentes() {
        return this.demandaspendentes;
    }

    getDemandasEmAndamento() {
        return this.demandasEmAndamento;
    }

    getDemandasConcluidas() {
        return this.demandasConcluidas;
    }

    getDemandasAtrasadas() {
        return this.demandasAtrasadas;
    }
}

// Exporta para Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Dashboard;
}

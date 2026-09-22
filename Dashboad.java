import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Dashboard {
    
    public static class Indicador {
        public String tipo;
        public int valor;
        public String percentual;
        public String descricao;
        
        public Indicador(String tipo, int valor, String percentual, String descricao) {
            this.tipo = tipo;
            this.valor = valor;
            this.percentual = percentual;
            this.descricao = descricao;
        }
    }
    
    public static class DemandaListagemPrazo {
        public String titulo;
        public String tipo;
        public String prioridade;
        public String status;
        public String responsavel;
        public LocalDate prazo;
        public String situacao;
        
        public DemandaListagemPrazo(String titulo, String tipo, String prioridade, 
                                    String status, String responsavel, LocalDate prazo, String situacao) {
            this.titulo = titulo;
            this.tipo = tipo;
            this.prioridade = prioridade;
            this.status = status;
            this.responsavel = responsavel;
            this.prazo = prazo;
            this.situacao = situacao;
        }
    }
    
    public static class Responsavel {
        public String nome;
        public int pendentes;
        public int emAndamento;
        public int concluidas;
        public int total;
        
        public Responsavel(String nome, int pendentes, int emAndamento, int concluidas) {
            this.nome = nome;
            this.pendentes = pendentes;
            this.emAndamento = emAndamento;
            this.concluidas = concluidas;
            this.total = pendentes + emAndamento + concluidas;
        }
    }
    
    public static class DadosBarraPorStatus {
        public String status;
        public int quantidade;
        public double percentual;
        
        public DadosBarraPorStatus(String status, int quantidade, double percentual) {
            this.status = status;
            this.quantidade = quantidade;
            this.percentual = percentual;
        }
    }
    
    private int totalDemandas;
    private int demandaspendentes;
    private int demandasEmAndamento;
    private int demandasConcluidas;
    private int demandasAtrasadas;
    
    private List<Indicador> indicadores;
    private List<DadosBarraPorStatus> demandasPorStatus;
    private List<DadosBarraPorStatus> demandasPorPrioridade;
    private List<DadosBarraPorStatus> demandasPorTipo;
    private List<Responsavel> cargaPorResponsavel;
    private List<DemandaListagemPrazo> prazosProximos;
    
    public Dashboard() {
        inicializarDados();
    }
    
    private void inicializarDados() {
        totalDemandas = 24;
        demandaspendentes = 9;
        demandasEmAndamento = 7;
        demandasConcluidas = 8;
        demandasAtrasadas = 3;
        
        this.indicadores = new ArrayList<>();
        this.demandasPorStatus = new ArrayList<>();
        this.demandasPorPrioridade = new ArrayList<>();
        this.demandasPorTipo = new ArrayList<>();
        this.cargaPorResponsavel = new ArrayList<>();
        this.prazosProximos = new ArrayList<>();
        
        carregarIndicadores();
        carregarDemandaPerStatus();
        carregarDemandaPerPrioridade();
        carregarDemandaPerTipo();
        carregarCargaPorResponsavel();
        carregarPrazosProximos();
    }
    
    private void carregarIndicadores() {
        indicadores.add(new Indicador("Total", totalDemandas, "", "Demandas em 2 projetos ativos"));
        indicadores.add(new Indicador("Pendentes", demandaspendentes, "37,5%", "Demandas aguardando ação"));
        indicadores.add(new Indicador("Em andamento", demandasEmAndamento, "29,2%", "Demandas sendo executadas"));
        indicadores.add(new Indicador("Concluídas", demandasConcluidas, "33,3%", "Demandas finalizadas"));
        indicadores.add(new Indicador("Atrasadas", demandasAtrasadas, "", "Prazo vencido e sem conclusão"));
    }
    
    private void carregarDemandaPerStatus() {
        demandasPorStatus.add(new DadosBarraPorStatus("Pendente", 9, 37.5));
        demandasPorStatus.add(new DadosBarraPorStatus("Concluída", 8, 33.3));
        demandasPorStatus.add(new DadosBarraPorStatus("Em andamento", 7, 29.2));
    }
    
    private void carregarDemandaPerPrioridade() {
        demandasPorPrioridade.add(new DadosBarraPorStatus("Média", 10, 41.7));
        demandasPorPrioridade.add(new DadosBarraPorStatus("Alta", 8, 33.3));
        demandasPorPrioridade.add(new DadosBarraPorStatus("Baixa", 6, 25.0));
    }
    
    private void carregarDemandaPerTipo() {
        demandasPorTipo.add(new DadosBarraPorStatus("Funcionalidade", 11, 45.8));
        demandasPorTipo.add(new DadosBarraPorStatus("Correção", 7, 29.2));
        demandasPorTipo.add(new DadosBarraPorStatus("Melhoria", 4, 16.7));
        demandasPorTipo.add(new DadosBarraPorStatus("Documentação", 2, 8.3));
    }
    
    private void carregarCargaPorResponsavel() {
        cargaPorResponsavel.add(new Responsavel("Ana Martins", 2, 2, 2));
        cargaPorResponsavel.add(new Responsavel("Bruno Lima", 2, 2, 1));
        cargaPorResponsavel.add(new Responsavel("Carla Souza", 1, 1, 3));
        cargaPorResponsavel.add(new Responsavel("Diego Santos", 2, 1, 1));
        cargaPorResponsavel.add(new Responsavel("Sem responsável", 2, 1, 1));
    }
    
    private void carregarPrazosProximos() {
        DateTimeFormatter formato = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        
        prazosProximos.add(new DemandaListagemPrazo(
            "Padronizar mensagens de erro",
            "Melhoria",
            "Média",
            "Pendente",
            "Sem responsável",
            LocalDate.of(2026, 9, 3),
            "Atrasada há 5 dias"
        ));
        
        prazosProximos.add(new DemandaListagemPrazo(
            "Revisar diagrama de classes",
            "Documentação",
            "Alta",
            "Em andamento",
            "Bruno Lima",
            LocalDate.of(2026, 9, 6),
            "Atrasada há 2 dias"
        ));
        
        prazosProximos.add(new DemandaListagemPrazo(
            "Ajustar contraste dos botões",
            "Melhoria",
            "Baixa",
            "Pendente",
            "Carla Souza",
            LocalDate.of(2026, 9, 7),
            "Atrasada há 1 dia"
        ));
        
        prazosProximos.add(new DemandaListagemPrazo(
            "Criar tela de login",
            "Funcionalidade",
            "Alta",
            "Em andamento",
            "Ana Martins",
            LocalDate.of(2026, 9, 14),
            "Faltam 6 dias"
        ));
        
        prazosProximos.add(new DemandaListagemPrazo(
            "Corrigir listagem de projetos",
            "Correção",
            "Alta",
            "Pendente",
            "Bruno Lima",
            LocalDate.of(2026, 9, 16),
            "Faltam 8 dias"
        ));
        
        prazosProximos.add(new DemandaListagemPrazo(
            "Criar cadastro de demandas",
            "Funcionalidade",
            "Média",
            "Pendente",
            "Diego Santos",
            LocalDate.of(2026, 9, 20),
            "Faltam 12 dias"
        ));
    }
    
    // Getters
    public List<Indicador> getIndicadores() {
        return indicadores;
    }
    
    public List<DadosBarraPorStatus> getDemandasPorStatus() {
        return demandasPorStatus;
    }
    
    public List<DadosBarraPorStatus> getDemandasPorPrioridade() {
        return demandasPorPrioridade;
    }
    
    public List<DadosBarraPorStatus> getDemandasPorTipo() {
        return demandasPorTipo;
    }
    
    public List<Responsavel> getCargaPorResponsavel() {
        return cargaPorResponsavel;
    }
    
    public List<DemandaListagemPrazo> getPrazosProximos() {
        return prazosProximos;
    }
    
    public int getTotalDemandas() {
        return totalDemandas;
    }
    
    public int getDemandaspendentes() {
        return demandaspendentes;
    }
    
    public int getDemandasEmAndamento() {
        return demandasEmAndamento;
    }
    
    public int getDemandasConcluidas() {
        return demandasConcluidas;
    }
    
    public int getDemandasAtrasadas() {
        return demandasAtrasadas;
    }
    
    // Main com exemplos
    public static void main(String[] args) {
        Dashboard dashboard = new Dashboard();
        
        System.out.println("=== INDICADORES GERAIS ===");
        for (Indicador ind : dashboard.getIndicadores()) {
            System.out.println(ind.tipo + ": " + ind.valor + " " + ind.percentual + " - " + ind.descricao);
        }
        
        System.out.println("\n=== DEMANDAS POR STATUS ===");
        for (DadosBarraPorStatus status : dashboard.getDemandasPorStatus()) {
            System.out.println(status.status + ": " + status.quantidade + " demandas (" + String.format("%.1f", status.percentual) + "%)");
        }
        
        System.out.println("\n=== CARGA POR RESPONSÁVEL ===");
        for (Responsavel resp : dashboard.getCargaPorResponsavel()) {
            System.out.println(resp.nome + ": " + resp.pendentes + " pendentes, " + resp.emAndamento + " em andamento, " + resp.concluidas + " concluídas (Total: " + resp.total + ")");
        }
        
        System.out.println("\n=== PRAZOS PRÓXIMOS ===");
        for (DemandaListagemPrazo demanda : dashboard.getPrazosProximos()) {
            System.out.println(demanda.titulo + " - " + demanda.prazo + " - " + demanda.situacao);
        }
    }
}

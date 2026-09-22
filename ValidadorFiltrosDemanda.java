import java.util.HashMap;
import java.util.Map;

public class ValidadorFiltrosDemanda {
    
    private static final int TAMANHO_MINIMO_BUSCA = 2;
    private static final int TAMANHO_MAXIMO_BUSCA = 60;
    
    private String busca;
    private String status;
    private String prioridade;
    private String tipo;
    private String responsavel;
    private String projeto;
    
    private String erroBusca = "";
    private String statusFormulario = "";
    private boolean formularioValido = false;
    
    public ValidadorFiltrosDemanda(String busca, String status, String prioridade, 
                                   String tipo, String responsavel, String projeto) {
        this.busca = busca;
        this.status = status;
        this.prioridade = prioridade;
        this.tipo = tipo;
        this.responsavel = responsavel;
        this.projeto = projeto;
    }
    
    private boolean validarBusca() {
        String valor = busca != null ? busca.trim() : "";
        
        if (valor.isEmpty()) {
            limparErroBusca();
            return true;
        }
        
        if (valor.length() < TAMANHO_MINIMO_BUSCA) {
            erroBusca = "Digite pelo menos " + TAMANHO_MINIMO_BUSCA + " caracteres para buscar.";
            return false;
        }
        
        if (valor.length() > TAMANHO_MAXIMO_BUSCA) {
            erroBusca = "A busca pode ter no máximo " + TAMANHO_MAXIMO_BUSCA + " caracteres.";
            return false;
        }
        
        limparErroBusca();
        return true;
    }
    
    private void limparErroBusca() {
        erroBusca = "";
    }
    
    private void definirStatusFormulario(String mensagem, String tipo) {
        statusFormulario = mensagem;
        
        if ("erro".equals(tipo)) {
            statusFormulario = "[ERRO] " + mensagem;
        } else {
            statusFormulario = "[SUCESSO] " + mensagem;
        }
    }
    
    public boolean validarFormulario() {
        boolean buscaValida = validarBusca();
        
        if (!buscaValida) {
            definirStatusFormulario(
                "Corrija os campos destacados antes de aplicar os filtros.",
                "erro"
            );
            formularioValido = false;
            return false;
        }
        
        String filtrosEscolhidos = montarFiltros();
        definirStatusFormulario(
            "Filtros válidos. Serão buscados por: " + filtrosEscolhidos,
            "sucesso"
        );
        
        formularioValido = true;
        return true;
    }
    
    private String montarFiltros() {
        StringBuilder sb = new StringBuilder();
        
        sb.append("status: ").append(status != null && !status.isEmpty() ? status : "todos");
        sb.append(", prioridade: ").append(prioridade != null && !prioridade.isEmpty() ? prioridade : "todas");
        sb.append(", tipo: ").append(tipo != null && !tipo.isEmpty() ? tipo : "todos");
        sb.append(", responsável: ").append(responsavel != null && !responsavel.isEmpty() ? responsavel : "todos");
        sb.append(", projeto: ").append(projeto != null && !projeto.isEmpty() ? projeto : "todos");
        
        return sb.toString();
    }
    
    public Map<String, String> obterFiltros() {
        Map<String, String> filtros = new HashMap<>();
        
        if (validarFormulario()) {
            filtros.put("busca", busca != null ? busca.trim() : "");
            filtros.put("status", status != null ? status : "");
            filtros.put("prioridade", prioridade != null ? prioridade : "");
            filtros.put("tipo", tipo != null ? tipo : "");
            filtros.put("responsavel", responsavel != null ? responsavel : "");
            filtros.put("projeto", projeto != null ? projeto : "");
        }
        
        return filtros;
    }
    
    public void limparFiltros() {
        busca = "";
        status = "";
        prioridade = "";
        tipo = "";
        responsavel = "";
        projeto = "";
        erroBusca = "";
        statusFormulario = "";
        formularioValido = false;
    }
    
    public String getErroBusca() {
        return erroBusca;
    }
    
    public String getStatusFormulario() {
        return statusFormulario;
    }
    
    public boolean isFormularioValido() {
        return formularioValido;
    }
    
    public String getBusca() {
        return busca;
    }
    
    public String getStatus() {
        return status;
    }
    
    public String getPrioridade() {
        return prioridade;
    }
    
    public String getTipo() {
        return tipo;
    }
    
    public String getResponsavel() {
        return responsavel;
    }
    
    public String getProjeto() {
        return projeto;
    }
    
    public void setBusca(String busca) {
        this.busca = busca;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public void setPrioridade(String prioridade) {
        this.prioridade = prioridade;
    }
    
    public void setTipo(String tipo) {
        this.tipo = tipo;
    }
    
    public void setResponsavel(String responsavel) {
        this.responsavel = responsavel;
    }
    
    public void setProjeto(String projeto) {
        this.projeto = projeto;
    }
    
    public static void main(String[] args) {
        ValidadorFiltrosDemanda validador = new ValidadorFiltrosDemanda(
            "tarefa",
            "aberta",
            "alta",
            "bug",
            "João",
            "Jarvis"
        );
        
        if (validador.validarFormulario()) {
            System.out.println(validador.getStatusFormulario());
            System.out.println("Filtros: " + validador.obterFiltros());
        }
        
        ValidadorFiltrosDemanda validador2 = new ValidadorFiltrosDemanda(
            "x",
            "",
            "",
            "",
            "",
            ""
        );
        
        if (!validador2.validarFormulario()) {
            System.out.println(validador2.getStatusFormulario());
            System.out.println("Erro na busca: " + validador2.getErroBusca());
        }
    }
}

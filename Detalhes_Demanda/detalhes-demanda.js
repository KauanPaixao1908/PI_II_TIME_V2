// Autor: Kauan Paixão
// Validação dos dados exibidos na tela de Detalhes da Demanda.


window.addEventListener("DOMContentLoaded", function () {
    var titulo = document.getElementById("titulo-demanda");
    var descricao = document.querySelector("#cabecalho-pagina + .box .secao-detalhes p");
    var informacoes = document.querySelectorAll(".item-informacao");
    var faixaAzul = document.querySelector(".faixa-azul");
    var areaCabecalho = document.getElementById("cabecalho-pagina");

    var tiposPermitidos = [
        "Tarefa",
        "Defeito",
        "Melhoria",
        "Documentação"
    ];

    var prioridadesPermitidas = [
        "Crítica",
        "Alta",
        "Média",
        "Baixa"
    ];

    var statusPermitidos = [
        "Aberta",
        "Em andamento",
        "Em revisão",
        "Concluída",
        "Cancelada"
    ];

    function textoDoItem(rotulo) {
        var itens = document.querySelectorAll(".item-informacao");
        var i;

        for (i = 0; i < itens.length; i++) {
            var textoRotulo = itens[i].querySelector(".rotulo");

            if (textoRotulo && textoRotulo.textContent.trim() === rotulo) {
                return itens[i].textContent.replace(textoRotulo.textContent, "").trim();
            }
        }

        return "";
    }

    function criarResultado() {
        var resultadoExistente = document.getElementById("resultado-validacao-demanda");

        if (resultadoExistente) {
            resultadoExistente.remove();
        }

        var resultado = document.createElement("div");
        resultado.id = "resultado-validacao-demanda";
        resultado.style.marginTop = "20px";
        resultado.style.padding = "14px 16px";
        resultado.style.border = "1px solid #dee2e6";
        resultado.style.borderRadius = "8px";
        resultado.style.fontSize = "0.95rem";

        areaCabecalho.insertAdjacentElement("afterend", resultado);

        return resultado;
    }

    function validarData(dataTexto) {
        var partes = dataTexto.split("/");

        if (partes.length !== 3) {
            return false;
        }

        var dia = Number(partes[0]);
        var mes = Number(partes[1]);
        var ano = Number(partes[2]);
        var data = new Date(ano, mes - 1, dia);

        return data.getFullYear() === ano &&
            data.getMonth() === mes - 1 &&
            data.getDate() === dia;
    }

    function validarDetalhes() {
        var erros = [];
        var tipo = textoDoItem("Tipo");
        var prioridade = textoDoItem("Prioridade");
        var status = textoDoItem("Status");
        var projeto = textoDoItem("Projeto");
        var responsavel = textoDoItem("Responsável");
        var dataCriacao = textoDoItem("Data de criação");
        var prazo = textoDoItem("Prazo de finalização");

        // Campos básicos da demanda previstos no escopo.
        if (!titulo || titulo.textContent.trim() === "") {
            erros.push("O título da demanda não está preenchido.");
        }

        if (!descricao || descricao.textContent.trim() === "") {
            erros.push("A descrição da demanda não está preenchida.");
        }

        // O responsável pode ficar em branco no momento da criação, conforme o escopo.
        if (tipo === "" || tiposPermitidos.indexOf(tipo) === -1) {
            erros.push("O tipo da demanda deve ser Tarefa, Defeito, Melhoria ou Documentação.");
        }

        if (prioridade === "" || prioridadesPermitidas.indexOf(prioridade) === -1) {
            erros.push("A prioridade deve ser Crítica, Alta, Média ou Baixa.");
        }

        if (status === "" || statusPermitidos.indexOf(status) === -1) {
            erros.push("O status informado não pertence aos status previstos no escopo.");
        }

        if (projeto === "") {
            erros.push("O projeto associado deve estar informado.");
        }

        if (dataCriacao === "" || !validarData(dataCriacao)) {
            erros.push("A data de criação deve estar em formato DD/MM/AAAA e representar uma data válida.");
        }

        if (prazo === "" || !validarData(prazo)) {
            erros.push("O prazo de finalização deve estar em formato DD/MM/AAAA e representar uma data válida.");
        }

        if (validarData(dataCriacao) && validarData(prazo)) {
            var partesCriacao = dataCriacao.split("/");
            var partesPrazo = prazo.split("/");

            var dataInicial = new Date(
                Number(partesCriacao[2]),
                Number(partesCriacao[1]) - 1,
                Number(partesCriacao[0])
            );

            var dataFinal = new Date(
                Number(partesPrazo[2]),
                Number(partesPrazo[1]) - 1,
                Number(partesPrazo[0])
            );

            if (dataFinal < dataInicial) {
                erros.push("O prazo de finalização não pode ser anterior à data de criação.");
            }
        }

        return erros;
    }

    function mostrarResultado(erros) {
        var resultado = criarResultado();

        if (erros.length === 0) {
            resultado.textContent = "Validação concluída: os dados obrigatórios exibidos estão consistentes com as regras básicas do escopo.";
            resultado.style.backgroundColor = "#d1e7dd";
            resultado.style.borderColor = "#a3cfbb";
            resultado.style.color = "#0f5132";
            return;
        }

        resultado.textContent = "Há dados que precisam ser verificados: " + erros.join(" ");
        resultado.style.backgroundColor = "#f8d7da";
        resultado.style.borderColor = "#f1aeb5";
        resultado.style.color = "#842029";
    }

    function configurarSair() {
        var links = document.querySelectorAll("#navegacao-principal a");
        var i;

        for (i = 0; i < links.length; i++) {
            if (links[i].textContent.trim() === "Sair") {
                links[i].addEventListener("click", function (evento) {
                    var confirmar = window.confirm("Deseja realmente sair do sistema?");

                    if (!confirmar) {
                        evento.preventDefault();
                    }
                });
            }
        }
    }

    // Evita aviso caso a página seja alterada no futuro e os elementos ainda não existam.
    if (faixaAzul && informacoes.length > 0) {
        mostrarResultado(validarDetalhes());
    }

    configurarSair();
});

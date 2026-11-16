// Autor: Miguel Bueno
// Ligação com a API: Kauan Paixão
// Dashboard: busca os números em GET /api/dashboard (calculados no MySQL)
// e monta os indicadores, as barras e as tabelas. Nenhum número é fixo.
// O token do login vai no cabeçalho Authorization; o servidor aplica o perfil
// (Administrador vê tudo; Líder e Membro só os projetos vinculados).

// Tela de login (para onde volta quem não está logado ou clica em Sair)
var TELA_LOGIN = "../index.html";

class Dashboard {
    constructor(token) {
        this.token = token;
        this.dados = null;
        this.filtrosCarregados = false;
    }

    // Busca os números na API com os filtros escolhidos.
    async carregar(filtros) {
        var parametros = new URLSearchParams(filtros).toString();
        var resposta = await fetch("/api/dashboard" + (parametros ? "?" + parametros : ""), {
            headers: { "Authorization": "Bearer " + this.token }
        });

        // Token vencido ou inválido: limpa a sessão e volta para o login.
        if (resposta.status === 401) {
            sessionStorage.clear();
            window.location.href = TELA_LOGIN;
            throw new Error("Sessão expirada");
        }

        var dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.mensagem);
        }

        this.dados = dados;
        return dados;
    }

    // Monta a tela inteira com os dados recebidos.
    renderizar() {
        var d = this.dados;

        if (!this.filtrosCarregados) {
            preencherSelect("projeto", d.filtros.projetos);
            preencherSelect("responsavel", d.filtros.responsaveis);
            this.filtrosCarregados = true;
        }

        this.renderizarIndicadores(d);
        renderizarBarras("lista-status", d.porStatus, d.total, true);
        renderizarBarras("lista-prioridade", d.porPrioridade, d.total, true);
        renderizarBarras("lista-tipo", d.porTipo, d.total, false);
        this.renderizarCarga(d.cargaPorResponsavel);
        this.renderizarPrazos(d.prazosProximos);
    }

    renderizarIndicadores(d) {
        // Procura a quantidade de um status na lista porStatus.
        function qtd(status) {
            var item = d.porStatus.find(function (s) { return s.nome === status; });
            return item ? item.quantidade : 0;
        }

        var notaTotal = d.canceladas > 0
            ? "Inclui " + d.canceladas + (d.canceladas === 1 ? " cancelada" : " canceladas")
            : "Demandas que você pode ver";

        var cartoes = [
            ["Total", "neutra", d.total, notaTotal],
            ["Abertas", "aberta", qtd("Aberta"), percentual(qtd("Aberta"), d.total)],
            ["Em andamento", "andamento", qtd("Em andamento"), percentual(qtd("Em andamento"), d.total)],
            ["Em revisão", "revisao", qtd("Em revisão"), percentual(qtd("Em revisão"), d.total)],
            ["Concluídas", "concluida", qtd("Concluída"), percentual(qtd("Concluída"), d.total)],
            ["Críticas abertas", "critica", d.criticasAbertas, "Prioridade crítica sem conclusão"],
            ["Atrasadas", "alta", d.atrasadas, "Prazo vencido e sem conclusão"]
        ];

        var grade = document.getElementById("grade-indicadores");
        grade.innerHTML = "";

        cartoes.forEach(function (c) {
            var cartao = document.createElement("article");
            cartao.className = "cartao-indicador";
            cartao.appendChild(criarElemento("span", "etiqueta " + c[1], c[0]));
            cartao.appendChild(criarElemento("strong", "numero-indicador", String(c[2])));
            cartao.appendChild(criarElemento("span", "nota-indicador", c[3]));
            grade.appendChild(cartao);
        });
    }

    renderizarCarga(linhas) {
        var corpo = document.getElementById("tbody-carga");
        corpo.innerHTML = "";

        if (linhas.length === 0) {
            corpo.appendChild(linhaVazia(6, "Nenhuma demanda encontrada."));
            return;
        }

        linhas.forEach(function (l) {
            var tr = document.createElement("tr");
            var nome = criarElemento("th", "", l.nome);
            nome.scope = "row";
            tr.appendChild(nome);
            tr.appendChild(criarElemento("td", "", String(l.abertas)));
            tr.appendChild(criarElemento("td", "", String(l.emAndamento)));
            tr.appendChild(criarElemento("td", "", String(l.emRevisao)));
            tr.appendChild(criarElemento("td", "", String(l.concluidas)));
            tr.appendChild(criarElemento("td", "celula-total", String(l.total)));
            corpo.appendChild(tr);
        });
    }

    renderizarPrazos(linhas) {
        var corpo = document.getElementById("tbody-prazos");
        corpo.innerHTML = "";

        if (linhas.length === 0) {
            corpo.appendChild(linhaVazia(7, "Nenhuma demanda em aberto com prazo definido."));
            return;
        }

        linhas.forEach(function (l) {
            var tr = document.createElement("tr");

            // O título leva para a tela de Detalhes da demanda.
            var tdTitulo = criarElemento("td", "titulo-demanda", "");
            var link = criarElemento("a", "", l.titulo);
            link.href = "detalhes-demanda.html?id=" + l.id;
            tdTitulo.appendChild(link);
            tr.appendChild(tdTitulo);

            tr.appendChild(criarElemento("td", "", l.tipo));
            tr.appendChild(celulaEtiqueta(l.prioridade, classeEtiqueta(l.prioridade)));
            tr.appendChild(celulaEtiqueta(l.status, classeEtiqueta(l.status)));
            tr.appendChild(criarElemento("td", "", l.responsavelNome || "Sem responsável"));
            tr.appendChild(criarElemento("td", "data", formatarData(l.prazo)));

            var situacao = textoSituacao(l.diasRestantes);
            tr.appendChild(celulaEtiqueta(situacao.texto, situacao.classe));

            corpo.appendChild(tr);
        });
    }
}

// ----------------------------------------------------------------------
// Funções de apoio
// ----------------------------------------------------------------------

// Cria um elemento com classe e texto (textContent: o texto nunca vira HTML).
function criarElemento(tag, classe, texto) {
    var elemento = document.createElement(tag);
    if (classe) {
        elemento.className = classe;
    }
    elemento.textContent = texto;
    return elemento;
}

function celulaEtiqueta(texto, classe) {
    var td = document.createElement("td");
    td.appendChild(criarElemento("span", "etiqueta " + classe, texto));
    return td;
}

function linhaVazia(colunas, texto) {
    var tr = document.createElement("tr");
    var td = criarElemento("td", "", texto);
    td.colSpan = colunas;
    tr.appendChild(td);
    return tr;
}

// "Em andamento" -> "andamento", "Crítica" -> "critica", "Em revisão" -> "revisao"
function classeEtiqueta(texto) {
    return String(texto)
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/^em /, "")
        .replace(/\s+/g, "-");
}

// 9 de 24 -> "37,5% do total"
function percentual(quantidade, total) {
    var valor = total > 0 ? (quantidade / total) * 100 : 0;
    return valor.toFixed(1).replace(".", ",") + "% do total";
}

// "2026-11-20" -> "20/11/2026"
function formatarData(texto) {
    if (!texto) {
        return "";
    }
    var partes = String(texto).substring(0, 10).split("-");
    return partes[2] + "/" + partes[1] + "/" + partes[0];
}

// Texto e cor da coluna Situação a partir dos dias até o prazo.
function textoSituacao(dias) {
    if (dias < 0) {
        var atraso = -dias;
        return { texto: "Atrasada há " + atraso + (atraso === 1 ? " dia" : " dias"), classe: "alta" };
    }
    if (dias === 0) {
        return { texto: "Vence hoje", classe: "media" };
    }
    return { texto: "Faltam " + dias + (dias === 1 ? " dia" : " dias"), classe: "neutra" };
}

// Monta uma lista de barras. A maior barra fica cheia e as outras são
// proporcionais a ela. comCor = usa a cor do status/prioridade.
function renderizarBarras(idLista, itens, total, comCor) {
    var lista = document.getElementById(idLista);
    lista.innerHTML = "";

    var maior = 0;
    itens.forEach(function (i) {
        if (i.quantidade > maior) {
            maior = i.quantidade;
        }
    });

    itens.forEach(function (i) {
        var li = criarElemento("li", "linha-barra", "");

        var topo = criarElemento("div", "topo-barra", "");
        topo.appendChild(criarElemento("span", "rotulo-barra", i.nome));
        var texto = i.quantidade + (i.quantidade === 1 ? " demanda" : " demandas") +
            " · " + percentual(i.quantidade, total).replace(" do total", "");
        topo.appendChild(criarElemento("span", "valor-barra", texto));

        var trilha = criarElemento("div", "trilha-barra", "");
        trilha.setAttribute("aria-hidden", "true");
        var preenchimento = criarElemento("div",
            "preenchimento-barra" + (comCor ? " barra-" + classeEtiqueta(i.nome) : ""), "");
        preenchimento.style.width = (maior > 0 ? (i.quantidade / maior) * 100 : 0) + "%";
        trilha.appendChild(preenchimento);

        li.appendChild(topo);
        li.appendChild(trilha);
        lista.appendChild(li);
    });
}

// Coloca as opções vindas da API num <select>, mantendo as opções fixas
// ("Todos", "Sem responsável").
function preencherSelect(idSelect, opcoes) {
    var select = document.getElementById(idSelect);
    opcoes.forEach(function (o) {
        var opcao = document.createElement("option");
        opcao.value = o.id;
        opcao.textContent = o.nome;
        select.appendChild(opcao);
    });
}

// ----------------------------------------------------------------------
// Início da tela
// ----------------------------------------------------------------------

window.addEventListener("DOMContentLoaded", function () {
    var token = sessionStorage.getItem("token");
    var usuario = JSON.parse(sessionStorage.getItem("usuarioLogado") || "null");

    // Sem login: volta para a tela de login.
    if (!token || !usuario) {
        window.location.href = TELA_LOGIN;
        return;
    }

    // O Membro da Equipe não cadastra demandas, então o botão some para ele
    // (quem bloqueia de verdade é o servidor, com 403).
    document.getElementById("botao-nova-demanda").hidden = usuario.perfil === "Membro da Equipe";

    var dashboard = new Dashboard(token);
    var formulario = document.getElementById("form-filtros");
    var aviso = document.getElementById("ajuda-filtros");

    function lerFiltros() {
        return {
            projeto: document.getElementById("projeto").value,
            periodo: document.getElementById("periodo").value,
            responsavel: document.getElementById("responsavel").value
        };
    }

    async function atualizar() {
        aviso.textContent = "Carregando dados...";
        aviso.style.color = "";

        try {
            await dashboard.carregar(lerFiltros());
            dashboard.renderizar();
            aviso.textContent = "Números calculados a partir das demandas cadastradas no sistema.";
        } catch (erro) {
            if (erro.message === "Sessão expirada") {
                return;
            }
            aviso.textContent = erro instanceof TypeError
                ? "Não foi possível conectar ao servidor. Verifique se a API está rodando."
                : erro.message;
            aviso.style.color = "#842029";
        }
    }

    formulario.addEventListener("submit", function (evento) {
        evento.preventDefault();
        atualizar();
    });

    // "Limpar filtros": espera o formulário voltar ao padrão e recarrega.
    formulario.addEventListener("reset", function () {
        setTimeout(atualizar, 0);
    });

    // Sair: confirma, apaga a sessão e volta para o login.
    document.getElementById("link-sair").addEventListener("click", function (evento) {
        if (!window.confirm("Deseja realmente sair do sistema?")) {
            evento.preventDefault();
            return;
        }
        sessionStorage.clear();
    });

    atualizar();
});

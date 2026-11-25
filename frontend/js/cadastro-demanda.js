// Autor: Leonardo Miziara
// Tela de Cadastro e Edição de Demanda (cards #14, #29 e #24).
// Usa o mesmo formulário para os dois modos:
//   cadastro-demanda.html        -> modo cadastro  (POST /api/demandas)
//   cadastro-demanda.html?id=3   -> modo edição    (GET /api/demandas/3 e PUT /api/demandas/3)
// Rotas usadas (todas com o token no cabeçalho Authorization):
//   GET  /api/demandas/filtros               projetos e responsáveis dos <select>
//   GET  /api/demandas/:id                   dados da demanda (modo edição)
//   POST /api/demandas  e  PUT /api/demandas/:id
//   GET  /api/feriados/verificar?data=...    aviso de feriado ao escolher o prazo
// O servidor é a validação oficial; aqui só há conferências simples para ajudar o usuário.

// Tela de login (para onde volta quem não está logado ou clica em Sair)
var TELA_LOGIN = "../index.html";

window.addEventListener("DOMContentLoaded", function () {
    var token = sessionStorage.getItem("token");
    var usuario = JSON.parse(sessionStorage.getItem("usuarioLogado") || "null");

    // Sem login: volta para a tela de login.
    if (!token || !usuario) {
        window.location.href = TELA_LOGIN;
        return;
    }

    // Membro da Equipe não cadastra nem edita (o servidor também bloqueia com 403).
    if (usuario.perfil === "Membro da Equipe") {
        window.location.href = "listagemdemanda.html";
        return;
    }

    var formulario = document.getElementById("formulario-demanda");
    var campoTitulo = document.getElementById("titulo");
    var campoDescricao = document.getElementById("descricao");
    var campoTipo = document.getElementById("tipo");
    var campoPrioridade = document.getElementById("prioridade");
    var campoProjeto = document.getElementById("projeto");
    var campoResponsavel = document.getElementById("responsavel");
    var campoPrazo = document.getElementById("prazo");
    var erroPrazo = document.getElementById("erro-prazo");
    var mensagem = document.getElementById("mensagem-formulario");
    var botaoEnviar = document.getElementById("botao-enviar");

    // Lê o ?id= da URL: se existir, a tela está em modo edição.
    var id = new URLSearchParams(window.location.search).get("id");
    var modoEdicao = id !== null;

    // ------------------------------------------------------------------
    // Funções de apoio
    // ------------------------------------------------------------------

    // Chama a API já mandando o token. Se o token venceu (401), limpa a
    // sessão e volta para o login.
    async function chamarApi(caminho, opcoes) {
        opcoes = opcoes || {};
        opcoes.headers = {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        };

        var resposta = await fetch("/api" + caminho, opcoes);

        if (resposta.status === 401) {
            sessionStorage.clear();
            window.location.href = TELA_LOGIN;
            throw new Error("Sessão expirada");
        }

        var dados = await resposta.json();
        return { ok: resposta.ok, dados: dados };
    }

    // Mostra uma mensagem (tipo "erro" ou "sucesso") com uma lista opcional de itens.
    function mostrarMensagem(texto, tipo, itens) {
        mensagem.innerHTML = "";
        mensagem.className = tipo;
        mensagem.hidden = false;

        var titulo = document.createElement("strong");
        titulo.textContent = texto;
        mensagem.appendChild(titulo);

        if (itens && itens.length > 0) {
            var lista = document.createElement("ul");
            for (var i = 0; i < itens.length; i++) {
                var li = document.createElement("li");
                li.textContent = itens[i]; // textContent: o texto nunca vira HTML
                lista.appendChild(li);
            }
            mensagem.appendChild(lista);
        }
    }

    function limparMensagens() {
        mensagem.hidden = true;
        mensagem.innerHTML = "";
        erroPrazo.hidden = true;
        erroPrazo.textContent = "";
    }

    // Preenche um <select> com {id, nome}, mantendo a primeira opção (vazia).
    function preencherSelect(select, itens) {
        for (var i = 0; i < itens.length; i++) {
            var item = itens[i];
            var opcao = document.createElement("option");
            opcao.value = item.id;
            opcao.textContent = item.nome;
            select.appendChild(opcao);
        }
    }

    // "2026-12-10 00:00:00" -> "2026-12-10" (valor aceito pelo <input type="date">)
    function soData(texto) {
        return texto ? String(texto).substring(0, 10) : "";
    }

    // ------------------------------------------------------------------
    // Carregar a tela
    // ------------------------------------------------------------------

    async function iniciar() {
        try {
            // Projetos e responsáveis que o usuário pode usar.
            var filtros = await chamarApi("/demandas/filtros");
            if (!filtros.ok) {
                mostrarMensagem("Não foi possível carregar projetos e responsáveis.", "erro");
                return;
            }
            preencherSelect(campoProjeto, filtros.dados.projetos);
            preencherSelect(campoResponsavel, filtros.dados.responsaveis);

            if (modoEdicao) {
                await prepararEdicao();
            }
        } catch (erro) {
            if (erro.message !== "Sessão expirada") {
                mostrarMensagem("Não foi possível conectar ao servidor. Verifique se a API está rodando.", "erro");
            }
        }
    }

    // Modo edição: troca os textos, busca a demanda e preenche o formulário.
    async function prepararEdicao() {
        document.title = "Edição de Demanda - Projeto Integrador";
        document.getElementById("titulo-pagina").textContent = "Edição de Demanda";
        document.getElementById("descricao-pagina").textContent = "Altere os campos desejados e salve.";
        botaoEnviar.textContent = "Salvar alterações";

        var resposta = await chamarApi("/demandas/" + encodeURIComponent(id));
        if (!resposta.ok) {
            mostrarMensagem(resposta.dados.mensagem, "erro");
            botaoEnviar.disabled = true;
            return;
        }

        var d = resposta.dados;

        // Demandas finalizadas não podem ser editadas (o servidor também recusa).
        if (d.status === "Concluída" || d.status === "Cancelada") {
            mostrarMensagem("Demandas " + d.status.toLowerCase() + "s não podem ser editadas.", "erro");
            botaoEnviar.disabled = true;
        }

        campoTitulo.value = d.titulo;
        campoDescricao.value = d.descricao;
        campoTipo.value = d.tipo;
        campoPrioridade.value = d.prioridade;
        campoProjeto.value = d.projetoId;
        campoProjeto.disabled = true; // o projeto da demanda não muda
        campoResponsavel.value = d.responsavelId || "";
        campoPrazo.value = soData(d.prazo);

        // Cancelar volta para os detalhes da demanda.
        var cancelar = document.querySelector("#acoes-formulario a");
        cancelar.href = "detalhes-demanda.html?id=" + encodeURIComponent(id);
    }

    // ------------------------------------------------------------------
    // Aviso de feriado ao escolher o prazo
    // ------------------------------------------------------------------

    campoPrazo.addEventListener("change", async function () {
        erroPrazo.hidden = true;
        erroPrazo.textContent = "";

        if (campoPrazo.value === "") {
            return;
        }

        try {
            var resposta = await chamarApi("/feriados/verificar?data=" + encodeURIComponent(campoPrazo.value));
            if (resposta.ok && resposta.dados.feriado) {
                erroPrazo.textContent = "O prazo não pode ser um feriado nacional (" + resposta.dados.nome + ").";
                erroPrazo.hidden = false;
            }
        } catch (erro) {
            // Se a conferência falhar, o servidor confere de novo no envio.
        }
    });

    // ------------------------------------------------------------------
    // Enviar o formulário
    // ------------------------------------------------------------------

    formulario.addEventListener("submit", async function (evento) {
        evento.preventDefault();
        limparMensagens();

        var titulo = campoTitulo.value.trim();
        var descricao = campoDescricao.value.trim();

        // Conferências simples no navegador (a oficial é a do servidor).
        var erros = [];
        if (titulo === "" || titulo.length > 150) {
            erros.push("O título é obrigatório (até 150 caracteres).");
        }
        if (descricao === "") {
            erros.push("A descrição é obrigatória.");
        }
        if (erros.length > 0) {
            mostrarMensagem("Corrija os campos abaixo:", "erro", erros);
            return;
        }

        var corpo = {
            titulo: titulo,
            descricao: descricao,
            tipo: campoTipo.value,
            prioridade: campoPrioridade.value,
            responsavelId: campoResponsavel.value === "" ? null : Number(campoResponsavel.value),
            prazo: campoPrazo.value === "" ? null : campoPrazo.value
        };

        var caminho = "/demandas";
        var metodo = "POST";
        if (modoEdicao) {
            caminho = "/demandas/" + encodeURIComponent(id);
            metodo = "PUT";
        } else {
            corpo.projetoId = Number(campoProjeto.value);
        }

        botaoEnviar.disabled = true;

        try {
            var resposta = await chamarApi(caminho, { method: metodo, body: JSON.stringify(corpo) });

            if (!resposta.ok) {
                // A mensagem de feriado/prazo aparece junto do campo prazo;
                // as demais ficam na lista geral.
                var outros = [];
                var errosServidor = resposta.dados.erros || [];
                for (var i = 0; i < errosServidor.length; i++) {
                    var texto = errosServidor[i];
                    if (texto.indexOf("prazo") !== -1 || texto.indexOf("Prazo") !== -1) {
                        erroPrazo.textContent = texto;
                        erroPrazo.hidden = false;
                    } else {
                        outros.push(texto);
                    }
                }
                if (outros.length > 0 || erroPrazo.hidden) {
                    mostrarMensagem(resposta.dados.mensagem, "erro", outros);
                }
                botaoEnviar.disabled = false;
                return;
            }

            // Sucesso: cadastro volta para a listagem; edição volta para os detalhes.
            mostrarMensagem(resposta.dados.mensagem, "sucesso");
            window.setTimeout(function () {
                if (modoEdicao) {
                    window.location.href = "detalhes-demanda.html?id=" + encodeURIComponent(id);
                } else {
                    window.location.href = "listagemdemanda.html";
                }
            }, 800);
        } catch (erro) {
            if (erro.message !== "Sessão expirada") {
                mostrarMensagem("Não foi possível conectar ao servidor.", "erro");
            }
            botaoEnviar.disabled = false;
        }
    });

    // ------------------------------------------------------------------
    // Sair: confirma, apaga a sessão e volta para o login
    // ------------------------------------------------------------------

    document.getElementById("link-sair").addEventListener("click", function (evento) {
        if (!window.confirm("Deseja realmente sair do sistema?")) {
            evento.preventDefault();
            return;
        }
        sessionStorage.clear();
    });

    iniciar();
});

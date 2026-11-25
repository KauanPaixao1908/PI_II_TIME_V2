// Autor original: Kauan Paixão
// Integração do cancelamento e simplificações: Leonardo Miziara
// Tela de Detalhes da Demanda: busca a demanda, os comentários e o histórico na API
// (que lê do MySQL) e permite comentar.
// Rotas usadas (todas com o token no cabeçalho Authorization):
//   GET  /api/demandas/:id
//   GET  /api/demandas/:id/comentarios
//   POST /api/demandas/:id/comentarios
//   GET  /api/demandas/:id/historico

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

    var aviso = document.getElementById("aviso-detalhes");
    var boxDemanda = document.getElementById("box-demanda");
    var botaoEditar = document.getElementById("botao-editar");
    var botaoCancelar = document.getElementById("botao-cancelar");
    var listaComentarios = document.getElementById("lista-comentarios");
    var listaHistorico = document.getElementById("lista-historico");
    var formComentario = document.getElementById("form-comentario");
    var textoComentario = document.getElementById("texto-comentario");
    var botaoComentar = document.getElementById("botao-comentar");
    var avisoComentario = document.getElementById("aviso-comentario");

    // Lê o ?id= da URL (ex.: detalhes-demanda.html?id=3)
    var id = new URLSearchParams(window.location.search).get("id");

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

    function mostrarAviso(texto, cor) {
        aviso.textContent = texto;
        aviso.style.color = cor || "";
        aviso.hidden = texto === "";
    }

    // "2026-11-08" ou "2026-11-08 14:30:00" -> "08/11/2026"
    function formatarData(texto) {
        if (!texto) {
            return "";
        }
        var partes = String(texto).substring(0, 10).split("-");
        return partes[2] + "/" + partes[1] + "/" + partes[0];
    }

    // "2026-11-08 14:30:00" -> "08/11/2026 às 14:30"
    function formatarDataHora(texto) {
        if (!texto) {
            return "";
        }
        var hora = String(texto).substring(11, 16);
        return formatarData(texto) + (hora ? " às " + hora : "");
    }

    // Classe CSS da etiqueta a partir do texto:
    // "Em andamento" -> "andamento", "Crítica" -> "critica", "Em revisão" -> "revisao"
    function classeEtiqueta(texto) {
        if (texto === "Em andamento") {
            return "andamento";
        }
        if (texto === "Em revisão") {
            return "revisao";
        }
        if (texto === "Concluída") {
            return "concluida";
        }
        if (texto === "Crítica") {
            return "critica";
        }
        if (texto === "Média") {
            return "media";
        }
        if (texto === "Documentação") {
            return "documentacao";
        }
        return String(texto).toLowerCase();
    }

    function preencherEtiqueta(elemento, texto) {
        elemento.textContent = texto;
        elemento.className = "etiqueta " + classeEtiqueta(texto);
    }

    // Monta um item da lista (comentário ou histórico).
    // Usa textContent para o texto digitado nunca virar HTML.
    function criarItem(nome, dataHora, texto) {
        var item = document.createElement("li");

        var topo = document.createElement("div");
        topo.className = "registro-topo";
        var autor = document.createElement("strong");
        autor.textContent = nome;
        topo.appendChild(autor);
        topo.appendChild(document.createTextNode(" · " + formatarDataHora(dataHora)));

        var corpo = document.createElement("div");
        corpo.textContent = texto;

        item.appendChild(topo);
        item.appendChild(corpo);
        return item;
    }

    function mostrarListaVazia(lista, texto) {
        lista.innerHTML = "";
        var item = document.createElement("li");
        item.className = "lista-vazia";
        item.textContent = texto;
        lista.appendChild(item);
    }

    // ------------------------------------------------------------------
    // Preenche a tela
    // ------------------------------------------------------------------

    function mostrarDemanda(demanda) {
        document.title = demanda.titulo + " - Projeto Integrador";
        document.getElementById("titulo-demanda").textContent = demanda.titulo;
        var codigo = String(demanda.id);
        while (codigo.length < 3) {
            codigo = "0" + codigo;
        }
        document.getElementById("codigo-demanda").textContent = "Demanda #" + codigo;
        document.getElementById("descricao-demanda").textContent = demanda.descricao;

        preencherEtiqueta(document.getElementById("etiqueta-status-topo"), demanda.status);
        preencherEtiqueta(document.getElementById("info-status"), demanda.status);
        preencherEtiqueta(document.getElementById("info-prioridade"), demanda.prioridade);

        document.getElementById("info-tipo").textContent = demanda.tipo;
        document.getElementById("info-projeto").textContent = demanda.projetoNome;
        document.getElementById("info-responsavel").textContent =
            demanda.responsavelNome || "Sem responsável";
        document.getElementById("info-criacao").textContent = formatarData(demanda.criadaEm);
        document.getElementById("info-atualizacao").textContent = formatarDataHora(demanda.atualizadaEm);
        document.getElementById("info-prazo").textContent =
            demanda.prazo ? formatarData(demanda.prazo) : "Sem prazo definido";

        // O botão Editar leva o ?id= para a tela de cadastro (modo edição).
        // O Membro da Equipe não edita, então o botão fica escondido para ele
        // (quem bloqueia de verdade é o servidor, com 403).
        botaoEditar.href = "cadastro-demanda.html?id=" + demanda.id;
        // Editar e cancelar: só para Administrador e Líder, e só enquanto a demanda
        // não estiver Concluída nem Cancelada.
        var podeGerenciar = usuario.perfil !== "Membro da Equipe";
        var emAberto = demanda.status !== "Concluída" && demanda.status !== "Cancelada";
        botaoEditar.hidden = !(podeGerenciar && emAberto);
        botaoCancelar.hidden = !(podeGerenciar && emAberto);
    }

    function mostrarComentarios(comentarios) {
        if (comentarios.length === 0) {
            mostrarListaVazia(listaComentarios, "Nenhum comentário ainda.");
            return;
        }

        listaComentarios.innerHTML = "";
        for (var i = 0; i < comentarios.length; i++) {
            var comentario = comentarios[i];
            listaComentarios.appendChild(criarItem(comentario.autorNome, comentario.criadoEm, comentario.texto));
        }
    }

    function mostrarHistorico(registros) {
        if (registros.length === 0) {
            mostrarListaVazia(listaHistorico, "Nenhuma alteração registrada.");
            return;
        }

        listaHistorico.innerHTML = "";
        for (var i = 0; i < registros.length; i++) {
            var registro = registros[i];
            listaHistorico.appendChild(criarItem(registro.usuarioNome, registro.criadoEm, registro.descricao));
        }
    }

    // Busca tudo na API ao abrir a tela.
    async function carregarTela() {
        if (!id) {
            mostrarAviso("Nenhuma demanda informada. Abra os detalhes pela listagem de demandas.", "#842029");
            return;
        }

        try {
            // Primeiro busca a demanda, depois os comentários e o histórico.
            var demanda = await chamarApi("/demandas/" + encodeURIComponent(id));
            var respostaComentarios = await chamarApi("/demandas/" + encodeURIComponent(id) + "/comentarios");
            var respostaHistorico = await chamarApi("/demandas/" + encodeURIComponent(id) + "/historico");

            // 400 (id inválido), 403 (sem acesso) ou 404 (não existe):
            // mostra a mensagem que o servidor mandou.
            if (!demanda.ok) {
                mostrarAviso(demanda.dados.mensagem, "#842029");
                return;
            }

            mostrarDemanda(demanda.dados);

            if (respostaComentarios.ok) {
                mostrarComentarios(respostaComentarios.dados);
            } else {
                mostrarComentarios([]);
            }

            if (respostaHistorico.ok) {
                mostrarHistorico(respostaHistorico.dados);
            } else {
                mostrarHistorico([]);
            }

            mostrarAviso("", "");
            boxDemanda.hidden = false;
        } catch (erro) {
            if (erro.message !== "Sessão expirada") {
                mostrarAviso("Não foi possível conectar ao servidor. Verifique se a API está rodando.", "#842029");
            }
        }
    }

    // ------------------------------------------------------------------
    // Cancelar demanda (usa o PATCH de status, que grava no histórico)
    // ------------------------------------------------------------------

    botaoCancelar.addEventListener("click", async function () {
        if (!window.confirm("Deseja realmente cancelar esta demanda? Essa ação não pode ser desfeita.")) {
            return;
        }

        botaoCancelar.disabled = true;

        try {
            var resposta = await chamarApi("/demandas/" + encodeURIComponent(id) + "/status", {
                method: "PATCH",
                body: JSON.stringify({ status: "Cancelada" })
            });

            if (!resposta.ok) {
                // A rota de status responde o erro em "erro"; as outras, em "mensagem".
                window.alert(resposta.dados.erro || resposta.dados.mensagem);
                botaoCancelar.disabled = false;
                return;
            }

            // Recarrega a tela para mostrar o novo status e o histórico.
            window.location.reload();
        } catch (erro) {
            if (erro.message !== "Sessão expirada") {
                window.alert("Não foi possível conectar ao servidor.");
            }
            botaoCancelar.disabled = false;
        }
    });

    // ------------------------------------------------------------------
    // Comentar
    // ------------------------------------------------------------------

    formComentario.addEventListener("submit", async function (evento) {
        evento.preventDefault();

        var texto = textoComentario.value.trim();

        if (texto === "") {
            avisoComentario.textContent = "Escreva o comentário antes de enviar.";
            avisoComentario.style.color = "#842029";
            return;
        }

        botaoComentar.disabled = true;
        avisoComentario.textContent = "Enviando...";
        avisoComentario.style.color = "#626970";

        try {
            var resposta = await chamarApi("/demandas/" + encodeURIComponent(id) + "/comentarios", {
                method: "POST",
                body: JSON.stringify({ texto: texto })
            });

            if (!resposta.ok) {
                avisoComentario.textContent = resposta.dados.mensagem;
                avisoComentario.style.color = "#842029";
                return;
            }

            // Tira o aviso de "nenhum comentário" e coloca o novo no fim da lista.
            var vazio = listaComentarios.querySelector(".lista-vazia");
            if (vazio) {
                vazio.remove();
            }
            var c = resposta.dados;
            listaComentarios.appendChild(criarItem(c.autorNome, c.criadoEm, c.texto));

            textoComentario.value = "";
            avisoComentario.textContent = "Comentário adicionado.";
            avisoComentario.style.color = "#146c43";
        } catch (erro) {
            if (erro.message !== "Sessão expirada") {
                avisoComentario.textContent = "Não foi possível conectar ao servidor.";
                avisoComentario.style.color = "#842029";
            }
        } finally {
            botaoComentar.disabled = false;
        }
    });

    textoComentario.addEventListener("input", function () {
        avisoComentario.textContent = "";
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

    carregarTela();
});

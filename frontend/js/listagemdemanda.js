// Autor: Bruno Mareto
//
// Tela de Listagem de Demandas.
// - Busca as demandas na API (GET /api/demandas) e monta a tabela (Documento
//   de Visão, 2.2.9: título, tipo, prioridade, status, projeto, responsável,
//   data de criação e prazo de finalização).
// - Envia à API os filtros por status, prioridade, tipo, responsável e
//   projeto, a busca textual por título ou descrição e a ordenação por
//   criação, prioridade, prazo ou status (Documento de Visão, 2.3).
// - Respeita o perfil do usuário logado (Documento de Visão, 2.1): o
//   Administrador vê todas as demandas; Líder de Projeto e Membro da Equipe
//   veem só as dos projetos vinculados; o Membro não cria demandas.
// - Valida o formulário de filtros e busca (Reunião 3).
// Filtragem, busca e ordenação são feitas pelo back-end; a tela só monta a
// URL com os parâmetros escolhidos e exibe a resposta.

document.addEventListener('DOMContentLoaded', function () {

    // ---------- 1. ELEMENTOS DA PÁGINA ----------

    const formulario = document.getElementById('form-filtros');
    const campoBusca = document.getElementById('busca');
    const erroBusca = document.getElementById('erro-busca');
    const statusFormulario = document.getElementById('status-formulario');

    const campoStatus = document.getElementById('status');
    const campoPrioridade = document.getElementById('prioridade');
    const campoTipo = document.getElementById('tipo');
    const campoResponsavel = document.getElementById('responsavel');
    const campoProjeto = document.getElementById('projeto');
    const campoOrdenacao = document.getElementById('ordenacao');

    const corpoTabela = document.getElementById('corpo-tabela');
    const contador = document.getElementById('contador-resultados');
    const semResultados = document.getElementById('sem-resultados');

    const textoUsuario = document.getElementById('usuario-logado');
    const botaoNovaDemanda = document.getElementById('botao-nova-demanda');
    const linkSair = document.getElementById('link-sair');

    // Regras de tamanho da busca textual.
    const TAMANHO_MINIMO_BUSCA = 2;
    const TAMANHO_MAXIMO_BUSCA = 60;

    // Ordenação inicial e após "Limpar filtros": mais recentes primeiro.
    const ORDENACAO_PADRAO = 'criacao-desc';

    // Classe CSS da etiqueta de cada prioridade (2.2.2) e de cada status (2.2.3).
    const CLASSE_PRIORIDADE = {
        'Crítica': 'critica',
        'Alta': 'alta',
        'Média': 'media',
        'Baixa': 'baixa',
    };

    const CLASSE_STATUS = {
        'Aberta': 'aberta',
        'Em andamento': 'andamento',
        'Em revisão': 'revisao',
        'Concluída': 'concluida',
        'Cancelada': 'cancelada',
    };


    // ---------- 2. PERFIL DO USUÁRIO (Documento de Visão, 2.1) ----------

    // Chaves combinadas com a tela de login: o login grava em sessionStorage o
    // usuário que entrou (id, nome, perfil e projetoIds, sem senha) e o token.
    const CHAVE_USUARIO = 'usuarioLogado';
    const CHAVE_TOKEN = 'token';

    // Lê o usuário guardado no navegador. Devolve null se não houver ninguém
    // logado ou se o valor guardado não for um JSON válido.
    function lerUsuarioLogado() {
        try {
            const texto = sessionStorage.getItem(CHAVE_USUARIO);
            return texto ? JSON.parse(texto) : null;
        } catch (erro) {
            return null;
        }
    }

    // Projetos vinculados ao usuário; lista vazia quando o login não os informar.
    function projetosDoUsuario(usuario) {
        return Array.isArray(usuario.projetoIds) ? usuario.projetoIds : [];
    }

    // Administrador vê todos os projetos (2.1.1); Líder (2.1.2) e Membro (2.1.3)
    // veem só as demandas dos projetos aos quais estão vinculados.
    function filtrarPorPerfil(lista, usuario) {
        if (usuario.perfil === 'Administrador') {
            return lista;
        }
        const vinculados = projetosDoUsuario(usuario);
        return lista.filter(function (demanda) {
            return demanda.projeto !== null && vinculados.includes(demanda.projeto.id);
        });
    }

    // Ajusta o cabeçalho, o botão de cadastro e o filtro de projeto ao perfil.
    function aplicarPerfilNaTela(usuario) {
        if (usuario === null) {
            textoUsuario.textContent = 'Nenhum usuário logado';
            botaoNovaDemanda.hidden = true;
            semResultados.textContent = 'Entre pelo login para ver as demandas.';
            return;
        }

        textoUsuario.textContent = usuario.nome + ' · ' + usuario.perfil;

        // O Membro da Equipe não cria demandas (2.1.3).
        botaoNovaDemanda.hidden = usuario.perfil === 'Membro da Equipe';

        // Fora o Administrador, o filtro de projeto mostra só os projetos vinculados.
        if (usuario.perfil !== 'Administrador') {
            const opcoes = Array.from(campoProjeto.options);
            for (const opcao of opcoes) {
                if (opcao.value !== '' && !projetosDoUsuario(usuario).includes(Number(opcao.value))) {
                    opcao.remove();
                }
            }
        }
    }

    const usuarioLogado = lerUsuarioLogado();


    // ---------- 3. CONVERSÃO DOS DADOS PARA A TELA ----------

    // A API devolve o projeto e o responsável como { id, nome }.
    function nomeDoProjeto(projeto) {
        return projeto ? projeto.nome : 'Projeto não encontrado';
    }

    // O responsável é opcional (2.2.5): a API devolve null quando não há.
    function nomeDoResponsavel(responsavel) {
        return responsavel ? responsavel.nome : 'Sem responsável';
    }

    // Converte "2026-10-09" ou "2026-10-09T08:30:00" para "09/10/2026".
    // O prazo é opcional (2.2.5): null vira "Sem prazo".
    function formatarData(textoIso) {
        if (textoIso === null) {
            return 'Sem prazo';
        }
        const partes = textoIso.slice(0, 10).split('-');   // ["2026", "10", "09"]
        return partes[2] + '/' + partes[1] + '/' + partes[0];
    }


    // ---------- 4. MONTAGEM DA TABELA ----------

    // Cria uma célula com texto simples e, opcionalmente, uma classe.
    function criarCelula(texto, classe) {
        const celula = document.createElement('td');
        celula.textContent = texto;
        if (classe) {
            celula.classList.add(classe);
        }
        return celula;
    }

    // Cria uma célula com a etiqueta colorida de prioridade ou de status.
    function criarEtiqueta(texto, classe) {
        const celula = document.createElement('td');
        const etiqueta = document.createElement('span');
        etiqueta.textContent = texto;
        etiqueta.classList.add('etiqueta');
        if (classe) {
            etiqueta.classList.add(classe);
        }
        celula.append(etiqueta);
        return celula;
    }

    // Apaga as linhas atuais e cria uma linha para cada demanda da lista.
    function renderizarTabela(lista) {
        corpoTabela.innerHTML = '';

        for (const demanda of lista) {
            const linha = document.createElement('tr');

            linha.append(
                criarCelula(demanda.titulo, 'titulo-demanda'),
                criarCelula(demanda.tipo),
                criarEtiqueta(demanda.prioridade, CLASSE_PRIORIDADE[demanda.prioridade]),
                criarEtiqueta(demanda.status, CLASSE_STATUS[demanda.status]),
                criarCelula(nomeDoProjeto(demanda.projeto)),
                criarCelula(nomeDoResponsavel(demanda.responsavel)),
                criarCelula(formatarData(demanda.criadaEm), 'data'),
                criarCelula(formatarData(demanda.prazo), 'data')
            );

            // Leva para a tela de Detalhes da Demanda, informando o id na URL.
            const celulaAcoes = document.createElement('td');
            const link = document.createElement('a');
            link.textContent = 'Ver detalhes';
            link.classList.add('botao-detalhes');
            link.href = 'detalhes-demanda.html?id=' + demanda.id;
            link.setAttribute('aria-label', 'Ver detalhes: ' + demanda.titulo);
            celulaAcoes.append(link);
            linha.append(celulaAcoes);

            corpoTabela.append(linha);
        }

        // Contador e mensagem de lista vazia.
        const total = lista.length;
        contador.textContent = total === 1 ? '1 demanda' : total + ' demandas';
        semResultados.hidden = total > 0;
    }


    // ---------- 5. FILTROS, BUSCA E ORDENAÇÃO NA API (2.3) ----------

    // Nome do campo de ordenação na API para cada opção do <select>.
    const CAMPO_ORDENACAO_API = {
        criacao: 'criadaEm',
        prioridade: 'prioridade',
        prazo: 'prazo',
        status: 'status',
    };

    // Lê os valores atuais do formulário. Campo vazio = sem filtro.
    function lerFiltros() {
        return {
            busca: campoBusca.value.trim(),
            status: campoStatus.value,
            prioridade: campoPrioridade.value,
            tipo: campoTipo.value,
            responsavelId: campoResponsavel.value,
            projetoId: campoProjeto.value,
        };
    }

    // Monta os parâmetros da URL, por exemplo:
    // status=Aberta&prioridade=Alta&ordenar=prazo&ordem=asc
    // Filtros vazios não são enviados.
    function montarParametros(filtros, opcaoOrdenacao) {
        const parametros = new URLSearchParams();

        for (const nome in filtros) {
            if (filtros[nome] !== '') {
                parametros.append(nome, filtros[nome]);
            }
        }

        const partes = opcaoOrdenacao.split('-');   // "prazo-asc" -> ["prazo", "asc"]
        parametros.append('ordenar', CAMPO_ORDENACAO_API[partes[0]]);
        parametros.append('ordem', partes[1]);

        return parametros;
    }

    // Busca as demandas na API e redesenha a tabela.
    // Devolve quantas demandas foram exibidas, ou null se a busca falhar.
    async function carregarDemandas(filtros, opcaoOrdenacao) {
        const url = '/api/demandas?' + montarParametros(filtros, opcaoOrdenacao).toString();

        // O token do login acompanha a requisição, para a API identificar o usuário.
        const cabecalhos = {};
        const token = sessionStorage.getItem(CHAVE_TOKEN);
        if (token) {
            cabecalhos.Authorization = 'Bearer ' + token;
        }

        contador.textContent = 'Carregando...';

        try {
            const resposta = await fetch(url, { headers: cabecalhos });
            const dados = await resposta.json();

            // 400: algum filtro com valor inválido; a API explica qual.
            if (!resposta.ok) {
                renderizarTabela([]);
                definirStatusFormulario(dados.erro || 'Não foi possível carregar as demandas.', 'erro');
                return null;
            }

            const visiveis = filtrarPorPerfil(dados.demandas, usuarioLogado);
            renderizarTabela(visiveis);
            return visiveis.length;
        } catch (erro) {
            // Servidor desligado ou resposta que não é JSON.
            renderizarTabela([]);
            definirStatusFormulario('Não foi possível conectar ao servidor. Verifique se a API está rodando.', 'erro');
            return null;
        }
    }

    // Aplica os filtros escolhidos no formulário.
    function aplicarFiltros() {
        return carregarDemandas(lerFiltros(), campoOrdenacao.value);
    }


    // ---------- 6. VALIDAÇÃO DA BUSCA (Reunião 3) ----------

    // Destaca o campo (CSS: [aria-invalid="true"]) e escreve a mensagem de erro.
    function mostrarErro(campo, elementoErro, mensagem) {
        campo.setAttribute('aria-invalid', 'true');
        elementoErro.textContent = mensagem;
    }

    function limparErro(campo, elementoErro) {
        campo.removeAttribute('aria-invalid');
        elementoErro.textContent = '';
    }

    // A busca é opcional; o tamanho só é conferido quando há texto digitado.
    function validarBusca() {
        const valor = campoBusca.value.trim();

        if (valor.length === 0) {
            limparErro(campoBusca, erroBusca);
            return true;
        }

        if (valor.length < TAMANHO_MINIMO_BUSCA) {
            mostrarErro(campoBusca, erroBusca,
                'Digite pelo menos ' + TAMANHO_MINIMO_BUSCA + ' caracteres para buscar.');
            return false;
        }

        if (valor.length > TAMANHO_MAXIMO_BUSCA) {
            mostrarErro(campoBusca, erroBusca,
                'A busca pode ter no máximo ' + TAMANHO_MAXIMO_BUSCA + ' caracteres.');
            return false;
        }

        limparErro(campoBusca, erroBusca);
        return true;
    }

    // Mensagem geral do formulário, com cor de erro ou de sucesso.
    function definirStatusFormulario(mensagem, tipo) {
        statusFormulario.textContent = mensagem;
        statusFormulario.hidden = false;
        statusFormulario.classList.remove('status-erro', 'status-sucesso');
        statusFormulario.classList.add(tipo === 'erro' ? 'status-erro' : 'status-sucesso');
    }


    // ---------- 7. EVENTOS ----------

    // Revalida a busca a cada tecla, para o erro sumir assim que for corrigido.
    campoBusca.addEventListener('input', validarBusca);

    formulario.addEventListener('submit', async function (evento) {
        evento.preventDefault();

        if (!validarBusca()) {
            campoBusca.focus();
            definirStatusFormulario('Corrija os campos destacados antes de aplicar os filtros.', 'erro');
            return;
        }

        const total = await aplicarFiltros();

        if (total === null) {
            return;
        }

        if (total === 0) {
            definirStatusFormulario('Nenhuma demanda corresponde aos filtros escolhidos.', 'erro');
        } else {
            definirStatusFormulario('Filtros aplicados: ' + total + ' demanda(s) encontrada(s).', 'sucesso');
        }
    });

    // O evento "reset" acontece ANTES de o navegador limpar os campos.
    // Por isso a busca é feita direto sem filtros e com a ordenação padrão,
    // em vez de ler os campos (que ainda teriam os valores antigos).
    formulario.addEventListener('reset', function () {
        limparErro(campoBusca, erroBusca);
        statusFormulario.hidden = true;
        statusFormulario.textContent = '';
        carregarDemandas({}, ORDENACAO_PADRAO);
    });

    // Sair: apaga o usuário e o token guardados antes de ir para a tela de login.
    linkSair.addEventListener('click', function () {
        sessionStorage.removeItem(CHAVE_USUARIO);
        sessionStorage.removeItem(CHAVE_TOKEN);
    });


    // ---------- 8. INÍCIO ----------

    aplicarPerfilNaTela(usuarioLogado);

    // Sem usuário logado, a tela não busca demandas.
    if (usuarioLogado === null) {
        renderizarTabela([]);
    } else {
        aplicarFiltros();
    }
});
// Autor: Bruno Mareto
//
// Tela de Listagem de Demandas.
// - Busca as demandas na API (GET /api/demandas) e monta a tabela (Documento
//   de Visão, 2.2.9: título, tipo, prioridade, status, projeto, responsável,
//   data de criação e prazo de finalização).
// - Envia à API os filtros por status, prioridade, tipo, responsável e
//   projeto, a busca textual por título ou descrição e a ordenação por
//   criação, prioridade, prazo ou status (Documento de Visão, 2.3).
// - Carrega as opções de projeto e responsável da API (GET /api/demandas/filtros).
// - Permite alterar o status de cada demanda (PATCH /api/demandas/:id/status),
//   oferecendo só as transições do fluxo permitidas ao perfil (2.2.4).
// - Respeita o perfil do usuário logado (2.1). As restrições de acesso são
//   aplicadas pelo back-end; a tela só esconde o que o perfil não pode usar.
// - Valida o formulário de filtros e busca (Reunião 3).

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

    // Fluxo de status (2.2.4): para cada status, os próximos permitidos.
    // As mesmas regras são conferidas pelo back-end, que é quem decide.
    const TRANSICOES = {
        'Aberta': ['Em andamento', 'Cancelada'],
        'Em andamento': ['Em revisão', 'Cancelada'],
        'Em revisão': ['Concluída', 'Em andamento', 'Cancelada'],
        'Concluída': [],
        'Cancelada': [],
    };

    // O Membro da Equipe só faz estas transições, e só nas demandas dele (2.1.3).
    const TRANSICOES_MEMBRO = {
        'Aberta': ['Em andamento'],
        'Em andamento': ['Em revisão'],
    };


    // ---------- 2. USUÁRIO LOGADO (Documento de Visão, 2.1) ----------

    // Chaves gravadas pela tela de login em sessionStorage.
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

    const usuarioLogado = lerUsuarioLogado();
    const token = sessionStorage.getItem(CHAVE_TOKEN);

    // Ajusta o cabeçalho e o botão de cadastro ao perfil.
    function aplicarPerfilNaTela(usuario) {
        if (usuario === null || !token) {
            textoUsuario.textContent = 'Nenhum usuário logado';
            botaoNovaDemanda.hidden = true;
            semResultados.textContent = 'Entre pelo login para ver as demandas.';
            return;
        }

        textoUsuario.textContent = usuario.nome + ' · ' + usuario.perfil;

        // O Membro da Equipe não cria demandas (2.1.3).
        botaoNovaDemanda.hidden = usuario.perfil === 'Membro da Equipe';
    }

    // Status para os quais o usuário pode mover a demanda, conforme o perfil.
    function transicoesPermitidas(demanda) {
        if (usuarioLogado.perfil === 'Membro da Equipe') {
            const ehResponsavel = demanda.responsavel !== null && demanda.responsavel.id === usuarioLogado.id;
            return ehResponsavel ? (TRANSICOES_MEMBRO[demanda.status] || []) : [];
        }
        return TRANSICOES[demanda.status] || [];
    }


    // ---------- 3. COMUNICAÇÃO COM A API ----------

    // Faz a requisição com o token do login e devolve { resposta, dados }.
    // Sessão vencida ou inválida (401): limpa o login e avisa o usuário.
    async function chamarApi(url, opcoes) {
        const configuracao = opcoes || {};
        configuracao.headers = Object.assign({}, configuracao.headers, {
            Authorization: 'Bearer ' + token,
        });

        const resposta = await fetch(url, configuracao);
        const dados = await resposta.json();

        if (resposta.status === 401) {
            sessionStorage.removeItem(CHAVE_USUARIO);
            sessionStorage.removeItem(CHAVE_TOKEN);
            semResultados.textContent = 'Sua sessão expirou. Entre novamente pelo login.';
        }

        return { resposta: resposta, dados: dados };
    }

    // Preenche um <select> com as opções da API, mantendo a primeira ("Todos").
    function preencherSelect(campo, itens) {
        while (campo.options.length > 1) {
            campo.remove(1);
        }
        for (const item of itens) {
            const opcao = document.createElement('option');
            opcao.value = item.id;
            opcao.textContent = item.nome;
            campo.append(opcao);
        }
    }

    // Carrega os projetos e responsáveis que o usuário pode usar nos filtros.
    async function carregarOpcoesDosFiltros() {
        try {
            const { resposta, dados } = await chamarApi('/api/demandas/filtros');
            if (resposta.ok) {
                preencherSelect(campoProjeto, dados.projetos);
                preencherSelect(campoResponsavel, dados.responsaveis);
            }
        } catch (erro) {
            // Sem as opções, os filtros de projeto e responsável ficam só com "Todos".
        }
    }


    // ---------- 4. CONVERSÃO DOS DADOS PARA A TELA ----------

    // A API devolve o projeto e o responsável como { id, nome }.
    function nomeDoProjeto(projeto) {
        return projeto ? projeto.nome : 'Projeto não encontrado';
    }

    // O responsável é opcional (2.2.5): a API devolve null quando não há.
    function nomeDoResponsavel(responsavel) {
        return responsavel ? responsavel.nome : 'Sem responsável';
    }

    // Converte "2026-10-09" ou "2026-10-09 08:30:00" para "09/10/2026".
    // O prazo é opcional (2.2.5): null vira "Sem prazo".
    function formatarData(textoIso) {
        if (textoIso === null) {
            return 'Sem prazo';
        }
        const partes = textoIso.slice(0, 10).split('-');   // ["2026", "10", "09"]
        return partes[2] + '/' + partes[1] + '/' + partes[0];
    }


    // ---------- 5. MONTAGEM DA TABELA ----------

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

    // Cria a lista de alteração de status, só com as transições permitidas.
    // Devolve null quando o usuário não pode mover a demanda.
    function criarSeletorDeStatus(demanda) {
        const opcoes = transicoesPermitidas(demanda);
        if (opcoes.length === 0) {
            return null;
        }

        const seletor = document.createElement('select');
        seletor.classList.add('seletor-status');
        seletor.setAttribute('aria-label', 'Alterar status: ' + demanda.titulo);

        const primeira = document.createElement('option');
        primeira.value = '';
        primeira.textContent = 'Alterar status...';
        seletor.append(primeira);

        for (const status of opcoes) {
            const opcao = document.createElement('option');
            opcao.value = status;
            opcao.textContent = status === 'Cancelada' ? 'Cancelar demanda' : 'Mover para ' + status;
            seletor.append(opcao);
        }

        seletor.addEventListener('change', function () {
            if (seletor.value !== '') {
                alterarStatus(demanda, seletor.value, seletor);
            }
        });

        return seletor;
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

            // Ações: ver detalhes (leva o id na URL) e alterar status.
            const celulaAcoes = document.createElement('td');
            const caixaAcoes = document.createElement('div');
            caixaAcoes.classList.add('caixa-acoes');

            const link = document.createElement('a');
            link.textContent = 'Ver detalhes';
            link.classList.add('botao-detalhes');
            link.href = 'detalhes-demanda.html?id=' + demanda.id;
            link.setAttribute('aria-label', 'Ver detalhes: ' + demanda.titulo);
            caixaAcoes.append(link);

            const seletor = criarSeletorDeStatus(demanda);
            if (seletor !== null) {
                caixaAcoes.append(seletor);
            }

            celulaAcoes.append(caixaAcoes);
            linha.append(celulaAcoes);
            corpoTabela.append(linha);
        }

        // Contador e mensagem de lista vazia.
        const total = lista.length;
        contador.textContent = total === 1 ? '1 demanda' : total + ' demandas';
        semResultados.hidden = total > 0;
    }


    // ---------- 6. FILTROS, BUSCA E ORDENAÇÃO NA API (2.3) ----------

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

    // Filtros e ordenação da última busca, reaplicados depois de alterar um status.
    let ultimaBusca = { filtros: {}, ordenacao: ORDENACAO_PADRAO };

    // Busca as demandas na API e redesenha a tabela.
    // Devolve quantas demandas foram exibidas, ou null se a busca falhar.
    async function carregarDemandas(filtros, opcaoOrdenacao) {
        ultimaBusca = { filtros: filtros, ordenacao: opcaoOrdenacao };
        const url = '/api/demandas?' + montarParametros(filtros, opcaoOrdenacao).toString();

        contador.textContent = 'Carregando...';

        try {
            const { resposta, dados } = await chamarApi(url);

            // 400: algum filtro com valor inválido; 401: sessão vencida.
            if (!resposta.ok) {
                renderizarTabela([]);
                definirStatusFormulario(dados.erro || dados.mensagem || 'Não foi possível carregar as demandas.', 'erro');
                return null;
            }

            renderizarTabela(dados.demandas);
            return dados.demandas.length;
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


    // ---------- 7. ALTERAÇÃO DE STATUS (2.2.4) ----------

    // Envia o novo status à API, mostra o resultado e atualiza a tabela.
    async function alterarStatus(demanda, novoStatus, seletor) {
        const pergunta = novoStatus === 'Cancelada'
            ? 'Cancelar a demanda "' + demanda.titulo + '"? Ela não poderá voltar a ser movida.'
            : 'Mover a demanda "' + demanda.titulo + '" de ' + demanda.status + ' para ' + novoStatus + '?';

        if (!window.confirm(pergunta)) {
            seletor.value = '';
            return;
        }

        seletor.disabled = true;

        try {
            const { resposta, dados } = await chamarApi('/api/demandas/' + demanda.id + '/status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: novoStatus }),
            });

            if (resposta.ok) {
                definirStatusFormulario(dados.mensagem, 'sucesso');
            } else {
                // 400: transição proibida; 403: sem permissão; 404: demanda inexistente.
                definirStatusFormulario(dados.erro || dados.mensagem || 'Não foi possível alterar o status.', 'erro');
            }
        } catch (erro) {
            definirStatusFormulario('Não foi possível conectar ao servidor. Verifique se a API está rodando.', 'erro');
        }

        await carregarDemandas(ultimaBusca.filtros, ultimaBusca.ordenacao);
    }


    // ---------- 8. VALIDAÇÃO DA BUSCA (Reunião 3) ----------

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


    // ---------- 9. EVENTOS ----------

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


    // ---------- 10. INÍCIO ----------

    aplicarPerfilNaTela(usuarioLogado);

    // Sem login, a tela não chama a API (as rotas exigem o token).
    if (usuarioLogado === null || !token) {
        renderizarTabela([]);
    } else {
        carregarOpcoesDosFiltros();
        aplicarFiltros();
    }
});
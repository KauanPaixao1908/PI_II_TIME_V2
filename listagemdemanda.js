// Autor: Bruno Mareto
//
// Tela de Listagem de Demandas.
// - Monta a tabela a partir dos dados de listagem-dados.js (Documento de
//   Visão, 2.2.9: título, tipo, prioridade, status, projeto, responsável,
//   data de criação e prazo de finalização).
// - Aplica filtros por status, prioridade, tipo, responsável e projeto,
//   busca textual por título ou descrição e ordenação por criação,
//   prioridade, prazo ou status (Documento de Visão, 2.3).
// - Valida o formulário de filtros e busca (Reunião 3).
// Nesta etapa a tela ainda não está integrada à API (Reunião 4); as regras de
// filtro e ordenação são as mesmas da rota GET /demandas do back-end.

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

    // Posição de cada valor na ordenação: prioridade da mais urgente para a
    // menos urgente (2.2.2) e status na ordem do ciclo de vida (2.2.4).
    const ORDEM_PRIORIDADE = {
        'Crítica': 0,
        'Alta': 1,
        'Média': 2,
        'Baixa': 3,
    };

    const ORDEM_STATUS = {
        'Aberta': 0,
        'Em andamento': 1,
        'Em revisão': 2,
        'Concluída': 3,
        'Cancelada': 4,
    };

    // Demandas que a tela pode mostrar. Por enquanto, todas.
    const listaBase = demandas;


    // ---------- 2. CONVERSÃO DOS DADOS PARA A TELA ----------

    // Os dados guardam só o id do projeto; a tabela mostra o nome.
    function nomeDoProjeto(projetoId) {
        const projeto = projetos.find(function (p) { return p.id === projetoId; });
        return projeto ? projeto.nome : 'Projeto não encontrado';
    }

    // O responsável é opcional (2.2.5): responsavelId pode ser null.
    function nomeDoResponsavel(responsavelId) {
        if (responsavelId === null) {
            return 'Sem responsável';
        }
        const usuario = usuarios.find(function (u) { return u.id === responsavelId; });
        return usuario ? usuario.nome : 'Usuário não encontrado';
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


    // ---------- 3. MONTAGEM DA TABELA ----------

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
                criarCelula(nomeDoProjeto(demanda.projetoId)),
                criarCelula(nomeDoResponsavel(demanda.responsavelId)),
                criarCelula(formatarData(demanda.criadaEm), 'data'),
                criarCelula(formatarData(demanda.prazo), 'data')
            );

            // Leva para a tela de Detalhes da Demanda, informando o id na URL.
            const celulaAcoes = document.createElement('td');
            const link = document.createElement('a');
            link.textContent = 'Ver detalhes';
            link.classList.add('botao-detalhes');
            link.href = 'Detalhes_Demanda/detalhes-demanda.html?id=' + demanda.id;
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


    // ---------- 4. FILTROS, BUSCA E ORDENAÇÃO (2.3) ----------

    // Remove acentos e diferença entre maiúsculas e minúsculas,
    // para "relatorio" encontrar "Relatório".
    function normalizar(texto) {
        return texto
            .normalize('NFD')                   // separa a letra do acento: "ó" vira "o" + "´"
            .replace(/[\u0300-\u036f]/g, '')    // apaga os acentos separados
            .toLowerCase();
    }

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

    // Mantém só as demandas que passam em todos os filtros preenchidos.
    function filtrarDemandas(lista, filtros) {
        const termo = normalizar(filtros.busca);

        return lista.filter(function (demanda) {
            if (filtros.status !== '' && demanda.status !== filtros.status) {
                return false;
            }
            if (filtros.prioridade !== '' && demanda.prioridade !== filtros.prioridade) {
                return false;
            }
            if (filtros.tipo !== '' && demanda.tipo !== filtros.tipo) {
                return false;
            }
            // O value do <select> é texto ("4"); o id nos dados é número (4).
            if (filtros.responsavelId !== '' && demanda.responsavelId !== Number(filtros.responsavelId)) {
                return false;
            }
            if (filtros.projetoId !== '' && demanda.projetoId !== Number(filtros.projetoId)) {
                return false;
            }
            // Busca textual no título ou na descrição.
            if (termo !== '') {
                const textoDaDemanda = normalizar(demanda.titulo + ' ' + demanda.descricao);
                if (!textoDaDemanda.includes(termo)) {
                    return false;
                }
            }
            return true;
        });
    }

    // Ordena uma cópia da lista. A opção vem do <select>, por exemplo "prazo-asc".
    // Demandas sem prazo ficam sempre no fim, nas duas direções.
    function ordenarDemandas(lista, opcao) {
        const partes = opcao.split('-');       // "prazo-asc" -> ["prazo", "asc"]
        const campo = partes[0];
        const fator = partes[1] === 'desc' ? -1 : 1;

        const copia = lista.slice();           // sort altera o array; a lista original fica intacta

        copia.sort(function (a, b) {
            if (campo === 'prazo') {
                if (a.prazo === null && b.prazo === null) return 0;
                if (a.prazo === null) return 1;      // a vai para o fim
                if (b.prazo === null) return -1;     // b vai para o fim
                return fator * a.prazo.localeCompare(b.prazo);
            }
            if (campo === 'criacao') {
                return fator * a.criadaEm.localeCompare(b.criadaEm);
            }
            if (campo === 'prioridade') {
                return fator * (ORDEM_PRIORIDADE[a.prioridade] - ORDEM_PRIORIDADE[b.prioridade]);
            }
            if (campo === 'status') {
                return fator * (ORDEM_STATUS[a.status] - ORDEM_STATUS[b.status]);
            }
            return 0;
        });

        return copia;
    }

    // Filtra, ordena e redesenha a tabela. Devolve quantas demandas sobraram.
    function aplicarFiltros() {
        const filtradas = filtrarDemandas(listaBase, lerFiltros());
        const ordenadas = ordenarDemandas(filtradas, campoOrdenacao.value);
        renderizarTabela(ordenadas);
        return ordenadas.length;
    }


    // ---------- 5. VALIDAÇÃO DA BUSCA (Reunião 3) ----------

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


    // ---------- 6. EVENTOS ----------

    // Revalida a busca a cada tecla, para o erro sumir assim que for corrigido.
    campoBusca.addEventListener('input', validarBusca);

    formulario.addEventListener('submit', function (evento) {
        evento.preventDefault();

        if (!validarBusca()) {
            campoBusca.focus();
            definirStatusFormulario('Corrija os campos destacados antes de aplicar os filtros.', 'erro');
            return;
        }

        const total = aplicarFiltros();

        if (total === 0) {
            definirStatusFormulario('Nenhuma demanda corresponde aos filtros escolhidos.', 'erro');
        } else {
            definirStatusFormulario('Filtros aplicados: ' + total + ' demanda(s) encontrada(s).', 'sucesso');
        }
    });

    // O evento "reset" acontece ANTES de o navegador limpar os campos.
    // Por isso a tabela é montada direto com a lista completa e a ordenação
    // padrão, em vez de ler os campos (que ainda teriam os valores antigos).
    formulario.addEventListener('reset', function () {
        limparErro(campoBusca, erroBusca);
        statusFormulario.hidden = true;
        statusFormulario.textContent = '';
        renderizarTabela(ordenarDemandas(listaBase, ORDENACAO_PADRAO));
    });


    // ---------- 7. INÍCIO ----------

    aplicarFiltros();
});
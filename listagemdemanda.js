// Autor: Bruno Mareto
//
// Tela de Listagem de Demandas.
// - Monta a tabela a partir dos dados de listagem-dados.js (Documento de
//   Visão, 2.2.9: título, tipo, prioridade, status, projeto, responsável,
//   data de criação e prazo de finalização).
// - Valida o formulário de filtros e busca (Reunião 3).
// Nesta etapa a tela ainda não está integrada à API (Reunião 4).

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

    const corpoTabela = document.getElementById('corpo-tabela');
    const contador = document.getElementById('contador-resultados');
    const semResultados = document.getElementById('sem-resultados');

    // Regras de tamanho da busca textual.
    const TAMANHO_MINIMO_BUSCA = 2;
    const TAMANHO_MAXIMO_BUSCA = 60;

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
    // Recebe a lista como parâmetro para poder mostrar o resultado dos filtros.
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


    // ---------- 4. VALIDAÇÃO DA BUSCA (Reunião 3) ----------

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


    // ---------- 5. EVENTOS ----------

    // Revalida a busca a cada tecla, para o erro sumir assim que for corrigido.
    campoBusca.addEventListener('input', validarBusca);

    formulario.addEventListener('submit', function (evento) {
        evento.preventDefault();

        if (!validarBusca()) {
            campoBusca.focus();
            definirStatusFormulario('Corrija os campos destacados antes de aplicar os filtros.', 'erro');
            return;
        }

        // Os filtros passam a ser aplicados à tabela na próxima etapa.
        definirStatusFormulario('Filtros válidos.', 'sucesso');
    });

    // O type="reset" limpa os campos; aqui são limpas as mensagens.
    formulario.addEventListener('reset', function () {
        limparErro(campoBusca, erroBusca);
        statusFormulario.hidden = true;
        statusFormulario.textContent = '';
    });


    // ---------- 6. INÍCIO ----------

    renderizarTabela(demandas);
});
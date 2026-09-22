// Autor: Bruno Mareto
//
// Validações em JavaScript do formulário de filtros e busca da tela de
// Listagem de Demandas. Nesta etapa do projeto ainda não existe backend
// integrado a esta tela, então este script não busca dados de verdade:
// ele garante que o formulário não seja considerado "válido" enquanto o
// campo de busca não estiver em um formato aceitável.

document.addEventListener('DOMContentLoaded', function () {

    // 1. Referências para os elementos do DOM usados nas validações.
    var formulario = document.getElementById('form-filtros');
    var campoBusca = document.getElementById('busca');
    var erroBusca = document.getElementById('erro-busca');
    var statusFormulario = document.getElementById('status-formulario');

    var campoStatus = document.getElementById('status');
    var campoPrioridade = document.getElementById('prioridade');
    var campoTipo = document.getElementById('tipo');
    var campoResponsavel = document.getElementById('responsavel');
    var campoProjeto = document.getElementById('projeto');

    // Regras de tamanho da busca textual, isoladas em constantes para
    // não espalhar números soltos pelo meio do código.
    var TAMANHO_MINIMO_BUSCA = 2;
    var TAMANHO_MAXIMO_BUSCA = 60;

    // 2. Marca um campo como inválido: destaca a borda (via CSS, com o
    //    seletor [aria-invalid="true"]) e escreve a mensagem de erro no
    //    elemento correspondente.
    function mostrarErro(campo, elementoErro, mensagem) {
        campo.setAttribute('aria-invalid', 'true');
        elementoErro.textContent = mensagem;
    }

    // Desfaz a marcação de erro de um campo.
    function limparErro(campo, elementoErro) {
        campo.removeAttribute('aria-invalid');
        elementoErro.textContent = '';
    }

    // 3. Valida somente o campo de busca textual.
    //    Retorna true se o valor pode ser usado, false caso contrário.
    function validarBusca() {
        var valor = campoBusca.value.trim();

        // A busca é opcional: não preencher nada é um estado válido,
        // significa "não filtrar por texto". A validação de tamanho só
        // entra em ação quando a pessoa já digitou alguma coisa.
        if (valor.length === 0) {
            limparErro(campoBusca, erroBusca);
            return true;
        }

        if (valor.length < TAMANHO_MINIMO_BUSCA) {
            mostrarErro(
                campoBusca,
                erroBusca,
                'Digite pelo menos ' + TAMANHO_MINIMO_BUSCA + ' caracteres para buscar.'
            );
            return false;
        }

        if (valor.length > TAMANHO_MAXIMO_BUSCA) {
            mostrarErro(
                campoBusca,
                erroBusca,
                'A busca pode ter no máximo ' + TAMANHO_MAXIMO_BUSCA + ' caracteres.'
            );
            return false;
        }

        limparErro(campoBusca, erroBusca);
        return true;
    }

    // 4. Mostra a mensagem geral de status acima/abaixo dos botões,
    //    trocando a cor de fundo conforme o tipo ('erro' ou 'sucesso').
    function definirStatusFormulario(mensagem, tipo) {
        statusFormulario.textContent = mensagem;
        statusFormulario.hidden = false;
        statusFormulario.classList.remove('status-erro', 'status-sucesso');
        statusFormulario.classList.add(tipo === 'erro' ? 'status-erro' : 'status-sucesso');
    }

    // 5. Validação em tempo real: revalida a busca a cada tecla digitada,
    //    para a mensagem de erro sumir assim que o problema for corrigido.
    campoBusca.addEventListener('input', validarBusca);

    // 6. Intercepta o envio do formulário.
    formulario.addEventListener('submit', function (evento) {
        // Sem isso, o navegador tentaria recarregar a página (o <form>
        // não tem "action" definido) e a validação nunca chegaria a
        // aparecer na tela.
        evento.preventDefault();

        var buscaValida = validarBusca();

        if (!buscaValida) {
            campoBusca.focus();
            definirStatusFormulario(
                'Corrija os campos destacados antes de aplicar os filtros.',
                'erro'
            );
            return;
        }

        // Dados válidos. Como o backend desta tela ainda não existe
        // nesta etapa, não há requisição real — só demonstramos que a
        // validação passou, resumindo os filtros que seriam enviados.
        var filtrosEscolhidos = [
            'status: ' + (campoStatus.value || 'todos'),
            'prioridade: ' + (campoPrioridade.value || 'todas'),
            'tipo: ' + (campoTipo.value || 'todos'),
            'responsável: ' + (campoResponsavel.value || 'todos'),
            'projeto: ' + (campoProjeto.value || 'todos')
        ];

        definirStatusFormulario(
            'Filtros válidos. Quando o backend estiver integrado, esta ação buscará por: ' +
                filtrosEscolhidos.join(', ') + '.',
            'sucesso'
        );
    });

    // 7. O botão "Limpar filtros" (type="reset") já limpa os valores dos
    //    campos sozinho — é o comportamento padrão do navegador. Porém
    //    ele não sabe das mensagens de erro/status que criamos, então
    //    elas precisam ser limpas manualmente aqui.
    formulario.addEventListener('reset', function () {
        limparErro(campoBusca, erroBusca);
        statusFormulario.hidden = true;
        statusFormulario.textContent = '';
    });
});

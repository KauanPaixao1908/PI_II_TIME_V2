document.addEventListener('DOMContentLoaded', function() {
    inicializarFormulario();
    configurarDataAtual();
    configurarValidacoes();
    carregarRascunho();
});

function inicializarFormulario() {
    const formulario = document.getElementById('formulario-demanda');
    
    if (formulario) {
        formulario.addEventListener('submit', handleSubmit);
        setInterval(salvarRascunho, 30000);
        
        const campos = formulario.querySelectorAll('input, select, textarea');
        campos.forEach(campo => {
            campo.addEventListener('change', salvarRascunho);
        });
    }
}

function handleSubmit(evento) {
    evento.preventDefault();
    
    if (!validarFormulario()) {
        return false;
    }
    
    const dadosDemanda = coletarDadosFormulario();
    
    console.log('=== DADOS DA DEMANDA ===');
    console.log(dadosDemanda);
    console.log('========================');
    
    salvarDemanda(dadosDemanda);
    exibirMensagemSucesso();
    limparRascunho();
    
    setTimeout(function() {
        window.location.href = 'listagemdemanda.html';
    }, 2000);
    
    return false;
}

function coletarDadosFormulario() {
    const formulario = document.getElementById('formulario-demanda');
    
    return {
        id: gerarIdUnico(),
        titulo: formulario.titulo.value.trim(),
        descricao: formulario.descricao.value.trim(),
        tipo: formulario.tipo.value,
        prioridade: formulario.prioridade.value,
        status: formulario.status.value,
        projeto: formulario.projeto.value,
        responsavel: formulario.responsavel.value,
        dataCriacao: formulario['data-criacao'].value || obterDataAtual(),
        prazo: formulario.prazo.value,
        observacoes: formulario.observacoes.value.trim(),
        dataCadastro: new Date().toISOString()
    };
}

function validarFormulario() {
    const formulario = document.getElementById('formulario-demanda');
    let valido = true;
    let mensagensErro = [];
    
    if (formulario.titulo.value.trim().length < 5) {
        mensagensErro.push('O título deve ter pelo menos 5 caracteres.');
        marcarCampoInvalido(formulario.titulo);
        valido = false;
    } else {
        marcarCampoValido(formulario.titulo);
    }
    
    if (formulario.descricao.value.trim().length < 10) {
        mensagensErro.push('A descrição deve ter pelo menos 10 caracteres.');
        marcarCampoInvalido(formulario.descricao);
        valido = false;
    } else {
        marcarCampoValido(formulario.descricao);
    }
    
    const selects = ['tipo', 'prioridade', 'status', 'projeto', 'responsavel'];
    selects.forEach(function(nome) {
        if (!formulario[nome].value) {
            mensagensErro.push('Por favor, selecione um valor para ' + obterNomeCampo(nome) + '.');
            marcarCampoInvalido(formulario[nome]);
            valido = false;
        } else {
            marcarCampoValido(formulario[nome]);
        }
    });
    
    if (!formulario.prazo.value) {
        mensagensErro.push('Por favor, informe o prazo de finalização.');
        marcarCampoInvalido(formulario.prazo);
        valido = false;
    } else {
        const dataPrazo = new Date(formulario.prazo.value);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        if (dataPrazo < hoje) {
            mensagensErro.push('O prazo não pode ser anterior à data atual.');
            marcarCampoInvalido(formulario.prazo);
            valido = false;
        } else {
            marcarCampoValido(formulario.prazo);
        }
    }
    
    if (!valido) {
        exibirMensagensErro(mensagensErro);
    }
    
    return valido;
}

function marcarCampoInvalido(campo) {
    campo.style.borderColor = '#dc3545';
    campo.style.backgroundColor = '#fff5f5';
}

function marcarCampoValido(campo) {
    campo.style.borderColor = '#adb5bd';
    campo.style.backgroundColor = 'white';
}

function obterNomeCampo(nome) {
    const nomes = {
        'tipo': 'Tipo',
        'prioridade': 'Prioridade',
        'status': 'Status',
        'projeto': 'Projeto',
        'responsavel': 'Responsável'
    };
    return nomes[nome] || nome;
}

function exibirMensagensErro(mensagens) {
    const alertaAnterior = document.querySelector('.alerta-erro');
    if (alertaAnterior) {
        alertaAnterior.remove();
    }
    
    const formulario = document.getElementById('formulario-demanda');
    const alerta = document.createElement('div');
    alerta.className = 'alerta-erro';
    alerta.style.cssText = `
        margin: 0 0 20px;
        padding: 14px 16px;
        border-left: 4px solid #dc3545;
        background-color: #ffebee;
        color: #721c24;
        font-size: 0.875rem;
        border-radius: 4px;
    `;
    
    const titulo = document.createElement('strong');
    titulo.textContent = 'Erro no preenchimento:';
    alerta.appendChild(titulo);
    
    const lista = document.createElement('ul');
    lista.style.margin = '8px 0 0 0';
    lista.style.paddingLeft = '20px';
    
    mensagens.forEach(function(msg) {
        const item = document.createElement('li');
        item.textContent = msg;
        lista.appendChild(item);
    });
    
    alerta.appendChild(lista);
    formulario.insertBefore(alerta, formulario.firstChild);
    alerta.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function exibirMensagemSucesso() {
    const alertaAnterior = document.querySelector('.alerta-sucesso, .alerta-erro');
    if (alertaAnterior) {
        alertaAnterior.remove();
    }
    
    const formulario = document.getElementById('formulario-demanda');
    const alerta = document.createElement('div');
    alerta.className = 'alerta-sucesso';
    alerta.style.cssText = `
        margin: 0 0 20px;
        padding: 14px 16px;
        border-left: 4px solid #28a745;
        background-color: #d4edda;
        color: #155724;
        font-size: 0.875rem;
        border-radius: 4px;
    `;
    
    alerta.innerHTML = '<strong>✓ Sucesso!</strong> Demanda cadastrada com sucesso. Redirecionando...';
    formulario.insertBefore(alerta, formulario.firstChild);
    alerta.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function salvarDemanda(demanda) {
    try {
        let demandas = JSON.parse(localStorage.getItem('demandas')) || [];
        demandas.push(demanda);
        localStorage.setItem('demandas', JSON.stringify(demandas));
        console.log('Demanda salva com sucesso!');
        return true;
    } catch (erro) {
        console.error('Erro ao salvar demanda:', erro);
        return false;
    }
}

function salvarRascunho() {
    const formulario = document.getElementById('formulario-demanda');
    if (!formulario) return;
    
    const rascunho = {
        titulo: formulario.titulo.value,
        descricao: formulario.descricao.value,
        tipo: formulario.tipo.value,
        prioridade: formulario.prioridade.value,
        status: formulario.status.value,
        projeto: formulario.projeto.value,
        responsavel: formulario.responsavel.value,
        dataCriacao: formulario['data-criacao'].value,
        prazo: formulario.prazo.value,
        observacoes: formulario.observacoes.value,
        dataRascunho: new Date().toISOString()
    };
    
    try {
        localStorage.setItem('rascunho-demanda', JSON.stringify(rascunho));
        console.log('Rascunho salvo automaticamente');
    } catch (erro) {
        console.error('Erro ao salvar rascunho:', erro);
    }
}

function carregarRascunho() {
    try {
        const rascunho = JSON.parse(localStorage.getItem('rascunho-demanda'));
        
        if (rascunho) {
            const carregar = confirm('Existe um rascunho salvo. Deseja recuperá-lo?');
            
            if (carregar) {
                const formulario = document.getElementById('formulario-demanda');
                formulario.titulo.value = rascunho.titulo || '';
                formulario.descricao.value = rascunho.descricao || '';
                formulario.tipo.value = rascunho.tipo || '';
                formulario.prioridade.value = rascunho.prioridade || '';
                formulario.status.value = rascunho.status || '';
                formulario.projeto.value = rascunho.projeto || '';
                formulario.responsavel.value = rascunho.responsavel || '';
                formulario['data-criacao'].value = rascunho.dataCriacao || '';
                formulario.prazo.value = rascunho.prazo || '';
                formulario.observacoes.value = rascunho.observacoes || '';
                console.log('Rascunho carregado');
            } else {
                limparRascunho();
            }
        }
    } catch (erro) {
        console.error('Erro ao carregar rascunho:', erro);
    }
}

function limparRascunho() {
    try {
        localStorage.removeItem('rascunho-demanda');
        console.log('Rascunho removido');
    } catch (erro) {
        console.error('Erro ao limpar rascunho:', erro);
    }
}

function gerarIdUnico() {
    return 'DEM-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function obterDataAtual() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

function configurarDataAtual() {
    const campoDataCriacao = document.getElementById('data-criacao');
    if (campoDataCriacao && !campoDataCriacao.value) {
        campoDataCriacao.value = obterDataAtual();
    }
}

function configurarValidacoes() {
    const formulario = document.getElementById('formulario-demanda');
    if (!formulario) return;
    
    formulario.titulo.addEventListener('blur', function() {
        if (this.value.trim().length > 0 && this.value.trim().length < 5) {
            marcarCampoInvalido(this);
        } else if (this.value.trim().length >= 5) {
            marcarCampoValido(this);
        }
    });
    
    formulario.descricao.addEventListener('blur', function() {
        if (this.value.trim().length > 0 && this.value.trim().length < 10) {
            marcarCampoInvalido(this);
        } else if (this.value.trim().length >= 10) {
            marcarCampoValido(this);
        }
    });
    
    const selects = formulario.querySelectorAll('select[required]');
    selects.forEach(function(select) {
        select.addEventListener('change', function() {
            if (this.value) {
                marcarCampoValido(this);
            }
        });
    });
}

function listarTodasDemandas() {
    try {
        const demandas = JSON.parse(localStorage.getItem('demandas')) || [];
        console.log('=== TODAS AS DEMANDAS ===');
        console.table(demandas);
        return demandas;
    } catch (erro) {
        console.error('Erro ao listar demandas:', erro);
        return [];
    }
}

function limparTodasDemandas() {
    if (confirm('Tem certeza que deseja limpar todas as demandas?')) {
        localStorage.removeItem('demandas');
        console.log('Todas as demandas foram removidas');
    }
}

window.debugDemandas = {
    listar: listarTodasDemandas,
    limpar: limparTodasDemandas,
    verRascunho: function() {
        const rascunho = localStorage.getItem('rascunho-demanda');
        console.log(rascunho ? JSON.parse(rascunho) : 'Nenhum rascunho encontrado');
    }
};

console.log('Sistema de cadastro de demandas carregado!');
console.log('Use window.debugDemandas para acessar funções de debug:');
console.log('  - debugDemandas.listar() - Listar todas as demandas');
console.log('  - debugDemandas.limpar() - Limpar todas as demandas');
console.log('  - debugDemandas.verRascunho() - Ver rascunho atual');

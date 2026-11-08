// Autor: Kauan Paixão
// Validações da Tela de Cadastro e envio da nova conta para a API.

// Endereço do backend (Node/Express). Troque se a porta for outra.
var API_URL = "http://localhost:3000";

window.addEventListener("DOMContentLoaded", function () {
    var formulario = document.getElementById("formulario-cadastro");
    var nome = document.getElementById("nome");
    var email = document.getElementById("email");
    var senha = document.getElementById("senha");
    var confirmarSenha = document.getElementById("confirmar-senha");
    var botaoCriar = document.getElementById("botao-entrar");
    var aviso = document.getElementById("aviso-prototipo");

    function mostrarAviso(texto, cor) {
        aviso.textContent = texto;
        aviso.style.color = cor;
    }

    function limparMensagem(campo) {
        var mensagem = campo.parentElement.querySelector(".mensagem-erro");

        if (mensagem) {
            mensagem.remove();
        }

        campo.style.borderColor = "";
        campo.style.outline = "";
    }

    function mostrarErro(campo, mensagemTexto) {
        limparMensagem(campo);

        campo.style.borderColor = "#dc3545";
        campo.style.outline = "3px solid #f8d7da";

        var mensagem = document.createElement("p");
        mensagem.className = "mensagem-erro";
        mensagem.textContent = mensagemTexto;
        mensagem.style.margin = "6px 0 0";
        mensagem.style.color = "#842029";
        mensagem.style.fontSize = "0.875rem";

        campo.parentElement.appendChild(mensagem);
    }

    // Regras da senha (as mesmas são conferidas de novo no backend):
    //  - pelo menos 8 caracteres;
    //  - pelo menos 1 letra maiúscula;
    //  - pelo menos 1 caractere especial (algo que não é letra, número nem espaço).
    // Devolve a mensagem de erro, ou "" se a senha estiver ok.
    function verificarRegrasSenha(valor) {
        if (valor.length < 8) {
            return "A senha deve ter pelo menos 8 caracteres.";
        }
        if (!/\p{Lu}/u.test(valor)) {
            return "A senha deve ter pelo menos 1 letra maiúscula.";
        }
        if (!/[^\p{L}\p{N}\s]/u.test(valor)) {
            return "A senha deve ter pelo menos 1 caractere especial (ex.: ! @ # $ %).";
        }
        return "";
    }

    // Confere cada campo e marca em vermelho os que estiverem errados.
    function validarCampos() {
        var tudoCerto = true;
        var formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        [nome, email, senha, confirmarSenha].forEach(limparMensagem);

        if (nome.value.trim() === "") {
            mostrarErro(nome, "Informe o nome.");
            tudoCerto = false;
        }

        if (email.value.trim() === "") {
            mostrarErro(email, "Informe o e-mail.");
            tudoCerto = false;
        } else if (!formatoEmail.test(email.value.trim())) {
            mostrarErro(email, "Informe um e-mail em formato válido.");
            tudoCerto = false;
        }

        var erroSenha = verificarRegrasSenha(senha.value);
        if (erroSenha !== "") {
            mostrarErro(senha, erroSenha);
            tudoCerto = false;
        }

        if (confirmarSenha.value !== senha.value) {
            mostrarErro(confirmarSenha, "As senhas não são iguais.");
            tudoCerto = false;
        }

        return tudoCerto;
    }

    // Envia os dados para a API, que grava o novo usuário no banco.
    async function criarConta() {
        botaoCriar.disabled = true;
        mostrarAviso("Criando conta...", "#626970");

        try {
            var resposta = await fetch(API_URL + "/api/cadastro", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nome: nome.value.trim(),
                    email: email.value.trim(),
                    senha: senha.value
                })
            });

            var dados = await resposta.json();

            // Ex.: e-mail já cadastrado.
            if (!resposta.ok) {
                mostrarAviso(dados.mensagem, "#842029");
                return;
            }

            // Conta criada: volta para o login já com o e-mail preenchido.
            mostrarAviso(dados.mensagem + " Redirecionando para o login...", "#146c43");
            setTimeout(function () {
                window.location.href = "index.html?cadastro=ok&email=" +
                    encodeURIComponent(email.value.trim());
            }, 1200);
        } catch (erro) {
            // Cai aqui quando o backend não está rodando.
            mostrarAviso("Não foi possível conectar ao servidor. Verifique se a API está rodando.", "#842029");
        } finally {
            botaoCriar.disabled = false;
        }
    }

    formulario.addEventListener("submit", function (evento) {
        evento.preventDefault();

        if (!validarCampos()) {
            mostrarAviso("Corrija os campos destacados antes de continuar.", "#842029");
            return;
        }

        criarConta();
    });

    // Ao digitar, some a mensagem de erro do campo.
    [nome, email, senha, confirmarSenha].forEach(function (campo) {
        campo.addEventListener("input", function () {
            limparMensagem(campo);
            mostrarAviso("", "");
        });
    });
});

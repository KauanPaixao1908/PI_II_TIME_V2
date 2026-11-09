// Autor: Kauan Paixão
// Validações da Tela de Login e envio dos dados para a API.

// Endereço do backend (Node/Express). Troque se a porta for outra.
var API_URL = "http://localhost:3000";

window.addEventListener("DOMContentLoaded", function () {
    var formulario = document.getElementById("formulario-login");
    var email = document.getElementById("email");
    var senha = document.getElementById("senha");
    var botaoEntrar = document.getElementById("botao-entrar");
    var aviso = document.getElementById("aviso-prototipo");

    // Se veio da tela de cadastro, preenche o e-mail e mostra a mensagem.
    var parametros = new URLSearchParams(window.location.search);
    if (parametros.get("cadastro") === "ok") {
        email.value = parametros.get("email") || "";
        mostrarAviso("Conta criada! Agora faça login com seu e-mail e senha.", "#146c43");
    }

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

    function validarEmail() {
        var valor = email.value.trim();
        var formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        limparMensagem(email);

        if (valor === "") {
            mostrarErro(email, "Informe o e-mail.");
            return false;
        }

        if (!formatoEmail.test(valor)) {
            mostrarErro(email, "Informe um e-mail em formato válido.");
            return false;
        }

        return true;
    }

    function validarSenha() {
        var valor = senha.value;

        limparMensagem(senha);

        if (valor.trim() === "") {
            mostrarErro(senha, "Informe a senha.");
            return false;
        }

        return true;
    }

    // Envia e-mail e senha para a API, que confere com o banco de dados.
    async function fazerLogin() {
        botaoEntrar.disabled = true;
        mostrarAviso("Verificando...", "#626970");

        try {
            var resposta = await fetch(API_URL + "/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.value.trim(),
                    senha: senha.value
                })
            });

            var dados = await resposta.json();

            // E-mail ou senha não batem com o banco.
            if (!resposta.ok) {
                mostrarAviso(dados.mensagem, "#842029");
                return;
            }

            // Guarda quem está logado (id, nome, perfil) para as próximas telas.
            sessionStorage.setItem("usuarioLogado", JSON.stringify(dados.usuario));        
            // Token do login, enviado pelas outras telas no cabeçalho Authorization.
            sessionStorage.setItem("token", dados.token);

            mostrarAviso("Login realizado com sucesso! Redirecionando...", "#146c43");
            window.location.href = "pages/dashboard.html";
        } catch (erro) {
            // Cai aqui quando o backend não está rodando.
            mostrarAviso("Não foi possível conectar ao servidor. Verifique se a API está rodando.", "#842029");
        } finally {
            botaoEntrar.disabled = false;
        }
    }

    function validarFormulario(evento) {
        evento.preventDefault();

        var emailValido = validarEmail();
        var senhaValida = validarSenha();

        if (!emailValido || !senhaValida) {
            mostrarAviso("Corrija os campos destacados antes de continuar.", "#842029");
            return;
        }

        fazerLogin();
    }

    // O botão "Entrar" é do tipo submit, então basta ouvir o envio do formulário
    // (funciona também apertando Enter).
    formulario.addEventListener("submit", validarFormulario);

    email.addEventListener("input", function () {
        limparMensagem(email);
        mostrarAviso("", "");
    });

    senha.addEventListener("input", function () {
        limparMensagem(senha);
        mostrarAviso("", "");
    });
});

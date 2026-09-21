// Autor: Kauan Paixão
// Validações da Tela de Login.
// Baseado nos requisitos de autenticação e nas validações de frontend
// definidos para os grupos veteranos na Reunião 3 do PI II.

window.addEventListener("DOMContentLoaded", function () {
    var formulario = document.getElementById("formulario-login");
    var email = document.getElementById("email");
    var senha = document.getElementById("senha");
    var botaoEntrar = document.getElementById("botao-entrar");
    var aviso = document.getElementById("aviso-prototipo");

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

    function validarFormulario(evento) {
        if (evento) {
            evento.preventDefault();
        }

        var emailValido = validarEmail();
        var senhaValida = validarSenha();

        if (!emailValido || !senhaValida) {
            aviso.textContent = "Corrija os campos destacados antes de continuar.";
            aviso.style.color = "#842029";
            return false;
        }

        // Nesta etapa do PI II, o frontend valida os dados.
        // A autenticação real depende da integração com o backend.
        aviso.textContent = "Validação concluída. Os dados estão em formato válido; a autenticação será realizada pelo backend.";
        aviso.style.color = "#146c43";

        return true;
    }

    formulario.addEventListener("submit", validarFormulario);
    botaoEntrar.addEventListener("click", validarFormulario);

    email.addEventListener("input", function () {
        limparMensagem(email);
        aviso.textContent = "Prévia visual: o acesso ainda não está disponível.";
        aviso.style.color = "#626970";
    });

    senha.addEventListener("input", function () {
        limparMensagem(senha);
        aviso.textContent = "Prévia visual: o acesso ainda não está disponível.";
        aviso.style.color = "#626970";
    });
});

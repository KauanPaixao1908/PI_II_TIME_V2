// Autor: Bruno Mareto e Kauan Paixao
//
// Ponto de entrada do backend do Sistema de Acompanhamento de Demandas.
// Nesta etapa (Reunião 3), o objetivo é apenas comprovar que o servidor
// inicializa corretamente e responde a uma requisição simples. Rotas de
// negócio (demandas, projetos, usuários) e a conexão com o banco de
// dados serão implementadas em etapas futuras.

import express from "express";
import path from "path";

const app = express();

const PORTA = 3000;

// Permite receber dados enviados em JSON
app.use(express.json());

// Permite acessar os arquivos HTML e CSS da pasta public
app.use(express.static(path.join(__dirname, "../public")));

// Tela inicial: Login
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/Tela.Login.html"));
});

// Rota da tela de login
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/Tela.Login.html"));
});

// Rota da tela de detalhes da demanda
app.get("/detalhes-demanda", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/detalhes-demanda.html"));
});

// Servidor local
app.listen(PORTA, () => {
    console.log(`Servidor rodando em http://localhost:${PORTA}`);
});

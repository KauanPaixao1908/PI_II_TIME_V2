// Autor: Bruno Mareto
//
// Ponto de entrada do backend do Sistema de Acompanhamento de Demandas.
// Nesta etapa (Reunião 3), o objetivo é apenas comprovar que o servidor
// inicializa corretamente e responde a uma requisição simples. Rotas de
// negócio (demandas, projetos, usuários) e a conexão com o banco de
// dados serão implementadas em etapas futuras.

import express, { Request, Response } from 'express';

// "app" é a aplicação Express em si: é nela que registramos rotas
// (quais URLs o servidor entende) e que, no fim, colocamos para
// escutar uma porta específica do computador.
const app = express();

// A porta é lida de uma variável de ambiente (process.env.PORT), e só
// se ela não existir usamos 3000 como valor padrão. Isso é uma prática
// comum porque, quando o projeto for hospedado num serviço na nuvem,
// normalmente é esse serviço quem decide (via variável de ambiente)
// em qual porta a aplicação deve rodar.
const PORTA = process.env.PORT || 3000;

// Middleware que permite ao Express interpretar automaticamente um
// corpo de requisição no formato JSON (necessário assim que as rotas
// de cadastro/edição de demanda começarem a receber dados do frontend).
app.use(express.json());

// Rota de verificação de saúde do servidor ("health check").
// Ao acessar http://localhost:3000/ no navegador (ou com uma
// ferramenta como o curl), esta função é executada e devolve uma
// resposta simples, confirmando que o servidor está de pé.
app.get('/', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        mensagem: 'Servidor do Sistema de Acompanhamento de Demandas está funcionando.',
    });
});

// app.listen liga o servidor de fato: a partir deste ponto, o processo
// Node.js fica "vivo", escutando a porta indicada, até ser encerrado
// manualmente (Ctrl+C no terminal).
app.listen(PORTA, () => {
    console.log(`Servidor rodando em http://localhost:${PORTA}`);
});
// Autor: Bruno Mareto
//
// Ponto de entrada do backend (API) do Sistema de Acompanhamento de Demandas.
// Cria a aplicação Express, entrega as telas do front-end (pasta frontend/),
// registra as rotas da API com o prefixo /api e inicia o servidor.
// O sistema abre em http://localhost:3000 e as telas chamam a API pelo mesmo
// endereço (fetch('/api/...')), sem necessidade de CORS.

import express, { Request, Response } from 'express';
import path from 'path';
import listagemRouter from './routes/listagem';
import loginRouter from './routes/login';
import cadastroUsuarioRouter from './routes/cadastroUsuario';
import comentariosRouter from './routes/comentarios';
import historicoRouter from './routes/historico';
import statusRouter from './routes/status';

const app = express();

// Porta definida pela variável de ambiente PORT ou, na ausência dela, 3000.
const PORTA = process.env.PORT || 3000;

// Pasta do front-end: dois níveis acima de servidor/src (ou de servidor/dist, após o build).
const PASTA_FRONTEND = path.join(__dirname, '..', '..', 'frontend');

// Permite receber o corpo das requisições em JSON (usado nas rotas POST, PUT e PATCH).
app.use(express.json());

// Entrega as telas do front-end. A página inicial (/) é o frontend/index.html (login).
app.use(express.static(PASTA_FRONTEND));

// Rota de verificação: confirma que a API está em execução.
app.get('/api', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        mensagem: 'API do Sistema de Acompanhamento de Demandas está funcionando.',
    });
});

// Rotas da API, uma por tela do sistema, todas com o prefixo /api.
app.use('/api', listagemRouter);        // GET /api/demandas e /api/demandas/filtros (Bruno Mareto)
app.use('/api', statusRouter);          // PATCH /api/demandas/:id/status (Bruno Mareto)
app.use('/api', loginRouter);           // POST /api/login (Kauan Paixão)
app.use('/api', cadastroUsuarioRouter); // POST /api/cadastro (Kauan Paixão)
app.use('/api', comentariosRouter);     // GET e POST /api/demandas/:id/comentarios (Kauan Paixão)
app.use('/api', historicoRouter);       // GET /api/demandas/:id/historico (Kauan Paixão)

// Inicia o servidor na porta definida acima.
app.listen(PORTA, () => {
    console.log(`Servidor rodando em http://localhost:${PORTA}`);
});
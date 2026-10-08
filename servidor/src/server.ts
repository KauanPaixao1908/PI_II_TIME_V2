// Autor: Bruno Mareto
//
// Ponto de entrada do backend (API) do Sistema de Acompanhamento de Demandas.
// Cria a aplicação Express, registra as rotas de cada tela e inicia o servidor.
// Na Reunião 4 os dados ficam em memória (src/data); a conexão com o banco de
// dados será feita em etapa posterior.

import express, { Request, Response } from 'express';
import listagemRouter from './routes/listagem';

const app = express();

// Porta definida pela variável de ambiente PORT ou, na ausência dela, 3000.
const PORTA = process.env.PORT || 3000;

// Permite receber o corpo das requisições em JSON (usado nas rotas POST).
app.use(express.json());

// Rota de verificação: confirma que o servidor está em execução.
app.get('/', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        mensagem: 'Servidor do Sistema de Acompanhamento de Demandas está funcionando.',
    });
});

// Rotas da API, uma por tela do sistema.
app.use(listagemRouter); // GET /demandas (Bruno Mareto)

// Inicia o servidor na porta definida acima.
app.listen(PORTA, () => {
    console.log(`Servidor rodando em http://localhost:${PORTA}`);
});
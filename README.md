# PI_II_TIME_V2
Grupo 5 - Sala 3

## Descrição do projeto

Projeto desenvolvido para a disciplina de Projeto Integrador II - Engenharia de Software da PUC-Campinas.

O sistema é uma aplicação web para gerenciar e acompanhar demandas de desenvolvimento de software, permitindo cadastrar, organizar, filtrar e atualizar tarefas, bugs, melhorias e documentações, usando frontend, backend e banco de dados.

## Integrantes

- Kauan Paixão Benedito
- Bruno de Souza Mareto
- Miguel Bueno Peixe Del Bianco
- Leonardo Justo Miziara

## Objetivos

- Desenvolver um sistema de acompanhamento de demandas de desenvolvimento para organizar, distribuir e acompanhar tarefas, bugs, melhorias e outras atividades de seus projetos.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Front-end | HTML, CSS e JavaScript |
| Back-end | Node.js (LTS), TypeScript e Express |
| Banco de dados | MySQL |

## Estrutura do projeto

```
PI_II_TIME_V2/
├── frontend/              Telas do sistema (entregues pelo servidor)
│   ├── index.html         Login
│   ├── criar-conta.html   Criação de conta
│   ├── pages/             Dashboard, Listagem, Cadastro e Detalhes de demanda
│   ├── css/               Um arquivo de estilo por tela
│   └── js/                Um arquivo de script por tela
└── servidor/              API (Node.js + TypeScript + Express)
    ├── package.json       Dependências e comandos (npm run dev)
    ├── tsconfig.json      Configuração do TypeScript
    └── src/
        ├── server.ts      Ponto de entrada: entrega o front-end e registra as rotas
        ├── tipos.ts       Tipos de Demanda, Usuário, Projeto e Comentário
        ├── routes/        Rotas da API, uma por tela
        └── data/          Dados em memória (substituídos pelo banco na integração)
```

## Como executar

### Pré-requisitos

- [Node.js](https://nodejs.org/) na versão LTS
- [Git](https://git-scm.com/)

### Passo a passo

1. Clonar o repositório e entrar na pasta:

   ```
   git clone https://github.com/KauanPaixao1908/PI_II_TIME_V2.git
   cd PI_II_TIME_V2
   ```

2. Ir para a branch de integração, que reúne o front-end e o back-end:

   ```
   git switch feature/integracao
   ```

3. Instalar as dependências do servidor:

   ```
   cd servidor
   npm install
   ```

4. Iniciar o servidor:

   ```
   npm run dev
   ```

5. Abrir o sistema no navegador: **http://localhost:3000**

O servidor entrega as telas da pasta `frontend/` e responde à API no mesmo endereço, com o prefixo `/api`. Por isso as telas não devem ser abertas com dois cliques no arquivo: elas precisam ser acessadas pelo endereço do servidor.

> **Windows (PowerShell):** se o `npm` mostrar o erro "a execução de scripts foi desabilitada neste sistema", execute uma vez `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` e tente novamente.

### Outros comandos (dentro de `servidor/`)

| Comando | Função |
| --- | --- |
| `npm run dev` | Inicia o servidor e reinicia sozinho a cada alteração no código |
| `npx tsc --noEmit` | Confere os tipos do TypeScript sem gerar arquivos |
| `npm run build` | Compila o TypeScript para JavaScript na pasta `dist/` |
| `npm start` | Executa a versão compilada |

## Banco de dados

O script do banco (`Banco_PI_II.sql`) está na branch `Banco-de-dados`. Ele cria o banco `pi2_demandas` com as tabelas `usuario`, `projeto`, `projeto_usuario`, `demanda`, `comentario` e `historico`, além de dados de exemplo. Para criar o banco, execute o script no MySQL Workbench.

## Rotas da API

Todas as rotas usam o prefixo `/api` e respondem em JSON.

| Método | Rota | Descrição | Respostas | Autor |
| --- | --- | --- | --- | --- |
| GET | `/api` | Confirma que a API está em execução | 200 | Bruno Mareto |
| GET | `/api/demandas` | Lista as demandas com filtros, busca e ordenação | 200, 400 | Bruno Mareto |

Parâmetros aceitos em `GET /api/demandas` (todos opcionais):

| Parâmetro | Exemplo | Descrição |
| --- | --- | --- |
| `status` | `?status=Aberta` | Aberta, Em andamento, Em revisão, Concluída ou Cancelada |
| `prioridade` | `?prioridade=Alta` | Crítica, Alta, Média ou Baixa |
| `tipo` | `?tipo=Defeito` | Tarefa, Defeito, Melhoria ou Documentação |
| `responsavelId` | `?responsavelId=4` | Id do responsável |
| `projetoId` | `?projetoId=2` | Id do projeto |
| `busca` | `?busca=login` | Texto procurado no título ou na descrição |
| `ordenar` | `?ordenar=prazo` | prioridade, criadaEm, prazo ou status |
| `ordem` | `?ordem=desc` | asc (padrão) ou desc |

Exemplos para testar no navegador ou no Thunder Client:

- `http://localhost:3000/api/demandas?status=Aberta` → **200** com a lista
- `http://localhost:3000/api/demandas?status=Pendente` → **400** com a mensagem de erro

Cada integrante acrescenta aqui as rotas da sua tela quando elas forem registradas no `server.ts`.

## Como trabalhar no repositório

1. Atualizar e partir da branch de integração:

   ```
   git fetch
   git switch feature/integracao
   git pull
   git switch -c feature/nome-da-tarefa
   ```

2. Fazer os commits pelo VS Code, com mensagens claras e comentário de autor nos arquivos novos.
3. Enviar a branch (`git push -u origin feature/nome-da-tarefa`) e abrir um Pull Request para a `feature/integracao`.
4. Registrar a rota nova no `server.ts` com `app.use('/api', nomeDoRouter)`.

Não envie arquivos pelo site do GitHub nas branches de outros integrantes: use sempre uma branch própria e um Pull Request.
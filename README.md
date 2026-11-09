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

## Tecnologias e dependências

| Camada | Tecnologias |
| --- | --- |
| Front-end | HTML, CSS e JavaScript |
| Back-end | Node.js (LTS), TypeScript e Express |
| Banco de dados | MySQL |

Bibliotecas do servidor (instaladas pelo `npm install`):

| Biblioteca | Uso |
| --- | --- |
| `express` | Servidor HTTP e rotas da API |
| `mysql2` | Conexão com o MySQL |
| `bcrypt` | Hash das senhas dos usuários |
| `jsonwebtoken` | Token de login (JWT) |
| `dotenv` | Leitura das configurações do arquivo `.env` |
| `typescript`, `tsx` | Compilação e execução do TypeScript (desenvolvimento) |

## Estrutura do projeto

```
PI_II_TIME_V2/
├── banco/
│   ├── Banco_PI_II.sql      Criação do banco, das tabelas e dos projetos
│   └── dados_teste.sql      Carga de dados de teste (usuários, demandas, histórico)
├── frontend/                Telas do sistema (entregues pelo servidor)
│   ├── index.html           Login
│   ├── criar-conta.html     Criação de conta
│   ├── pages/               Dashboard, Listagem, Cadastro e Detalhes de demanda
│   ├── css/                 Um arquivo de estilo por tela
│   └── js/                  Um arquivo de script por tela
└── servidor/                API (Node.js + TypeScript + Express)
    ├── .env.example         Modelo das configurações de ambiente
    ├── package.json         Dependências e comandos
    └── src/
        ├── server.ts        Ponto de entrada: entrega o front-end e registra as rotas
        ├── db.ts            Conexão com o MySQL
        ├── acessoDemanda.ts Verificação de acesso a uma demanda
        ├── tipos.ts         Tipos de Demanda, Usuário, Projeto e Comentário
        └── routes/          Rotas da API
```

## Como executar

### Pré-requisitos

- [Node.js](https://nodejs.org/) na versão LTS
- [Git](https://git-scm.com/)
- [MySQL Community Server](https://dev.mysql.com/downloads/mysql/) e [MySQL Workbench](https://dev.mysql.com/downloads/workbench/)

### 1. Baixar o projeto

```
git clone https://github.com/KauanPaixao1908/PI_II_TIME_V2.git
cd PI_II_TIME_V2
git switch feature/integracao
```

### 2. Criar o banco de dados

No MySQL Workbench, conectado ao servidor local, execute os scripts **nesta ordem**:

1. `banco/Banco_PI_II.sql`: cria o banco `pi2_demandas`, as tabelas `usuario`, `projeto`, `projeto_usuario`, `demanda`, `comentario` e `historico`, e os projetos.
2. `banco/dados_teste.sql`: cria os usuários de teste, os vínculos com os projetos, demandas, comentários e histórico.

Atenção: o `Banco_PI_II.sql` apaga e recria o banco. Executá-lo de novo remove todos os dados.

### 3. Configurar o ambiente

Dentro de `servidor/`, copie o arquivo `.env.example` para `.env` e preencha com os dados do seu MySQL:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha_do_mysql
DB_NAME=pi2_demandas
JWT_SECRET=uma_chave_aleatoria
```

Para gerar o `JWT_SECRET`:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

O arquivo `.env` não é enviado ao GitHub (está no `.gitignore`).

### 4. Instalar e iniciar o servidor

```
cd servidor
npm install
npm run dev
```

O terminal deve mostrar `Servidor rodando em http://localhost:3000` e `Conectado ao MySQL.`

> **Windows (PowerShell):** se o `npm` mostrar o erro "a execução de scripts foi desabilitada neste sistema", execute uma vez `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` e tente novamente.

### 5. Abrir o sistema

Acesse **http://localhost:3000** no navegador. O servidor entrega as telas da pasta `frontend/` e responde à API no mesmo endereço, com o prefixo `/api`. As telas não devem ser abertas com dois cliques no arquivo.

### Usuários de teste

Criados pelo `dados_teste.sql`. Todos usam a senha **senha123**.

| E-mail | Nome | Perfil | Projetos |
| --- | --- | --- | --- |
| admin@pi2.com | Ana Souza | Administrador | Todos |
| lider@pi2.com | Lucas Lima | Líder de Projeto | Portal Acadêmico e App Biblioteca |
| maria@pi2.com | Maria Alves | Membro da Equipe | Portal Acadêmico |
| joao@pi2.com | João Pereira | Membro da Equipe | Portal Acadêmico e App Biblioteca |

Contas criadas pela tela **Criar conta** entram como Membro da Equipe.

### Outros comandos (dentro de `servidor/`)

| Comando | Função |
| --- | --- |
| `npm run dev` | Inicia o servidor e reinicia sozinho a cada alteração no código |
| `npx tsc --noEmit` | Confere os tipos do TypeScript sem gerar arquivos |
| `npm run build` | Compila o TypeScript para JavaScript na pasta `dist/` |
| `npm start` | Executa a versão compilada |

## Regras de negócio

**Fluxo de status:** Aberta → Em andamento → Em revisão → Concluída, com retorno de Em revisão para Em andamento. Demandas Abertas, Em andamento ou Em revisão podem ser canceladas. Não é permitido concluir direto de Em andamento, voltar para Aberta nem alterar demandas Concluídas ou Canceladas. Toda alteração de status é registrada no histórico. Não existe exclusão de demandas.

**Perfis**, com as restrições aplicadas no back-end:

| Perfil | Acesso |
| --- | --- |
| Administrador | Todas as demandas e todas as transições de status |
| Líder de Projeto | Demandas dos projetos vinculados e todas as transições de status |
| Membro da Equipe | Demandas dos projetos vinculados; altera o status só das demandas atribuídas a ele, de Aberta para Em andamento e de Em andamento para Em revisão; não cria, conclui nem cancela demandas |

## Rotas da API

Todas as rotas usam o prefixo `/api` e respondem em JSON. As rotas marcadas com 🔒 exigem o token do login no cabeçalho `Authorization: Bearer <token>`.

| Método | Rota | Descrição | Respostas | Autor |
| --- | --- | --- | --- | --- |
| GET | `/api` | Confirma que a API está em execução | 200 | Bruno Mareto |
| POST | `/api/login` | Login com e-mail e senha; devolve o token e o usuário | 200, 400, 401 | Kauan Paixão |
| POST | `/api/cadastro` | Cria uma conta (perfil Membro da Equipe) | 201, 400, 409 | Kauan Paixão |
| GET 🔒 | `/api/demandas` | Lista as demandas visíveis ao usuário, com filtros, busca e ordenação | 200, 400, 401 | Bruno Mareto |
| GET 🔒 | `/api/demandas/filtros` | Projetos e responsáveis disponíveis nos filtros | 200, 401 | Bruno Mareto |
| PATCH 🔒 | `/api/demandas/:id/status` | Altera o status conforme o fluxo e o perfil | 200, 400, 401, 403, 404 | Bruno Mareto |
| GET 🔒 | `/api/demandas/:id/comentarios` | Lista os comentários de uma demanda | 200, 400, 401, 403, 404 | Kauan Paixão |
| POST 🔒 | `/api/demandas/:id/comentarios` | Registra um comentário | 201, 400, 401, 403, 404 | Kauan Paixão |
| GET 🔒 | `/api/demandas/:id/historico` | Lista o histórico de alterações | 200, 400, 401, 403, 404 | Kauan Paixão |

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

Corpo de `PATCH /api/demandas/:id/status`:

```json
{ "status": "Em andamento" }
```

## Testes

Os testes de API podem ser feitos no Thunder Client, Postman ou Insomnia. Primeiro, faça `POST /api/login` com `{ "email": "admin@pi2.com", "senha": "senha123" }` e use o `token` devolvido no cabeçalho `Authorization: Bearer <token>` das demais rotas.

| Cenário | Requisição | Resultado esperado |
| --- | --- | --- |
| Login válido | `POST /api/login` com admin@pi2.com e senha123 | 200 com token |
| Login inválido | `POST /api/login` com senha errada | 401 "E-mail ou senha inválidos." |
| Acesso sem login | `GET /api/demandas` sem token | 401 |
| Listagem com filtro | `GET /api/demandas?status=Aberta&ordenar=prioridade` | 200, críticas primeiro |
| Filtro inválido | `GET /api/demandas?status=Pendente` | 400 com os valores aceitos |
| Restrição por projeto | `GET /api/demandas` com maria@pi2.com | 200, só demandas do Portal Acadêmico |
| Transição válida | `PATCH /api/demandas/1/status` `{ "status": "Em andamento" }` com maria@pi2.com | 200 e registro no histórico |
| Transição proibida | `PATCH /api/demandas/2/status` `{ "status": "Concluída" }` com status Em andamento | 400 "Transição não permitida" |
| Membro concluindo | `PATCH` para Concluída com maria@pi2.com em demanda Em revisão | 403 |
| Membro em demanda de outro projeto | `PATCH /api/demandas/3/status` com maria@pi2.com | 403 |
| Status final | `PATCH /api/demandas/4/status` `{ "status": "Aberta" }` | 400 |
| Demanda inexistente | `PATCH /api/demandas/999/status` | 404 |

Na interface: entrar com cada perfil em http://localhost:3000, conferir a listagem, os filtros e a alteração de status pela coluna **Ações** da Listagem de Demandas.

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

## Versão de entrega

A versão apresentada à banca é marcada com a tag `1.0.0-final`.
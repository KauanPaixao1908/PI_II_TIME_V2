-- =====================================================================
-- Sistema de Acompanhamento de Demandas - Projeto Integrador 2
-- Versão SIMPLES (sem triggers e sem views)
-- Autor: <PREENCHER NOME DO AUTOR DO ARQUIVO>
-- =====================================================================
-- As regras (ciclo de vida do status, permissões por perfil, histórico,
-- feriado) ficam no BACKEND (Node/TypeScript). O banco só guarda os dados.

DROP DATABASE IF EXISTS pi2_demandas;
CREATE DATABASE pi2_demandas CHARACTER SET utf8mb4;
USE pi2_demandas;

-- ---------------------------------------------------------------------
-- USUÁRIOS (cadastrados direto no banco, sem tela de cadastro)
-- ---------------------------------------------------------------------
CREATE TABLE usuario (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nome   VARCHAR(100) NOT NULL,
  email  VARCHAR(150) NOT NULL UNIQUE,
  senha  VARCHAR(255) NOT NULL,
  perfil ENUM('Administrador','Líder de Projeto','Membro da Equipe') NOT NULL
);

-- ---------------------------------------------------------------------
-- PROJETOS (cadastrados direto no banco)
-- ---------------------------------------------------------------------
CREATE TABLE projeto (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  nome      VARCHAR(100) NOT NULL,
  descricao TEXT
);

-- Quais usuários participam de quais projetos
CREATE TABLE projeto_usuario (
  projeto_id INT NOT NULL,
  usuario_id INT NOT NULL,
  PRIMARY KEY (projeto_id, usuario_id),
  FOREIGN KEY (projeto_id) REFERENCES projeto(id),
  FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

-- ---------------------------------------------------------------------
-- DEMANDAS
-- Não existe DELETE: para "excluir" a demanda vira status 'Cancelada'.
-- ---------------------------------------------------------------------
CREATE TABLE demanda (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  titulo            VARCHAR(150) NOT NULL,
  descricao         TEXT NOT NULL,
  tipo              ENUM('Tarefa','Defeito','Melhoria','Documentação') NOT NULL,
  prioridade        ENUM('Crítica','Alta','Média','Baixa') NOT NULL,
  status            ENUM('Aberta','Em andamento','Em revisão','Concluída','Cancelada')
                    NOT NULL DEFAULT 'Aberta',
  projeto_id        INT NOT NULL,
  responsavel_id    INT NULL,
  data_criacao      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
  prazo_finalizacao DATE NULL,
  FOREIGN KEY (projeto_id)     REFERENCES projeto(id),
  FOREIGN KEY (responsavel_id) REFERENCES usuario(id)
);

-- ---------------------------------------------------------------------
-- COMENTÁRIOS
-- ---------------------------------------------------------------------
CREATE TABLE comentario (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  demanda_id INT NOT NULL,
  usuario_id INT NOT NULL,
  texto      TEXT NOT NULL,
  data_hora  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (demanda_id) REFERENCES demanda(id),
  FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

-- ---------------------------------------------------------------------
-- HISTÓRICO DE ALTERAÇÕES
-- O backend grava a frase pronta, por exemplo:
-- 'João alterou o status da demanda de Aberta para Em andamento.'
-- ---------------------------------------------------------------------
CREATE TABLE historico (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  demanda_id INT NOT NULL,
  usuario_id INT NOT NULL,
  descricao  VARCHAR(255) NOT NULL,
  data_hora  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (demanda_id) REFERENCES demanda(id),
  FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

-- =====================================================================
-- DADOS DE EXEMPLO
-- (as senhas precisam ser trocadas por hash gerado pelo backend)
-- =====================================================================
INSERT INTO usuario (nome, email, senha, perfil) VALUES
  ('Ana',   'admin@pi2.com', 'trocar_por_hash', 'Administrador'),
  ('Lucas', 'lider@pi2.com', 'trocar_por_hash', 'Líder de Projeto'),
  ('Maria', 'maria@pi2.com', 'trocar_por_hash', 'Membro da Equipe'),
  ('João',  'joao@pi2.com',  'trocar_por_hash', 'Membro da Equipe');

INSERT INTO projeto (nome, descricao) VALUES
  ('Portal Acadêmico', 'Consulta de notas e matrículas'),
  ('App Biblioteca',   'Empréstimo e reserva de livros');

INSERT INTO projeto_usuario (projeto_id, usuario_id) VALUES
  (1, 2), (1, 3), (1, 4),
  (2, 2), (2, 4);

INSERT INTO demanda (titulo, descricao, tipo, prioridade, projeto_id, responsavel_id, prazo_finalizacao) VALUES
  ('Erro ao fazer login', 'Usuário não consegue entrar', 'Defeito',      'Crítica', 1, 3,    DATE_ADD(CURDATE(), INTERVAL 3 DAY)),
  ('Tela de relatório',   'Relatório de notas por turma', 'Tarefa',      'Alta',    1, 4,    DATE_ADD(CURDATE(), INTERVAL 15 DAY)),
  ('Melhorar busca',      'Buscar livros por autor',      'Melhoria',    'Média',   2, NULL, NULL),
  ('Documentar API',      'Documentar os endpoints',      'Documentação','Baixa',   2, 4,    NULL);

INSERT INTO comentario (demanda_id, usuario_id, texto) VALUES
  (1, 3, 'Consegui reproduzir o erro.');

INSERT INTO historico (demanda_id, usuario_id, descricao) VALUES
  (1, 2, 'Lucas criou a demanda.');

-- =====================================================================
-- COMANDOS QUE O BACKEND VAI USAR (? = valor que vem do código)
-- =====================================================================

-- LOGIN
-- SELECT * FROM usuario WHERE email = ?;

-- CADASTRAR DEMANDA (status já nasce 'Aberta' pelo DEFAULT)
-- INSERT INTO demanda (titulo, descricao, tipo, prioridade, projeto_id, responsavel_id, prazo_finalizacao)
-- VALUES (?, ?, ?, ?, ?, ?, ?);

-- LISTAR DEMANDAS (com nome do projeto e do responsável)
-- SELECT d.id, d.titulo, d.tipo, d.prioridade, d.status,
--        p.nome AS projeto, u.nome AS responsavel,
--        d.data_criacao, d.prazo_finalizacao
-- FROM demanda d
-- JOIN projeto p ON p.id = d.projeto_id
-- LEFT JOIN usuario u ON u.id = d.responsavel_id;

-- FILTRAR POR STATUS E PRIORIDADE + BUSCA POR TEXTO + ORDENAR
-- SELECT * FROM demanda
-- WHERE status = ? AND prioridade = ?
--   AND (titulo LIKE ? OR descricao LIKE ?)
-- ORDER BY data_criacao DESC;

-- DETALHES DE UMA DEMANDA
-- SELECT * FROM demanda WHERE id = ?;

-- EDITAR DEMANDA
-- UPDATE demanda SET titulo = ?, descricao = ?, tipo = ?, prioridade = ?,
--        responsavel_id = ?, prazo_finalizacao = ? WHERE id = ?;

-- ATUALIZAR STATUS (o backend confere antes se a transição é permitida)
-- UPDATE demanda SET status = ? WHERE id = ?;

-- CANCELAR DEMANDA (nunca DELETE!)
-- UPDATE demanda SET status = 'Cancelada' WHERE id = ?;

-- COMENTÁRIOS DE UMA DEMANDA
-- SELECT c.texto, c.data_hora, u.nome
-- FROM comentario c JOIN usuario u ON u.id = c.usuario_id
-- WHERE c.demanda_id = ? ORDER BY c.data_hora;
-- INSERT INTO comentario (demanda_id, usuario_id, texto) VALUES (?, ?, ?);

-- HISTÓRICO DE UMA DEMANDA
-- SELECT descricao, data_hora FROM historico WHERE demanda_id = ? ORDER BY data_hora;
-- INSERT INTO historico (demanda_id, usuario_id, descricao) VALUES (?, ?, ?);

-- DASHBOARD
-- SELECT COUNT(*) FROM demanda;                                       -- total
-- SELECT status, COUNT(*) FROM demanda GROUP BY status;               -- por status
-- SELECT prioridade, COUNT(*) FROM demanda GROUP BY prioridade;       -- por prioridade
-- SELECT tipo, COUNT(*) FROM demanda GROUP BY tipo;                   -- por tipo
-- SELECT * FROM demanda WHERE prioridade = 'Crítica' AND status = 'Aberta';  -- críticas abertas
-- SELECT * FROM demanda                                               -- próximas do prazo
-- WHERE prazo_finalizacao BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
--   AND status NOT IN ('Concluída','Cancelada');

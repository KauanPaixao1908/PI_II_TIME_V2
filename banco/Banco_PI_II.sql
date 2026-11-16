-- Autor: <Kauan Paixão>
-- As regras (ciclo de vida do status, permissões por perfil, histórico,
-- feriado) ficam no BACKEND (Node/TypeScript). O banco só guarda os dados.

DROP DATABASE IF EXISTS pi2_demandas;
CREATE DATABASE pi2_demandas CHARACTER SET utf8mb4;
USE pi2_demandas;

-- USUÁRIOS
-- Admin e Líder são cadastrados direto no banco.
-- Pela tela "Criar conta" o usuário entra como 'Membro da Equipe'.

CREATE TABLE usuario (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nome   VARCHAR(100) NOT NULL,
  email  VARCHAR(150) NOT NULL UNIQUE,
  senha  VARCHAR(255) NOT NULL,
  perfil ENUM('Administrador','Líder de Projeto','Membro da Equipe') NOT NULL
);

-- PROJETOS (cadastrados direto no banco)
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

-- DEMANDAS
-- Não existe DELETE: para "excluir" a demanda vira status 'Cancelada'.

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

-- COMENTÁRIOS
CREATE TABLE comentario (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  demanda_id INT NOT NULL,
  usuario_id INT NOT NULL,
  texto      TEXT NOT NULL,
  data_hora  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (demanda_id) REFERENCES demanda(id),
  FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

-- HISTÓRICO DE ALTERAÇÕES
-- O backend grava a frase pronta, por exemplo:
-- 'João alterou o status da demanda de Aberta para Em andamento.'

CREATE TABLE historico (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  demanda_id INT NOT NULL,
  usuario_id INT NOT NULL,
  descricao  VARCHAR(255) NOT NULL,
  data_hora  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (demanda_id) REFERENCES demanda(id),
  FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

-- DADOS INICIAIS
-- O banco começa SEM usuários e SEM demandas.
-- Os usuários são criados pela tela "Criar conta" (entram como
-- 'Membro da Equipe') e as demandas serão criadas pelo sistema.
-- Só os projetos já vêm cadastrados, porque não existe tela para eles.

INSERT INTO projeto (nome, descricao) VALUES
  ('Portal Acadêmico', 'Consulta de notas e matrículas'),
  ('App Biblioteca',   'Empréstimo e reserva de livros');

-- Para tornar alguém Administrador ou Líder depois que a pessoa criar
-- a conta pela tela, rode (trocando o e-mail):
--   UPDATE usuario SET perfil = 'Administrador'    WHERE email = 'seu@email.com';
--   UPDATE usuario SET perfil = 'Líder de Projeto' WHERE email = 'seu@email.com';
-- Para colocar um usuário em um projeto:
--   INSERT INTO projeto_usuario (projeto_id, usuario_id)
--   SELECT 1, id FROM usuario WHERE email = 'seu@email.com';


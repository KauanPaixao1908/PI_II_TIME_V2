-- =====================================================================
-- Sistema de Acompanhamento de Demandas - Projeto Integrador 2
-- Carga inicial de dados de teste
-- Autor: Bruno Mareto
-- =====================================================================
-- Executar DEPOIS do Banco_PI_II.sql (que cria o banco e os projetos).
-- Cria um usuário de cada perfil, os vínculos com os projetos, demandas
-- com tipos, prioridades e status variados, comentários e histórico,
-- para demonstrar filtros, permissões, fluxo de status e dashboard.
--
-- Usuários de teste (todos com a senha: senha123)
--   admin@pi2.com  -> Ana Souza     (Administrador)
--   lider@pi2.com  -> Lucas Lima    (Líder de Projeto, projetos 1 e 2)
--   maria@pi2.com  -> Maria Alves   (Membro da Equipe, projeto 1)
--   joao@pi2.com   -> João Pereira  (Membro da Equipe, projetos 1 e 2)
-- A senha está guardada como hash bcrypt, igual às contas criadas pelo sistema.
-- Os prazos não caem em feriados nacionais.

USE pi2_demandas;

INSERT INTO usuario (id, nome, email, senha, perfil) VALUES
  (1, 'Ana Souza',    'admin@pi2.com', '$2b$10$ZdvF3vS.qcQjVrNOg20xi.pnUXnf3qV3TdfcyKoHQnndvwrn10PXO', 'Administrador'),
  (2, 'Lucas Lima',   'lider@pi2.com', '$2b$10$ZdvF3vS.qcQjVrNOg20xi.pnUXnf3qV3TdfcyKoHQnndvwrn10PXO', 'Líder de Projeto'),
  (3, 'Maria Alves',  'maria@pi2.com', '$2b$10$ZdvF3vS.qcQjVrNOg20xi.pnUXnf3qV3TdfcyKoHQnndvwrn10PXO', 'Membro da Equipe'),
  (4, 'João Pereira', 'joao@pi2.com',  '$2b$10$ZdvF3vS.qcQjVrNOg20xi.pnUXnf3qV3TdfcyKoHQnndvwrn10PXO', 'Membro da Equipe');

-- Projeto 1 = Portal Acadêmico; projeto 2 = App Biblioteca (criados no Banco_PI_II.sql).
INSERT INTO projeto_usuario (projeto_id, usuario_id) VALUES
  (1, 2), (1, 3), (1, 4),
  (2, 2), (2, 4);

INSERT INTO demanda (id, titulo, descricao, tipo, prioridade, status, projeto_id, responsavel_id,
                     data_criacao, data_atualizacao, prazo_finalizacao) VALUES
  (1, 'Erro ao fazer login no portal', 'Alunos com e-mail em maiúsculas não conseguem entrar.',
      'Defeito', 'Crítica', 'Aberta', 1, 3, '2026-11-03 09:15:00', '2026-11-03 09:15:00', '2026-11-12'),
  (2, 'Tela de relatório de notas', 'Relatório de notas por turma, com exportação em PDF.',
      'Tarefa', 'Alta', 'Em andamento', 1, 3, '2026-11-02 10:00:00', '2026-11-05 14:30:00', '2026-11-27'),
  (3, 'Melhorar a busca de livros', 'Permitir buscar livros pelo nome do autor.',
      'Melhoria', 'Média', 'Em revisão', 2, 4, '2026-10-28 08:40:00', '2026-11-06 16:00:00', '2026-11-13'),
  (4, 'Documentar a API de empréstimos', 'Descrever os endpoints, parâmetros e respostas.',
      'Documentação', 'Baixa', 'Concluída', 2, 4, '2026-10-20 11:20:00', '2026-11-04 10:10:00', '2026-11-06'),
  (5, 'Erro na reserva duplicada', 'O sistema permite reservar o mesmo livro duas vezes.',
      'Defeito', 'Crítica', 'Aberta', 2, NULL, '2026-11-07 15:45:00', '2026-11-07 15:45:00', NULL),
  (6, 'Página de matrícula lenta', 'A página de matrícula demora mais de 10 segundos para abrir.',
      'Melhoria', 'Alta', 'Aberta', 1, 4, '2026-11-08 09:00:00', '2026-11-08 09:00:00', '2026-12-04'),
  (7, 'Tela de cadastro de livros', 'Cadastro de livros com título, autor e ISBN.',
      'Tarefa', 'Média', 'Cancelada', 2, NULL, '2026-10-25 13:00:00', '2026-11-01 09:30:00', NULL),
  (8, 'Manual do aluno', 'Guia de uso do portal para os alunos.',
      'Documentação', 'Baixa', 'Aberta', 1, NULL, '2026-11-09 08:00:00', '2026-11-09 08:00:00', '2026-12-11');

INSERT INTO comentario (demanda_id, usuario_id, texto, data_hora) VALUES
  (1, 3, 'Consegui reproduzir o erro com o e-mail ALUNO@PUC.EDU.BR.', '2026-11-03 10:05:00'),
  (3, 2, 'Falta tratar autores com acento na busca.', '2026-11-06 16:20:00');

INSERT INTO historico (demanda_id, usuario_id, descricao, data_hora) VALUES
  (1, 2, 'Lucas Lima criou a demanda.', '2026-11-03 09:15:00'),
  (2, 2, 'Lucas Lima criou a demanda.', '2026-11-02 10:00:00'),
  (2, 3, 'Maria Alves alterou o status da demanda de Aberta para Em andamento.', '2026-11-05 14:30:00'),
  (3, 2, 'Lucas Lima criou a demanda.', '2026-10-28 08:40:00'),
  (3, 4, 'João Pereira alterou o status da demanda de Aberta para Em andamento.', '2026-10-30 09:00:00'),
  (3, 4, 'João Pereira alterou o status da demanda de Em andamento para Em revisão.', '2026-11-06 16:00:00'),
  (4, 1, 'Ana Souza criou a demanda.', '2026-10-20 11:20:00'),
  (4, 4, 'João Pereira alterou o status da demanda de Aberta para Em andamento.', '2026-10-22 08:30:00'),
  (4, 4, 'João Pereira alterou o status da demanda de Em andamento para Em revisão.', '2026-11-01 17:00:00'),
  (4, 2, 'Lucas Lima alterou o status da demanda de Em revisão para Concluída.', '2026-11-04 10:10:00'),
  (5, 1, 'Ana Souza criou a demanda.', '2026-11-07 15:45:00'),
  (6, 2, 'Lucas Lima criou a demanda.', '2026-11-08 09:00:00'),
  (7, 1, 'Ana Souza criou a demanda.', '2026-10-25 13:00:00'),
  (7, 1, 'Ana Souza alterou o status da demanda de Aberta para Cancelada.', '2026-11-01 09:30:00'),
  (8, 2, 'Lucas Lima criou a demanda.', '2026-11-09 08:00:00');
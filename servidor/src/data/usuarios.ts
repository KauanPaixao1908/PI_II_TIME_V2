// Autor: Bruno Mareto
// Usuários de teste mantidos em memória (Reunião 4: dados ainda sem banco de dados).
// Contempla os três perfis exigidos (Documento de Visão, 2.1) e o vínculo de cada
// usuário com os projetos de src/data/projetos.ts. As senhas são fictícias.

import { Usuario } from '../tipos';

export const usuarios: Usuario[] = [
    {
        id: 1,
        nome: 'Ana Souza',
        email: 'ana.souza@exemplo.com',
        senha: 'admin123',
        perfil: 'Administrador',
        projetoIds: [1, 2, 3],
    },
    {
        id: 2,
        nome: 'Carlos Lima',
        email: 'carlos.lima@exemplo.com',
        senha: 'lider123',
        perfil: 'Líder de Projeto',
        projetoIds: [1, 2],
    },
    {
        id: 3,
        nome: 'Fernanda Rocha',
        email: 'fernanda.rocha@exemplo.com',
        senha: 'lider456',
        perfil: 'Líder de Projeto',
        projetoIds: [3],
    },
    {
        id: 4,
        nome: 'João Pereira',
        email: 'joao.pereira@exemplo.com',
        senha: 'membro123',
        perfil: 'Membro da Equipe',
        projetoIds: [1],
    },
    {
        id: 5,
        nome: 'Mariana Alves',
        email: 'mariana.alves@exemplo.com',
        senha: 'membro456',
        perfil: 'Membro da Equipe',
        projetoIds: [1, 3],
    },
    {
        id: 6,
        nome: 'Pedro Santos',
        email: 'pedro.santos@exemplo.com',
        senha: 'membro789',
        perfil: 'Membro da Equipe',
        projetoIds: [2],
    },
];
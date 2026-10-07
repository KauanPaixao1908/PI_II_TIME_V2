// Autor: Bruno Mareto
// Projetos de teste mantidos em memória (Reunião 4: dados ainda sem banco de dados).
// Os projetos podem ser previamente inseridos, sem tela de cadastro (Documento de Visão, 2.1).
// Cada demanda deve estar vinculada a um destes projetos (2.2).

import { Projeto } from '../tipos';

export const projetos: Projeto[] = [
    {
        id: 1,
        nome: 'Portal do Cliente',
        descricao: 'Aplicação web para clientes consultarem pedidos e abrirem chamados.',
    },
    {
        id: 2,
        nome: 'App de Entregas',
        descricao: 'Aplicativo para acompanhamento de entregas em tempo real.',
    },
    {
        id: 3,
        nome: 'Sistema Financeiro',
        descricao: 'Sistema interno de controle de contas a pagar e a receber.',
    },
];
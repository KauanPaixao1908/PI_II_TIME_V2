// Autor: Bruno Mareto
// Tipos de dados do Sistema de Acompanhamento de Demandas, definidos conforme
// o Documento de Visão do PI2. Utilizados pelas rotas da API e pelos dados
// de teste em src/data.

// Tipos de demanda (Documento de Visão, 2.2.1).
export type TipoDemanda = 'Tarefa' | 'Defeito' | 'Melhoria' | 'Documentação';

// Prioridades de uma demanda (2.2.2).
export type Prioridade = 'Crítica' | 'Alta' | 'Média' | 'Baixa';

// Status obrigatórios de uma demanda (2.2.3). Toda demanda inicia como 'Aberta'.
export type StatusDemanda = 'Aberta' | 'Em andamento' | 'Em revisão' | 'Concluída' | 'Cancelada';

// Perfis de acesso dos usuários (2.1).
export type Perfil = 'Administrador' | 'Líder de Projeto' | 'Membro da Equipe';

// Usuário do sistema. A senha nunca deve ser retornada pela API.
// projetoIds indica os projetos aos quais o usuário está vinculado (2.1.2 e 2.1.3).
export interface Usuario {
    id: number;
    nome: string;
    email: string;
    senha: string;
    perfil: Perfil;
    projetoIds: number[];
}

// Projeto ao qual as demandas estão vinculadas.
export interface Projeto {
    id: number;
    nome: string;
    descricao: string;
}

// Demanda de desenvolvimento, com os campos mínimos exigidos (2.2.5).
// Responsável e prazo podem ficar em branco (null) e ser definidos depois.
// Datas de criação e atualização no formato AAAA-MM-DDTHH:mm:ss; prazo no formato AAAA-MM-DD.
export interface Demanda {
    id: number;
    titulo: string;
    descricao: string;
    tipo: TipoDemanda;
    prioridade: Prioridade;
    status: StatusDemanda;
    projetoId: number;
    responsavelId: number | null;
    criadaEm: string;
    atualizadaEm: string;
    prazo: string | null;
}

// Comentário vinculado a uma demanda e a um usuário, com data e horário (2.2.6).
export interface Comentario {
    id: number;
    demandaId: number;
    autorId: number;
    texto: string;
    criadoEm: string;
}
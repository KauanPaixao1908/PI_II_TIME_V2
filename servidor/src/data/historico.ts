// Autor: Kauan Paixão
// Arquivo: historico.ts
// Função: dados do histórico de alterações das demandas (em memória, antes de ligar ao banco).
// O histórico nunca é apagado, nem quando a demanda é cancelada.

// Formato de cada registro do histórico
export interface RegistroHistorico {
    id: number;
    demandaId: number;
    usuarioId: number;
    descricao: string; // frase pronta, ex.: "Maria alterou o status de Aberta para Em andamento."
    criadoEm: string;
}

export const historico: RegistroHistorico[] = [
    {
        id: 1,
        demandaId: 1,
        usuarioId: 2,
        descricao: "Lucas criou a demanda.",
        criadoEm: "2026-09-07T09:00:00"
    },
    {
        id: 2,
        demandaId: 1,
        usuarioId: 3,
        descricao: "Maria alterou o status da demanda de Aberta para Em andamento.",
        criadoEm: "2026-09-08T14:00:00"
    }
];

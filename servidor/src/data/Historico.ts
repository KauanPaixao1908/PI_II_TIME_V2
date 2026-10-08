// Autor: Kauan Paixao
// Histórico de alterações das demandas (nunca é apagado - item 2.2.7)

export interface RegistroHistorico {
    id: number;
    demandaId: number;
    usuarioId: number;
    descricao: string;
    dataHora: string; // ISO
}

export const historico: RegistroHistorico[] = [
    {
        id: 1,
        demandaId: 1,
        usuarioId: 3,
        descricao: "Bruno Lima alterou o status da demanda de Aberta para Em andamento.",
        dataHora: "2026-09-10T10:00:00.000Z"
    }
];

// Registra uma alteração relevante da demanda
export function registrarHistorico(
    demandaId: number,
    usuarioId: number,
    descricao: string
): RegistroHistorico {
    const proximoId = historico.reduce((maior, h) => Math.max(maior, h.id), 0) + 1;

    const registro: RegistroHistorico = {
        id: proximoId,
        demandaId,
        usuarioId,
        descricao,
        dataHora: new Date().toISOString()
    };

    historico.push(registro);
    return registro;
}
// Autor: Kauan Paixao
// Comentários das demandas (dados em memória para teste local)

export interface Comentario {
    id: number;
    demandaId: number;
    usuarioId: number;
    usuario: string;
    texto: string;
    dataHora: string; // ISO, registrado automaticamente
}

export const comentarios: Comentario[] = [
    {
        id: 1,
        demandaId: 1,
        usuarioId: 2,
        usuario: "Ana Martins",
        texto: "A demanda está em andamento.",
        dataHora: "2026-09-10T10:30:00.000Z"
    }
];

// Cria um comentário com id novo e data/hora automáticos
export function adicionarComentario(
    dados: Omit<Comentario, "id" | "dataHora">
): Comentario {
    const proximoId = comentarios.reduce((maior, c) => Math.max(maior, c.id), 0) + 1;

    const novo: Comentario = {
        id: proximoId,
        ...dados,
        dataHora: new Date().toISOString()
    };

    comentarios.push(novo);
    return novo;
}

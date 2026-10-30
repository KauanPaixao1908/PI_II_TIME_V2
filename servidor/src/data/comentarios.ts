// Autor: Kauan Paixão
// Arquivo: comentarios.ts
// Função: dados dos comentários das demandas (em memória, antes de ligar ao banco).
// Cada comentário fica ligado a uma demanda (demandaId) e a um usuário (autorId).

import { Comentario } from "../tipos";

export const comentarios: Comentario[] = [
    {
        id: 1,
        demandaId: 1,
        autorId: 3,
        texto: "Comecei a montar o layout da tela.",
        criadoEm: "2026-09-08T14:30:00"
    },
    {
        id: 2,
        demandaId: 1,
        autorId: 2,
        texto: "Lembrar de manter o mesmo padrão visual das outras telas.",
        criadoEm: "2026-09-09T10:15:00"
    }
];

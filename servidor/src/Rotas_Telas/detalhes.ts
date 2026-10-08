// Autor: SEU NOME
// Rotas de detalhes da demanda, comentários, histórico e status

import { Router, Request, Response } from "express";
import { demandas, projetos, STATUS, Demanda, StatusDemanda } from "../data/demandas";
import { usuarios, UsuarioPublico } from "../data/usuarios";
import { comentarios, adicionarComentario } from "../data/Comentarios";
import { historico, registrarHistorico } from "../data/Historico";
import { autenticar } from "../central/autenticacao";

const router = Router();

// Todas as rotas deste arquivo exigem usuário logado
router.use(autenticar);

const LIMITE_TEXTO = 1000;

// Converte o :id da URL em número válido (ou null)
function lerId(valor: string): number | null {
    const id = Number(valor);
    return Number.isInteger(id) && id > 0 ? id : null;
}

// Administrador vê tudo; os demais só os projetos aos quais estão vinculados
function podeAcessar(usuario: UsuarioPublico, demanda: Demanda): boolean {
    return usuario.perfil === "Administrador" || usuario.projetoIds.includes(demanda.projetoId);
}

// Ciclo de vida da demanda (item 2.2.4)
function transicaoPermitida(de: StatusDemanda, para: StatusDemanda): boolean {
    if (para === "Cancelada") {
        return de !== "Concluída" && de !== "Cancelada"; // não cancela o que já foi concluído
    }
    if (de === "Aberta") return para === "Em andamento";
    if (de === "Em andamento") return para === "Em revisão";
    if (de === "Em revisão") return para === "Concluída" || para === "Em andamento";
    return false;
}

// Monta a resposta com os nomes do projeto e do responsável
function montarDetalhe(demanda: Demanda) {
    const projeto = projetos.find((p) => p.id === demanda.projetoId);
    const responsavel = usuarios.find((u) => u.id === demanda.responsavelId);

    return {
        ...demanda,
        projeto: projeto ? projeto.nome : null,
        responsavel: responsavel ? responsavel.nome : null
    };
}

// Valida o :id e a permissão; devolve a demanda ou responde com o erro
function obterDemanda(req: Request, res: Response): Demanda | null {
    const id = lerId(req.params.id);
    if (id === null) {
        res.status(400).json({ erro: "ID de demanda inválido." });
        return null;
    }

    const demanda = demandas.find((d) => d.id === id);
    if (!demanda) {
        res.status(404).json({ erro: "Demanda não encontrada." });
        return null;
    }

    // autenticar já garantiu que req.usuario existe
    if (!podeAcessar(req.usuario!, demanda)) {
        res.status(403).json({ erro: "Você não tem acesso a esta demanda." });
        return null;
    }

    return demanda;
}

// GET /demandas/:id
router.get("/:id", (req: Request, res: Response): void => {
    const demanda = obterDemanda(req, res);
    if (!demanda) return;

    res.status(200).json(montarDetalhe(demanda));
});

// GET /demandas/:id/comentarios
router.get("/:id/comentarios", (req: Request, res: Response): void => {
    const demanda = obterDemanda(req, res);
    if (!demanda) return;

    const lista = comentarios
        .filter((c) => c.demandaId === demanda.id)
        .sort((a, b) => a.dataHora.localeCompare(b.dataHora));

    res.status(200).json(lista);
});

// POST /demandas/:id/comentarios  -> { "texto": "..." }
router.post("/:id/comentarios", (req: Request, res: Response): void => {
    const demanda = obterDemanda(req, res);
    if (!demanda) return;

    const texto = String(req.body?.texto ?? "").trim();

    if (!texto) {
        res.status(400).json({ erro: "O texto do comentário é obrigatório." });
        return;
    }

    if (texto.length > LIMITE_TEXTO) {
        res.status(400).json({ erro: `O comentário deve ter no máximo ${LIMITE_TEXTO} caracteres.` });
        return;
    }

    const usuario = req.usuario!;

    // Usuário vem da sessão; data e hora são registradas automaticamente
    const novo = adicionarComentario({
        demandaId: demanda.id,
        usuarioId: usuario.id,
        usuario: usuario.nome,
        texto
    });

    res.status(201).json({
        mensagem: "Comentário registrado com sucesso.",
        comentario: novo
    });
});

// GET /demandas/:id/historico
router.get("/:id/historico", (req: Request, res: Response): void => {
    const demanda = obterDemanda(req, res);
    if (!demanda) return;

    const lista = historico
        .filter((h) => h.demandaId === demanda.id)
        .sort((a, b) => a.dataHora.localeCompare(b.dataHora));

    res.status(200).json(lista);
});

// PATCH /demandas/:id/status  -> { "status": "Em revisão" }
router.patch("/:id/status", (req: Request, res: Response): void => {
    const demanda = obterDemanda(req, res);
    if (!demanda) return;

    const usuario = req.usuario!;
    const novoStatus = String(req.body?.status ?? "");

    if (!(STATUS as readonly string[]).includes(novoStatus)) {
        res.status(400).json({ erro: `Status inválido. Use: ${STATUS.join(", ")}.` });
        return;
    }

    const de = demanda.status;
    const para = novoStatus as StatusDemanda;

    if (!transicaoPermitida(de, para)) {
        res.status(400).json({ erro: `Transição não permitida: ${de} → ${para}.` });
        return;
    }

    // Membro: só Aberta→Em andamento e Em andamento→Em revisão, nas demandas atribuídas a ele
    if (usuario.perfil === "Membro da Equipe") {
        const transicaoDoMembro =
            (de === "Aberta" && para === "Em andamento") ||
            (de === "Em andamento" && para === "Em revisão");

        if (!transicaoDoMembro || demanda.responsavelId !== usuario.id) {
            res.status(403).json({
                erro: "O Membro da Equipe só pode avançar demandas atribuídas a ele de Aberta para Em andamento e de Em andamento para Em revisão."
            });
            return;
        }
    }

    demanda.status = para;
    demanda.dataAtualizacao = new Date().toISOString();

    const descricao =
        para === "Cancelada"
            ? `${usuario.nome} cancelou a demanda (status anterior: ${de}).`
            : `${usuario.nome} alterou o status da demanda de ${de} para ${para}.`;

    registrarHistorico(demanda.id, usuario.id, descricao);

    res.status(200).json({
        mensagem: "Status atualizado com sucesso.",
        demanda: montarDetalhe(demanda)
    });
});

export default router;
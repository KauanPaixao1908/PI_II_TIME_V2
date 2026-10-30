// Autor: Kauan Paixão
// Arquivo: detalhes.ts
// Função: rotas da tela de Detalhes da Demanda:
//   GET  /demandas/:id               -> detalhes de uma demanda
//   GET  /demandas/:id/comentarios   -> lista os comentários da demanda
//   POST /demandas/:id/comentarios   -> registra um comentário novo
//   GET  /demandas/:id/historico     -> histórico de alterações da demanda
// Os dados vêm de src/data/ e os tipos de src/tipos.ts, como combinado no grupo.
// No server.ts esta rota é registrada assim:  app.use("/demandas", detalhesRouter);

import { Router, Request, Response } from "express";
import { demandas } from "../data/demandas";
import { projetos } from "../data/projetos";
import { usuarios } from "../data/usuarios";
import { comentarios } from "../data/comentarios";
import { historico } from "../data/historico";
import { Comentario } from "../tipos";

const router = Router();

// Procura uma demanda pelo id (devolve undefined se não existir)
function buscarDemanda(id: number) {
    return demandas.find(function (demanda) {
        return demanda.id === id;
    });
}

// Data e hora atuais no formato do tipos.ts: AAAA-MM-DDTHH:mm:ss
function dataHoraAgora(): string {
    const agora = new Date();

    function doisDigitos(numero: number): string {
        return numero < 10 ? "0" + numero : String(numero);
    }

    return agora.getFullYear() + "-" +
        doisDigitos(agora.getMonth() + 1) + "-" +
        doisDigitos(agora.getDate()) + "T" +
        doisDigitos(agora.getHours()) + ":" +
        doisDigitos(agora.getMinutes()) + ":" +
        doisDigitos(agora.getSeconds());
}

// Procura o nome de um usuário pelo id (vazio se não achar)
function nomeDoUsuario(id: number | undefined | null): string {
    const usuario = usuarios.find(function (u) {
        return u.id === id;
    });

    return usuario ? usuario.nome : "";
}

// ---------------------------------------------------------------------
// GET /demandas/:id
// 200 com a demanda | 404 se não existir
// ---------------------------------------------------------------------
router.get("/:id", function (req: Request, res: Response) {
    const id = Number(req.params.id);
    const demanda = buscarDemanda(id);

    if (!demanda) {
        res.status(404).json({ mensagem: "Demanda não encontrada." });
        return;
    }

    // Junta o nome do projeto e do responsável para a tela mostrar
    const projeto = projetos.find(function (p) {
        return p.id === demanda.projetoId;
    });

    res.status(200).json({
        ...demanda,
        projetoNome: projeto ? projeto.nome : "",
        responsavelNome: nomeDoUsuario(demanda.responsavelId)
    });
});

// ---------------------------------------------------------------------
// GET /demandas/:id/comentarios
// 200 com a lista | 404 se a demanda não existir
// ---------------------------------------------------------------------
router.get("/:id/comentarios", function (req: Request, res: Response) {
    const id = Number(req.params.id);

    if (!buscarDemanda(id)) {
        res.status(404).json({ mensagem: "Demanda não encontrada." });
        return;
    }

    // Só os comentários desta demanda, já com o nome de quem comentou
    const lista = comentarios
        .filter(function (c) {
            return c.demandaId === id;
        })
        .map(function (c) {
            return { ...c, autorNome: nomeDoUsuario(c.autorId) };
        });

    res.status(200).json(lista);
});

// ---------------------------------------------------------------------
// POST /demandas/:id/comentarios
// Corpo esperado: { "autorId": 3, "texto": "Meu comentário" }
// 201 ao criar | 400 texto vazio ou autor inválido | 404 demanda não existe
// ---------------------------------------------------------------------
router.post("/:id/comentarios", function (req: Request, res: Response) {
    const id = Number(req.params.id);

    if (!buscarDemanda(id)) {
        res.status(404).json({ mensagem: "Demanda não encontrada." });
        return;
    }

    const texto: string = req.body && req.body.texto ? String(req.body.texto).trim() : "";
    const autorId = Number(req.body ? req.body.autorId : 0);

    if (texto === "") {
        res.status(400).json({ mensagem: "O comentário não pode ficar vazio." });
        return;
    }

    // O autor precisa ser um usuário que existe
    const autor = usuarios.find(function (u) {
        return u.id === autorId;
    });

    if (!autor) {
        res.status(400).json({ mensagem: "Autor do comentário inválido." });
        return;
    }

    // Cria o próximo id (maior id atual + 1)
    let proximoId = 1;
    comentarios.forEach(function (c) {
        if (c.id >= proximoId) {
            proximoId = c.id + 1;
        }
    });

    const novo: Comentario = {
        id: proximoId,
        demandaId: id,
        autorId: autorId,
        texto: texto,
        criadoEm: dataHoraAgora()
    };

    comentarios.push(novo);

    res.status(201).json({ ...novo, autorNome: autor.nome });
});

// ---------------------------------------------------------------------
// GET /demandas/:id/historico
// 200 com a lista (mais antigo primeiro) | 404 se a demanda não existir
// ---------------------------------------------------------------------
router.get("/:id/historico", function (req: Request, res: Response) {
    const id = Number(req.params.id);

    if (!buscarDemanda(id)) {
        res.status(404).json({ mensagem: "Demanda não encontrada." });
        return;
    }

    const lista = historico
        .filter(function (h) {
            return h.demandaId === id;
        })
        .sort(function (a, b) {
            return a.criadoEm.localeCompare(b.criadoEm);
        });

    res.status(200).json(lista);
});

export default router;

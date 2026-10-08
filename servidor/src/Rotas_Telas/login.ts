// Autor: Kauan Paixao
// Rotas de autenticação e consulta de usuários

import { Router, Request, Response } from "express";
import { usuarios, paraPublico } from "../data/usuarios";
import { criarSessao, autenticar, exigirPerfil } from "../central/autenticacao";

const router = Router();

// POST /login  -> { "email": "...", "senha": "..." }
router.post("/login", (req: Request, res: Response): void => {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const senha = String(req.body?.senha ?? "");

    if (!email || !senha) {
        res.status(400).json({ erro: "E-mail e senha são obrigatórios." });
        return;
    }

    const usuario = usuarios.find(
        (u) => u.email.toLowerCase() === email && u.senha === senha
    );

    if (!usuario) {
        res.status(401).json({ erro: "E-mail ou senha inválidos." });
        return;
    }

    // O token deve ser enviado nas próximas requisições
    res.status(200).json({
        mensagem: "Login realizado com sucesso.",
        token: criarSessao(usuario.id),
        usuario: paraPublico(usuario)
    });
});

// GET /usuarios -> somente Administrador (item 2.1.1), sem senha
router.get(
    "/usuarios",
    autenticar,
    exigirPerfil("Administrador"),
    (_req: Request, res: Response): void => {
        res.status(200).json(usuarios.map(paraPublico));
    }
);

export default router;
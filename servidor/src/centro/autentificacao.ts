// Autor: Kauan Paixao
// Controle de sessão (token em memória) e verificação de perfil

import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { usuarios, paraPublico, UsuarioPublico, Perfil } from "../data/usuarios";

// Permite usar req.usuario nas rotas depois da autenticação
declare global {
    namespace Express {
        interface Request {
            usuario?: UsuarioPublico;
        }
    }
}

// token -> id do usuário (apenas em memória, perde-se ao reiniciar o servidor)
const sessoes = new Map<string, number>();

export function criarSessao(usuarioId: number): string {
    const token = randomUUID();
    sessoes.set(token, usuarioId);
    return token;
}

// Exige o cabeçalho "Authorization: Bearer <token>"
export function autenticar(req: Request, res: Response, next: NextFunction): void {
    const cabecalho = req.headers.authorization ?? "";
    const [tipo, token] = cabecalho.split(" ");

    if (tipo !== "Bearer" || !token) {
        res.status(401).json({ erro: "Autenticação necessária." });
        return;
    }

    const usuarioId = sessoes.get(token);
    const usuario = usuarios.find((u) => u.id === usuarioId);

    if (!usuario) {
        res.status(401).json({ erro: "Sessão inválida. Faça login novamente." });
        return;
    }

    req.usuario = paraPublico(usuario);
    next();
}

// Libera a rota apenas para os perfis informados
export function exigirPerfil(...perfis: Perfil[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.usuario || !perfis.includes(req.usuario.perfil)) {
            res.status(403).json({ erro: "Seu perfil não tem permissão para esta ação." });
            return;
        }
        next();
    };
}
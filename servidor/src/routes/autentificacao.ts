// Autor: Kauan Paixão
// Arquivo: autenticacao.ts
// Função: gerar o token do login e proteger as rotas.
//   gerarToken cria o token depois que o login dá certo
//   verificarLogin só deixa passar quem mandou um token válido
//   somentePerfis só deixa passar os perfis informados
//   somenteAdmin atalho para somentePerfis("Administrador")
//
// Como usar numa rota:
//   router.post("/algo", verificarLogin, somentePerfis("Administrador", "Líder de Projeto"), ...)
// Dentro da rota, req.usuario traz { id, nome, perfil } de quem está logado.

import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import { Perfil } from "../tipos";

// Lê o .env aqui também, para JWT_SECRET já existir quando este arquivo carregar.
dotenv.config({ quiet: true });

// Dados que ficam guardados dentro do token.
export interface UsuarioToken {
    id: number;
    nome: string;
    perfil: Perfil;
}

// Faz o TypeScript conhecer o campo req.usuario em todas as rotas.
declare global {
    namespace Express {
        interface Request {
            usuario?: UsuarioToken;
        }
    }
}

// A chave secreta assina o token. Ela precisa ficar só no .env:
// se alguém souber a chave, consegue criar um token falso de Administrador.
const SEGREDO = process.env.JWT_SECRET;
if (!SEGREDO) {
    throw new Error("JWT_SECRET não definido. Coloque JWT_SECRET=uma_frase_longa_e_secreta no arquivo .env.");
}

// Cria o token que o navegador vai guardar depois do login (vale 2 horas).
export function gerarToken(usuario: UsuarioToken): string {
    return jwt.sign(
        { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil },
        SEGREDO as string,
        { expiresIn: "2h" }
    );
}

// Confere se a pessoa está logada (token válido no header Authorization).
export function verificarLogin(req: Request, res: Response, next: NextFunction) {
    const cabecalho = req.headers.authorization || "";
    const [tipo, token] = cabecalho.split(" "); // formato: "Bearer TOKEN"

    if (tipo !== "Bearer" || !token) {
        return res.status(401).json({ mensagem: "Faça login para continuar." });
    }

    try {
        const dados = jwt.verify(token, SEGREDO as string) as UsuarioToken;
        req.usuario = { id: dados.id, nome: dados.nome, perfil: dados.perfil };
        next();
    } catch {
        // Token alterado, assinado com outra chave ou vencido.
        return res.status(401).json({ mensagem: "Sessão inválida ou expirada. Faça login novamente." });
    }
}

// Só deixa passar quem tem um dos perfis informados.
// Deve ser usado DEPOIS de verificarLogin.
export function somentePerfis(...perfis: Perfil[]) {
    return function (req: Request, res: Response, next: NextFunction) {
        if (!req.usuario) {
            return res.status(401).json({ mensagem: "Faça login para continuar." });
        }
        if (!perfis.includes(req.usuario.perfil)) {
            return res.status(403).json({ mensagem: "Seu perfil não tem permissão para esta ação." });
        }
        next();
    };
}

// Só deixa passar quem tem o perfil Administrador.
export const somenteAdmin = somentePerfis("Administrador");


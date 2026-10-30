// Autor: <PREENCHER NOME DO AUTOR>
// Arquivo: autentificacao.ts
// Função: gerar o token do login e proteger as rotas (só logado / só Administrador)

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const SEGREDO = process.env.JWT_SECRET || 'segredo_do_projeto';

// Cria o token que o navegador vai guardar depois do login
export function gerarToken(usuario: { id: number; nome: string; perfil: string }) {
  return jwt.sign(
    { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil },
    SEGREDO,
    { expiresIn: '2h' }
  );
}

// Confere se a pessoa está logada (token válido no header Authorization)
export function verificarLogin(req: any, res: Response, next: NextFunction) {
  const cabecalho = req.headers.authorization;

  if (!cabecalho) {
    return res.status(401).json({ mensagem: 'Faça login para continuar.' });
  }

  const token = cabecalho.split(' ')[1]; // formato: "Bearer TOKEN"

  try {
    req.usuario = jwt.verify(token, SEGREDO); // guarda id, nome e perfil
    next();
  } catch (erro) {
    res.status(401).json({ mensagem: 'Sessão inválida ou expirada.' });
  }
}

// Só deixa passar quem tem o perfil Administrador
export function somenteAdmin(req: any, res: Response, next: NextFunction) {
  if (req.usuario.perfil !== 'Administrador') {
    return res.status(403).json({ mensagem: 'Acesso negado: somente Administrador.' });
  }
  next();
}

// Autor: Leonardo
import { Router } from "express";
import { demandas } from "../data/demandas";
import { projetos } from "../data/projetos";

const router = Router();

// Valores permitidos (definidos no escopo do sistema)
const TIPOS = ["Tarefa", "Defeito", "Melhoria", "Documentação"];
const PRIORIDADES = ["Crítica", "Alta", "Média", "Baixa"];

// GET /projetos -> lista os projetos (usada no select da tela de cadastro)
router.get("/projetos", (req, res) => {
  res.status(200).json(projetos);
});

// POST /demandas -> cria uma demanda, validando tudo no servidor
router.post("/demandas", (req, res) => {
  const { titulo, descricao, tipo, prioridade, projetoId, responsavel, prazo } =
    req.body ?? {};

  const erros: string[] = [];

  if (!titulo || typeof titulo !== "string" || !titulo.trim()) {
    erros.push("O título é obrigatório.");
  }
  if (!TIPOS.includes(tipo)) {
    erros.push(`Tipo inválido. Use: ${TIPOS.join(", ")}.`);
  }
  if (!PRIORIDADES.includes(prioridade)) {
    erros.push(`Prioridade inválida. Use: ${PRIORIDADES.join(", ")}.`);
  }
  if (!projetos.some((p) => p.id === projetoId)) {
    erros.push("Projeto não encontrado.");
  }
  if (prazo && isNaN(Date.parse(prazo))) {
    erros.push("Prazo inválido. Use o formato AAAA-MM-DD.");
  }

  // Se algo falhou, devolve 400 e não cria nada
  if (erros.length > 0) {
    return res.status(400).json({ erro: "Dados inválidos.", detalhes: erros });
  }

  const nova = {
    id: demandas.length ? Math.max(...demandas.map((d) => d.id)) + 1 : 1,
    titulo: titulo.trim(),
    descricao: descricao ?? "",
    tipo,
    prioridade,
    status: "Aberta", // confira o primeiro status do documento de visão
    projetoId,
    responsavel: responsavel ?? null,
    prazo: prazo ?? null,
  };

  demandas.push(nova);
  res.status(201).json(nova); // 201 = registro criado
});

export default router;
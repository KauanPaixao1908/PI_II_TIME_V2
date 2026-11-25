// Autor: Leonardo Miziara
// Rota auxiliar para o formulário consultar um feriado antes de enviar o prazo.
// GET /api/feriados/verificar?data=AAAA-MM-DD

import { Router, Request, Response } from 'express';
import { verificarLogin } from './autentificacao';
import { dataEhReal, nomeDoFeriadoNacional } from '../feriados';

const router = Router();

router.get('/feriados/verificar', verificarLogin, async (req: Request, res: Response) => {
    let data = '';
    if (req.query.data) {
        data = String(req.query.data);
    }

    if (!dataEhReal(data)) {
        res.status(400).json({ mensagem: 'Informe uma data válida no formato AAAA-MM-DD.' });
        return;
    }

    try {
        const nome = await nomeDoFeriadoNacional(data);
        res.status(200).json({ feriado: nome !== null, nome });
    } catch (erro) {
        console.error('Erro ao consultar feriado:', erro);
        res.status(200).json({ feriado: false, nome: null });
    }
});

export default router;

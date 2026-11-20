import { Router } from 'express';
import * as SaudeFinanceira from '../models/saudeFinanceira.js';
import { autenticar } from '../middlewares/autenticar.js';

const router = Router();

router.use(autenticar);

router.get('/', async (req, res) => {
  const resultado = await SaudeFinanceira.obterSaudeFinanceira(
    req.usuarioId
  );

  return res.json(resultado);
});

export default router;

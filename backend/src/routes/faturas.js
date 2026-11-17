import { Router } from 'express';
import * as Fatura from '../models/fatura.js';
import { autenticar } from '../middlewares/autenticar.js';

const router = Router();

router.use(autenticar);

router.get('/', async (req, res) => {
  const resultado = await Fatura.listar(req.usuarioId);
  return res.json(resultado);
});

export default router;
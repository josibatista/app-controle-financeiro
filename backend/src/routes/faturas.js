import { Router } from 'express';
import * as Fatura from '../models/fatura.js';
import {
  identificarUsuarioDev,
} from '../middlewares/identificarUsuarioDev.js';

const router = Router();

router.use(identificarUsuarioDev);

router.get('/', async (req, res) => {
  const resultado = await Fatura.listar(req.usuarioId);
  return res.json(resultado);
});

export default router;
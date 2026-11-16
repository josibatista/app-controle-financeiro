import { Router } from 'express';
import categoriasRouter from './categorias.js';
import fontesDestinosRouter from './fontesDestinos.js';
import lancamentosRouter from './lancamentos.js';

const router = Router();

router.use('/categorias', categoriasRouter);
router.use('/fontes-destinos', fontesDestinosRouter);
router.use('/lancamentos', lancamentosRouter);

export default router;
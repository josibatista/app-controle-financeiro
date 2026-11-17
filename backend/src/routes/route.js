import { Router } from 'express';
import categoriasRouter from './categorias.js';
import fontesDestinosRouter from './fontesDestinos.js';
import lancamentosRouter from './lancamentos.js';
import faturasRouter from './faturas.js';

const router = Router();

router.use('/categorias', categoriasRouter);
router.use('/fontes-destinos', fontesDestinosRouter);
router.use('/lancamentos', lancamentosRouter);
router.use('/faturas', faturasRouter);

export default router;
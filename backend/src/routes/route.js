import { Router } from 'express';
import relatoriosRouter from './relatorios.js';

const router = Router();

router.use('/relatorios', relatoriosRouter);

export default router;
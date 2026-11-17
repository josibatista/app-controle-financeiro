import 'dotenv/config';
import { pool } from '../config/db.js';

export async function identificarUsuarioDev(req, res, next) {
  const usuarioId = Number(process.env.DEV_USER_ID);

  if (
    process.env.NODE_ENV !== 'development' ||
    !Number.isInteger(usuarioId) ||
    usuarioId <= 0 ||
    usuarioId > 2147483647
  ) {
    return res.status(503).json({
      mensagem: 'Configure o usuário do ambiente de desenvolvimento.',
    });
  }

  const resultado = await pool.query(
    'SELECT id FROM usuarios WHERE id = $1',
    [usuarioId]
  );

  if (!resultado.rowCount) {
    return res.status(503).json({
      mensagem: 'O usuário de desenvolvimento não existe no banco.',
    });
  }

  req.usuarioId = usuarioId;
  next();
}
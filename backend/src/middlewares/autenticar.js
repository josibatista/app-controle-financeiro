import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt.js';
import * as Usuario from '../models/usuario.js';

export async function autenticar(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({
      mensagem: 'Entre na sua conta para continuar.',
    });
  }

  let payload;

  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({
      mensagem: 'Sessão inválida ou expirada. Entre novamente.',
    });
  }

  try {
    // Garante que a conta associada ao token ainda existe.
    const usuario = await Usuario.buscarPorId(payload.id);

    if (!usuario) {
      return res.status(401).json({
        mensagem: 'Sessão inválida. Entre novamente.',
      });
    }

    req.usuarioId = usuario.id;
    return next();
  } catch (erro) {
    return next(erro);
  }
}
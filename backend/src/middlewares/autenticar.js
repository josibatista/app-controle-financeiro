import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt.js';

export function autenticar(req, res, next) {
  // O token chega no cabeçalho no formato "Bearer <token>".
  const [tipo, token] = (req.headers.authorization || '').split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ mensagem: 'Entre na sua conta para continuar.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.usuarioId = payload.id;
    next();
  } catch {
    return res.status(401).json({ mensagem: 'Sessão inválida ou expirada. Entre novamente.' });
  }
}

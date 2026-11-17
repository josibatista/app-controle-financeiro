import jwt from 'jsonwebtoken';

export function autenticar(req, res, next) {
  const token = req.get('Authorization')?.match(/^Bearer ([^\s]+)$/i)?.[1];
  if (!token) {
    return res.status(401).json({ mensagem: 'Entre na sua conta para continuar.' });
  }

  try {
    const payload = jwt.verify(token, req.app.locals.seguranca.jwtSecret, {
      algorithms: ['HS256'],
      issuer: 'controle-financeiro',
      audience: 'controle-financeiro-web',
    });
    const usuarioId = Number(payload.sub);
    if (
      !Number.isSafeInteger(usuarioId) ||
      usuarioId <= 0 ||
      !Number.isFinite(payload.exp)
    ) {
      throw new Error('Token inválido.');
    }
    req.usuarioId = usuarioId;
    req.expiracaoToken = payload.exp;
    return next();
  } catch {
    return res
      .status(401)
      .json({ mensagem: 'Sessão inválida ou expirada. Entre novamente.' });
  }
}

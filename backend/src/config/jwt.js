import 'dotenv/config';

if (!process.env.JWT_SECRET) {
  throw new Error('Defina JWT_SECRET no arquivo .env.');
}

export const JWT_SECRET = process.env.JWT_SECRET;

// O token vale por 1 hora.
export const JWT_EXPIRACAO = '1h';

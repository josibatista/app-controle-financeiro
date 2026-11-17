import 'dotenv/config';

export function carregarSeguranca(env = process.env) {
  const jwtSecret = env.JWT_SECRET?.trim();
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error(
      'Configure JWT_SECRET no .env com pelo menos 32 caracteres aleatórios.',
    );
  }

  const origens = (env.FRONTEND_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origem) => origem.trim())
    .filter(Boolean);

  if (env.CODESPACE_NAME) {
    const dominio = env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || 'app.github.dev';
    origens.push(`https://${env.CODESPACE_NAME}-5173.${dominio}`);
  }

  for (const origem of origens) {
    const url = new URL(origem);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origem) {
      throw new Error(
        'FRONTEND_ORIGINS deve conter origens HTTP/HTTPS completas, separadas por vírgula.',
      );
    }
  }

  return { jwtSecret, origens, duracaoToken: 3600 };
}

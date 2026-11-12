export const CHAVE_TEMA = 'controle-financeiro:tema';

export function lerTema() {
  try {
    return window.localStorage.getItem(CHAVE_TEMA) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function salvarTema(tema) {
  if (tema !== 'light' && tema !== 'dark') return;
  try {
    window.localStorage.setItem(CHAVE_TEMA, tema);
  } catch {
    // A troca visual continua funcionando quando o armazenamento está bloqueado.
  }
}

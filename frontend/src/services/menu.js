const CHAVE_MENU = 'controle-financeiro:menu';

export function lerMenuMinimizado() {
  try {
    return window.localStorage.getItem(CHAVE_MENU) !== 'fixo';
  } catch {
    return true;
  }
}

export function salvarMenuMinimizado(minimizado) {
  if (typeof minimizado !== 'boolean') return;
  try {
    window.localStorage.setItem(CHAVE_MENU, minimizado ? 'minimizado' : 'fixo');
  } catch {
    // O menu continua funcionando quando o armazenamento está bloqueado.
  }
}

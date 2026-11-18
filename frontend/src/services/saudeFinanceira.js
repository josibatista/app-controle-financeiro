import { api } from './api.js';

export async function buscarSaudeFinanceira(signal) {
  return api('/saude-financeira', { signal });
}

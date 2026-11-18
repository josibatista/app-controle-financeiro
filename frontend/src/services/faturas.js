import { api } from './api.js';

export function listarFaturas(signal) {
  return api('/faturas', { signal });
}
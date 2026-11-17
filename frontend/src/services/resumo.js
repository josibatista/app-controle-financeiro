import { api } from './api.js';

export function periodoMensal(ano, mes) {
  const prefixo = `${ano}-${String(mes).padStart(2, '0')}`;
  const ultimoDia = new Date(ano, mes, 0).getDate();
  return { inicio: `${prefixo}-01`, fim: `${prefixo}-${ultimoDia}` };
}

export function consultarResumo(ano, mes, { signal } = {}) {
  const parametros = new URLSearchParams(periodoMensal(ano, mes));
  return api(`/lancamentos/resumo?${parametros}`, { signal });
}

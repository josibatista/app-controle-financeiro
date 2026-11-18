import { api } from './api.js';

// Monta o primeiro e o último dia do mês escolhido (ex.: 2026-11-01 a 2026-11-30).
export function periodoMensal(ano, mes) {
  const prefixo = `${ano}-${String(mes).padStart(2, '0')}`;
  const ultimoDia = new Date(ano, mes, 0).getDate();
  return { inicio: `${prefixo}-01`, fim: `${prefixo}-${ultimoDia}` };
}

export function consultarResumo(ano, mes) {
  const { inicio, fim } = periodoMensal(ano, mes);
  return api(`/lancamentos/resumo?inicio=${inicio}&fim=${fim}`);
}

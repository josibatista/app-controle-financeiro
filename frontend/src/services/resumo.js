import { api, ErroApi } from './api.js';

export function periodoMensal(ano, mes) {
  if (!Number.isInteger(ano) || ano < 1900 || ano > 9999 || !Number.isInteger(mes) || mes < 1 || mes > 12) {
    throw new Error('Selecione um mês e ano válidos.');
  }
  const prefixo = `${ano}-${String(mes).padStart(2, '0')}`;
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return { inicio: `${prefixo}-01`, fim: `${prefixo}-${ultimoDia}` };
}

export async function consultarResumo(ano, mes, { signal } = {}) {
  const parametros = new URLSearchParams(periodoMensal(ano, mes));
  // Contrato da rota já existente na branch feature/lancamento.
  const dados = await api(`/lancamentos/resumo?${parametros}`, { signal });
  const campos = ['totalEntradas', 'totalSaidas', 'saldo'];
  if (!dados || campos.some((campo) => !['number', 'string'].includes(typeof dados[campo]) || String(dados[campo]).trim() === '' || !Number.isFinite(Number(dados[campo])))) {
    throw new ErroApi('Não foi possível interpretar o resumo do período. Tente novamente.');
  }
  const resumo = Object.fromEntries(campos.map((campo) => [campo, Number(dados[campo])]));
  if (resumo.totalEntradas < 0 || resumo.totalSaidas < 0) throw new ErroApi('O resumo retornou valores inválidos.');
  return resumo;
}

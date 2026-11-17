import { api } from './api.js';

export async function buscarRelatorioCategoria(inicio, fim) {
  const parametros = new URLSearchParams({
    inicio,
    fim,
  });

  return api(`/relatorios/categorias?${parametros}`);
}

export async function buscarRelatorioFonteDestino(inicio, fim) {
  const parametros = new URLSearchParams({
    inicio,
    fim,
  });

  return api(`/relatorios/fontes-destinos?${parametros}`);
}

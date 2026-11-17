import { api } from './api.js';

export function listarLancamentos(
  filtros = {},
  signal,
  pagina = 1,
  limite = 5
) {
  const parametros = new URLSearchParams();

  const nomes = {
    dataInicial: 'inicio',
    dataFinal: 'fim',
    tipo: 'tipo',
    categoria_id: 'categoriaId',
    fonte_destino_id: 'fonteDestinoId',
  };

  Object.entries(nomes).forEach(([campo, parametro]) => {
    if (filtros[campo]) {
      parametros.set(parametro, filtros[campo]);
    }
  });

  parametros.set('pagina', pagina);
  parametros.set('limite', limite);

  return api(`/lancamentos?${parametros.toString()}`, {
    signal,
  });
}

export function buscarResumo(filtros = {}, signal) {
  const parametros = new URLSearchParams();

  const nomes = {
    dataInicial: 'inicio',
    dataFinal: 'fim',
    tipo: 'tipo',
    categoria_id: 'categoriaId',
    fonte_destino_id: 'fonteDestinoId',
  };

  Object.entries(nomes).forEach(([campo, parametro]) => {
    if (filtros[campo]) {
      parametros.set(parametro, filtros[campo]);
    }
  });

  return api(`/lancamentos/resumo?${parametros.toString()}`, {
    signal,
  });
}

export function listarCategorias(signal) {
  return api('/categorias', { signal });
}

export function listarFontesDestinos(signal) {
  return api('/fontes-destinos', { signal });
}

export function buscarLancamento(id, signal) {
  return api(`/lancamentos/${id}`, { signal });
}

function prepararDados(dados) {
  return {
    tipo: dados.tipo,
    descricao: dados.descricao.trim(),
    valor: dados.valor,
    data: dados.data,
    categoriaId: Number(dados.categoria_id),
    fonteDestinoId: Number(dados.fonte_destino_id),
    totalParcelas: Number(dados.total_parcelas),
  };
}

export function criarLancamento(dados) {
  return api('/lancamentos', {
    method: 'POST',
    body: JSON.stringify(prepararDados(dados)),
  });
}

export function atualizarLancamento(id, dados) {
  return api(`/lancamentos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(prepararDados(dados)),
  });
}

export function excluirLancamento(id) {
  return api(`/lancamentos/${id}`, {
    method: 'DELETE',
  });
}

export function excluirGrupoParcelamento(grupoParcelamento) {
  return api(
    `/lancamentos/grupo/${encodeURIComponent(grupoParcelamento)}`,
    {
      method: 'DELETE',
    }
  );
}
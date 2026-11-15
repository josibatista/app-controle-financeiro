import { api } from './api.js';

export function listarCategorias(signal) {
  return api('/categorias', { signal });
}

export function criarCategoria(dados) {
  return api('/categorias', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

export function atualizarCategoria(id, dados) {
  return api(`/categorias/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  });
}

export function excluirCategoria(id) {
  return api(`/categorias/${id}`, {
    method: 'DELETE',
  });
}

export function validarCategoria(dados) {
  const erros = {};

  if (!dados.nome.trim()) {
    erros.nome = 'Informe o nome da categoria.';
  } else if (Array.from(dados.nome.trim()).length > 60) {
    erros.nome = 'Use até 60 caracteres.';
  }

  if (!['entrada', 'saida'].includes(dados.tipo)) {
    erros.tipo = 'Selecione Entrada ou Saída.';
  }

  return erros;
}
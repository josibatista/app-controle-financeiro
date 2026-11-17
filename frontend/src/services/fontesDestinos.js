import { api } from './api.js';

export const tiposFonteDestino = {
  renda: 'Renda',
  conta: 'Conta',
  cartao_credito: 'Cartão de crédito',
};

export function listarFontesDestinos(signal) {
  return api('/fontes-destinos', { signal });
}

export function criarFonteDestino(dados) {
  return api('/fontes-destinos', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

export function atualizarFonteDestino(id, dados) {
  return api(`/fontes-destinos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  });
}

export function excluirFonteDestino(id) {
  return api(`/fontes-destinos/${id}`, {
    method: 'DELETE',
  });
}

export function novoFormulario(tipo = 'renda') {
  return {
    nome: '',
    tipo,
    dia_fechamento: '',
    dia_vencimento: '',
    limite: '',
  };
}

export function formularioDoItem(item) {
  return {
    nome: item.nome,
    tipo: item.tipo,
    dia_fechamento: String(item.dia_fechamento ?? ''),
    dia_vencimento: String(item.dia_vencimento ?? ''),
    limite: String(item.limite ?? ''),
  };
}

function diaValido(valor) {
  return /^\d{1,2}$/.test(String(valor)) &&
    Number(valor) >= 1 &&
    Number(valor) <= 31;
}

function limiteValido(valor) {
  return /^\d{1,10}(\.\d{1,2})?$/.test(
    String(valor).trim().replace(',', '.')
  );
}

export function validarFonteDestino(dados) {
  const erros = {};

  if (!dados.nome.trim()) {
    erros.nome = 'Informe o nome.';
  } else if (Array.from(dados.nome.trim()).length > 60) {
    erros.nome = 'Use até 60 caracteres.';
  }

  if (!Object.hasOwn(tiposFonteDestino, dados.tipo)) {
    erros.tipo = 'Selecione um tipo válido.';
  }

  if (dados.tipo === 'cartao_credito') {
    if (!diaValido(dados.dia_fechamento)) {
      erros.dia_fechamento = 'Informe um dia inteiro de 1 a 31.';
    }

    if (!diaValido(dados.dia_vencimento)) {
      erros.dia_vencimento = 'Informe um dia inteiro de 1 a 31.';
    }

    if (!limiteValido(dados.limite)) {
      erros.limite =
        'Informe um limite não negativo com até duas casas decimais.';
    }
  }

  return erros;
}

export function dadosParaAPI(dados) {
  const cartao = dados.tipo === 'cartao_credito';

  return {
    nome: dados.nome.trim(),
    tipo: dados.tipo,
    dia_fechamento: cartao ? Number(dados.dia_fechamento) : null,
    dia_vencimento: cartao ? Number(dados.dia_vencimento) : null,
    limite: cartao
      ? String(dados.limite).trim().replace(',', '.')
      : null,
  };
}

export function formatarLimite(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(valor));
}
import { api } from './api.js';

export function cadastrarUsuario(dados, { signal } = {}) {
  return api('/auth/cadastro', {
    method: 'POST',
    publica: true,
    signal,
    body: {
      nome: dados.nome.trim(),
      email: dados.email.trim().toLowerCase(),
      cpf: dados.cpf.replace(/\D/g, ''),
      senha: dados.senha,
      confirmacaoSenha: dados.confirmacaoSenha,
    },
  });
}

export async function entrar(dados, { signal } = {}) {
  const resposta = await api('/auth/login', {
    method: 'POST',
    publica: true,
    signal,
    body: {
      email: dados.email.trim().toLowerCase(),
      senha: dados.senha,
    },
  });
  return resposta.token;
}

export async function consultarUsuario({ signal } = {}) {
  const dados = await api('/auth/me', { signal });
  return {
    id: dados.id,
    nome: dados.nome,
    email: dados.email,
    expiraEm: dados.expiraEm,
  };
}

export function consultarPerfil({ signal } = {}) {
  return api('/auth/perfil', { signal });
}

export function atualizarPerfil(dados) {
  return api('/auth/perfil', {
    method: 'PUT',
    body: {
      nome: dados.nome.trim(),
      email: dados.email.trim().toLowerCase(),
    },
  });
}

export function alterarSenha(dados) {
  return api('/auth/senha', {
    method: 'PUT',
    body: {
      senhaAtual: dados.senhaAtual,
      novaSenha: dados.novaSenha,
      confirmacaoSenha: dados.confirmacaoSenha,
    },
  });
}

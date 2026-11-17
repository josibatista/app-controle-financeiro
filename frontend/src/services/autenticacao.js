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

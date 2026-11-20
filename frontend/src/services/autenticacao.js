import { api } from './api.js';

export function cadastrarUsuario(dados) {
  return api('/auth/cadastro', {
    method: 'POST',
    publica: true,
    body: {
      nome: dados.nome.trim(),
      email: dados.email.trim().toLowerCase(),
      cpf: dados.cpf.replace(/\D/g, ''),
      senha: dados.senha,
      confirmacaoSenha: dados.confirmacaoSenha,
    },
  });
}

export async function entrar(dados) {
  const resposta = await api('/auth/login', {
    method: 'POST',
    publica: true,
    body: {
      email: dados.email.trim().toLowerCase(),
      senha: dados.senha,
    },
  });
  return resposta.token;
}

export function consultarUsuario() {
  return api('/auth/me');
}

export function consultarPerfil() {
  return api('/auth/perfil');
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

export function excluirConta(senha) {
  return api('/auth/perfil', {
    method: 'DELETE',
    body: { senha },
  });
}
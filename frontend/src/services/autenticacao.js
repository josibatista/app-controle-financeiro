import { api, ErroApi } from './api.js';

export function cadastrarUsuario(dados, { signal } = {}) {
  return api('/auth/cadastro', {
    method: 'POST', publica: true, signal,
    body: {
      nome: dados.nome.trim(), email: dados.email.trim().toLowerCase(),
      cpf: dados.cpf.replace(/\D/g, ''), senha: dados.senha, confirmacaoSenha: dados.confirmacaoSenha,
    },
  });
}

export async function entrar(dados, { signal } = {}) {
  const resposta = await api('/auth/login', {
    method: 'POST', publica: true, signal,
    body: { email: dados.email.trim().toLowerCase(), senha: dados.senha },
  });
  if (typeof resposta?.token !== 'string' || !resposta.token.trim()) {
    throw new ErroApi('Não foi possível confirmar seu acesso. Tente novamente.');
  }
  return resposta.token;
}

export async function consultarUsuario({ signal } = {}) {
  const resposta = await api('/auth/me', { signal });
  const usuario = resposta?.usuario ?? resposta;
  if (!usuario?.id || typeof usuario.nome !== 'string' || typeof usuario.email !== 'string') {
    throw new ErroApi('Não foi possível carregar os dados da sua conta.');
  }
  // Mantém apenas dados de apresentação; nenhuma senha faz parte do contexto.
  return { id: usuario.id, nome: usuario.nome, email: usuario.email };
}

export function expiracaoToken(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')));
    return typeof exp === 'number' && Number.isFinite(exp) ? exp * 1000 : null;
  } catch { return null; }
}

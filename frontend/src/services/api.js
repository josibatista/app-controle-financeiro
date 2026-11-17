const CHAVE_TOKEN = 'controle-financeiro-token';
const BASE_API = (import.meta.env?.VITE_API_URL || '/api').replace(/\/+$/, '');
const ouvintesExpiracao = new Set();

export function lerToken() {
  try {
    return sessionStorage.getItem(CHAVE_TOKEN);
  } catch {
    return null;
  }
}

export function salvarToken(token) {
  try {
    sessionStorage.setItem(CHAVE_TOKEN, token);
  } catch {
    throw new Error('Permita o armazenamento do navegador para entrar na conta.');
  }
}

export function limparToken() {
  try {
    sessionStorage.removeItem(CHAVE_TOKEN);
  } catch {
    // O contexto também encerra a sessão quando o armazenamento está bloqueado.
  }
}

export function aoExpirarSessao(ouvinte) {
  ouvintesExpiracao.add(ouvinte);
  return () => ouvintesExpiracao.delete(ouvinte);
}

export class ErroApi extends Error {
  constructor(mensagem, status = 0, erros = {}) {
    super(mensagem);
    this.status = status;
    this.erros = erros;
  }
}

export async function api(caminho, { publica = false, ...opcoes } = {}) {
  const headers = new Headers(opcoes.headers);
  const token = publica ? null : lerToken();

  if (opcoes.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    if (typeof opcoes.body !== 'string') {
      opcoes.body = JSON.stringify(opcoes.body);
    }
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let resposta;
  try {
    resposta = await fetch(`${BASE_API}${caminho}`, { ...opcoes, headers });
  } catch (erro) {
    if (erro.name === 'AbortError') throw erro;
    throw new ErroApi('Não foi possível conectar ao serviço. Tente novamente.');
  }

  if (resposta.status === 401 && token && token === lerToken()) {
    limparToken();
    ouvintesExpiracao.forEach((ouvinte) => ouvinte());
  }
  if (resposta.status === 204) return null;

  let dados;
  try {
    dados = await resposta.json();
  } catch {
    throw new ErroApi('O serviço retornou uma resposta inválida.', resposta.status);
  }

  if (!resposta.ok) {
    const mensagem =
      resposta.status >= 500
        ? 'Não foi possível concluir a operação. Tente novamente.'
        : dados.mensagem || 'Não foi possível concluir a operação.';
    throw new ErroApi(mensagem, resposta.status, dados.erros || {});
  }

  return dados;
}

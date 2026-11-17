const CHAVE_TOKEN = 'controle-financeiro-token';
const BASE_API = (import.meta.env?.VITE_API_URL || '/api').replace(/\/+$/, '');
let tokenEmMemoria = null;
let somenteMemoria = false;
const ouvintesExpiracao = new Set();

export function lerToken() {
  if (somenteMemoria) return tokenEmMemoria;
  try { return window.sessionStorage.getItem(CHAVE_TOKEN) || null; }
  catch { return tokenEmMemoria; }
}

export function salvarToken(token) {
  if (typeof token !== 'string' || !token.trim()) throw new Error('Token de acesso inválido.');
  tokenEmMemoria = token;
  try { window.sessionStorage.setItem(CHAVE_TOKEN, token); somenteMemoria = false; }
  catch { somenteMemoria = true; }
}

export function limparToken() {
  tokenEmMemoria = null;
  try { window.sessionStorage.removeItem(CHAVE_TOKEN); somenteMemoria = false; }
  catch { somenteMemoria = true; }
}

export function aoExpirarSessao(ouvinte) {
  ouvintesExpiracao.add(ouvinte);
  return () => ouvintesExpiracao.delete(ouvinte);
}

export class ErroApi extends Error {
  constructor(mensagem, status = 0, campos = {}) {
    super(mensagem);
    this.name = 'ErroApi';
    this.status = status;
    this.campos = campos;
    this.erros = campos;
  }
}

export async function api(caminho, { publica = false, signal, headers: iniciais, ...opcoes } = {}) {
  if (!caminho.startsWith('/') || caminho.startsWith('//') || caminho.includes('\\') || caminho.includes('..')) {
    throw new ErroApi('Caminho de consulta inválido.');
  }
  const headers = new Headers(iniciais);
  const token = publica ? null : lerToken();
  headers.set('Accept', 'application/json');
  if (opcoes.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    if (typeof opcoes.body !== 'string') opcoes.body = JSON.stringify(opcoes.body);
  }
  headers.delete('Authorization');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const controlador = new AbortController();
  const cancelar = () => controlador.abort();
  if (signal?.aborted) cancelar();
  else signal?.addEventListener('abort', cancelar, { once: true });
  let tempoEsgotado = false;
  const temporizador = setTimeout(() => { tempoEsgotado = true; cancelar(); }, 15000);

  try {
    const resposta = await fetch(`${BASE_API}${caminho}`, { ...opcoes, headers, signal: controlador.signal });
    const texto = resposta.status === 204 ? '' : await resposta.text();
    let dados = null;
    let jsonValido = true;
    if (texto) {
      try { dados = JSON.parse(texto); } catch { jsonValido = false; }
    }
    if (!resposta.ok) {
      if (resposta.status === 401 && token && token === lerToken()) {
        limparToken();
        ouvintesExpiracao.forEach((ouvinte) => ouvinte());
      }
      const origemCampos = dados?.campos ?? dados?.erros;
      const campos = origemCampos && typeof origemCampos === 'object' && !Array.isArray(origemCampos)
        ? Object.fromEntries(Object.entries(origemCampos).filter(([, mensagem]) => typeof mensagem === 'string'))
        : {};
      const mensagemServidor = dados?.erro ?? dados?.mensagem;
      const mensagem = resposta.status < 500 && typeof mensagemServidor === 'string'
        ? mensagemServidor : 'Não foi possível concluir a operação. Tente novamente.';
      throw new ErroApi(mensagem, resposta.status, campos);
    }
    if (!jsonValido) throw new ErroApi('O serviço retornou uma resposta inesperada. Tente novamente.', 502);
    return dados;
  } catch (erro) {
    if (erro instanceof ErroApi) throw erro;
    if (tempoEsgotado) throw new ErroApi('A consulta demorou mais que o esperado. Tente novamente.');
    if (erro.name === 'AbortError') throw erro;
    throw new ErroApi('Não foi possível conectar ao serviço. Tente novamente.');
  } finally {
    clearTimeout(temporizador);
    signal?.removeEventListener('abort', cancelar);
  }
}

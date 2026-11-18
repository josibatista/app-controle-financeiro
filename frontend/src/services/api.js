const CHAVE_TOKEN = 'controle-financeiro-token';

// Função chamada quando a API responde 401 (o AuthContext registra o logout aqui).
let aoReceber401 = null;

export function lerToken() {
  return sessionStorage.getItem(CHAVE_TOKEN);
}

export function salvarToken(token) {
  sessionStorage.setItem(CHAVE_TOKEN, token);
}

export function limparToken() {
  sessionStorage.removeItem(CHAVE_TOKEN);
}

export function aoExpirarSessao(funcao) {
  aoReceber401 = funcao;
}

// Ponto único de comunicação com a API: envia o token e trata os erros.
export async function api(caminho, { publica = false, ...opcoes } = {}) {
  const headers = { ...opcoes.headers };
  const token = publica ? null : lerToken();

  if (opcoes.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    if (typeof opcoes.body !== 'string') {
      opcoes.body = JSON.stringify(opcoes.body);
    }
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let resposta;
  try {
    resposta = await fetch(`/api${caminho}`, { ...opcoes, headers });
  } catch (erro) {
    if (erro.name === 'AbortError') throw erro;
    throw new Error('Não foi possível conectar ao servidor. Tente novamente.');
  }

  // Token ausente, inválido ou expirado: encerra a sessão e volta ao login.
  if (resposta.status === 401 && token) {
    limparToken();
    if (aoReceber401) aoReceber401();
  }

  if (resposta.status === 204) return null;

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    const erro = new Error(dados.mensagem || 'Não foi possível concluir a operação.');
    erro.status = resposta.status;
    erro.erros = dados.erros || {};
    throw erro;
  }

  return dados;
}

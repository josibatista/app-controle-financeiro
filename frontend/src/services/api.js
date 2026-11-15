const CHAVE_TOKEN = 'controle-financeiro-token';

export function salvarToken(token) {
  sessionStorage.setItem(CHAVE_TOKEN, token);
}

export function limparToken() {
  sessionStorage.removeItem(CHAVE_TOKEN);
}

export async function api(caminho, options = {}) {
  const headers = new Headers(options.headers);
  const token = sessionStorage.getItem(CHAVE_TOKEN);

  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const resposta = await fetch(`/api${caminho}`, {
    ...options,
    headers,
  });

  const dados = resposta.status === 204
    ? null
    : await resposta.json();

  if (!resposta.ok) {
    if (resposta.status === 401) limparToken();

    const erro = new Error(
      dados?.mensagem ?? 'Não foi possível concluir a operação.'
    );

    erro.status = resposta.status;
    erro.erros = dados?.erros ?? {};

    throw erro;
  }

  return dados;
}
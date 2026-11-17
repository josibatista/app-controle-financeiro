import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { aoExpirarSessao, lerToken, limparToken, salvarToken } from '../services/api.js';
import { cadastrarUsuario, consultarUsuario, entrar, expiracaoToken } from '../services/autenticacao.js';

const AuthContext = createContext(null);
const sessaoAnonima = { status: 'anonima', usuario: null, token: null, erro: '' };

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(() => ({ ...sessaoAnonima, status: lerToken() ? 'carregando' : 'anonima' }));
  const operacao = useRef(0);
  const consulta = useRef(null);

  const logout = useCallback(() => {
    operacao.current += 1;
    consulta.current?.abort();
    limparToken();
    setSessao(sessaoAnonima);
  }, []);

  const restaurarSessao = useCallback(async () => {
    const atual = ++operacao.current;
    consulta.current?.abort();
    const token = lerToken();
    if (!token) { setSessao(sessaoAnonima); return; }
    const validade = expiracaoToken(token);
    if (validade !== null && validade <= Date.now()) { logout(); return; }
    const controlador = new AbortController();
    consulta.current = controlador;
    setSessao({ ...sessaoAnonima, status: 'carregando' });
    try {
      const usuario = await consultarUsuario({ signal: controlador.signal });
      if (atual === operacao.current && token === lerToken()) {
        setSessao({ status: 'autenticada', usuario, token, erro: '' });
      }
    } catch (erro) {
      if (erro.name === 'AbortError' || atual !== operacao.current) return;
      setSessao({ ...sessaoAnonima, status: 'erro', erro: 'Não foi possível confirmar sua sessão. Tente novamente.' });
    }
  }, [logout]);

  useEffect(() => aoExpirarSessao(logout), [logout]);
  useEffect(() => {
    restaurarSessao();
    return () => { operacao.current += 1; consulta.current?.abort(); };
  }, [restaurarSessao]);

  useEffect(() => {
    if (!sessao.token) return;
    const validade = expiracaoToken(sessao.token);
    if (validade === null) return;
    let temporizador;
    function conferirValidade() {
      const restante = validade - Date.now();
      if (restante <= 0) logout();
      else temporizador = setTimeout(conferirValidade, Math.min(restante, 2147483647));
    }
    conferirValidade();
    return () => clearTimeout(temporizador);
  }, [sessao.token, logout]);

  async function login(dados, { signal } = {}) {
    const atual = ++operacao.current;
    consulta.current?.abort();
    const token = await entrar(dados, { signal });
    if (signal?.aborted || atual !== operacao.current) throw new DOMException('Acesso cancelado.', 'AbortError');
    const validade = expiracaoToken(token);
    if (validade !== null && validade <= Date.now()) throw new Error('Seu acesso expirou. Entre novamente.');
    salvarToken(token);
    try {
      const usuario = await consultarUsuario({ signal });
      if (signal?.aborted || atual !== operacao.current || token !== lerToken()) {
        throw new DOMException('Acesso cancelado.', 'AbortError');
      }
      setSessao({ status: 'autenticada', usuario, token, erro: '' });
      return usuario;
    } catch (erro) {
      if (atual === operacao.current && token === lerToken()) {
        limparToken();
        setSessao(sessaoAnonima);
      }
      throw erro;
    }
  }

  return <AuthContext.Provider value={{ ...sessao, login, logout, cadastrar: cadastrarUsuario, restaurarSessao }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth precisa estar dentro de AuthProvider.');
  return contexto;
}

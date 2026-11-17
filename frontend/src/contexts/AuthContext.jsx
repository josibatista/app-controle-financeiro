import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { aoExpirarSessao, lerToken, limparToken, salvarToken } from '../services/api.js';
import { cadastrarUsuario, consultarUsuario, entrar } from '../services/autenticacao.js';

const AuthContext = createContext(null);
const sessaoAnonima = { status: 'anonima', usuario: null, expiraEm: null, erro: '' };

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState({
    ...sessaoAnonima,
    status: lerToken() ? 'carregando' : 'anonima',
  });
  const consulta = useRef(null);

  const logout = useCallback(() => {
    consulta.current?.abort();
    limparToken();
    setSessao(sessaoAnonima);
  }, []);

  const restaurarSessao = useCallback(async () => {
    consulta.current?.abort();
    const token = lerToken();
    if (!token) {
      setSessao(sessaoAnonima);
      return;
    }

    const controlador = new AbortController();
    consulta.current = controlador;
    setSessao({ ...sessaoAnonima, status: 'carregando' });
    try {
      const { expiraEm, ...usuario } = await consultarUsuario({
        signal: controlador.signal,
      });
      if (!controlador.signal.aborted && token === lerToken()) {
        setSessao({ status: 'autenticada', usuario, expiraEm, erro: '' });
      }
    } catch (erro) {
      if (controlador.signal.aborted) return;
      setSessao({
        ...sessaoAnonima,
        status: 'erro',
        erro: 'Não foi possível confirmar sua sessão. Tente novamente.',
      });
    }
  }, []);

  useEffect(() => aoExpirarSessao(logout), [logout]);
  useEffect(() => {
    restaurarSessao();
    return () => consulta.current?.abort();
  }, [restaurarSessao]);

  useEffect(() => {
    if (!sessao.expiraEm) return;
    const tempoRestante = Math.max(0, sessao.expiraEm - Date.now());
    const temporizador = setTimeout(logout, tempoRestante);
    return () => clearTimeout(temporizador);
  }, [sessao.expiraEm, logout]);

  async function login(dados, { signal } = {}) {
    consulta.current?.abort();
    const controlador = new AbortController();
    consulta.current = controlador;
    const sinal = signal
      ? AbortSignal.any([signal, controlador.signal])
      : controlador.signal;
    let token;

    try {
      token = await entrar(dados, { signal: sinal });
      sinal.throwIfAborted();
      salvarToken(token);
      const { expiraEm, ...usuario } = await consultarUsuario({ signal: sinal });
      sinal.throwIfAborted();
      setSessao({ status: 'autenticada', usuario, expiraEm, erro: '' });
      return usuario;
    } catch (erro) {
      if (token && token === lerToken()) {
        limparToken();
        setSessao(sessaoAnonima);
      }
      throw erro;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        ...sessao,
        login,
        logout,
        cadastrar: cadastrarUsuario,
        restaurarSessao,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

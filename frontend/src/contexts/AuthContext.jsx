import { createContext, useContext, useEffect, useState } from 'react';
import { aoExpirarSessao, lerToken, limparToken, salvarToken } from '../services/api.js';
import { cadastrarUsuario, consultarUsuario, entrar } from '../services/autenticacao.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  // Se já existe um token salvo, começa carregando para confirmar a sessão.
  const [carregando, setCarregando] = useState(Boolean(lerToken()));

  function logout() {
    limparToken();
    setUsuario(null);
  }

  // Quando a API responder 401, o usuário é deslogado.
  useEffect(() => {
    aoExpirarSessao(logout);
  }, []);

  // Ao abrir ou recarregar a página, busca o usuário do token salvo.
  useEffect(() => {
    if (!lerToken()) return;

    consultarUsuario()
      .then((dados) => setUsuario(dados))
      .catch(() => logout())
      .finally(() => setCarregando(false));
  }, []);

  async function login(dados) {
    const token = await entrar(dados);
    salvarToken(token);
    const dadosUsuario = await consultarUsuario();
    setUsuario(dadosUsuario);
  }

  function atualizarUsuario(dados) {
    setUsuario({ id: dados.id, nome: dados.nome, email: dados.email });
  }

  const status = carregando ? 'carregando' : usuario ? 'autenticada' : 'anonima';

  return (
    <AuthContext.Provider
      value={{
        usuario,
        status,
        login,
        logout,
        cadastrar: cadastrarUsuario,
        atualizarUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

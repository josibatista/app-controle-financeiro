import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { validarCampoCadastro } from '../../services/validarCadastro.js';
import Campo from '../Campo.jsx';
import Icone from '../Icone.jsx';
import LayoutAcesso from '../LayoutAcesso.jsx';
import '../Acesso.css';

export default function Login() {
  const [dados, setDados] = useState({ email: '', senha: '' });
  const [erros, setErros] = useState({});
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { login, status } = useAuth();
  const navegar = useNavigate();
  const local = useLocation();

  function alterar(event) {
    const { name, value } = event.target;
    setDados({ ...dados, [name]: value });
    setErros({ ...erros, [name]: '' });
    setMensagem('');
  }

  async function enviar(event) {
    event.preventDefault();

    const novosErros = {};
    if (validarCampoCadastro('email', dados)) {
      novosErros.email = validarCampoCadastro('email', dados);
    }
    if (!dados.senha) novosErros.senha = 'Informe sua senha.';

    setErros(novosErros);
    setMensagem('');
    if (Object.keys(novosErros).length) return;

    setEnviando(true);
    try {
      await login(dados);
      navegar('/inicio', { replace: true });
    } catch (erro) {
      setErros(erro.erros || {});
      setMensagem(erro.message);
    } finally {
      setEnviando(false);
    }
  }

  if (status === 'autenticada') return <Navigate to="/inicio" replace />;

  return (
    <LayoutAcesso titulo="Entre na sua conta" descricao="Acesse seu controle financeiro.">
      {local.state?.cadastroConcluido && (
        <p className="fl-acesso-status">Conta criada. Entre para continuar.</p>
      )}
      <form className="fl-form" onSubmit={enviar} noValidate>
        <fieldset disabled={enviando}>
          <Campo
            id="login-email"
            name="email"
            label="E-mail"
            type="email"
            autoComplete="username"
            maxLength={160}
            placeholder="voce@exemplo.com"
            value={dados.email}
            onChange={alterar}
            erro={erros.email}
            required
          />
          <Campo
            id="login-senha"
            name="senha"
            label="Senha"
            type="password"
            autoComplete="current-password"
            placeholder="Sua senha"
            value={dados.senha}
            onChange={alterar}
            erro={erros.senha}
            required
          />
          <button className="fl-submit" type="submit">
            <span>{enviando ? 'Entrando...' : 'Entrar'}</span>
            <Icone nome="seta" />
          </button>
        </fieldset>
        {mensagem && <p className="fl-alert">{mensagem}</p>}
      </form>
      <p className="fl-switch">
        <span>Ainda não tem uma conta?</span>{' '}
        <Link className="fl-text-button" to="/cadastro">
          Criar conta
        </Link>
      </p>
    </LayoutAcesso>
  );
}

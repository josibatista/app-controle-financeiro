import { useEffect, useRef, useState } from 'react';
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
  const requisicao = useRef(null);
  const formularioRef = useRef(null);
  const campoParaFocar = useRef(null);
  const { login, status } = useAuth();
  const navegar = useNavigate();
  const local = useLocation();

  useEffect(() => () => requisicao.current?.abort(), []);
  useEffect(() => {
    if (!enviando && campoParaFocar.current) {
      formularioRef.current?.elements.namedItem(campoParaFocar.current)?.focus();
      campoParaFocar.current = null;
    }
  }, [enviando]);

  function alterar(event) {
    const { name, value } = event.target;
    setDados((atual) => ({ ...atual, [name]: value }));
    setErros((atuais) => ({ ...atuais, [name]: '' }));
    setMensagem('');
  }

  async function enviar(event) {
    event.preventDefault();
    if (requisicao.current) return;
    const formulario = event.currentTarget;
    const verificacoes = {
      email: validarCampoCadastro('email', dados),
      senha: dados.senha ? '' : 'Informe sua senha.',
    };
    const novosErros = Object.fromEntries(
      Object.entries(verificacoes).filter(([, erro]) => Boolean(erro)),
    );
    setErros(novosErros);
    setMensagem('');
    const primeiro = Object.keys(novosErros)[0];
    if (primeiro) {
      formulario.elements.namedItem(primeiro)?.focus();
      return;
    }
    const controlador = new AbortController();
    requisicao.current = controlador;
    setEnviando(true);
    try {
      await login(dados, { signal: controlador.signal });
      setDados({ email: '', senha: '' });
      navegar('/inicio', { replace: true });
    } catch (erro) {
      if (erro.name === 'AbortError' || controlador.signal.aborted) return;
      if (erro.status === 401) setMensagem('E-mail ou senha inválidos.');
      else if ([404, 501, 503].includes(erro.status))
        setMensagem(
          'O acesso à conta está indisponível no momento. Tente novamente mais tarde.',
        );
      else {
        const campos = Object.fromEntries(
          Object.entries(erro.erros ?? {}).filter(([campo]) =>
            ['email', 'senha'].includes(campo),
          ),
        );
        setErros(campos);
        setMensagem(erro.message || 'Não foi possível entrar. Tente novamente.');
        campoParaFocar.current = Object.keys(campos)[0];
      }
    } finally {
      requisicao.current = null;
      if (!controlador.signal.aborted) setEnviando(false);
    }
  }

  if (status === 'autenticada') return <Navigate to="/inicio" replace />;

  return (
    <LayoutAcesso titulo="Entre na sua conta" descricao="Acesse seu controle financeiro.">
      {local.state?.cadastroConcluido && (
        <p className="fl-acesso-status" role="status">
          Conta criada. Entre para continuar.
        </p>
      )}
      <form
        className="fl-form"
        ref={formularioRef}
        onSubmit={enviar}
        noValidate
        aria-busy={enviando}
      >
        <fieldset disabled={enviando}>
          <Campo
            id="login-email"
            name="email"
            label="E-mail"
            type="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
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
        {enviando && (
          <p className="fl-acesso-status" role="status">
            Confirmando seu acesso...
          </p>
        )}
        {mensagem && (
          <p className="fl-alert" role="alert">
            {mensagem}
          </p>
        )}
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

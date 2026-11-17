import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Campo from '../Campo.jsx';
import Icone from '../Icone.jsx';
import LayoutAcesso from '../LayoutAcesso.jsx';
import { formatarCpf } from '../../services/cpf.js';
import { validarCadastro, validarCampoCadastro } from '../../services/validarCadastro.js';
import './Cadastro.css';
import '../Acesso.css';

export default function Cadastro() {
  const [dados, setDados] = useState({
    nome: '',
    email: '',
    cpf: '',
    senha: '',
    confirmacaoSenha: '',
  });
  const [erros, setErros] = useState({});
  const [tocados, setTocados] = useState({});
  const [sucesso, setSucesso] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const requisicao = useRef(null);
  const formularioRef = useRef(null);
  const campoParaFocar = useRef(null);
  const { cadastrar, status } = useAuth();

  useEffect(() => () => requisicao.current?.abort(), []);
  useEffect(() => {
    if (!enviando && campoParaFocar.current) {
      formularioRef.current?.elements.namedItem(campoParaFocar.current)?.focus();
      campoParaFocar.current = null;
    }
  }, [enviando]);

  function alterar(event) {
    const { name, value } = event.target;
    const proximos = { ...dados, [name]: name === 'cpf' ? formatarCpf(value) : value };
    setDados(proximos);
    setMensagem('');

    if (tocados[name] || (name === 'senha' && tocados.confirmacaoSenha)) {
      setErros((atuais) => {
        const novos = { ...atuais };
        if (tocados[name]) novos[name] = validarCampoCadastro(name, proximos);
        if (name === 'senha' && tocados.confirmacaoSenha) {
          novos.confirmacaoSenha = validarCampoCadastro('confirmacaoSenha', proximos);
        }
        return novos;
      });
    }
  }

  function validarAoSair(event) {
    const { name } = event.target;
    setTocados((atuais) => ({ ...atuais, [name]: true }));
    setErros((atuais) => ({ ...atuais, [name]: validarCampoCadastro(name, dados) }));
  }

  async function conferir(event) {
    event.preventDefault();
    if (requisicao.current) return;
    const formulario = event.currentTarget;
    const novosErros = validarCadastro(dados);
    setErros(novosErros);
    setTocados(Object.fromEntries(Object.keys(dados).map((campo) => [campo, true])));
    const primeiroCampo = Object.keys(novosErros)[0];
    setMensagem('');
    if (primeiroCampo) {
      formulario.elements.namedItem(primeiroCampo)?.focus();
      return;
    }
    const controlador = new AbortController();
    requisicao.current = controlador;
    setEnviando(true);
    try {
      await cadastrar(dados, { signal: controlador.signal });
      if (controlador.signal.aborted) return;
      setDados({ nome: '', email: '', cpf: '', senha: '', confirmacaoSenha: '' });
      setSucesso(true);
    } catch (erro) {
      if (erro.name === 'AbortError' || controlador.signal.aborted) return;
      const campos = Object.fromEntries(
        Object.entries(erro.campos ?? {}).filter(([campo]) =>
          Object.hasOwn(dados, campo),
        ),
      );
      setErros(campos);
      setMensagem(
        [404, 501, 503].includes(erro.status)
          ? 'O cadastro está indisponível no momento. Tente novamente mais tarde.'
          : erro.message || 'Não foi possível criar sua conta. Tente novamente.',
      );
      campoParaFocar.current = Object.keys(campos)[0];
    } finally {
      requisicao.current = null;
      if (!controlador.signal.aborted) setEnviando(false);
    }
  }

  if (status === 'autenticada') return <Navigate to="/inicio" replace />;

  return (
    <LayoutAcesso
      titulo="Crie sua conta"
      descricao="Comece a organizar suas finanças."
      classePrincipal="fl-main--cadastro"
    >
      {sucesso ? (
        <div className="fl-acesso-sucesso">
          <p role="status">Conta criada com sucesso.</p>
          <Link
            className="fl-text-button"
            to="/login"
            state={{ cadastroConcluido: true }}
          >
            Entrar na minha conta
          </Link>
        </div>
      ) : (
        <form
          className="fl-form"
          ref={formularioRef}
          onSubmit={conferir}
          noValidate
          aria-busy={enviando}
        >
          <fieldset disabled={enviando}>
            <Campo
              id="cadastro-nome"
              name="nome"
              label="Nome completo"
              autoComplete="name"
              maxLength={120}
              placeholder="Seu nome completo"
              value={dados.nome}
              onChange={alterar}
              onBlur={validarAoSair}
              erro={erros.nome}
              marcarObrigatorio
              required
            />
            <Campo
              id="cadastro-email"
              name="email"
              label="E-mail"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={160}
              placeholder="voce@exemplo.com"
              value={dados.email}
              onChange={alterar}
              onBlur={validarAoSair}
              erro={erros.email}
              informacao="Esse e-mail será usado para entrar na conta. Cada e-mail pode ser cadastrado uma única vez."
              marcarObrigatorio
              required
            />
            <Campo
              id="cadastro-cpf"
              name="cpf"
              label="CPF"
              inputMode="numeric"
              autoComplete="off"
              maxLength={14}
              placeholder="000.000.000-00"
              value={dados.cpf}
              onChange={alterar}
              onBlur={validarAoSair}
              erro={erros.cpf}
              informacao="Cada CPF pode ser cadastrado uma única vez. Digite os 11 números; a pontuação é preenchida automaticamente."
              marcarObrigatorio
              required
            />
            <Campo
              id="cadastro-senha"
              name="senha"
              label="Senha"
              type="password"
              autoComplete="new-password"
              placeholder="Crie uma senha"
              value={dados.senha}
              onChange={alterar}
              onBlur={validarAoSair}
              erro={erros.senha}
              ajuda="Use pelo menos 8 caracteres, com letras e números."
              informacao="A senha precisa combinar letras e números. Use o ícone de olho para conferir o que digitou."
              marcarObrigatorio
              required
            />
            <Campo
              id="cadastro-confirmacao"
              name="confirmacaoSenha"
              label="Confirmar senha"
              type="password"
              autoComplete="new-password"
              placeholder="Repita sua senha"
              value={dados.confirmacaoSenha}
              onChange={alterar}
              onBlur={validarAoSair}
              erro={erros.confirmacaoSenha}
              marcarObrigatorio
              required
            />
            <button className="fl-submit" type="submit">
              <span>{enviando ? 'Criando conta...' : 'Criar conta'}</span>
              <Icone nome="seta" />
            </button>
          </fieldset>
          {enviando && (
            <p className="fl-acesso-status" role="status">
              Enviando seu cadastro...
            </p>
          )}
          {mensagem && (
            <p className="fl-alert" role="alert">
              {mensagem}
            </p>
          )}
        </form>
      )}
      <p className="fl-switch">
        <span>Já tem uma conta?</span>{' '}
        <Link className="fl-text-button" to="/login">
          Entrar
        </Link>
      </p>
    </LayoutAcesso>
  );
}

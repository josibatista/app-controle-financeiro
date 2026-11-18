import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Campo from '../Campo.jsx';
import Icone from '../Icone.jsx';
import LayoutAcesso from '../LayoutAcesso.jsx';
import { formatarCpf } from '../../services/cpf.js';
import { validarCadastro, validarCampoCadastro } from '../../services/validarCadastro.js';
import './Cadastro.css';
import '../Acesso.css';

const cadastroVazio = { nome: '', email: '', cpf: '', senha: '', confirmacaoSenha: '' };

export default function Cadastro() {
  const [dados, setDados] = useState(cadastroVazio);
  const [erros, setErros] = useState({});
  const [sucesso, setSucesso] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { cadastrar, status } = useAuth();

  function alterar(event) {
    const { name, value } = event.target;
    // O CPF recebe a máscara 000.000.000-00 enquanto é digitado.
    const novoValor = name === 'cpf' ? formatarCpf(value) : value;
    setDados({ ...dados, [name]: novoValor });
    setMensagem('');
  }

  // Valida o campo quando o usuário sai dele.
  function validarAoSair(event) {
    const { name } = event.target;
    setErros({ ...erros, [name]: validarCampoCadastro(name, dados) });
  }

  async function enviar(event) {
    event.preventDefault();

    const novosErros = validarCadastro(dados);
    setErros(novosErros);
    setMensagem('');
    if (Object.keys(novosErros).length) return;

    setEnviando(true);
    try {
      await cadastrar(dados);
      setDados(cadastroVazio);
      setSucesso(true);
    } catch (erro) {
      // Erros do servidor, como e-mail ou CPF já cadastrado (409), aparecem no campo.
      setErros(erro.erros || {});
      setMensagem(erro.message);
    } finally {
      setEnviando(false);
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
          <p>Conta criada com sucesso.</p>
          <Link className="fl-text-button" to="/login" state={{ cadastroConcluido: true }}>
            Entrar na minha conta
          </Link>
        </div>
      ) : (
        <form className="fl-form" onSubmit={enviar} noValidate>
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
          {mensagem && <p className="fl-alert">{mensagem}</p>}
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

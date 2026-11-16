import { useState } from 'react';
import { Link } from 'react-router-dom';
import Campo from '../Campo.jsx';
import Icone from '../Icone.jsx';
import LayoutAcesso from '../LayoutAcesso.jsx';
import { formatarCpf } from '../../services/cpf.js';
import { validarCadastro, validarCampoCadastro } from '../../services/validarCadastro.js';
import './Cadastro.css';

export default function Cadastro() {
  const [dados, setDados] = useState({ nome: '', email: '', cpf: '', senha: '', confirmacaoSenha: '' });
  const [erros, setErros] = useState({});
  const [tocados, setTocados] = useState({});
  const [conferido, setConferido] = useState(false);

  function alterar(event) {
    const { name, value } = event.target;
    const proximos = { ...dados, [name]: name === 'cpf' ? formatarCpf(value) : value };
    setDados(proximos);
    setConferido(false);

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

  function conferir(event) {
    event.preventDefault();
    const novosErros = validarCadastro(dados);
    setErros(novosErros);
    setTocados(Object.fromEntries(Object.keys(dados).map((campo) => [campo, true])));
    const primeiroCampo = Object.keys(novosErros)[0];
    setConferido(!primeiroCampo);
    if (primeiroCampo) event.currentTarget.elements.namedItem(primeiroCampo)?.focus();
  }

  return (
    <LayoutAcesso titulo="Crie sua conta" descricao="Comece a organizar suas finanças." classePrincipal="fl-main--cadastro">
      <form className="fl-form" onSubmit={conferir} noValidate>
        <Campo id="cadastro-nome" name="nome" label="Nome completo" autoComplete="name" maxLength={120} placeholder="Seu nome completo" value={dados.nome} onChange={alterar} onBlur={validarAoSair} erro={erros.nome} marcarObrigatorio required />
        <Campo id="cadastro-email" name="email" label="E-mail" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={160} placeholder="voce@exemplo.com" value={dados.email} onChange={alterar} onBlur={validarAoSair} erro={erros.email} informacao="Esse e-mail será usado para entrar na conta. Cada e-mail pode ser cadastrado uma única vez." marcarObrigatorio required />
        <Campo id="cadastro-cpf" name="cpf" label="CPF" inputMode="numeric" autoComplete="off" maxLength={14} placeholder="000.000.000-00" value={dados.cpf} onChange={alterar} onBlur={validarAoSair} erro={erros.cpf} informacao="Cada CPF pode ser cadastrado uma única vez. Digite os 11 números; a pontuação é preenchida automaticamente." marcarObrigatorio required />
        <Campo id="cadastro-senha" name="senha" label="Senha" type="password" autoComplete="new-password" placeholder="Crie uma senha" value={dados.senha} onChange={alterar} onBlur={validarAoSair} erro={erros.senha} ajuda="Use pelo menos 8 caracteres, com letras e números." informacao="A senha precisa combinar letras e números. Use o ícone de olho para conferir o que digitou." marcarObrigatorio required />
        <Campo id="cadastro-confirmacao" name="confirmacaoSenha" label="Confirmar senha" type="password" autoComplete="new-password" placeholder="Repita sua senha" value={dados.confirmacaoSenha} onChange={alterar} onBlur={validarAoSair} erro={erros.confirmacaoSenha} marcarObrigatorio required />
        <button className="fl-submit" type="submit"><span>Criar conta</span><Icone nome="seta" /></button>
        {conferido && <p className="fl-cadastro-status" role="status">Campos conferidos nesta prévia. Nenhuma conta foi criada.</p>}
      </form>
      <p className="fl-switch"><span>Já tem uma conta?</span> <Link className="fl-text-button" to="/login">Entrar</Link></p>
    </LayoutAcesso>
  );
}

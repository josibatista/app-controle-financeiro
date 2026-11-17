import { useEffect, useState } from 'react';
import Campo from '../Campo.jsx';
import { validarCampoCadastro } from '../../services/validarCadastro.js';
import './Perfil.css';

// Dados fictícios para a etapa visual, até a integração com o usuário autenticado.
const dadosExemplo = { nome: 'Marina Souza', email: 'marina.souza@exemplo.com', cpf: '•••.•••.•••-••' };
const senhasVazias = { senhaAtual: '', novaSenha: '', confirmacao: '' };

export default function Perfil() {
  const [dados, setDados] = useState({ nome: dadosExemplo.nome, email: dadosExemplo.email });
  const [senhas, setSenhas] = useState(senhasVazias);
  const [errosDados, setErrosDados] = useState({});
  const [errosSenha, setErrosSenha] = useState({});
  const [dadosConferidos, setDadosConferidos] = useState(false);
  const [senhaConferida, setSenhaConferida] = useState(false);
  const [versaoSenha, setVersaoSenha] = useState(0);

  useEffect(() => { document.title = 'Meu perfil'; }, []);

  function alterarDados(event) {
    const { name, value } = event.target;
    setDados((atuais) => ({ ...atuais, [name]: value }));
    setErrosDados((atuais) => ({ ...atuais, [name]: '' }));
    setDadosConferidos(false);
  }

  function cancelarDados() {
    setDados({ nome: dadosExemplo.nome, email: dadosExemplo.email });
    setErrosDados({});
    setDadosConferidos(false);
  }

  function conferirDados(event) {
    event.preventDefault();
    const novosErros = Object.fromEntries(
      ['nome', 'email']
        .map((campo) => [campo, validarCampoCadastro(campo, dados)])
        .filter(([, erro]) => Boolean(erro)),
    );
    setErrosDados(novosErros);
    const primeiroCampo = Object.keys(novosErros)[0];
    setDadosConferidos(!primeiroCampo);
    if (primeiroCampo) event.currentTarget.elements.namedItem(primeiroCampo)?.focus();
  }

  function alterarSenha(event) {
    const { name, value } = event.target;
    setSenhas((atuais) => ({ ...atuais, [name]: value }));
    setErrosSenha({});
    setSenhaConferida(false);
  }

  function conferirSenha(event) {
    event.preventDefault();
    const dadosSenha = { senha: senhas.novaSenha, confirmacaoSenha: senhas.confirmacao };
    const verificacoes = {
      senhaAtual: senhas.senhaAtual ? '' : 'Informe sua senha atual.',
      novaSenha: senhas.novaSenha ? validarCampoCadastro('senha', dadosSenha) : 'Informe a nova senha.',
      confirmacao: senhas.confirmacao ? validarCampoCadastro('confirmacaoSenha', dadosSenha) : 'Confirme a nova senha.',
    };
    const novosErros = Object.fromEntries(Object.entries(verificacoes).filter(([, erro]) => Boolean(erro)));
    setErrosSenha(novosErros);
    const primeiroCampo = Object.keys(novosErros)[0];
    setSenhaConferida(!primeiroCampo);
    if (primeiroCampo) {
      event.currentTarget.elements.namedItem(primeiroCampo)?.focus();
      return;
    }
    setSenhas(senhasVazias);
    setVersaoSenha((atual) => atual + 1);
    event.currentTarget.querySelector('button[type="submit"]')?.focus();
  }

  return (
    <section className="fl-perfil" aria-labelledby="titulo-perfil">
      <h1 id="titulo-perfil">Meu perfil</h1>
      <p className="fl-perfil-descricao">Gerencie seus dados e o acesso à sua conta.</p>

      <section className="fl-perfil-secao" aria-labelledby="titulo-dados-pessoais">
        <div className="fl-perfil-secao-titulo">
          <h2 id="titulo-dados-pessoais">Dados pessoais</h2>
          <p>Informações usadas no seu cadastro.</p>
        </div>
        <form className="fl-perfil-formulario" onSubmit={conferirDados} noValidate>
          <div className="fl-perfil-campos">
            <div className="fl-perfil-campo-completo">
              <Campo id="perfil-nome" name="nome" label="Nome completo" autoComplete="name" maxLength={120} value={dados.nome} onChange={alterarDados} erro={errosDados.nome} marcarObrigatorio required />
            </div>
            <div className="fl-perfil-campo-completo">
              <Campo id="perfil-email" name="email" label="E-mail" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={160} value={dados.email} onChange={alterarDados} erro={errosDados.email} informacao="Este e-mail será usado para entrar na conta." marcarObrigatorio required />
            </div>
            <div className="fl-perfil-campo-completo">
              <Campo id="perfil-cpf" name="cpf" label="CPF" value={dadosExemplo.cpf} disabled ajuda="O CPF não pode ser alterado por aqui." informacao="O CPF fica disponível apenas para consulta." />
            </div>
          </div>
          <div className="fl-perfil-acoes">
            <button className="fl-perfil-botao" type="button" onClick={cancelarDados}>Cancelar</button>
            <button className="fl-perfil-botao fl-perfil-botao--principal" type="submit">Salvar alterações</button>
          </div>
          {dadosConferidos && <p className="fl-perfil-status" role="status">Prévia: dados conferidos. Nenhuma alteração foi enviada.</p>}
        </form>
      </section>

      <section className="fl-perfil-secao" aria-labelledby="titulo-alterar-senha">
        <div className="fl-perfil-secao-titulo">
          <h2 id="titulo-alterar-senha">Alterar senha</h2>
          <p>Escolha uma nova senha para acessar sua conta.</p>
        </div>
        <form className="fl-perfil-formulario" onSubmit={conferirSenha} noValidate>
          <div className="fl-perfil-campos" key={versaoSenha}>
            <div className="fl-perfil-campo-completo">
              <Campo id="perfil-senha-atual" name="senhaAtual" label="Senha atual" type="password" autoComplete="current-password" placeholder="Digite sua senha atual" value={senhas.senhaAtual} onChange={alterarSenha} erro={errosSenha.senhaAtual} marcarObrigatorio required />
            </div>
            <Campo id="perfil-senha-nova" name="novaSenha" label="Nova senha" type="password" autoComplete="new-password" placeholder="Crie uma nova senha" value={senhas.novaSenha} onChange={alterarSenha} erro={errosSenha.novaSenha} ajuda="Use pelo menos 8 caracteres, com letras e números." marcarObrigatorio required />
            <Campo id="perfil-senha-confirmacao" name="confirmacao" label="Confirmar nova senha" type="password" autoComplete="new-password" placeholder="Repita a nova senha" value={senhas.confirmacao} onChange={alterarSenha} erro={errosSenha.confirmacao} marcarObrigatorio required />
          </div>
          <div className="fl-perfil-acoes">
            <button className="fl-perfil-botao fl-perfil-botao--principal" type="submit">Atualizar senha</button>
          </div>
          {senhaConferida && <p className="fl-perfil-status" role="status">Prévia: campos conferidos. A senha não foi alterada.</p>}
        </form>
      </section>
    </section>
  );
}

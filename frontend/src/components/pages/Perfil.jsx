import { useEffect } from 'react';
import Campo from '../Campo.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import './Perfil.css';

export default function Perfil() {
  const { usuario } = useAuth();
  useEffect(() => { document.title = 'Meu perfil'; }, []);

  // A API consultada ainda não oferece rotas para editar dados ou trocar a senha.
  return (
    <section className="fl-perfil" aria-labelledby="titulo-perfil">
      <h1 id="titulo-perfil">Meu perfil</h1>
      <p className="fl-perfil-descricao">Gerencie seus dados e o acesso à sua conta.</p>
      <p className="fl-perfil-aviso" role="status">A edição dos dados e da senha ainda não está disponível.</p>

      <section className="fl-perfil-secao" aria-labelledby="titulo-dados-pessoais">
        <div className="fl-perfil-secao-titulo">
          <h2 id="titulo-dados-pessoais">Dados pessoais</h2>
          <p>Informações usadas no seu cadastro.</p>
        </div>
        <form className="fl-perfil-formulario" onSubmit={(event) => event.preventDefault()}>
          <div className="fl-perfil-campos">
            <div className="fl-perfil-campo-completo">
              <Campo id="perfil-nome" name="nome" label="Nome completo" autoComplete="name" value={usuario.nome} readOnly marcarObrigatorio required />
            </div>
            <div className="fl-perfil-campo-completo">
              <Campo id="perfil-email" name="email" label="E-mail" type="email" autoComplete="email" value={usuario.email} readOnly informacao="Este e-mail é usado para entrar na conta." marcarObrigatorio required />
            </div>
            <div className="fl-perfil-campo-completo">
              <Campo id="perfil-cpf" name="cpf" label="CPF" value="•••.•••.•••-••" disabled ajuda="O CPF não pode ser alterado por aqui." informacao="O CPF fica protegido e não pode ser alterado por esta tela." />
            </div>
          </div>
          <div className="fl-perfil-acoes">
            <button className="fl-perfil-botao" type="button" disabled>Cancelar</button>
            <button className="fl-perfil-botao fl-perfil-botao--principal" type="submit" disabled>Salvar alterações</button>
          </div>
        </form>
      </section>

      <section className="fl-perfil-secao" aria-labelledby="titulo-alterar-senha">
        <div className="fl-perfil-secao-titulo">
          <h2 id="titulo-alterar-senha">Alterar senha</h2>
          <p>Escolha uma nova senha para acessar sua conta.</p>
        </div>
        <form className="fl-perfil-formulario" onSubmit={(event) => event.preventDefault()}>
          <fieldset className="fl-perfil-campos" disabled aria-label="Alteração de senha indisponível">
            <div className="fl-perfil-campo-completo">
              <Campo id="perfil-senha-atual" name="senhaAtual" label="Senha atual" type="password" autoComplete="current-password" placeholder="Digite sua senha atual" marcarObrigatorio required />
            </div>
            <Campo id="perfil-senha-nova" name="novaSenha" label="Nova senha" type="password" autoComplete="new-password" placeholder="Crie uma nova senha" ajuda="Use pelo menos 8 caracteres, com letras e números." marcarObrigatorio required />
            <Campo id="perfil-senha-confirmacao" name="confirmacao" label="Confirmar nova senha" type="password" autoComplete="new-password" placeholder="Repita a nova senha" marcarObrigatorio required />
          </fieldset>
          <div className="fl-perfil-acoes">
            <button className="fl-perfil-botao fl-perfil-botao--principal" type="submit" disabled>Atualizar senha</button>
          </div>
        </form>
      </section>
    </section>
  );
}

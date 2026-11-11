import { useState } from 'react';
import Campo from './Campo.jsx';
import Icone from './Icone.jsx';
import LayoutAcesso from './LayoutAcesso.jsx';

export default function Login() {
  const [dados, setDados] = useState({ email: '', senha: '' });

  function alterar(event) {
    const { name, value } = event.target;
    setDados((atual) => ({ ...atual, [name]: value }));
  }

  return (
    <LayoutAcesso titulo="Entre na sua conta" descricao="Acesse seu controle financeiro.">
      <form className="fl-form" onSubmit={(event) => event.preventDefault()}>
        <Campo id="login-email" name="email" label="E-mail" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={160} placeholder="voce@exemplo.com" value={dados.email} onChange={alterar} required />
        <Campo id="login-senha" name="senha" label="Senha" type="password" autoComplete="current-password" placeholder="Sua senha" value={dados.senha} onChange={alterar} required />
        <button className="fl-submit" type="submit"><span>Entrar</span><Icone nome="seta" /></button>
      </form>
      <p className="fl-switch"><span>Ainda não tem uma conta?</span> <button className="fl-text-button" type="button">Criar conta</button></p>
    </LayoutAcesso>
  );
}

import { cpfValido } from './cpf.js';

const obrigatorios = {
  nome: 'Informe seu nome.',
  email: 'Informe seu e-mail.',
  cpf: 'Informe seu CPF.',
  senha: 'Informe sua senha.',
  confirmacaoSenha: 'Confirme sua senha.',
};

export function validarCampoCadastro(campo, dados) {
  const valor = String(dados[campo] ?? '');
  if (!valor.trim()) return obrigatorios[campo] ?? '';

  if (campo === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim())) {
    return 'Digite um e-mail válido.';
  }

  if (campo === 'cpf' && !cpfValido(valor)) return 'Digite um CPF válido.';

  if (campo === 'senha' && (valor.length < 8 || !/[a-zA-Z]/.test(valor) || !/[0-9]/.test(valor))) {
    return 'Use no mínimo 8 caracteres, com letras e números.';
  }

  if (campo === 'confirmacaoSenha' && valor !== dados.senha) return 'As senhas precisam ser iguais.';

  return '';
}

export function validarCadastro(dados) {
  return Object.fromEntries(
    Object.keys(obrigatorios)
      .map((campo) => [campo, validarCampoCadastro(campo, dados)])
      .filter(([, erro]) => Boolean(erro)),
  );
}

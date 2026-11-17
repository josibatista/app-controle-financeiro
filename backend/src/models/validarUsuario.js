const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function texto(valor) {
  return typeof valor === 'string' ? valor : '';
}

export function cpfValido(cpf) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;

  function digito(tamanho) {
    let soma = 0;
    for (let i = 0; i < tamanho; i += 1) {
      soma += Number(cpf[i]) * (tamanho + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  }

  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10]);
}

function erroNome(nome) {
  if (!nome) return 'Informe seu nome.';
  if (nome.length > 120) return 'Use um nome de até 120 caracteres.';
  return '';
}

function erroEmail(email) {
  if (!email) return 'Informe seu e-mail.';
  if (email.length > 160 || !formatoEmail.test(email)) return 'Digite um e-mail válido.';
  return '';
}

function erroSenha(senha) {
  if (senha.length < 8 || !/[a-zA-Z]/.test(senha) || !/\d/.test(senha)) {
    return 'Use no mínimo 8 caracteres, com letras e números.';
  }
  return '';
}

export function validarCadastro(body) {
  const dados = {
    nome: texto(body?.nome).trim(),
    email: texto(body?.email).trim().toLowerCase(),
    cpf: texto(body?.cpf).replace(/\D/g, ''),
    senha: texto(body?.senha),
    confirmacaoSenha: texto(body?.confirmacaoSenha),
  };
  const erros = {};

  if (erroNome(dados.nome)) erros.nome = erroNome(dados.nome);
  if (erroEmail(dados.email)) erros.email = erroEmail(dados.email);

  if (!dados.cpf) erros.cpf = 'Informe seu CPF.';
  else if (!cpfValido(dados.cpf)) erros.cpf = 'Digite um CPF válido.';

  if (!dados.senha) erros.senha = 'Informe sua senha.';
  else if (erroSenha(dados.senha)) erros.senha = erroSenha(dados.senha);

  if (!dados.confirmacaoSenha) erros.confirmacaoSenha = 'Confirme sua senha.';
  else if (dados.confirmacaoSenha !== dados.senha) {
    erros.confirmacaoSenha = 'As senhas precisam ser iguais.';
  }

  return { dados, erros };
}

export function validarLogin(body) {
  const dados = {
    email: texto(body?.email).trim().toLowerCase(),
    senha: texto(body?.senha),
  };
  const erros = {};

  if (!formatoEmail.test(dados.email)) erros.email = 'Digite um e-mail válido.';
  if (!dados.senha) erros.senha = 'Informe sua senha.';

  return { dados, erros };
}

export function validarPerfil(body) {
  const dados = {
    nome: texto(body?.nome).trim(),
    email: texto(body?.email).trim().toLowerCase(),
  };
  const erros = {};

  if (erroNome(dados.nome)) erros.nome = erroNome(dados.nome);
  if (erroEmail(dados.email)) erros.email = erroEmail(dados.email);

  return { dados, erros };
}

export function validarTrocaSenha(body) {
  const dados = {
    senhaAtual: texto(body?.senhaAtual),
    novaSenha: texto(body?.novaSenha),
    confirmacaoSenha: texto(body?.confirmacaoSenha),
  };
  const erros = {};

  if (!dados.senhaAtual) erros.senhaAtual = 'Informe sua senha atual.';

  if (!dados.novaSenha) erros.novaSenha = 'Informe a nova senha.';
  else if (erroSenha(dados.novaSenha)) erros.novaSenha = erroSenha(dados.novaSenha);

  if (!dados.confirmacaoSenha) erros.confirmacaoSenha = 'Confirme a nova senha.';
  else if (dados.confirmacaoSenha !== dados.novaSenha) {
    erros.confirmacaoSenha = 'As senhas precisam ser iguais.';
  }

  return { dados, erros };
}

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

export function validarCadastro(body = {}) {
  const dados = {
    nome: texto(body?.nome).trim(),
    email: texto(body?.email).trim().toLowerCase(),
    cpf: texto(body?.cpf).trim(),
    senha: texto(body?.senha),
    confirmacaoSenha: texto(body?.confirmacaoSenha),
  };
  const erros = {};

  if (!dados.nome) erros.nome = 'Informe seu nome.';
  else if (dados.nome.length > 120 || /[\u0000-\u001f\u007f]/.test(dados.nome)) {
    erros.nome = 'Use um nome de até 120 caracteres, sem caracteres de controle.';
  }

  if (!dados.email) erros.email = 'Informe seu e-mail.';
  else if (dados.email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) {
    erros.email = 'Digite um e-mail válido.';
  }

  const formatoCpf = /^(\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/;
  if (!dados.cpf) erros.cpf = 'Informe seu CPF.';
  else if (!formatoCpf.test(dados.cpf) || !cpfValido(dados.cpf.replace(/\D/g, ''))) {
    erros.cpf = 'Digite um CPF válido.';
  }
  dados.cpf = dados.cpf.replace(/\D/g, '');

  if (!dados.senha.trim()) erros.senha = 'Informe sua senha.';
  else if (
    dados.senha.length < 8 ||
    !/[a-zA-Z]/.test(dados.senha) ||
    !/\d/.test(dados.senha)
  ) {
    erros.senha = 'Use no mínimo 8 caracteres, com letras e números.';
  } else if (Buffer.byteLength(dados.senha, 'utf8') > 72) {
    erros.senha = 'Use uma senha de até 72 bytes.';
  }

  if (!dados.confirmacaoSenha.trim()) erros.confirmacaoSenha = 'Confirme sua senha.';
  else if (dados.confirmacaoSenha !== dados.senha) {
    erros.confirmacaoSenha = 'As senhas precisam ser iguais.';
  }

  return { dados, erros };
}

export function validarLogin(body = {}) {
  const email = texto(body?.email).trim().toLowerCase();
  const senha = texto(body?.senha);
  const erros = {};

  if (!email || email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    erros.email = 'Digite um e-mail válido.';
  }
  if (!senha.trim()) erros.senha = 'Informe sua senha.';
  else if (Buffer.byteLength(senha, 'utf8') > 72)
    erros.senha = 'Use uma senha de até 72 bytes.';

  return { dados: { email, senha }, erros };
}

export function formatarCpf(valor) {
  const digitos = String(valor).replace(/\D/g, '').slice(0, 11);
  return digitos
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\.\d{3})(\d)/, '$1-$2');
}

export function cpfValido(valor) {
  const digitos = String(valor).replace(/\D/g, '');
  if (digitos.length !== 11 || /^(\d)\1{10}$/.test(digitos)) return false;

  function verificar(tamanho) {
    let soma = 0;
    for (let i = 0; i < tamanho; i += 1) {
      soma += Number(digitos[i]) * (tamanho + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  }

  return verificar(9) === Number(digitos[9]) && verificar(10) === Number(digitos[10]);
}

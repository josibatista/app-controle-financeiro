export function dataLocal(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

export function periodoMesAtual() {
  const hoje = new Date();

  return {
    dataInicial: dataLocal(
      new Date(hoje.getFullYear(), hoje.getMonth(), 1),
    ),
    dataFinal: dataLocal(
      new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0),
    ),
  };
}

export function dataValida(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;

  const data = new Date(`${valor}T12:00:00`);

  return !Number.isNaN(data.getTime()) && dataLocal(data) === valor;
}

export function formatarData(valor) {
  return valor.split('-').reverse().join('/');
}

export function paraCentavos(valor, permitirNegativo = false) {
  const texto = String(valor).trim().replace(',', '.');

  const regex = permitirNegativo
    ? /^-?\d{1,10}([.]\d{1,2})?$/
    : /^\d{1,10}([.]\d{1,2})?$/;

  if (!regex.test(texto)) return null;

  const negativo = texto.startsWith('-');
  const valorSemSinal = negativo ? texto.slice(1) : texto;

  const [inteiro, decimal = ''] = valorSemSinal.split('.');

  const centavos =
    Number(inteiro) * 100 + Number(decimal.padEnd(2, '0'));

  return negativo ? -centavos : centavos;
}

export function formatarMoeda(centavos) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100);
}

export function validarLancamento(
  dados,
  categorias,
  fontesDestinos,
  editando = false,
) {
  const erros = {};

  const categoria = categorias.find(
    (item) => item.id === Number(dados.categoria_id),
  );

  const fonte = fontesDestinos.find(
    (item) => item.id === Number(dados.fonte_destino_id),
  );

  const centavos = paraCentavos(dados.valor);
  const parcelas = Number(dados.total_parcelas);

  if (!['entrada', 'saida'].includes(dados.tipo)) {
    erros.tipo = 'Selecione o tipo.';
  }

  if (!dados.descricao.trim()) {
    erros.descricao = 'Informe a descrição.';
  } else if (dados.descricao.trim().length > 120) {
    erros.descricao = 'Use até 120 caracteres.';
  }

  if (centavos === null || centavos <= 0) {
    erros.valor = 'Informe um valor positivo com até duas casas decimais.';
  }

  if (!dataValida(dados.data)) {
    erros.data = 'Informe uma data válida.';
  }

  if (!categoria) {
    erros.categoria_id = 'Selecione a categoria.';
  } else if (categoria.tipo !== dados.tipo) {
    erros.categoria_id = 'A categoria deve ter o mesmo tipo do lançamento.';
  }

  if (!fonte) {
    erros.fonte_destino_id = 'Selecione a fonte ou o destino.';
  }

  if (!editando && fonte?.tipo === 'cartao_credito') {
    if (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > 48) {
      erros.total_parcelas = 'Informe um número inteiro de 1 a 48.';
    } else if (centavos !== null && centavos < parcelas) {
      erros.total_parcelas =
        'O valor precisa permitir pelo menos R$ 0,01 por parcela.';
    }
  }

  return erros;
}

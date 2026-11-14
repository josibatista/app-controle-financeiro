export const categoriasDemo = [
  { id: 1, nome: 'Salário', tipo: 'entrada' },
  { id: 2, nome: 'Freelance', tipo: 'entrada' },
  { id: 3, nome: 'Alimentação', tipo: 'saida' },
  { id: 4, nome: 'Transporte', tipo: 'saida' },
  { id: 5, nome: 'Compras', tipo: 'saida' },
];

export const fontesDestinosDemo = [
  { id: 1, nome: 'Trabalho', tipo: 'renda' },
  { id: 2, nome: 'Conta corrente', tipo: 'conta' },
  { id: 3, nome: 'Cartão de crédito', tipo: 'cartao_credito' },
];

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

export function paraCentavos(valor) {
  const texto = String(valor).trim().replace(',', '.');

  // Até dez dígitos inteiros, seguindo NUMERIC(12, 2) do banco.
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(texto)) return null;

  const [inteiro, decimal = ''] = texto.split('.');

  return Number(inteiro) * 100 + Number(decimal.padEnd(2, '0'));
}

export function formatarMoeda(centavos) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100);
}

function somarMeses(valor, quantidade) {
  const [ano, mes, dia] = valor.split('-').map(Number);
  const ultimoDia = new Date(ano, mes + quantidade, 0).getDate();

  return dataLocal(
    new Date(ano, mes - 1 + quantidade, Math.min(dia, ultimoDia)),
  );
}

export function criarLancamentosDemo() {
  const hoje = new Date();
  const dia = (numero) =>
    dataLocal(new Date(hoje.getFullYear(), hoje.getMonth(), numero));

  return [
    {
      id: 'demo-1',
      tipo: 'entrada',
      descricao: 'Salário do mês',
      valor: '2500.00',
      data: dia(5),
      categoria_id: 1,
      fonte_destino_id: 1,
      parcela_atual: 1,
      total_parcelas: 1,
      grupo_parcelamento: null,
    },
    {
      id: 'demo-2',
      tipo: 'saida',
      descricao: 'Supermercado',
      valor: '245.90',
      data: dia(8),
      categoria_id: 3,
      fonte_destino_id: 2,
      parcela_atual: 1,
      total_parcelas: 1,
      grupo_parcelamento: null,
    },
    {
      id: 'demo-3',
      tipo: 'saida',
      descricao: 'Compra parcelada',
      valor: '33.34',
      data: dia(10),
      categoria_id: 5,
      fonte_destino_id: 3,
      parcela_atual: 1,
      total_parcelas: 3,
      grupo_parcelamento: 'compra-demo',
    },
    {
      id: 'demo-4',
      tipo: 'saida',
      descricao: 'Compra parcelada',
      valor: '33.33',
      data: somarMeses(dia(10), 1),
      categoria_id: 5,
      fonte_destino_id: 3,
      parcela_atual: 2,
      total_parcelas: 3,
      grupo_parcelamento: 'compra-demo',
    },
    {
      id: 'demo-5',
      tipo: 'saida',
      descricao: 'Compra parcelada',
      valor: '33.33',
      data: somarMeses(dia(10), 2),
      categoria_id: 5,
      fonte_destino_id: 3,
      parcela_atual: 3,
      total_parcelas: 3,
      grupo_parcelamento: 'compra-demo',
    },
  ];
}

export function validarLancamento(dados, editando = false) {
  const erros = {};
  const categoria = categoriasDemo.find(
    (item) => item.id === Number(dados.categoria_id),
  );
  const fonte = fontesDestinosDemo.find(
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

export function simularCadastro(dados) {
  const fonte = fontesDestinosDemo.find(
    (item) => item.id === Number(dados.fonte_destino_id),
  );
  const quantidade =
    fonte?.tipo === 'cartao_credito' ? Number(dados.total_parcelas) : 1;
  const total = paraCentavos(dados.valor);
  const base = Math.floor(total / quantidade);
  const diferenca = total % quantidade;
  const grupo = quantidade > 1 ? crypto.randomUUID() : null;

  return Array.from({ length: quantidade }, (_, indice) => ({
    id: crypto.randomUUID(),
    tipo: dados.tipo,
    descricao: dados.descricao.trim(),
    valor: ((base + (indice === 0 ? diferenca : 0)) / 100).toFixed(2),
    data: somarMeses(dados.data, indice),
    categoria_id: Number(dados.categoria_id),
    fonte_destino_id: Number(dados.fonte_destino_id),
    parcela_atual: indice + 1,
    total_parcelas: quantidade,
    grupo_parcelamento: grupo,
  }));
}
import { pool } from '../config/db.js';
import { INFLACAO_PREVISTA } from '../config/saudeFinanceira.js';

function paraCentavos(valor) {
  const texto = String(valor).trim();

  const [inteiro, decimal = ''] = texto.split('.');
  const centavos =
    Number(inteiro) * 100 + Number(decimal.padEnd(2, '0'));

  return centavos;
}

function reaisParaCentavos(valor) {
  return Math.round(valor * 100);
}

function paraReais(centavos) {
  return centavos / 100;
}

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export async function calcularTaxaPoupanca(usuarioId, db = pool) {
  const resultado = await db.query(
    `SELECT
       COALESCE(SUM(valor) FILTER (WHERE tipo = 'entrada'), 0) AS entradas,
       COALESCE(SUM(valor) FILTER (WHERE tipo = 'saida'), 0) AS saidas
     FROM lancamentos
     WHERE usuario_id = $1
       AND data >= DATE_TRUNC('month', CURRENT_DATE)::date
       AND data <= CURRENT_DATE`,
    [usuarioId]
  );

  const entradas = paraCentavos(resultado.rows[0].entradas);
  const saidas = paraCentavos(resultado.rows[0].saidas);

  const saldo = entradas - saidas;

  const taxaPoupanca = entradas > 0
    ? Number(((saldo / entradas) * 100).toFixed(2))
    : null;

  return {
    entradas: paraReais(entradas),
    saidas: paraReais(saidas),
    saldo: paraReais(saldo),
    percentual: taxaPoupanca,
  };
}

//compara os gastos de cada categoria do mês atual com a média dos três meses anteriores completos
export async function listarVariacaoCategorias(usuarioId, db = pool) {
  const resultado = await db.query(
    `SELECT
       c.id AS categoria_id,
       c.nome AS categoria_nome,

       COALESCE(
         SUM(l.valor) FILTER (
           WHERE l.data >= DATE_TRUNC('month', CURRENT_DATE)::date
             AND l.data <= CURRENT_DATE
         ),
         0
       ) AS gasto_atual,

       COALESCE(
         SUM(l.valor) FILTER (
           WHERE l.data >= (
             DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3 months'
           )::date
             AND l.data < DATE_TRUNC('month', CURRENT_DATE)::date
         ),
         0
       ) AS gastos_anteriores

     FROM categorias c

     LEFT JOIN lancamentos l
       ON l.categoria_id = c.id
       AND l.usuario_id = c.usuario_id
       AND l.tipo = 'saida'
       AND l.data >= (
         DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3 months'
       )::date
       AND l.data <= CURRENT_DATE

     WHERE c.usuario_id = $1
       AND c.tipo = 'saida'

     GROUP BY c.id, c.nome
     ORDER BY c.nome`,
    [usuarioId]
  );
  
  return resultado.rows
    .map((categoria) => {
      const gastoAtual = paraCentavos(categoria.gasto_atual);
      const gastosAnteriores = paraCentavos(categoria.gastos_anteriores);

      const mediaAnterior = Math.round(gastosAnteriores / 3);

      const diferenca = gastoAtual - mediaAnterior;

      const percentual = mediaAnterior > 0
        ? Number(((diferenca / mediaAnterior) * 100).toFixed(2))
        : null;

      return {
        categoriaId: categoria.categoria_id,
        categoriaNome: categoria.categoria_nome,
        gastoAtual: paraReais(gastoAtual),
        mediaAnterior: paraReais(mediaAnterior),
        diferenca: paraReais(diferenca),
        percentual,
        tendencia: diferenca > 0
          ? 'acima'
          : diferenca < 0
            ? 'abaixo'
            : 'igual',
      };
    })
    .sort((a, b) => {
        if (a.percentual === null && b.percentual === null) return 0;
        if (a.percentual === null) return 1;
        if (b.percentual === null) return -1;

        return b.percentual - a.percentual;
    });
}

export async function calcularComprometimentoCartoes(usuarioId, db = pool) {
  const resultado = await db.query(
    `SELECT
       COALESCE(
         SUM(l.valor) FILTER (
           WHERE l.tipo = 'saida'
             AND f.tipo = 'cartao_credito'
             AND l.data >= CURRENT_DATE
             AND l.data < (CURRENT_DATE + INTERVAL '3 months')::date
         ),
         0
       ) AS total_faturas,

       COALESCE(
         SUM(l.valor) FILTER (
           WHERE l.tipo = 'entrada'
             AND f.tipo = 'renda'
             AND l.data >= (
               DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3 months'
             )::date
             AND l.data < DATE_TRUNC('month', CURRENT_DATE)::date
         ),
         0
       ) AS total_renda

     FROM lancamentos l

     INNER JOIN fontes_destinos f
       ON f.id = l.fonte_destino_id
       AND f.usuario_id = l.usuario_id

     WHERE l.usuario_id = $1
       AND f.tipo IN ('cartao_credito', 'renda')`,
    [usuarioId]
  );

  const totalFaturas = paraCentavos(resultado.rows[0].total_faturas);
  const totalRenda = paraCentavos(resultado.rows[0].total_renda);

  const mediaRendaMensal = Math.round(totalRenda / 3);

  const percentual = mediaRendaMensal > 0
    ? Number(((totalFaturas / mediaRendaMensal) * 100).toFixed(2))
    : null;

  return {
    totalFaturas: paraReais(totalFaturas),
    mediaRendaMensal: paraReais(mediaRendaMensal),
    percentual,
  };
}

export async function calcularParcelasFuturas(usuarioId, db = pool) {
  const resultadoTotal = await db.query(
    `SELECT
       COALESCE(SUM(valor), 0) AS total,
       MAX(data) AS ultimo_vencimento
     FROM lancamentos
     WHERE usuario_id = $1
       AND tipo = 'saida'
       AND total_parcelas > 1
       AND data > CURRENT_DATE`,
    [usuarioId]
  );

  const resultadoMeses = await db.query(
    `SELECT
       DATE_TRUNC('month', data)::date AS mes,
       COALESCE(SUM(valor), 0) AS total
     FROM lancamentos
     WHERE usuario_id = $1
       AND tipo = 'saida'
       AND total_parcelas > 1
       AND data > CURRENT_DATE
       AND data < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '6 months'
     GROUP BY DATE_TRUNC('month', data)
     ORDER BY mes`,
    [usuarioId]
  );

  const porMes = resultadoMeses.rows.map((item) => {
    const total = paraCentavos(item.total);

    return {
      mes: item.mes.toISOString().slice(0, 7),
      totalCentavos: total,
    };
  });

  const totalCentavos = paraCentavos(
    resultadoTotal.rows[0].total
  );

  const rawUltimoVencimento = resultadoTotal.rows[0].ultimo_vencimento;

  const ultimoVencimento = rawUltimoVencimento
    ? rawUltimoVencimento instanceof Date
      ? rawUltimoVencimento.toISOString().slice(0, 7)
      : String(rawUltimoVencimento).slice(0, 7)
    : null;

  return {
    totalCentavos,
    ultimoVencimento,
    porMes,
  };
}


export async function calcularProjecaoAnual(usuarioId, db = pool) {
  const resultado = await db.query(
    `SELECT
       COALESCE(
         SUM(valor) FILTER (WHERE tipo = 'saida'),
         0
       ) AS total_despesas,

       COALESCE(
         SUM(valor) FILTER (WHERE tipo = 'entrada'),
         0
       ) AS total_entradas

     FROM lancamentos
     WHERE usuario_id = $1
       AND data >= (CURRENT_DATE - INTERVAL '12 months')::date
       AND data <= CURRENT_DATE`,
    [usuarioId]
  );

  const totalDespesas = paraCentavos(resultado.rows[0].total_despesas);
  const totalEntradas = paraCentavos(resultado.rows[0].total_entradas);

  const projecao = Math.round(
    totalDespesas * (1 + INFLACAO_PREVISTA)
  );

  const percentual = totalEntradas > 0
    ? Number(((projecao / totalEntradas) * 100).toFixed(2))
    : null;

  return {
    totalDespesas: paraReais(totalDespesas),
    totalEntradas: paraReais(totalEntradas),
    inflacaoPrevista: INFLACAO_PREVISTA * 100,
    projecao: paraReais(projecao),
    percentual,
  };
}

export function gerarDicasFinanceiras({
  taxaPoupanca,
  comprometimentoCartoes,
  parcelasFuturas,
}) {
  const dicas = [];

  if (taxaPoupanca.percentual !== null) {
    if (taxaPoupanca.percentual < 0) {
      dicas.push({
        tipo: 'alerta',
        titulo: 'Despesas acima das entradas',
        mensagem: 'Suas despesas superaram suas entradas neste mês. Acompanhe seus gastos para identificar onde é possível economizar.',
      });
    }
  }

  if (
    comprometimentoCartoes.percentual !== null
    && comprometimentoCartoes.percentual > 30
  ) {
    dicas.push({
      tipo: 'atencao',
      titulo: 'Comprometimento com cartões',
      mensagem: 'Seus gastos previstos nos cartões representam mais de 30% da sua renda média mensal. Acompanhe as próximas faturas.',
    });
  }

  if (parcelasFuturas.totalCentavos > 0) {
    dicas.push({
      tipo: 'informacao',
      titulo: 'Parcelas futuras',
      mensagem: `Você ainda tem ${formatarMoeda(
        paraReais(parcelasFuturas.totalCentavos)
      )} em parcelas futuras.`,
    });
  }

  return dicas;
}

export async function obterSaudeFinanceira(usuarioId, db = pool) {
  const [
    taxaPoupanca,
    variacaoCategorias,
    comprometimentoCartoes,
    parcelasFuturas,
    projecaoAnual,
    referencias,
  ] = await Promise.all([
    calcularTaxaPoupanca(usuarioId, db),
    listarVariacaoCategorias(usuarioId, db),
    calcularComprometimentoCartoes(usuarioId, db),
    calcularParcelasFuturas(usuarioId, db),
    calcularProjecaoAnual(usuarioId, db),

    db.query(
      `SELECT
         TO_CHAR(DATE_TRUNC('month', CURRENT_DATE), 'YYYY-MM') AS mes_atual,
         TO_CHAR(
           DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '12 months',
           'YYYY-MM'
         ) AS inicio_projecao`
    ),
  ]);

  const dicas = gerarDicasFinanceiras({
    taxaPoupanca,
    comprometimentoCartoes,
    parcelasFuturas,
  });

  return {
    mesReferencia: referencias.rows[0].mes_atual,

    poupanca: {
      percentual: taxaPoupanca.percentual,
    },

    categorias: variacaoCategorias.map((categoria) => ({
      id: categoria.categoriaId,
      nome: categoria.categoriaNome,
      variacaoPercentual: categoria.percentual,
    })),

    cartoes: {
      meses: 3,
      percentual: comprometimentoCartoes.percentual,
    },

    parcelas: {
      totalCentavos: parcelasFuturas.totalCentavos,
      ultimoVencimento: parcelasFuturas.ultimoVencimento,
      porMes: parcelasFuturas.porMes,
    },

    projecao: {
      inicio: referencias.rows[0].inicio_projecao,
      fim: referencias.rows[0].mes_atual,
      saidasCentavos: reaisParaCentavos(projecaoAnual.projecao),
      entradasCentavos: reaisParaCentavos(projecaoAnual.totalEntradas),
      percentualComprometido: projecaoAnual.percentual,
    },

    dicas,
  };
}



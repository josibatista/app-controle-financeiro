import { pool } from '../config/db.js';

function ultimoDiaDoMes(ano, mes) {
  return new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
}

function dataSegura(ano, mes, dia) {
  const anoAjustado = ano + Math.floor(mes / 12);
  const mesAjustado = ((mes % 12) + 12) % 12;

  return new Date(
    Date.UTC(
      anoAjustado,
      mesAjustado,
      Math.min(
        dia,
        ultimoDiaDoMes(anoAjustado, mesAjustado)
      )
    )
  );
}

function iso(data) {
  return data.toISOString().slice(0, 10);
}

function hojeNoBrasil() {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const obter = (tipo) =>
    partes.find((parte) => parte.type === tipo).value;

  return `${obter('year')}-${obter('month')}-${obter('day')}`;
}

function paraCentavos(valor) {
  const texto = String(valor);

  if (!/^\d+(\.\d{1,2})?$/.test(texto)) {
    throw new Error('Valor monetário inválido.');
  }

  const [inteiro, decimal = ''] = texto.split('.');

  const resultado =
    Number(inteiro) * 100 +
    Number(decimal.padEnd(2, '0'));

  if (!Number.isSafeInteger(resultado)) {
    throw new Error('Valor fora do intervalo seguro.');
  }

  return resultado;
}

function somar(a, b) {
  const resultado = a + b;

  if (!Number.isSafeInteger(resultado)) {
    throw new Error('Total fora do intervalo seguro.');
  }

  return resultado;
}

function calcularFatura(dataCompra, cartao, numeroParcela = 1) {
  const [ano, mes, dia] = dataCompra.split('-').map(Number);
  const mesCompra = mes - 1;

  const fechamentoDoMes = Math.min(
    cartao.dia_fechamento,
    ultimoDiaDoMes(ano, mesCompra)
  );

  let mesFechamento =
    dia < fechamentoDoMes ? mesCompra : mesCompra + 1;

  mesFechamento += numeroParcela - 1;

  const fechamento = iso(
    dataSegura(ano, mesFechamento, cartao.dia_fechamento)
  );

  const mesVencimento =
    cartao.dia_vencimento > cartao.dia_fechamento
      ? mesFechamento
      : mesFechamento + 1;

  const vencimento = iso(
    dataSegura(ano, mesVencimento, cartao.dia_vencimento)
  );

  return {
    referencia: vencimento.slice(0, 7),
    fechamento,
    vencimento,
  };
}

// Compatibilidade com o backend atual:
// ele avança a data registrada de cada parcela em um mês.
function dataEsperadaParcela(dataCompra, parcelaAtual) {
  const [ano, mes, dia] = dataCompra.split('-').map(Number);

  return iso(
    dataSegura(ano, mes - 1 + parcelaAtual - 1, dia)
  );
}

function montarCartao(cartao, hoje) {
  const limite = paraCentavos(cartao.limite);

  const resultado = {
    id: cartao.id,
    nome: cartao.nome,
    diaFechamento: cartao.dia_fechamento,
    diaVencimento: cartao.dia_vencimento,
    limiteCentavos: limite,
    utilizadoCentavos: null,
    disponivelCentavos: null,
    pendencia: null,
    faturas: [],
  };

  // Confere a origem antes de apresentar qualquer total do cartão.
  for (const lancamento of cartao.lancamentos) {
    const parcelaValida =
      Number.isInteger(lancamento.parcela_atual) &&
      Number.isInteger(lancamento.total_parcelas) &&
      lancamento.parcela_atual >= 1 &&
      lancamento.parcela_atual <= lancamento.total_parcelas &&
      lancamento.total_parcelas <= 48;

    if (!parcelaValida || !lancamento.data_compra) {
      resultado.pendencia =
        `Não foi possível recuperar a data original da compra ` +
        `"${lancamento.descricao}" (lançamento ${lancamento.id}). ` +
        'Confira o grupo de parcelamento.';

      return resultado;
    }

    if (
      lancamento.total_parcelas > 1 &&
      dataEsperadaParcela(
        lancamento.data_compra,
        lancamento.parcela_atual
      ) !== lancamento.data_registrada
    ) {
      resultado.pendencia =
        `As datas da compra "${lancamento.descricao}" ` +
        `(lançamento ${lancamento.id}) não seguem o ` +
        'parcelamento atual. Confira as datas do grupo.';

      return resultado;
    }
  }

  // A fatura de uma compra feita hoje é a atualmente aberta.
  const aberta = calcularFatura(hoje, cartao);
  const [ano, mes] = aberta.fechamento.split('-').map(Number);

  const faturas = Array.from({ length: 4 }, (_, indice) => {
    const mesFechamento = mes - 1 + indice;

    const fechamento = iso(
      dataSegura(ano, mesFechamento, cartao.dia_fechamento)
    );

    const mesVencimento =
      cartao.dia_vencimento > cartao.dia_fechamento
        ? mesFechamento
        : mesFechamento + 1;

    const vencimento = iso(
      dataSegura(ano, mesVencimento, cartao.dia_vencimento)
    );

    return {
      referencia: vencimento.slice(0, 7),
      fechamento,
      vencimento,
      aberta: indice === 0,
      totalCentavos: 0,
      lancamentos: [],
    };
  });

  const porFechamento = new Map(
    faturas.map((fatura) => [fatura.fechamento, fatura])
  );

  let utilizado = 0;

  for (const lancamento of cartao.lancamentos) {
    const datas = calcularFatura(
      lancamento.data_compra,
      cartao,
      lancamento.parcela_atual
    );

    const valor = paraCentavos(lancamento.valor);

    // O limite considera todas as parcelas ainda não vencidas,
    // inclusive as que estão além das quatro faturas exibidas.
    if (datas.vencimento >= hoje) {
      utilizado = somar(utilizado, valor);
    }

    const fatura = porFechamento.get(datas.fechamento);

    if (fatura) {
      fatura.totalCentavos = somar(
        fatura.totalCentavos,
        valor
      );

      fatura.lancamentos.push({
        id: lancamento.id,
        descricao: lancamento.descricao,
        dataCompra: lancamento.data_compra,
        parcelaAtual: lancamento.parcela_atual,
        totalParcelas: lancamento.total_parcelas,
        valorCentavos: valor,
      });
    }
  }

  return {
    ...resultado,
    utilizadoCentavos: utilizado,
    disponivelCentavos: limite - utilizado,
    faturas,
  };
}

export async function listar(usuarioId, db = pool) {
  const consulta = await db.query(
    `WITH primeiras AS (
       SELECT
         usuario_id,
         grupo_parcelamento,
         MIN(data) FILTER (
           WHERE parcela_atual = 1
         ) AS data_compra,
         COUNT(*) FILTER (
           WHERE parcela_atual = 1
         ) AS quantidade
       FROM lancamentos
       WHERE usuario_id = $1
         AND grupo_parcelamento IS NOT NULL
       GROUP BY usuario_id, grupo_parcelamento
     )
     SELECT
       f.id,
       f.nome,
       f.dia_fechamento,
       f.dia_vencimento,
       f.limite::text AS limite,
       COALESCE(
         jsonb_agg(
           jsonb_build_object(
             'id', l.id,
             'descricao', l.descricao,
             'valor', l.valor::text,
             'data_registrada', to_char(l.data, 'YYYY-MM-DD'),
             'data_compra',
               CASE
                 WHEN l.total_parcelas = 1
                   THEN to_char(l.data, 'YYYY-MM-DD')
                 WHEN p.quantidade = 1
                   THEN to_char(p.data_compra, 'YYYY-MM-DD')
                 ELSE NULL
               END,
             'parcela_atual', l.parcela_atual,
             'total_parcelas', l.total_parcelas
           )
           ORDER BY l.data, l.id
         ) FILTER (WHERE l.id IS NOT NULL),
         '[]'::jsonb
       ) AS lancamentos
     FROM fontes_destinos f
     LEFT JOIN lancamentos l
       ON l.fonte_destino_id = f.id
      AND l.usuario_id = f.usuario_id
      AND l.tipo = 'saida'
     LEFT JOIN primeiras p
       ON p.usuario_id = l.usuario_id
      AND p.grupo_parcelamento = l.grupo_parcelamento
     WHERE f.usuario_id = $1
       AND f.tipo = 'cartao_credito'
     GROUP BY f.id
     ORDER BY f.nome, f.id`,
    [usuarioId]
  );

  const dataReferencia = hojeNoBrasil();

  return {
    dataReferencia,
    cartoes: consulta.rows.map((cartao) =>
      montarCartao(cartao, dataReferencia)
    ),
  };
}
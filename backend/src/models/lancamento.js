import { pool } from '../config/db.js';
import { randomUUID } from 'node:crypto';

async function validarRelacionamentos(
  usuarioId,
  tipo,
  categoriaId,
  fonteDestinoId,
  db
) {
  const resultado = await db.query(
    `SELECT
       c.tipo AS categoria_tipo,
       f.tipo AS fonte_tipo,
       f.limite AS fonte_limite,
       f.dia_vencimento AS fonte_dia_vencimento,
       f.dia_fechamento AS fonte_dia_fechamento
     FROM categorias c
     CROSS JOIN fontes_destinos f
     WHERE c.id = $1
       AND c.usuario_id = $2
       AND f.id = $3
       AND f.usuario_id = $2`,
    [categoriaId, usuarioId, fonteDestinoId]
  );

  const relacionamento = resultado.rows[0];

  if (!relacionamento) {
    const erro = new Error(
      'Categoria ou fonte/destino inexistente ou de outro usuário.'
    );
    erro.code = 'RELACIONAMENTO_INVALIDO';
    throw erro;
  }

  if (relacionamento.categoria_tipo !== tipo) {
    const erro = new Error(
      'O tipo da categoria deve ser igual ao tipo do lançamento.'
    );
    erro.code = 'TIPO_INCOMPATIVEL';
    throw erro;
  }

  return relacionamento;
}

function calcularDataVencimento(dataCompraStr, diaFechamento, diaVencimento) {
  const [ano, mes, dia] = dataCompraStr.split('-').map(Number);

  let mesFechamento = dia > diaFechamento ? mes + 1 : mes;
  let anoFechamento = ano;
  if (mesFechamento > 12) {
    mesFechamento = 1;
    anoFechamento += 1;
  }

  let mesVenc = diaVencimento < diaFechamento ? mesFechamento + 1 : mesFechamento;
  let anoVenc = anoFechamento;
  if (mesVenc > 12) {
    mesVenc = 1;
    anoVenc += 1;
  }

  const ultimoDia = new Date(Date.UTC(anoVenc, mesVenc, 0)).getUTCDate();
  const diaSeguro = Math.min(diaVencimento, ultimoDia);

  return [
    anoVenc,
    String(mesVenc).padStart(2, '0'),
    String(diaSeguro).padStart(2, '0'),
  ].join('-');
}

async function validarLimiteTotalCartao({
  usuarioId,
  fonteDestinoId,
  limiteDecimal,
  diaFechamento,
  diaVencimento,
  parcelasSimuladas,
  ignorarLancamentoId = null,
  db,
}) {
  if (limiteDecimal === null || limiteDecimal === undefined) return;

  const limiteCentavos = decimalParaCentavos(limiteDecimal);
  const hojeStr = new Date().toISOString().slice(0, 10);

  const params = [usuarioId, fonteDestinoId];
  let filtroEdicao = '';

  if (ignorarLancamentoId !== null) {
    params.push(ignorarLancamentoId);
    filtroEdicao = `AND id <> $3`;
  }

  const res = await db.query(
    `SELECT valor, data
     FROM lancamentos
     WHERE usuario_id = $1
       AND fonte_destino_id = $2
       AND tipo = 'saida'
       ${filtroEdicao}`,
    params
  );

  let utilizadoCentavos = 0;

  for (const row of res.rows) {
    const dataStr = row.data instanceof Date
      ? row.data.toISOString().slice(0, 10)
      : String(row.data).slice(0, 10);

    const vencimento = calcularDataVencimento(
      dataStr,
      diaFechamento || 1,
      diaVencimento || 1
    );

    if (vencimento >= hojeStr) {
      utilizadoCentavos += decimalParaCentavos(row.valor);
    }
  }

  let novoComprometidoCentavos = 0;
  for (const parcela of parcelasSimuladas) {
    const vencimento = calcularDataVencimento(
      parcela.data,
      diaFechamento || 1,
      diaVencimento || 1
    );
    if (vencimento >= hojeStr) {
      novoComprometidoCentavos += parcela.valorCentavos;
    }
  }

  if (utilizadoCentavos + novoComprometidoCentavos > limiteCentavos) {
    const erro = new Error(
      'Seu limite disponível no cartão não comporta esse lançamento.'
    );
    erro.code = 'LIMITE_CARTAO_EXCEDIDO';
    erro.status = 400;
    erro.erros = {
      valor: 'Seu limite disponível no cartão não comporta esse lançamento.',
    };
    throw erro;
  }
}

function calcularDataParcela(dataInicial, numeroParcela) {
  const [ano, mes, dia] = dataInicial.split('-').map(Number);

  const dataBase = new Date(
    Date.UTC(ano, mes - 1 + numeroParcela, 1)
  );

  const ultimoDia = new Date(
    Date.UTC(
      dataBase.getUTCFullYear(),
      dataBase.getUTCMonth() + 1,
      0
    )
  ).getUTCDate();

  const diaParcela = Math.min(dia, ultimoDia);

  return [
    dataBase.getUTCFullYear(),
    String(dataBase.getUTCMonth() + 1).padStart(2, '0'),
    String(diaParcela).padStart(2, '0'),
  ].join('-');
}

function calcularValoresParcelas(valorCentavos, totalParcelas) {
  const valorBase = Math.floor(valorCentavos / totalParcelas);
  const diferenca = valorCentavos % totalParcelas;

  return Array.from({ length: totalParcelas }, (_, indice) =>
    valorBase + (indice < diferenca ? 1 : 0)
  );
}

function validarValor(valorCentavos) {
  if (
    !Number.isSafeInteger(valorCentavos) ||
    valorCentavos <= 0 ||
    valorCentavos > 999999999999
  ) {
    throw new Error(
      'O valor do lançamento deve ser positivo e ter até duas casas decimais.'
    );
  }
}

function centavosParaDecimal(valorCentavos) {
  const inteiro = Math.floor(valorCentavos / 100);
  const decimal = String(valorCentavos % 100).padStart(2, '0');

  return `${inteiro}.${decimal}`;
}

function decimalParaCentavos(valorDecimal) {
  const [inteiro, decimal = ''] = String(valorDecimal).split('.');

  return (
    Number(inteiro) * 100 +
    Number(decimal.padEnd(2, '0'))
  );
}

export async function listar(
  usuarioId,
  {
    inicio,
    fim,
    tipo,
    categoriaId,
    fonteDestinoId,
    pagina = 1,
    limite = 20,
  } = {},
  db = pool
) {
  if (!Number.isInteger(pagina) || pagina < 1) {
    throw new Error('A página deve ser um número inteiro positivo.');
  }

  if (!Number.isInteger(limite) || limite < 1 || limite > 100) {
    throw new Error('O limite deve ser um inteiro entre 1 e 100.');
  }

  const condicoes = ['usuario_id = $1'];
  const valores = [usuarioId];

  function adicionarFiltro(condicao, valor) {
    if (valor !== undefined && valor !== null && valor !== '') {
      valores.push(valor);
      condicoes.push(`${condicao} $${valores.length}`);
    }
  }

  adicionarFiltro('data >=', inicio);
  adicionarFiltro('data <=', fim);
  adicionarFiltro('tipo =', tipo);
  adicionarFiltro('categoria_id =', categoriaId);
  adicionarFiltro('fonte_destino_id =', fonteDestinoId);

  const where = condicoes.join(' AND ');

  const resultadoContagem = await db.query(
    `SELECT COUNT(*) AS total
     FROM lancamentos
     WHERE ${where}`,
    valores
  );

  const total = Number(resultadoContagem.rows[0].total);

  const valoresPaginacao = [...valores];

  valoresPaginacao.push(limite);
  const parametroLimite = `$${valoresPaginacao.length}`;

  valoresPaginacao.push((pagina - 1) * limite);
  const parametroOffset = `$${valoresPaginacao.length}`;

  const resultado = await db.query(
    `SELECT *
     FROM lancamentos
     WHERE ${where}
     ORDER BY data DESC, id DESC
     LIMIT ${parametroLimite}
     OFFSET ${parametroOffset}`,
    valoresPaginacao
  );

  return {
    dados: resultado.rows,
    total,
    pagina,
    limite,
    totalPaginas: Math.ceil(total / limite),
  };
}

export async function buscarPorId(id, usuarioId, db = pool) {
  const resultado = await db.query(
    `SELECT *
     FROM lancamentos
     WHERE id = $1 AND usuario_id = $2`,
    [id, usuarioId]
  );

  return resultado.rows[0] ?? null;
}

export async function criar(
  usuarioId,
  {
    tipo,
    descricao,
    valor,
    data,
    categoriaId,
    fonteDestinoId,
    parcelaAtual = 1,
    totalParcelas = 1,
    grupoParcelamento = null,
  },
  db = pool
) {
  await validarRelacionamentos(
    usuarioId,
    tipo,
    categoriaId,
    fonteDestinoId,
    db
  );

  const resultado = await db.query(
    `INSERT INTO lancamentos
       (usuario_id, tipo, descricao, valor, data,
        categoria_id, fonte_destino_id,
        parcela_atual, total_parcelas, grupo_parcelamento)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      usuarioId,
      tipo,
      descricao.trim(),
      valor,
      data,
      categoriaId,
      fonteDestinoId,
      parcelaAtual,
      totalParcelas,
      grupoParcelamento,
    ]
  );

  return resultado.rows[0];
}

export async function criarParcelado(
  usuarioId,
  {
    tipo,
    descricao,
    valorCentavos,
    data,
    categoriaId,
    fonteDestinoId,
    totalParcelas,
  }
) {
  validarValor(valorCentavos);

  if (
    !Number.isInteger(totalParcelas) ||
    totalParcelas < 1 ||
    totalParcelas > 48
  ) {
    throw new Error('O número de parcelas deve estar entre 1 e 48.');
  }

  const client = await pool.connect();
  let transacaoIniciada = false;

  try {
    await client.query('BEGIN');
    transacaoIniciada = true;

    const relacionamento = await validarRelacionamentos(
      usuarioId,
      tipo,
      categoriaId,
      fonteDestinoId,
      client
    );

    if (
      totalParcelas > 1 &&
      relacionamento.fonte_tipo !== 'cartao_credito'
    ) {
      const erro = new Error(
        'O parcelamento só é permitido para cartão de crédito.'
      );

      erro.code = 'PARCELAMENTO_INVALIDO';
      throw erro;
    }

    const grupoParcelamento =
      totalParcelas > 1 ? randomUUID() : null;

    const valoresParcelas = calcularValoresParcelas(
      valorCentavos,
      totalParcelas
    );

    if (
      tipo === 'saida' &&
      relacionamento.fonte_tipo === 'cartao_credito'
    ) {
      const parcelasSimuladas = valoresParcelas.map((valorParcela, idx) => ({
        data: calcularDataParcela(data, idx),
        valorCentavos: valorParcela,
      }));

      await validarLimiteTotalCartao({
        usuarioId,
        fonteDestinoId,
        limiteDecimal: relacionamento.fonte_limite,
        diaFechamento: relacionamento.fonte_dia_fechamento,
        diaVencimento: relacionamento.fonte_dia_vencimento,
        parcelasSimuladas,
        db: client,
      });
    }

    const lancamentos = [];

    for (let parcelaAtual = 1; parcelaAtual <= totalParcelas; parcelaAtual++) {
      const resultado = await client.query(
        `INSERT INTO lancamentos
           (usuario_id, tipo, descricao, valor, data,
            categoria_id, fonte_destino_id,
            parcela_atual, total_parcelas, grupo_parcelamento)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          usuarioId,
          tipo,
          descricao.trim(),
          centavosParaDecimal(valoresParcelas[parcelaAtual - 1]),
          calcularDataParcela(data, parcelaAtual - 1),
          categoriaId,
          fonteDestinoId,
          parcelaAtual,
          totalParcelas,
          grupoParcelamento,
        ]
      );

      lancamentos.push(resultado.rows[0]);
    }

    await client.query('COMMIT');

    return lancamentos;
  } catch (erro) {
    if (transacaoIniciada) {
      await client.query('ROLLBACK');
    }

    throw erro;
  } finally {
    client.release();
  }
}

export async function atualizar(
  id,
  usuarioId,
  {
    tipo,
    descricao,
    valorCentavos,
    data,
    categoriaId,
    fonteDestinoId,
  },
  db = pool
) {
  validarValor(valorCentavos);

  const relacionamento = await validarRelacionamentos(
    usuarioId,
    tipo,
    categoriaId,
    fonteDestinoId,
    db
  );

  if (
    tipo === 'saida' &&
    relacionamento.fonte_tipo === 'cartao_credito'
  ) {
    await validarLimiteTotalCartao({
      usuarioId,
      fonteDestinoId,
      limiteDecimal: relacionamento.fonte_limite,
      diaFechamento: relacionamento.fonte_dia_fechamento,
      diaVencimento: relacionamento.fonte_dia_vencimento,
      parcelasSimuladas: [{ data, valorCentavos }],
      ignorarLancamentoId: id,
      db,
    });
  }

  const resultado = await db.query(
    `UPDATE lancamentos
     SET tipo = $1,
         descricao = $2,
         valor = $3,
         data = $4,
         categoria_id = $5,
         fonte_destino_id = $6
     WHERE id = $7 AND usuario_id = $8
     RETURNING *`,
    [
      tipo,
      descricao.trim(),
      centavosParaDecimal(valorCentavos),
      data,
      categoriaId,
      fonteDestinoId,
      id,
      usuarioId,
    ]
  );

  return resultado.rows[0] ?? null;
}

export async function excluir(id, usuarioId, db = pool) {
  const resultado = await db.query(
    `DELETE FROM lancamentos
     WHERE id = $1 AND usuario_id = $2`,
    [id, usuarioId]
  );

  return resultado.rowCount > 0;
}

export async function excluirGrupo(
  grupoParcelamento,
  usuarioId,
  db = pool
) {
  const resultado = await db.query(
    `DELETE FROM lancamentos
     WHERE grupo_parcelamento = $1 AND usuario_id = $2`,
    [grupoParcelamento, usuarioId]
  );

  return resultado.rowCount;
}

export async function resumo(
  usuarioId,
  {
    inicio,
    fim,
    tipo,
    categoriaId,
    fonteDestinoId,
  },
  db = pool
) {
  const condicoes = ['usuario_id = $1'];
  const valores = [usuarioId];

  function adicionarFiltro(condicao, valor) {
    if (valor !== undefined && valor !== null && valor !== '') {
      valores.push(valor);
      condicoes.push(`${condicao} $${valores.length}`);
    }
  }

  adicionarFiltro('data >=', inicio);
  adicionarFiltro('data <=', fim);
  adicionarFiltro('tipo =', tipo);
  adicionarFiltro('categoria_id =', categoriaId);
  adicionarFiltro('fonte_destino_id =', fonteDestinoId);

  const resultado = await db.query(
    `SELECT
       COALESCE(
         SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END),
         0
       ) AS total_entradas,
       COALESCE(
         SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END),
         0
       ) AS total_saidas
     FROM lancamentos
     WHERE ${condicoes.join(' AND ')}`,
    valores
  );

  const totalEntradasCentavos = decimalParaCentavos(
    resultado.rows[0].total_entradas
  );

  const totalSaidasCentavos = decimalParaCentavos(
    resultado.rows[0].total_saidas
  );

  const saldoCentavos =
    totalEntradasCentavos - totalSaidasCentavos;

  return {
    totalEntradas: totalEntradasCentavos / 100,
    totalSaidas: totalSaidasCentavos / 100,
    saldo: saldoCentavos / 100,
  };
}
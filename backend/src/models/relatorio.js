import { pool } from '../config/db.js';

export async function listarPorCategoria(
  usuarioId,
  { inicio, fim },
  db = pool
) {
  const resultado = await db.query(
    `WITH periodo AS (
       SELECT
         $2::date AS inicio_atual,
         $3::date AS fim_atual,
         ($2::date - ($3::date - $2::date + 1)) AS inicio_anterior,
         ($2::date - 1) AS fim_anterior
     ),

     totais AS (
       SELECT
         c.id AS categoria_id,
         c.nome AS categoria,
         c.tipo,

         COALESCE(
           SUM(l.valor) FILTER (
             WHERE l.data BETWEEN p.inicio_atual AND p.fim_atual
           ), 0
         ) AS total_atual,

         COALESCE(
           SUM(l.valor) FILTER (
             WHERE l.data BETWEEN p.inicio_anterior AND p.fim_anterior
           ), 0
         ) AS total_anterior

       FROM categorias c
       CROSS JOIN periodo p

       LEFT JOIN lancamentos l
         ON l.categoria_id = c.id
         AND l.usuario_id = c.usuario_id
         AND (
           l.data BETWEEN p.inicio_anterior AND p.fim_atual
         )

       WHERE c.usuario_id = $1

       GROUP BY c.id, c.nome, c.tipo
     ),

     totais_por_tipo AS (
       SELECT
         tipo,
         SUM(total_atual) AS total_tipo_atual
       FROM totais
       GROUP BY tipo
     ),

     resumo_periodo AS (
      SELECT
        COALESCE(
          SUM(total_atual) FILTER (WHERE tipo = 'entrada'),
          0
        ) AS total_entradas,

        COALESCE(
          SUM(total_atual) FILTER (WHERE tipo = 'saida'),
          0
        ) AS total_saidas,

        COALESCE(
          SUM(total_atual) FILTER (WHERE tipo = 'entrada'),
          0
        ) -
        COALESCE(
          SUM(total_atual) FILTER (WHERE tipo = 'saida'),
          0
        ) AS saldo_periodo

      FROM totais
    )

     SELECT
       t.categoria_id,
       t.categoria,
       t.tipo,
       t.total_atual,
       t.total_anterior,
       r.total_entradas,
       r.total_saidas,
       r.saldo_periodo,

       CASE
         WHEN tt.total_tipo_atual = 0 THEN 0
         ELSE ROUND(
           (t.total_atual / tt.total_tipo_atual) * 100,
           2
         )
       END AS percentual_atual,

       CASE
         WHEN t.total_anterior = 0 THEN
           CASE
             WHEN t.total_atual = 0 THEN 0
             ELSE NULL
           END
         ELSE ROUND(
           ((t.total_atual - t.total_anterior)
             / t.total_anterior) * 100,
           2
         )
       END AS variacao_percentual

     FROM resumo_periodo r

     LEFT JOIN totais t
       ON TRUE

     LEFT JOIN totais_por_tipo tt
       ON tt.tipo = t.tipo

     ORDER BY t.tipo, t.total_atual DESC`,
    [usuarioId, inicio, fim]
  );

  const resumo = resultado.rows[0];

  const categorias = resultado.rows
    .filter((item) => item.categoria_id !== null)
    .map((item) => ({
    id: item.categoria_id,
    nome: item.categoria,
    tipo: item.tipo,
    total: Number(item.total_atual),
    percentual: Number(item.percentual_atual),
    periodoAnterior: Number(item.total_anterior),
    variacaoPercentual:
      item.variacao_percentual === null
        ? null
        : Number(item.variacao_percentual),
  }));

  const saidas = categorias.filter(
    (item) => item.tipo === 'saida'
  );

  const entradas = categorias.filter(
    (item) => item.tipo === 'entrada'
  );

  return {
    periodo: {
      inicio,
      fim,
    },

    saidas: {
      total: Number(resumo?.total_saidas ?? 0),
      categorias: saidas.map(({ tipo, ...item }) => item),
    },

    entradas: {
      total: Number(resumo?.total_entradas ?? 0),
      categorias: entradas.map(({ tipo, ...item }) => item),
    },

    saldo: Number(resumo?.saldo_periodo ?? 0),
  };
}

export async function listarPorFonteDestino(
  usuarioId,
  { inicio, fim },
  db = pool
) {
  const resultado = await db.query(
    `SELECT
       f.id AS fonte_destino_id,
       f.nome AS fonte_destino,
       f.tipo AS tipo_fonte_destino,

       COALESCE(
         SUM(l.valor) FILTER (WHERE l.tipo = 'entrada'),
         0
       ) AS total_entradas,

       COALESCE(
         SUM(l.valor) FILTER (WHERE l.tipo = 'saida'),
         0
       ) AS total_saidas,

       COALESCE(
         SUM(l.valor) FILTER (WHERE l.tipo = 'entrada'),
         0
       ) -
       COALESCE(
         SUM(l.valor) FILTER (WHERE l.tipo = 'saida'),
         0
       ) AS saldo_periodo

     FROM fontes_destinos f

     LEFT JOIN lancamentos l
       ON l.fonte_destino_id = f.id
       AND l.usuario_id = f.usuario_id
       AND l.data >= $2
       AND l.data <= $3

     WHERE f.usuario_id = $1

     GROUP BY f.id, f.nome, f.tipo
     ORDER BY f.nome`,
    [usuarioId, inicio, fim]
  );

  const registros = resultado.rows.map((item) => ({
    id: item.fonte_destino_id,
    nome: item.fonte_destino,
    tipo: item.tipo_fonte_destino,
    totalEntradas: Number(item.total_entradas),
    totalSaidas: Number(item.total_saidas),
    saldo: Number(item.saldo_periodo),
  }));

  const fontes = registros
    .filter((item) => item.tipo === 'renda')
    .map(({ id, nome, totalEntradas }) => ({
      id,
      nome,
      total: totalEntradas,
    }));

  const destinos = registros
    .filter((item) => item.tipo !== 'renda')
    .map(({ id, nome, tipo, totalSaidas }) => ({
      id,
      nome,
      tipo,
      total: totalSaidas,
    }));

  const contas = registros
    .filter((item) => item.tipo === 'conta')
    .map(({ id, nome, totalEntradas, totalSaidas, saldo }) => ({
      id,
      nome,
      totalEntradas,
      totalSaidas,
      saldo,
    }));

  return {
    periodo: {
      inicio,
      fim,
    },

    fontes: {
      total: fontes.reduce((soma, item) => soma + item.total, 0),
      itens: fontes,
    },

    destinos: {
      total: destinos.reduce((soma, item) => soma + item.total, 0),
      itens: destinos,
    },

    contas,

    registros,
  };
}


import { pool } from '../config/db.js';

export async function listar(usuarioId, db = pool) {
  const resultado = await db.query(
    `SELECT *
     FROM fontes_destinos
     WHERE usuario_id = $1
     ORDER BY nome, id`,
    [usuarioId]
  );

  return resultado.rows;
}

export async function buscarPorId(id, usuarioId, db = pool) {
  const resultado = await db.query(
    `SELECT *
     FROM fontes_destinos
     WHERE id = $1 AND usuario_id = $2`,
    [id, usuarioId]
  );

  return resultado.rows[0] ?? null;
}

export async function criar(
  usuarioId,
  {
    nome,
    tipo,
    diaFechamento = null,
    diaVencimento = null,
    limite = null,
  },
  db = pool
) {
  const cartao = tipo === 'cartao_credito';

  const resultado = await db.query(
    `INSERT INTO fontes_destinos
       (usuario_id, nome, tipo,
        dia_fechamento, dia_vencimento, limite)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      usuarioId,
      nome.trim(),
      tipo,
      cartao ? diaFechamento : null,
      cartao ? diaVencimento : null,
      cartao ? limite : null,
    ]
  );

  return resultado.rows[0];
}

export async function atualizar(
  id,
  usuarioId,
  {
    nome,
    tipo,
    diaFechamento = null,
    diaVencimento = null,
    limite = null,
  },
  db = pool
) {
  const cartao = tipo === 'cartao_credito';

  const resultado = await db.query(
    `UPDATE fontes_destinos
     SET nome = $1,
         tipo = $2,
         dia_fechamento = $3,
         dia_vencimento = $4,
         limite = $5
     WHERE id = $6 AND usuario_id = $7
     RETURNING *`,
    [
      nome.trim(),
      tipo,
      cartao ? diaFechamento : null,
      cartao ? diaVencimento : null,
      cartao ? limite : null,
      id,
      usuarioId,
    ]
  );

  return resultado.rows[0] ?? null;
}

export async function excluir(id, usuarioId, db = pool) {
  const resultado = await db.query(
    `DELETE FROM fontes_destinos
     WHERE id = $1 AND usuario_id = $2`,
    [id, usuarioId]
  );

  return resultado.rowCount > 0;
}

export async function criarPadrao(usuarioId, db = pool) {
  const resultado = await db.query(
    `INSERT INTO fontes_destinos (usuario_id, nome, tipo)
     VALUES ($1, 'Conta corrente', 'conta')
     ON CONFLICT (usuario_id, nome) DO NOTHING
     RETURNING *`,
    [usuarioId]
  );

  return resultado.rows[0] ?? null;
}

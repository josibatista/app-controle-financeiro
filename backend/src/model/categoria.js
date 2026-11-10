import { pool } from '../config/db.js';

export async function listar(usuarioId, db = pool) {
  const resultado = await db.query(
    `SELECT id, usuario_id, nome, tipo
     FROM categorias
     WHERE usuario_id = $1
     ORDER BY nome, id`,
    [usuarioId]
  );

  return resultado.rows;
}

export async function buscarPorId(id, usuarioId, db = pool) {
  const resultado = await db.query(
    `SELECT id, usuario_id, nome, tipo
     FROM categorias
     WHERE id = $1 AND usuario_id = $2`,
    [id, usuarioId]
  );

  return resultado.rows[0] ?? null;
}

export async function criar(
  usuarioId,
  { nome, tipo },
  db = pool
) {
  const resultado = await db.query(
    `INSERT INTO categorias (usuario_id, nome, tipo)
     VALUES ($1, $2, $3)
     RETURNING id, usuario_id, nome, tipo`,
    [usuarioId, nome.trim(), tipo]
  );

  return resultado.rows[0];
}

export async function atualizar(
  id,
  usuarioId,
  { nome, tipo },
  db = pool
) {
  const resultado = await db.query(
    `UPDATE categorias
     SET nome = $1, tipo = $2
     WHERE id = $3 AND usuario_id = $4
     RETURNING id, usuario_id, nome, tipo`,
    [nome.trim(), tipo, id, usuarioId]
  );

  return resultado.rows[0] ?? null;
}

export async function excluir(id, usuarioId, db = pool) {
  const resultado = await db.query(
    `DELETE FROM categorias
     WHERE id = $1 AND usuario_id = $2`,
    [id, usuarioId]
  );

  return resultado.rowCount > 0;
}

export async function criarPadrao(usuarioId, db = pool) {
  const resultado = await db.query(
    `INSERT INTO categorias (usuario_id, nome, tipo)
     VALUES
       ($1, 'Salário', 'entrada'),
       ($1, 'Outros', 'entrada'),
       ($1, 'Alimentação', 'saida'),
       ($1, 'Moradia', 'saida'),
       ($1, 'Saúde', 'saida'),
       ($1, 'Mobilidade', 'saida'),
       ($1, 'Lazer', 'saida'),
       ($1, 'Educação', 'saida'),
       ($1, 'Outros', 'saida')
     ON CONFLICT (usuario_id, nome, tipo) DO NOTHING
     RETURNING id, usuario_id, nome, tipo`,
    [usuarioId]
  );

  return resultado.rows;
}
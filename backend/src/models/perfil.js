import { pool } from '../config/db.js';

export async function buscar(usuarioId, db = pool) {
  const resultado = await db.query(
    `SELECT id, nome, email, cpf
     FROM usuarios
     WHERE id = $1`,
    [usuarioId]
  );

  return resultado.rows[0] ?? null;
}

export async function atualizarDados(usuarioId, { nome, email }, db = pool) {
  const resultado = await db.query(
    `UPDATE usuarios
     SET nome = $1, email = $2
     WHERE id = $3
     RETURNING id, nome, email, cpf`,
    [nome, email, usuarioId]
  );

  return resultado.rows[0] ?? null;
}

export async function buscarSenhaHash(usuarioId, db = pool) {
  const resultado = await db.query(
    'SELECT senha_hash FROM usuarios WHERE id = $1',
    [usuarioId]
  );

  return resultado.rows[0]?.senha_hash ?? null;
}

export async function atualizarSenha(usuarioId, senhaHash, db = pool) {
  const resultado = await db.query(
    'UPDATE usuarios SET senha_hash = $1 WHERE id = $2',
    [senhaHash, usuarioId]
  );

  return resultado.rowCount > 0;
}
